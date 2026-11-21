# Task Manager Website — Design Specification

**Project:** Task Manager Website (TaskFlow)
**Version:** 1.0
**Status:** Design complete — approved for implementation
**Owner:** MausBot (Main Manager)

## 1. Product overview

A lightweight, fully client-side Task Manager web app. Users can create, edit,
complete, filter, search, sort and delete tasks. Data persists in the browser
(localStorage). No backend, no paid services, no sign-in required.

## 2. Information architecture

Single page app with these regions (top to bottom):

1. **Header** — app name/logo, global search, theme toggle, "Add Task" CTA.
2. **Stats bar** — 4 cards: Total, Active, Completed, Overdue.
3. **Toolbar** — filter tabs (All / Active / Completed / Overdue), sort
   dropdown, category filter dropdown.
4. **Task list** — responsive grid of task cards. Empty state when no tasks.
5. **Footer** — Export JSON, Import JSON, Clear completed, item count.

## 3. User flows

- **Add task:** click "Add Task" → modal opens → fill form → Save → task
  appears at top of list, toast "Task added".
- **Edit task:** click edit icon on card → modal prefilled → Save → card
  updates, toast "Task updated".
- **Complete:** click checkbox → strikethrough + dim + move to completed
  filter view, toast "Task completed".
- **Delete:** click delete → confirm dialog → remove, toast "Task deleted".
- **Filter/Search/Sort:** instant, client-side, no reload.
- **Theme:** toggle persists in localStorage.

## 4. Visual design

### 4.1 Color tokens

Light theme (default):
- `--bg`: #F9FAFB
- `--surface`: #FFFFFF
- `--surface-2`: #F3F4F6
- `--text`: #111827
- `--text-muted`: #6B7280
- `--border`: #E5E7EB
- `--primary`: #4F46E5
- `--primary-hover`: #4338CA
- `--success`: #10B981
- `--warning`: #F59E0B
- `--danger`: #EF4444

Dark theme (`.dark` on `<html>`):
- `--bg`: #0F172A
- `--surface`: #1E293B
- `--surface-2`: #334155
- `--text`: #F1F5F9
- `--text-muted`: #94A3B8
- `--border`: #334155

Priority colors:
- High: #EF4444 (red)
- Medium: #F59E0B (amber)
- Low: #10B981 (green)

### 4.2 Typography

- Font family: `Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
- Base size: 16px, line-height 1.5
- H1 (app title): 24px / 700
- H2 (section): 18px / 600
- Body: 16px / 400
- Small/meta: 13px / 500

### 4.3 Spacing & radius

- Base unit: 8px. Spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Card radius: 12px. Button radius: 8px. Input radius: 8px.
- Card padding: 16px. Modal padding: 24px.

### 4.4 Shadows

- Card: `0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)`
- Modal: `0 20px 40px rgba(0,0,0,.25)`
- Hover: `0 4px 12px rgba(0,0,0,.12)`

## 5. Components

### 5.1 Header
- Left: logo (checkmark icon) + "TaskFlow" wordmark.
- Center: search input (max 480px) with magnifier icon, placeholder
  "Search tasks…".
- Right: theme toggle (sun/moon icon button), "Add Task" primary button.

### 5.2 Stats cards
- 4 cards in a row (2x2 on mobile). Each: icon + label + large number.
- Total (blue), Active (amber), Completed (green), Overdue (red).

### 5.3 Filter tabs
- Pill-style tabs: All, Active, Completed, Overdue. Active tab filled primary.
- Show count badge on each.

### 5.4 Task card
- Left: circular checkbox (animated check).
- Body: title (bold, strikethrough if done), description (2-line clamp),
  meta row: priority badge, due date, category tag.
- Right (on hover / always mobile): edit (pencil) + delete (trash) icon buttons.
- Overdue tasks get a red left border accent.
- Completed tasks: reduced opacity (0.6), strikethrough title.

### 5.5 Add/Edit modal
- Centered dialog, max-width 560px, backdrop blur.
- Fields: Title (required), Description (textarea), Priority (select),
  Due date (date), Category (select with "New category…" option).
- Footer: Cancel (ghost) + Save (primary).
- Close on Esc, backdrop click.

### 5.6 Empty state
- Centered illustration (SVG checkmark in circle), heading "No tasks yet",
  subtext "Add your first task to get started", CTA button.

### 5.7 Toast
- Bottom-right, slide-in, auto-dismiss 3s. Types: success (green), error (red),
  info (blue).

## 6. Responsive breakpoints

- Mobile: < 640px — single column, full-width modal (bottom sheet), icon-only
  header buttons.
- Tablet: 640–1024px — 2-column task grid.
- Desktop: > 1024px — 3-column task grid, full header.

## 7. Accessibility

- Semantic HTML (header, main, section, article, button).
- All interactive elements keyboard-focusable with visible focus ring.
- ARIA labels on icon buttons.
- Modal traps focus, restores on close.
- Color contrast ≥ 4.5:1 for text.
- `prefers-reduced-motion` respected.

## 8. Data model

```js
Task = {
  id: string (uuid v4),
  title: string (1..120 chars),
  description: string (0..500 chars),
  priority: 'high' | 'medium' | 'low',
  dueDate: string (ISO date YYYY-MM-DD) | null,
  category: string,
  completed: boolean,
  createdAt: string (ISO datetime),
  updatedAt: string (ISO datetime)
}
```

Storage key: `taskflow.tasks` (JSON array), `taskflow.theme`, `taskflow.categories`.

## 9. Tech stack

- Vanilla HTML5, CSS3 (custom properties), ES2022 JavaScript.
- No build step, no dependencies, no framework.
- Deployable as static files to any host (GitHub Pages).

## 10. Out of scope (v1)

- Multi-user / auth / backend.
- Drag-and-drop reordering.
- Recurring tasks.
- File attachments.

---
*Design approved. Implementation follows.*
