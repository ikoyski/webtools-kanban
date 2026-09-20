# PLAN.md — Multi-board + membership (frontend)

Repo: `webtools-kanban` (vanilla JS, ES6 modules, no build step, Tailwind CDN, SortableJS)
Companion doc: `backend-plan.md` in the `webtools-kanban-backend` repo. The **API
Contract** section below is duplicated verbatim in both files — keep them in sync if
either changes.

## Context / why

`app.js`'s `KanbanApp` has zero multi-board awareness today — `this.state` *is* the
board (`{id, name, columns, cards, settings}`), and `this.state.id` is only ever read in
one place (`createColumn(newName.trim(), this.state.id)`). `ApiClient.getBoard()` hits
`GET /v1/boards`, which today returns "the one board." After the backend change, that
same path returns a **list**.

Header (`index.html`, ~line 104–214) already has a working dropdown (`#menu-dropdown`,
triggered by `#profile-trigger`) with `add-column-menu`, export/import/logout — the board
switcher slots in right next to it.

---

## Phase 1 — api.js

- Rename `getBoard()` → `getBoards()`, hitting the (now list-returning) `GET
  /v1/boards`.
- Add `getBoard(boardId)` → `GET /v1/boards/{boardId}` (today's full-state shape).
- Add `createBoard(name)` → `POST /v1/boards`.
- Add `renameBoard(boardId, name)` → `PATCH /v1/boards/{boardId}`.
- Add `deleteBoard(boardId)` → `DELETE /v1/boards/{boardId}`.
- Update `exportBoard()`/`importBoard()` to take `boardId` and hit the `{boardId}`-scoped
  paths.
- Add `getMembers(boardId)`, `addMember(boardId, email, role)`,
  `updateMemberRole(boardId, userId, role)`, `removeMember(boardId, userId)`.
- No change needed to the 401 → `auth-expired` handling in `request()` — that's already
  correct and will start firing for real once the backend enforces the gateway headers.

## Phase 2 — app.js (KanbanApp)

- New instance fields: `boards` (array from `getBoards()`), `currentBoardId`,
  `currentRole` — set from the `role` field on whichever response was loaded most
  recently (both the list entries and the board-detail response carry `role`; see API
  Contract below), so it's always available immediately after either call without
  needing to cross-reference the other.
- `start()`: after `checkAuth()`, call `ApiClient.getBoards()`.
  - Empty list → show a "create your first board" state (new small form, reuse the
    existing modal CSS patterns already in `index.html` rather than inventing new
    markup).
  - Non-empty → resolve `currentBoardId` in this order: (1) `?board=<id>` query param if
    present and still in the list, (2) `localStorage.getItem('kanban-active-board')` if
    still in the list, (3) the first board.
- Replace `loadBoard()` with `loadBoard(boardId)`: calls `ApiClient.getBoard(boardId)`,
  sets `this.state`, sets `this.currentRole`, persists `boardId` to
  `localStorage('kanban-active-board')`, and syncs the URL (see below).
- **URL persistence** — no router library needed given there's no build step, just plain
  `URLSearchParams`/History API:
  - Whenever `loadBoard(boardId)` succeeds, call
    `history.replaceState(null, '', updateBoardParam(boardId))` on first load (so a bare
    `index.html` visit resolves to a real `?board=<id>` URL without adding a history
    entry), and `history.pushState(...)` specifically when the user *actively switches*
    boards via the switcher (so back/forward moves between boards they've visited).
  - Add a `popstate` listener: on back/forward, re-read `?board=` from the URL and call
    `loadBoard(boardId)` if it differs from `currentBoardId`.
  - If `?board=<id>` is present on load but not in the fetched `boards` list (stale link,
    no access, deleted board), fall back silently to the localStorage/first-board logic
    above rather than erroring — a bad link shouldn't block the whole app.
  - Sharing a board's URL now works for another member with access; it does **not**
    grant access — `GET /v1/boards/{boardId}` still 403s server-side for non-members, so
    the fallback above also covers "someone sent me a link to a board I'm not on."
- `this.state.id` keeps working unchanged everywhere it's already used (e.g.
  `createColumn`), since `state.id` is still just "the currently loaded board's id."
- Gate every mutating handler behind `this.currentRole !== 'VIEWER'`:
  - `addColumnMenu.onclick`
  - `rename-column` / `delete-column` window event handlers
  - `handleFormSubmit` (card create/update)
  - `handleDelete` (card delete)
  - `handleSortEnd` (drag-and-drop move)
  - `importData`
  - For each: don't just block the API call — hide/disable the triggering UI element
    (see Phase 4) so a viewer never sees an affordance that will fail.
- Handle `403` responses from `ApiClient` the same way `401` is handled today (toast +
  revert optimistic update) — currently mutating handlers only roll back on generic
  errors, which already covers this. Use a specific message rather than the raw server
  error, e.g. **"You don't have permission to edit this board."** (placeholder copy,
  adjust freely — the point is not leaking a raw 403/error body to the user).
- Add a board-switch handler: on selecting a different board from the new switcher,
  tear down current Sortable instances, call `loadBoard(newBoardId)` (which pushes the
  new `?board=` URL as described above), re-render, re-init Sortables.

## Phase 3 — ui.js

- Add DOM bindings for the new header elements (board switcher trigger/dropdown, "+ New
  board" action) and a members modal (list, invite-by-email input + role select, remove
  button per row) — mirror the existing `menuDropdown`/`aboutModal`/`profileModal`
  binding style already at the top of the `UI` object.
- `renderBoardSwitcher(boards, currentBoardId)`: populate the dropdown, highlight the
  active board.
- `renderMembers(members, currentRole)`: render the member list; only render the
  invite/role-change/remove controls when `currentRole === 'OWNER'` — VIEWER/EDITOR get a
  read-only list.
- Role-gating in rendering: `createColumnElement` and `createCardHTML` should accept (or
  read from a shared app-state reference) `currentRole`, and:
  - Skip rendering `.rename-col-btn` / `.delete-col-btn` / `.add-card-btn` for VIEWER.
  - Skip rendering the `.edit-btn` / `.delete-btn` on cards for VIEWER.
  - Add a small role badge somewhere in the header for clarity (e.g. next to
    `#user-name`).

## Phase 4 — app.js `initSortables()`

- Skip `Sortable.create(...)` entirely (or pass `disabled: true`) when `this.currentRole
  === 'VIEWER'`, so drag-and-drop isn't even attempted for read-only members.

## Phase 5 — index.html

- Add the board-switcher markup in `<header>` near `#profile-trigger` (~line 106–135).
- Add a members modal skeleton following the existing `about-modal`/`profile-modal`
  structure (~line 214+ area where other modals live).
- Add a lightweight "create your first board" empty-state block, shown instead of
  `#board-container` when `boards.length === 0`. Placeholder copy: **"You don't have any
  boards yet — create one to get started"**, with the create-board form/button front and
  center (adjust copy freely, this is just a starting point).

---

## API Contract (shared with backend-plan.md — keep in sync)

| Method | Path | Min role | Notes |
|---|---|---|---|
| GET | `/v1/boards` | authenticated | list: `{id, name, role, updatedAt}[]` |
| POST | `/v1/boards` | authenticated | body `{name}`; creator becomes OWNER |
| GET | `/v1/boards/{boardId}` | VIEWER | full state, same shape as today's `BoardResponse`, **plus `role`** |
| GET | `/v1/boards/{boardId}/export` | VIEWER | |
| PUT | `/v1/boards/{boardId}/import` | EDITOR | |
| PATCH | `/v1/boards/{boardId}` | EDITOR | rename |
| DELETE | `/v1/boards/{boardId}` | OWNER | |
| GET | `/v1/boards/{boardId}/members` | VIEWER | `{userId, email, displayName, role}[]` |
| POST | `/v1/boards/{boardId}/members` | OWNER | body `{email, role}` |
| PATCH | `/v1/boards/{boardId}/members/{userId}` | OWNER | body `{role}`; 409 if demoting last OWNER |
| DELETE | `/v1/boards/{boardId}/members/{userId}` | OWNER (or self) | 409 if removing last OWNER |
| POST | `/v1/columns` | EDITOR (of body's `boardId`) | unchanged shape |
| PATCH/DELETE | `/v1/columns/{id}` | EDITOR | unchanged shape |
| PATCH | `/v1/columns/reorder` | EDITOR | unchanged shape |
| POST/PATCH/DELETE | `/v1/cards*` | EDITOR | unchanged shape |

Role values, exactly as strings: `OWNER`, `EDITOR`, `VIEWER`.
