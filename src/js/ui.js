export const UI = {
    // DOM Elements
    appAuthView: document.getElementById('app-auth-view'),
    appBoardView: document.getElementById('app-board-view'),
    loginCard: document.getElementById('login-card'),
    signupCard: document.getElementById('signup-card'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    showSignupBtn: document.getElementById('show-signup'),
    showLoginBtn: document.getElementById('show-login'),

    boardContainer: document.getElementById('board-container'),
    menuToggle: document.getElementById('menu-toggle'),
    menuDropdown: document.getElementById('menu-dropdown'),
    themeToggleMenu: document.getElementById('theme-toggle-menu'),
    aboutMenu: document.getElementById('about-menu'),
    exportMenu: document.getElementById('export-menu'),
    importMenu: document.getElementById('import-menu'),
    logoutMenu: document.getElementById('logout-menu'),
    addColumnMenu: document.getElementById('add-column-menu'),
    logoutMenu: document.getElementById('logout-menu'),
    profileTrigger: document.getElementById('profile-trigger'),
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    importFile: document.getElementById('import-file'),
    themeDarkIcon: document.getElementById('theme-toggle-dark-icon'),
    themeLightIcon: document.getElementById('theme-toggle-light-icon'),
    aboutModal: document.getElementById('about-modal'),
    closeAboutModalBtn: document.getElementById('close-about-modal'),
    aboutOkBtn: document.getElementById('about-ok-btn'),
    cardModal: document.getElementById('card-modal'),
    modalTitle: document.getElementById('modal-title'),
    cardForm: document.getElementById('card-form'),
    confirmModal: document.getElementById('confirm-modal'),
    deleteColumnModal: document.getElementById('delete-column-modal'),
    deleteColTitle: document.getElementById('delete-col-title'),
    deleteColMessage: document.getElementById('delete-col-message'),
    deleteColTransferSection: document.getElementById('delete-col-transfer-section'),
    deleteColDestination: document.getElementById('delete-col-destination'),
    deleteColConfirm: document.getElementById('delete-col-confirm'),
    deleteColCancel: document.getElementById('delete-col-cancel'),
    closeDeleteColModal: document.getElementById('close-delete-col-modal'),
    profileModal: document.getElementById('profile-modal'),
    profileName: document.getElementById('profile-name'),
    profileEmail: document.getElementById('profile-email'),
    profileAvatar: document.getElementById('profile-avatar'),
    closeProfileModalBtn: document.getElementById('close-profile-modal'),

    renderBoard(state) {
        this.boardContainer.innerHTML = '';

        Object.values(state.columns).forEach(column => {
            const colEl = this.createColumnElement(column, state.cards);
            this.boardContainer.appendChild(colEl);
        });
    },

    createColumnElement(column, cards) {
        const div = document.createElement('div');
        div.className = 'group flex-shrink-0 w-[300px] flex flex-col max-h-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700';
        div.id = `col-${column.id}`;

        const cardCount = column.cardIds.length;

        div.innerHTML = `
            <div class="flex items-center justify-between mb-4 px-1">
                <div class="flex items-center gap-2">
                    <h3 class="font-bold text-slate-700 dark:text-slate-200">${column.title}</h3>
                    <div class="flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                        <button class="rename-col-btn text-slate-400 hover:text-primary-600 transition-colors" title="Rename Column">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-col-btn text-slate-400 hover:text-red-600 transition-colors" title="Delete Column">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                    <span class="column-card-count text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">${cardCount}</span>
                </div>
                <button class="add-card-btn text-slate-400 hover:text-primary-600 transition-colors" title="Add Card">
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
        div.querySelector('.add-card-btn').onclick = () => {
            window.dispatchEvent(new CustomEvent('open-card-modal', { detail: { columnId: column.id } }));
        };

        // Attach listener to the "Rename Column" button
        div.querySelector('.rename-col-btn').onclick = () => {
            window.dispatchEvent(new CustomEvent('rename-column', { detail: { columnId: column.id } }));
        };

        // Attach listener to the "Delete Column" button
        div.querySelector('.delete-col-btn').onclick = () => {
            window.dispatchEvent(new CustomEvent('delete-column', { detail: { columnId: column.id } }));
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
            <div class="card group bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border-l-4 ${priorityClass} cursor-pointer relative" data-card-id="${card.id}" data-id="${card.id}">
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
                    <div class="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button class="edit-btn p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-primary-600 transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
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

    updateCardCounts(state) {
        Object.values(state.columns).forEach(column => {
            const colEl = document.getElementById(`col-${column.id}`);
            if (colEl) {
                const countEl = colEl.querySelector('.column-card-count');
                if (countEl) {
                    countEl.textContent = column.cardIds.length;
                }
            }
        });
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
    },

    openDeleteColumnModal(columnId, title, hasCards, otherColumns) {
        this.deleteColumnModal.classList.remove('hidden');
        this.deleteColumnModal.classList.add('flex');
        this.deleteColTitle.textContent = `Delete Column: ${title}`;
        this.deleteColMessage.textContent = hasCards
            ? `This column contains cards. You must transfer them to another column before deleting.`
            : `Are you sure you want to delete the column "${title}"? This action cannot be undone.`;

        this.deleteColTransferSection.classList.toggle('hidden', !hasCards);

        if (hasCards) {
            this.deleteColDestination.innerHTML = '';
            otherColumns.forEach(col => {
                const option = document.createElement('option');
                option.value = col.id;
                option.textContent = col.title;
                this.deleteColDestination.appendChild(option);
            });
        }

        setTimeout(() => {
            this.deleteColumnModal.querySelector('.relative').classList.remove('scale-95', 'opacity-0');
            this.deleteColumnModal.querySelector('.relative').classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeDeleteColumnModal() {
        const modalContent = this.deleteColumnModal.querySelector('.relative');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            this.deleteColumnModal.classList.add('hidden');
            this.deleteColumnModal.classList.remove('flex');
        }, 200);
    },

    updateUserHeader(user) {
        if (!user) return;
        this.userName.textContent = user.displayName;
        this.userAvatar.src = user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURI(user.displayName);
    },

    openProfile(user) {
        if (!user) return;
        this.profileName.textContent = user.displayName;
        this.profileEmail.textContent = user.email;
        this.profileAvatar.src = user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURI(user.displayName);

        this.profileModal.classList.remove('hidden');
        this.profileModal.classList.add('flex');
        setTimeout(() => {
            this.profileModal.querySelector('.relative').classList.remove('scale-95', 'opacity-0');
            this.profileModal.querySelector('.relative').classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    closeProfile() {
        const modalContent = this.profileModal.querySelector('.relative');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            this.profileModal.classList.add('hidden');
            this.profileModal.classList.remove('flex');
        }, 200);
    }
}
