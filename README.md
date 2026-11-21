# TaskFlow — Task Manager Website

A lightweight, fully client-side Task Manager web app. Create, edit, complete,
filter, search, sort and delete tasks. Data persists in the browser (localStorage).
No backend, no paid services, no sign-in required.

## Features

- Add / edit / delete tasks
- Mark tasks complete / reopen
- Priority levels (High / Medium / Low) with color coding
- Due dates with overdue highlighting
- Categories (create your own)
- Filter: All / Active / Completed / Overdue
- Search by title, description, category
- Sort by created date, due date, priority, title
- Stats dashboard (Total, Active, Completed, Overdue)
- Dark / light theme (persisted)
- Export / import tasks as JSON
- Clear completed tasks
- Responsive (mobile, tablet, desktop)
- Keyboard shortcuts: `N` new task, `Ctrl/Cmd+K` focus search, `Esc` close modal
- Accessible (keyboard navigation, ARIA, focus management)

## Tech stack

- Vanilla HTML5, CSS3 (custom properties), ES2022 JavaScript
- No build step, no dependencies, no framework
- Deployable as static files to any host (e.g. GitHub Pages)

## Run locally

Just open `index.html` in any modern browser. No server required.

Or serve with any static server, e.g.:

```bash
npx serve .
```

## Project structure

```
.
├── index.html          # App shell & markup
├── css/
│   └── styles.css      # Styles & theming
├── js/
│   └── app.js          # Application logic
├── DESIGN.md           # Design specification
├── README.md
└── .gitignore
```

## Data model

```js
Task = {
  id, title, description, priority, dueDate, category,
  completed, createdAt, updatedAt
}
```

Storage keys (localStorage): `taskflow.tasks`, `taskflow.theme`, `taskflow.categories`.

## License

MIT
