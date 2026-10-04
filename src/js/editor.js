/**
 * Rich-text (WYSIWYG) support for card descriptions and comments.
 *
 * - Editing:  Quill 2 (loaded from CDN as window.Quill)
 * - Safety:   DOMPurify (loaded from CDN as window.DOMPurify). Everything that
 *             is stored or rendered goes through sanitizeHtml().
 * - Storage:  descriptions/comments are stored as a small, clean subset of HTML
 *             (p, br, strong/b, em/i, u, s, code, pre, blockquote, ul/ol/li, a).
 *             Older content that was saved as plain text still renders fine.
 */

const PURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'div', 'br', 'h1', 'h2', 'h3',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
        'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a',
    ],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
};

// What the editor is allowed to produce (also strips formatting from pasted content).
const EDITOR_FORMATS = ['bold', 'italic', 'underline', 'strike', 'list', 'blockquote', 'code', 'code-block', 'link'];

const EDITOR_TOOLBAR = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code', 'code-block'],
    ['link', 'clean'],
];

/* ------------------------------------------------------------------ */
/* Text / HTML helpers                                                 */
/* ------------------------------------------------------------------ */

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[c]));
}

/** Sanitize untrusted HTML down to the allowed subset. Links open in a new tab. */
export function sanitizeHtml(html) {
    const purify = window.DOMPurify;
    const hook = (node) => {
        if (node.tagName === 'A' && node.hasAttribute('href')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
        }
    };
    purify.addHook('afterSanitizeAttributes', hook);
    try {
        return purify.sanitize(String(html ?? ''), PURIFY_CONFIG);
    } finally {
        purify.removeHook('afterSanitizeAttributes');
    }
}

// Content written by this editor always starts with a block-level tag.
// Anything else is treated as legacy plain text.
function looksLikeHtml(content) {
    return /^\s*<(p|div|h[1-6]|ul|ol|blockquote|pre)[\s>]/i.test(content);
}

function plainToHtml(text) {
    return String(text)
        .split(/\r?\n/)
        .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
        .join('');
}

/** Safe HTML for display (handles both rich HTML and legacy plain text). */
export function toDisplayHtml(content) {
    if (!content) return '';
    return looksLikeHtml(content) ? sanitizeHtml(content) : plainToHtml(content);
}

const plainTextCache = new Map();

/** Single-line plain text (for card previews and search). NOT html-escaped. */
export function toPlainText(content) {
    if (!content) return '';
    const cached = plainTextCache.get(content);
    if (cached !== undefined) return cached;

    let text;
    if (looksLikeHtml(content)) {
        const doc = new DOMParser().parseFromString(toDisplayHtml(content), 'text/html');
        // Put a space after every block so "a</p><p>b" doesn't become "ab".
        doc.body
            .querySelectorAll('br,p,div,li,blockquote,pre,h1,h2,h3')
            .forEach((el) => el.after(doc.createTextNode(' ')));
        text = doc.body.textContent;
    } else {
        text = String(content);
    }
    text = text.replace(/\s+/g, ' ').trim();

    if (plainTextCache.size > 1000) plainTextCache.clear();
    plainTextCache.set(content, text);
    return text;
}

/**
 * Turn Quill's live DOM into clean, portable HTML:
 *  - drops Quill's UI helper nodes
 *  - Quill 2 renders every list as <ol><li data-list="bullet|ordered">; convert to real <ul>/<ol>
 *  - code blocks become <pre><code>
 *  - links typed without a protocol get https://
 *  - leading/trailing empty paragraphs are removed
 */
export function normalizeEditorHtml(rawHtml) {
    const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
    const body = doc.body;

    body.querySelectorAll('.ql-ui, .ql-cursor').forEach((n) => n.remove());

    body.querySelectorAll('ol').forEach((ol) => {
        const frag = doc.createDocumentFragment();
        let current = null;
        let currentTag = null;
        Array.from(ol.children).forEach((li) => {
            const tag = (li.getAttribute('data-list') || 'ordered') === 'ordered' ? 'ol' : 'ul';
            if (!current || tag !== currentTag) {
                current = doc.createElement(tag);
                currentTag = tag;
                frag.appendChild(current);
            }
            li.removeAttribute('data-list');
            current.appendChild(li);
        });
        ol.replaceWith(frag);
    });

    body.querySelectorAll('.ql-code-block-container').forEach((container) => {
        const pre = doc.createElement('pre');
        const code = doc.createElement('code');
        code.textContent = Array.from(container.querySelectorAll('.ql-code-block'))
            .map((line) => line.textContent)
            .join('\n');
        pre.appendChild(code);
        container.replaceWith(pre);
    });

    body.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href').trim();
        if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) {
            a.setAttribute('href', 'https://' + href.replace(/^\/+/, ''));
        }
    });

    const isEmptyParagraph = (el) => el.tagName === 'P' && el.textContent.trim() === '';
    while (body.firstElementChild && isEmptyParagraph(body.firstElementChild)) body.firstElementChild.remove();
    while (body.lastElementChild && isEmptyParagraph(body.lastElementChild)) body.lastElementChild.remove();

    return sanitizeHtml(body.innerHTML);
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

/**
 * Mounts a Quill editor (toolbar + editing area) inside `container`.
 *
 * Returns:
 *   getHtml()      clean sanitized HTML ('' when empty)
 *   setHtml(str)   load HTML or legacy plain text
 *   isEmpty()
 *   clear()
 *   focus()        focus with the cursor at the end
 *   onKeydown(fn)  key handler that runs before Quill's own (call e.stopImmediatePropagation() to swallow)
 *   destroy()
 */
export function createRichEditor(container, { html = '', placeholder = '', compact = false } = {}) {
    if (!window.Quill) throw new Error('The rich-text editor failed to load.');

    container.classList.add('rich-editor');
    container.classList.toggle('rich-editor--compact', compact);

    const host = document.createElement('div');
    container.appendChild(host);

    const quill = new window.Quill(host, {
        theme: 'snow',
        placeholder,
        formats: EDITOR_FORMATS,
        modules: { toolbar: EDITOR_TOOLBAR },
        bounds: container,
    });

    const isEmpty = () => quill.getText().trim().length === 0;

    const setHtml = (content) => {
        const safe = toDisplayHtml(content);
        if (safe) {
            quill.setContents(quill.clipboard.convert({ html: safe }), 'silent');
        } else {
            quill.setText('', 'silent');
        }
        quill.history.clear();
    };

    setHtml(html);

    return {
        quill,
        isEmpty,
        setHtml,
        getHtml: () => (isEmpty() ? '' : normalizeEditorHtml(quill.root.innerHTML)),
        clear: () => setHtml(''),
        focus: () => {
            quill.focus();
            quill.setSelection(quill.getLength(), 0);
        },
        onKeydown: (handler) => quill.root.addEventListener('keydown', handler, true),
        destroy: () => {
            container.innerHTML = '';
            container.classList.remove('rich-editor', 'rich-editor--compact');
        },
    };
}
