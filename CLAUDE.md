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
- `src/js/app.js`: Main application controller (`KanbanApp` class). Manages application state, event listeners, and coordinates between storage and UI.
- `src/js/storage.js`: Data persistence layer (`StorageManager` class). Handles loading and saving the board state to `localStorage`.
- `src/js/ui.js`: UI rendering and DOM manipulation layer (`UI` object). Handles board rendering, modal controls, and theme switching.

### State Management
- State is maintained as a central object within the `KanbanApp` instance.
- State includes `columns` (mapping column IDs to lists of card IDs), `cards` (mapping card IDs to card data), and `settings` (e.g., theme).
- State changes are persisted via `StorageManager` and trigger a re-render through the `UI` layer.

### Key Dependencies
- **Tailwind CSS**: Used for responsive styling.
- **SortableJS**: Implements the drag-and-drop functionality for moving cards between columns.
