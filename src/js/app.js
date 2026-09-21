import ApiClient from './api.js';
import { UI } from './ui.js';

class KanbanApp {
    constructor() {
        this.settings = {};
        this.state = null;
        this.boards = [];
        this.currentBoardId = null;
        this.currentRole = null;
        this.currentBoardName = null;
    }

    async start() {
        // Load theme from localStorage if available
        const savedTheme = localStorage.getItem('kanban-theme');
        if (savedTheme) {
            this.settings.theme = savedTheme;
        }
        UI.setTheme(this.settings.theme);
        
        this.setupAuthListeners();

        if (this.checkAuth()) {
            try {
                this.boards = await ApiClient.getBoards();
                await this.resolveActiveBoard();
            } catch (error) {
                console.error('Failed to load boards:', error);
                this.handleLogout();
            }
        } else {
            this.switchView('auth');
        }
    }

    checkAuth() {
        return !!localStorage.getItem('kanban-token');
    }

    switchView(view) {
        if (view === 'board') {
            UI.appAuthView.classList.add('hidden');
            UI.appBoardView.classList.remove('hidden');
        } else {
            UI.appAuthView.classList.remove('hidden');
            UI.appBoardView.classList.add('hidden');
        }
    }

    async resolveActiveBoard() {
        const params = new URLSearchParams(window.location.search);
        const boardParam = params.get('board');
        const storedBoardId = localStorage.getItem('kanban-active-board');

        let activeId = null;

        if (boardParam && this.boards.some(b => b.id === boardParam)) {
            activeId = boardParam;
        } else if (storedBoardId && this.boards.some(b => b.id === storedBoardId)) {
            activeId = storedBoardId;
        } else if (this.boards.length > 0) {
            activeId = this.boards[0].id;
        }

        if (activeId) {
            await this.loadBoard(activeId);
        } else {
            this.showEmptyState();
        }
    }

    async loadBoard(boardId) {
        try {
            const boardData = await ApiClient.getBoard(boardId);
            this.state = boardData;
            this.currentBoardId = boardId;
            this.currentRole = boardData.role;
            this.currentBoardName = boardData.name;

            localStorage.setItem('kanban-active-board', boardId);
            this.updateUrl(boardId);
            this.switchView('board');
            this.init();
        } catch (error) {
            console.error(`Failed to load board ${boardId}:`, error);
            if (error.message.includes('401')) {
                this.handleLogout();
            } else if (error.message.includes('403')) {
                alert('You don\'t have permission to access this board.');
                this.resolveActiveBoard(); // Try to find another valid board
            } else {
                alert('Failed to load board from server. Please refresh the page.');
            }
        }
    }

    updateUrl(boardId) {
        const params = new URLSearchParams(window.location.search);
        params.set('board', boardId);
        const newUrl = `${window.location.pathname}?${params.toString()}`;

        // Use replaceState on first load, pushState on manual switches
        // For simplicity in this method, we'll use replaceState.
        // The manual switch handler will call pushState.
        history.replaceState(null, '', newUrl);
    }

    showEmptyState() {
        this.switchView('board');
        UI.renderEmptyState();
        this.setupEventListeners();
    }

    init() {
        // Initial Render
        UI.renderBoard(this.state, this.currentRole);

        // Setup user profile in header
        const user = JSON.parse(localStorage.getItem('kanban-user') || '{}');
        UI.updateUserHeader(user, this.currentRole);

        this.setupEventListeners();
        this.initSortables();
        UI.renderBoardSwitcher(this.boards, this.currentBoardId);
    }

    setupAuthListeners() {
        // Popstate listener for browser back/forward
        window.addEventListener('popstate', async () => {
            const params = new URLSearchParams(window.location.search);
            const boardId = params.get('board');
            if (boardId && boardId !== this.currentBoardId) {
                await this.loadBoard(boardId);
            }
        });

        // Toggle between Login and Signup cards
        UI.showSignupBtn.onclick = () => {
            UI.loginCard.classList.add('hidden');
            UI.signupCard.classList.remove('hidden');
        };

        UI.showLoginBtn.onclick = () => {
            UI.signupCard.classList.add('hidden');
            UI.loginCard.classList.remove('hidden');
        };

        // Login Submit
        UI.loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const authData = await ApiClient.login(email, password);
                localStorage.setItem('kanban-token', authData.token);
                localStorage.setItem('kanban-user', JSON.stringify({
                    email: authData.email,
                    displayName: authData.displayName,
                    avatarUrl: authData.avatarUrl
                }));

                const user = JSON.parse(localStorage.getItem('kanban-user') || '{}');
                UI.updateUserHeader(user);
                this.boards = await ApiClient.getBoards();
                await this.resolveActiveBoard();
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        };

        // Signup Submit
        UI.signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const displayName = document.getElementById('signup-name').value;
            try {
                const authData = await ApiClient.signup(email, password, displayName);
                localStorage.setItem('kanban-token', authData.token);
                localStorage.setItem('kanban-user', JSON.stringify({
                    email: authData.email,
                    displayName: authData.displayName,
                    avatarUrl: authData.avatarUrl
                }));

                const user = JSON.parse(localStorage.getItem('kanban-user') || '{}');
                UI.updateUserHeader(user);
                this.boards = await ApiClient.getBoards();
                await this.resolveActiveBoard();
            } catch (error) {
                alert('Signup failed: ' + error.message);
            }
        };

        // Handle session expiration (401)
        window.addEventListener('auth-expired', () => this.handleLogout());
    }

    async createBoard() {
        const name = prompt('Enter board name:');
        if (name && name.trim()) {
            try {
                const newBoard = await ApiClient.createBoard(name.trim());
                this.boards.push(newBoard);
                await this.loadBoard(newBoard.id);
                UI.renderBoardSwitcher(this.boards, this.currentBoardId);
            } catch (error) {
                alert('Failed to create board: ' + error.message);
            }
        }
    }

    setupEventListeners() {
        // Board Switcher
        UI.boardSwitcher.onchange = async (e) => {
            const newBoardId = e.target.value;
            if (newBoardId && newBoardId !== this.currentBoardId) {
                const params = new URLSearchParams(window.location.search);
                params.set('board', newBoardId);
                history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
                await this.loadBoard(newBoardId);
            }
        };

        // Create Board
        UI.createBoardBtn.onclick = async () => {
            await this.createBoard();
        };

        // Empty State Create Board Trigger
        window.addEventListener('create-board-trigger', async () => {
            await this.createBoard();
        });

        // Members Modal
        UI.membersMenu.onclick = async (e) => {
            e.stopPropagation();
            try {
                const members = await ApiClient.getMembers(this.currentBoardId);
                UI.openMembersModal(members, this.currentRole);
            } catch (error) {
                alert('Failed to load members: ' + error.message);
            }
            UI.menuDropdown.classList.add('hidden');
        };

        // Handle Member Invitations
        UI.inviteMemberForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = UI.inviteEmail.value;
            const role = UI.inviteRole.value;
            try {
                await ApiClient.addMember(this.currentBoardId, email, role);
                // Refresh members list
                const members = await ApiClient.getMembers(this.currentBoardId);
                UI.openMembersModal(members, this.currentRole);
                UI.inviteEmail.value = '';
            } catch (error) {
                alert('Failed to invite member: ' + error.message);
            }
        };

        // Handle Member Removal
        UI.membersList.onclick = async (e) => {
            const removeBtn = e.target.closest('button[data-user-id]');
            if (removeBtn) {
                const userId = removeBtn.dataset.userId;
                if (!confirm('Are you sure you want to remove this member?')) return;
                try {
                    await ApiClient.removeMember(this.currentBoardId, userId);
                    const members = await ApiClient.getMembers(this.currentBoardId);
                    UI.openMembersModal(members, this.currentRole);
                } catch (error) {
                    alert('Failed to remove member: ' + error.message);
                }
            }
        };

        // Menu Toggle
        UI.menuToggle.onclick = (e) => {
            e.stopPropagation();
            UI.menuDropdown.classList.toggle('hidden');
        };


        // Theme Toggle from Menu
        UI.themeToggleMenu.onclick = (e) => {
            e.stopPropagation();
            if (!this.settings.theme) {
                this.settings.theme = 'light';
            }
            const newTheme = this.settings.theme === 'light' ? 'dark' : 'light';
            this.settings.theme = newTheme;
            UI.setTheme(newTheme);
            localStorage.setItem('kanban-theme', newTheme);
            UI.menuDropdown.classList.add('hidden');
        };

        // About Menu
        UI.aboutMenu.onclick = (e) => {
            e.stopPropagation();
            UI.openAboutModal();
            UI.menuDropdown.classList.add('hidden');
        };

        // Export Menu
        UI.exportMenu.onclick = (e) => {
            e.stopPropagation();
            this.exportData();
            UI.menuDropdown.classList.add('hidden');
        };

        // Import Menu
        UI.importMenu.onclick = (e) => {
            e.stopPropagation();
            UI.importFile.click();
            UI.menuDropdown.classList.add('hidden');
        };

        // Import File Change
        UI.importFile.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
            }
            UI.importFile.value = ''; // Reset input
        };

        // Add Column handler
        UI.addColumnMenu.onclick = async (e) => {
            e.stopPropagation();
            const newName = prompt('Enter new column name:');
            if (newName !== null && newName.trim() !== '') {
                try {
                    const newColumn = await ApiClient.createColumn(newName.trim(), this.state.id);
                    this.state.columns[newColumn.id] = newColumn;
                    UI.renderBoard(this.state);
                    this.initSortables();
                } catch (error) {
                    alert('Failed to create column: ' + error.message);
                }
            }
            UI.menuDropdown.classList.add('hidden');
        };

        // Logout Handler
        UI.logoutMenu.onclick = (e) => {
            e.stopPropagation();
            this.handleLogout();
        };

        // Change Password Placeholder
        if (UI.changePasswordMenu) {
            UI.changePasswordMenu.onclick = (e) => {
                e.stopPropagation();
                UI.menuDropdown.classList.add('hidden');
            };
        }


        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!UI.menuDropdown.contains(e.target) && e.target !== UI.menuToggle) {
                UI.menuDropdown.classList.add('hidden');
            }
        });

        // Close members modal when clicking outside
        UI.membersModal.onclick = (e) => {
            if (e.target === UI.membersModal) {
                UI.closeMembersModal();
            }
        };


        // About Modal Controls
        UI.closeAboutModalBtn.onclick = () => UI.closeAboutModal();
        UI.aboutOkBtn.onclick = () => UI.closeAboutModal();

        // Close members modal via button
        UI.closeMembersModalBtn.onclick = () => UI.closeMembersModal();

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

        // Rename Column handler
        window.addEventListener('rename-column', async (e) => {
            const { columnId } = e.detail;
            const currentTitle = this.state.columns[columnId].title;
            const newTitle = prompt('Enter new column name:', currentTitle);
            if (newTitle !== null && newTitle.trim() !== '') {
                const trimmedTitle = newTitle.trim();
                const oldTitle = currentTitle;

                // Optimistic update
                this.state.columns[columnId].title = trimmedTitle;
                UI.renderBoard(this.state);
                this.initSortables();

                try {
                    await ApiClient.renameColumn(columnId, trimmedTitle);
                } catch (error) {
                    // Rollback
                    this.state.columns[columnId].title = oldTitle;
                    UI.renderBoard(this.state);
                    this.initSortables();
                }
            }
        });

        // Delete Column handler
        window.addEventListener('delete-column', async (e) => {
            const { columnId } = e.detail;
            const column = this.state.columns[columnId];
            const hasCards = column.cardIds.length > 0;
            const otherColumns = Object.values(this.state.columns).filter(col => col.id !== columnId);

            this.pendingDeleteColId = columnId;
            UI.openDeleteColumnModal(columnId, column.title, hasCards, otherColumns);
        });

        // Confirm Delete Column handler
        UI.deleteColConfirm.onclick = async () => {
            const columnId = this.pendingDeleteColId;
            if (!columnId) return;

            const column = this.state.columns[columnId];
            const destinationId = UI.deleteColDestination.value;

            if (column.cardIds.length > 0) {
                if (!destinationId) {
                    alert('Please select a destination column for the cards.');
                    return;
                }
                const destCol = this.state.columns[destinationId];
                destCol.cardIds.push(...column.cardIds);
            }

            const oldColumns = { ...this.state.columns };
            delete this.state.columns[columnId];

            UI.renderBoard(this.state);
            this.initSortables();
            UI.closeDeleteColumnModal();
            this.pendingDeleteColId = null;

            try {
                // Move cards via API if necessary
                if (column.cardIds.length > 0 && destinationId) {
                    await Promise.all(column.cardIds.map((cardId, index) =>
                        ApiClient.moveCard(cardId, destinationId, this.state.columns[destinationId].cardIds.length - 1)
                    ));
                }
                await ApiClient.deleteColumn(columnId);
            } catch (error) {
                this.state.columns = oldColumns;
                UI.renderBoard(this.state);
                this.initSortables();
                alert('Failed to delete column: ' + error.message);
            }
        };

        UI.deleteColCancel.onclick = () => {
            UI.closeDeleteColumnModal();
            this.pendingDeleteColId = null;
        };

        UI.closeDeleteColModal.onclick = () => {
            UI.closeDeleteColumnModal();
            this.pendingDeleteColId = null;
        };
    }

    handleLogout() {
        localStorage.removeItem('kanban-token');
        localStorage.removeItem('kanban-user');
        window.location.replace("./");
    }

    initSortables() {
        if (this.currentRole === 'VIEWER') return;

        if (typeof Sortable === 'undefined') {
            console.error('SortableJS is not loaded. Please check the CDN link in index.html');
            return;
        }

        Object.values(this.state.columns).forEach(column => {
            const el = document.querySelector(`[data-column-id="${column.id}"]`);
            if (!el) {
                console.warn(`Column element not found for id: ${column.id}`);
                return;
            }

            Sortable.create(el, {
                group: 'kanban',
                handle: '.drag-handle',
                animation: 150,
                ghostClass: 'drag-card-ghost',
                dragClass: 'drag-card-active',
                onStart: (evt) => console.log('Drag started!', evt),
                onUpdate: (evt) => console.log('Card moved!', evt),
                onEnd: (evt) => {
                    console.log('Drag ended!', evt);
                    this.handleSortEnd(evt);
                }
            });
        });
    }

    async handleSortEnd(evt) {
        if (this.currentRole === 'VIEWER') {
            // Revert the move visually if Sortable allowed it
            UI.renderBoard(this.state);
            this.initSortables();
            return;
        }

        const { oldIndex, newIndex } = evt;
        const sourceColId = evt.from.dataset.columnId;
        const destColId = evt.to.dataset.columnId;

        const oldState = JSON.parse(JSON.stringify(this.state));
        const cardId = this.state.columns[sourceColId].cardIds.splice(oldIndex, 1)[0];
        this.state.columns[destColId].cardIds.splice(newIndex, 0, cardId);
        UI.updateCardCounts(this.state);

        try {
            await ApiClient.moveCard(cardId, destColId, newIndex);
        } catch (error) {
            this.state = oldState;
            UI.renderBoard(this.state);
            this.initSortables();
            alert('Failed to move card: ' + error.message);
        }
    }

    // create new card or update card
    async handleFormSubmit() {
        if (this.currentRole === 'VIEWER') {
            alert('You do not have permission to edit cards.');
            return;
        }

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
            // update card
            const oldCard = { ...this.state.cards[cardId] };
            this.state.cards[cardId] = { ...oldCard, ...cardData };
            UI.renderBoard(this.state);
            this.initSortables();
            UI.closeModal();

            try {
                await ApiClient.updateCard(cardId, cardData);
            } catch (error) {
                this.state.cards[cardId] = oldCard;
            }
        } else {
            // create new card
            const tempId = 'card-' + Date.now();
            const newCard = {
                id: tempId,
                ...cardData,
                createdAt: new Date().toISOString(),
            };
            this.state.cards[tempId] = newCard;
            if (columnId && this.state.columns[columnId]) {
                this.state.columns[columnId].cardIds.push(tempId);
            } else {
                this.state.columns['todo'].cardIds.push(tempId);
            }
            UI.renderBoard(this.state);
            this.initSortables();
            UI.closeModal();

            try {
                const createdCard = await ApiClient.createCard(columnId, cardData);
                delete this.state.cards[tempId];
                this.state.cards[createdCard.id] = createdCard;

                Object.values(this.state.columns).forEach(col => {
                    col.cardIds = col.cardIds.map(id => id === tempId ? createdCard.id : id);
                });
                UI.renderBoard(this.state);
                this.initSortables();
            } catch (error) {
                delete this.state.cards[tempId];
                Object.values(this.state.columns).forEach(col => {
                    col.cardIds = col.cardIds.filter(id => id !== tempId);
                });
                UI.renderBoard(this.state);
                this.initSortables();
                alert('Failed to create card: ' + error.message);
            }
        }
    }

    async handleDelete() {
        if (this.currentRole === 'VIEWER') {
            alert('You do not have permission to delete cards.');
            return;
        }

        const cardId = this.pendingDeleteId;
        if (!cardId) return;

        const oldState = JSON.parse(JSON.stringify(this.state));

        Object.values(this.state.columns).forEach(col => {
            col.cardIds = col.cardIds.filter(id => id !== cardId);
        });
        delete this.state.cards[cardId];

        UI.renderBoard(this.state);
        this.initSortables();
        UI.closeConfirm();

        try {
            await ApiClient.deleteCard(cardId);
        } catch (error) {
            this.state = oldState;
            UI.renderBoard(this.state);
            this.initSortables();
            alert('Failed to delete card: ' + error.message);
        }
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

    async exportData() {
        try {
            const boardData = await ApiClient.exportBoard();
            const dataStr = JSON.stringify(boardData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = 'kanban-data.json';

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (error) {
            alert('Failed to export data: ' + error.message);
        }
    }

    async importData(file) {
        try {
            const text = await file.text();
            const importedState = JSON.parse(text);

            if (!importedState.columns || !importedState.cards) {
                throw new Error('Invalid data format');
            }

            const response = await ApiClient.importBoard(importedState);

            const fullFreshState = await ApiClient.getBoard();
            this.state = fullFreshState;

            const boardContainer = document.getElementById('boardContainer');
            if (boardContainer) boardContainer.innerHTML = '';

            UI.renderBoard(this.state);
            this.initSortables();

            setTimeout(() => {
                alert('Data imported successfully!');
            }, 10);

        } catch (e) {
            console.error('Import error:', e);
            alert('Failed to import data: ' + e.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new KanbanApp();
    await app.start();
});
