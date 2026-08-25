export const UI = {
    // DOM Elements
    boardContainer: document.getElementById('board-container'),
    menuToggle: document.getElementById('menu-toggle'),
    menuDropdown: document.getElementById('menu-dropdown'),
    themeToggleMenu: document.getElementById('theme-toggle-menu'),
    aboutMenu: document.getElementById('about-menu'),
    themeDarkIcon: document.getElementById('theme-toggle-dark-icon'),
    themeLightIcon: document.getElementById('theme-toggle-light-icon'),
    aboutModal: document.getElementById('about-modal'),
    closeAboutModalBtn: document.getElementById('close-about-modal'),
    aboutOkBtn: document.getElementById('about-ok-btn'),
    cardModal: document.getElementById('card-modal'),
    modalTitle: document.getElementById('modal-title'),
    cardForm: document.getElementById('card-form'),
    confirmModal: document.getElementById('confirm-modal'),

    renderBoard(state) {
        this.boardContainer.innerHTML = '';

        Object.values(state.columns).forEach(column => {
            const colEl = this.createColumnElement(column, state.cards);
            this.boardContainer.appendChild(colEl);
        });
    },

    createColumnElement(column, cards) {
        const div = document.createElement('div');
        div.className = 'flex-shrink-0 w-[300px] flex flex-col max-h-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700';
        div.id = `col-${column.id}`;

        const cardCount = column.cardIds.length;

        div.innerHTML = `
            <div class="flex items-center justify-between mb-4 px-1">
                <div class="flex items-center gap-2">
                    <h3 class="font-bold text-slate-700 dark:text-slate-200">${column.title}</h3>
                    <span class="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">${cardCount}</span>
                </div>
                <button class="text-slate-400 hover:text-primary-600 transition-colors" title="Add Card">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="card-list flex-1 overflow-y-auto space-y-3 pb-4" data-column-id="${column.id}">
                ${column.cardIds.map(id => this.createCardHTML(cards[id])).join('')}
            </div>
        `;

        // Attach listener to the "Add Card" button
        div.querySelector('button').onclick = () => {
            window.dispatchEvent(new CustomEvent('open-card-modal', { detail: { columnId: column.id } }));
        };

        return div;
    },

    createCardHTML(card) {
        if (!card) return '';

        const priorityColors = {
            'High': 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20',
            'Medium': 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
            'Low': 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20',
        };

        const priorityClass = priorityColors[card.priority] || priorityColors['Medium'];
        const labelsHTML = card.labels.map(l => `<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">${l}</span>`).join(' ');

        return `
            <div class="card group bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border-l-4 ${priorityClass} hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer relative" data-card-id="${card.id}">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex flex-wrap gap-1">
                        ${labelsHTML}
                    </div>
                    <div class="drag-handle cursor-grab active:cursor-grabbing p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" title="Drag to move">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                </div>
                <h4 class="font-semibold text-sm mb-1 text-slate-800 dark:text-slate-100">${card.title}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">${card.description || ''}</p>

                <div class="flex items-center justify-between mt-auto">
                    <div class="flex items-center gap-2 text-[10px] text-slate-400">
                        ${card.dueDate ? `
                            <div class="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>${card.dueDate}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-btn p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-primary-600 transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.538 3.538M9 11l3 3m-3-3l3-3m-3 3l-3-3m3 3l3 3m-6 4h4" />
                            </svg>
                        </button>
                        <button class="delete-btn p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            this.themeDarkIcon.classList.add('hidden');
            this.themeLightIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            this.themeLightIcon.classList.add('hidden');
            this.themeDarkIcon.classList.remove('hidden');
        }
    },

    openModal(title, card = null, columnId = null) {
        this.modalTitle.textContent = card ? 'Edit Card' : title;
        this.cardModal.classList.remove('hidden');
        this.cardModal.classList.add('flex');

        // Trigger animation
        setTimeout(() => {
            this.cardModal.querySelector('.relative').classList.remove('scale-95', 'opacity-0');
            this.cardModal.querySelector('.relative').classList.add('scale-100', 'opacity-100');
        }, 10);

        if (card) {
            document.getElementById('card-id').value = card.id;
            document.getElementById('form-title').value = card.title;
            document.getElementById('form-description').value = card.description;
            document.getElementById('form-date').value = card.dueDate;
            document.getElementById('form-labels').value = card.labels.join(', ');
            document.querySelector(`input[name="priority"][value="${card.priority}"]`).checked = true;
        } else {
            this.cardForm.reset();
            document.getElementById('card-id').value = '';
            document.getElementById('column-id').value = columnId || '';
            document.querySelector('input[name="priority"][value="Medium"]').checked = true;
        }
    },

    closeModal() {
        const modalContent = this.cardModal.querySelector('.relative');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            this.cardModal.classList.add('hidden');
            this.cardModal.classList.remove('flex');
        }, 200);
    },

    openConfirm(cardId) {
        this.confirmModal.classList.remove('hidden');
        this.confirmModal.classList.add('flex');
        setTimeout(() => {
            this.confirmModal.querySelector('.relative').classList.remove('scale-95', 'opacity-0');
            this.confirmModal.querySelector('.relative').classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeConfirm() {
        const modalContent = this.confirmModal.querySelector('.relative');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            this.confirmModal.classList.add('hidden');
            this.confirmModal.classList.remove('flex');
        }, 200);
    },

    openAboutModal() {
        this.aboutModal.classList.remove('hidden');
        this.aboutModal.classList.add('flex');
        setTimeout(() => {
            this.aboutModal.querySelector('.relative').classList.remove('scale-95', 'opacity-0');
            this.aboutModal.querySelector('.relative').classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeAboutModal() {
        const modalContent = this.aboutModal.querySelector('.relative');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            this.aboutModal.classList.add('hidden');
            this.aboutModal.classList.remove('flex');
        }, 200);
    }
}
