# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands
- **Run App**: Open `index.html` directly in a modern web browser.
- **Build/Test**: No build process or automated test suite is currently implemented.

## Architecture and Structure
The project is a vanilla JavaScript implementation of a Kanban board using ES6 modules.

### Core Components
- `index.html`: The main entry point and layout.
- `src/css/style.css`: Custom styles (complements Tailwind CSS).
- `src/js/app.js`: Main application controller (`KanbanApp` class). Manages application state, event listeners, and coordinates between the API and UI.
- `src/js/api.js`: Data persistence layer (`ApiClient` class). Handles communication with the REST API backend.
- `src/js/ui.js`: UI rendering and DOM manipulation layer (`UI` object). Handles board rendering, modal controls, and theme switching.

### State Management
- State is maintained as a central object within the `KanbanApp` instance.
- State includes `columns` (mapping column IDs to lists of card IDs), `cards` (mapping card IDs to card data), and `settings` (e.g., theme).
- State changes are persisted via `ApiClient` to a REST API backend, using optimistic updates for a snappy UI.

### UI Interaction Patterns
- **DOM Access**: The `UI` object centralizes access to common DOM elements.
- **Communication**: The project uses an event-driven approach for UI-to-App communication. The `UI` layer often dispatches `CustomEvent` objects on the `window` object to signal actions that require state changes.
    - Example events: `open-card-modal`, `rename-column`, `delete-column`.
- **Rendering**: The board is re-rendered entirely via `UI.renderBoard(state)` whenever a significant state change occurs, followed by a re-initialization of SortableJS.

### Key Dependencies
- **Tailwind CSS**: Used for responsive styling.
- **SortableJS**: Implements the drag-and-drop functionality for moving cards between columns.
