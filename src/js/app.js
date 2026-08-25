import { StorageManager } from './storage.js';
import { UI } from './ui.js';

class KanbanApp {
    constructor() {
        this.state = StorageManager.loadState();
        this.init();
    }

    init() {
        // Initial Render
        UI.renderBoard(this.state);
        UI.setTheme(this.state.settings.theme);

        this.setupEventListeners();
        this.initSortables();
    }

    setupEventListeners() {
        // Theme Toggle
        UI.themeToggle.onclick = () => {
            const newTheme = this.state.settings.theme === 'light' ? 'dark' : 'light';
            this.state.settings.theme = newTheme;
            UI.setTheme(newTheme);
            this.save();
        };

        // Modal Controls
        document.getElementById('close-modal').onclick = () => UI.closeModal();
        document.getElementById('cancel-modal').onclick = () => UI.closeModal();

        // Modal Open Event
        window.addEventListener('open-card-modal', (e) => {
            const { columnId } = e.detail;
            UI.openModal('Add New Card', null, columnId);
        });

        // Form Submit
        UI.cardForm.onsubmit = (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        };

        // Confirm Modal Controls
        document.getElementById('confirm-cancel').onclick = () => UI.closeConfirm();
        document.getElementById('confirm-delete').onclick = () => this.handleDelete();

        // Card Clicks (Edit/Delete)
        UI.boardContainer.onclick = (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const cardEl = e.target.closest('.card');

            if (editBtn && cardEl) {
                const cardId = cardEl.dataset.cardId;
                UI.openModal('Edit Card', this.state.cards[cardId]);
            } else if (deleteBtn && cardEl) {
                const cardId = cardEl.dataset.cardId;
                this.pendingDeleteId = cardId;
                UI.openConfirm(cardId);
            } else if (cardEl) {
                // Open edit modal when clicking card body
                const cardId = cardEl.dataset.cardId;
                UI.openModal('Edit Card', this.state.cards[cardId]);
            }
        };

        // Search functionality
        document.getElementById('search-input').oninput = (e) => {
            const term = e.target.value.toLowerCase();
            this.filterCards(term);
        };

        // Accessibility: ESC key to close modals
        window.onkeydown = (e) => {
            if (e.key === 'Escape') {
                UI.closeModal();
                UI.closeConfirm();
            }
        };
    }

    initSortables() {
        if (typeof Sortable === 'undefined') {
            console.error('SortableJS is not loaded. Please check the CDN link in index.html');
            return;
        }

        console.log('Initializing Sortables...');
        Object.values(this.state.columns).forEach(column => {
            const el = document.querySelector(`[data-column-id="${column.id}"]`);
            if (!el) {
                console.warn(`Column element not found for id: ${column.id}`);
                return;
            }

            console.log(`Creating sortable for column: ${column.id}`);
            Sortable.create(el, {
                group: 'kanban',
                animation: 150,
                ghostClass: 'opacity-50 bg-blue-100 dark:bg-blue-900/30',
                dragClass: 'rotate-2 shadow-xl',
                onEnd: (evt) => {
                    console.log('Sort ended:', evt);
                    this.handleSortEnd(evt);
                }
            });
        });
    }

    handleSortEnd(evt) {
        const { oldIndex, newIndex } = evt;
        const sourceColId = evt.from.dataset.columnId;
        const destColId = evt.to.dataset.columnId;

        // Update state
        const cardId = this.state.columns[sourceColId].cardIds.splice(oldIndex, 1)[0];
        this.state.columns[destColId].cardIds.splice(newIndex, 0, cardId);

        this.save();
        UI.renderBoard(this.state);
        this.initSortables(); // Re-init to ensure event listeners on new DOM
    }

    handleFormSubmit() {
        const cardId = document.getElementById('card-id').value;
        const columnId = document.getElementById('column-id').value;

        const cardData = {
            title: document.getElementById('form-title').value,
            description: document.getElementById('form-description').value,
            priority: document.querySelector('input[name="priority"]:checked').value,
            dueDate: document.getElementById('form-date').value,
            labels: document.getElementById('form-labels').value.split(',').map(l => l.trim()).filter(l => l !== ''),
        };

        if (cardId) {
            // Edit existing
            const card = this.state.cards[cardId];
            this.state.cards[cardId] = { ...card, ...cardData };
        } else {
            // Create new
            const newId = 'card-' + Date.now();
            const newCard = {
                id: newId,
                ...cardData,
                createdAt: new Date().toISOString(),
            };
            this.state.cards[newId] = newCard;

            // Add to column
            if (columnId && this.state.columns[columnId]) {
                this.state.columns[columnId].cardIds.push(newId);
            } else {
                // Default to todo
                this.state.columns['todo'].cardIds.push(newId);
            }
        }

        this.save();
        UI.closeModal();
        UI.renderBoard(this.state);
        this.initSortables();
    }

    handleDelete() {
        const cardId = this.pendingDeleteId;
        if (!cardId) return;

        // Remove from all columns
        Object.values(this.state.columns).forEach(col => {
            col.cardIds = col.cardIds.filter(id => id !== cardId);
        });

        // Remove from cards object
        delete this.state.cards[cardId];

        this.save();
        UI.closeConfirm();
        UI.renderBoard(this.state);
        this.initSortables();
        this.pendingDeleteId = null;
    }

    filterCards(term) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(cardEl => {
            const id = cardEl.dataset.cardId;
            const card = this.state.cards[id];
            const matches = card.title.toLowerCase().includes(term) ||
                           card.description.toLowerCase().includes(term) ||
                           card.labels.some(l => l.toLowerCase().includes(term));

            cardEl.classList.toggle('hidden', !matches);
        });
    }

    save() {
        StorageManager.saveState(this.state);
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    new KanbanApp();
});
