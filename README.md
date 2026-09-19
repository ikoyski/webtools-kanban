# WebTools Kanban

A modern, responsive Kanban board implementation featuring drag-and-drop functionality, dark mode support, and REST API persistence.

## Features

- **Authentication**: Secure user accounts with Login, Signup, and session persistence.
- **User Profile**: Personalized experience with display names and avatars.
- **Drag and Drop**: Easily move cards between columns using SortableJS.
- **Dark Mode**: Seamlessly switch between light and dark themes.
- **REST API**: Your boards and cards are persisted in a PostgreSQL database via a REST API.
- **Responsive Design**: Works on desktops, tablets, and mobile devices.
- **Card Management**: Add, edit, and delete cards with priority levels, due dates, and custom labels.
- **Column Management**: Create new columns, rename existing ones, and delete columns with an integrated card transfer mechanism to prevent data loss.
- **Data Portability**: Export your entire board state to a JSON file and import it back to restore your data or move it between browsers.
- **Search Function**: Quickly filter cards across all columns by keyword (title, description, or labels).

## Project Structure

```text
.
├── index.html          # Main entry point and layout
├── CLAUDE.md           # AI development guidance
├── README.md           # Project documentation
├── LICENSE             # License information
└── src/
    ├── css/
    │   └── style.css    # Custom styles complementing Tailwind CSS
    └── js/
        ├── app.js       # Main application controller (KanbanApp class)
        ├── api.js         # REST API client for data persistence (ApiClient class)
        └── ui.js        # UI rendering and DOM manipulation (UI object)
```

## Tech Stack

- **HTML5**
- **Tailwind CSS** (via CDN)
- **JavaScript (ES6 Modules)**
- **SortableJS** (for drag-and-drop)

## Getting Started

No installation or build process is required. Simply open `index.html` in any modern web browser to start using the board.

## Development

This is a vanilla JavaScript project. Since it uses ES6 modules and CDN-hosted dependencies, it can be run directly from the filesystem or a simple local server.

- **Styling**: All layouts are built with Tailwind CSS.
- **State**: The application state is maintained as a central object and synchronized with a REST API.
- **Interactions**: UI events are handled via a mix of direct listeners and custom browser events.

## Screenshots

<img width="800" height="302" alt="image" src="https://github.com/user-attachments/assets/5e0fd240-2aa4-45d6-8ff4-bd9ecbaecf18" />
<img width="800" height="302" alt="image" src="https://github.com/user-attachments/assets/5c6e7b22-fec0-4961-b3e5-6366f2494d45" />
