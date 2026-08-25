export class StorageManager {
    static STORAGE_KEY = 'webtools-kanban-state';

    static saveState(state) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    static loadState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading from localStorage, returning defaults:', e);
        }
        return this.getInitialData();
    }

    static getInitialData() {
        const sampleCards = {
            'card-1': { id: 'card-1', title: 'Design landing page', description: 'Create high-fidelity mockups for the main page.', priority: 'High', labels: ['Design'], dueDate: '', createdAt: new Date().toISOString() },
            'card-2': { id: 'card-2', title: 'Research competitor products', description: 'Analyze top 3 competitors in the task management space.', priority: 'Medium', labels: ['Research'], dueDate: '', createdAt: new Date().toISOString() },
            'card-3': { id: 'card-3', title: 'Create project roadmap', description: 'Define milestones and deadlines for the next 3 months.', priority: 'High', labels: ['Planning'], dueDate: '', createdAt: new Date().toISOString() },
            'card-4': { id: 'card-4', title: 'Build authentication UI', description: 'Create login and signup screens with validation.', priority: 'High', labels: ['Development'], dueDate: '', createdAt: new Date().toISOString() },
            'card-5': { id: 'card-5', title: 'Implement dashboard navigation', description: 'Build a responsive side-nav and top-bar.', priority: 'Medium', labels: ['Development'], dueDate: '', createdAt: new Date().toISOString() },
            'card-6': { id: 'card-6', title: 'Review API integration', description: 'Verify that the frontend connects correctly to the backend.', priority: 'High', labels: ['Review'], dueDate: '', createdAt: new Date().toISOString() },
            'card-7': { id: 'card-7', title: 'Test responsive layout', description: 'Ensure the board works on all screen sizes.', priority: 'Medium', labels: ['QA'], dueDate: '', createdAt: new Date().toISOString() },
            'card-8': { id: 'card-8', title: 'Set up project', description: 'Initialize git repo and basic project structure.', priority: 'Low', labels: ['Setup'], dueDate: '', createdAt: new Date().toISOString() },
            'card-9': { id: 'card-9', title: 'Create initial database schema', description: 'Define tables for users, boards, and cards.', priority: 'Medium', labels: ['Backend'], dueDate: '', createdAt: new Date().toISOString() },
        };

        return {
            columns: {
                'todo': { id: 'todo', title: 'To Do', cardIds: ['card-1', 'card-2', 'card-3'] },
                'in-progress': { id: 'in-progress', title: 'In Progress', cardIds: ['card-4', 'card-5'] },
                'review': { id: 'review', title: 'Review', cardIds: ['card-6', 'card-7'] },
                'done': { id: 'done', title: 'Done', cardIds: ['card-8', 'card-9'] },
            },
            cards: sampleCards,
            settings: {
                theme: 'light'
            }
        };
    }
}
