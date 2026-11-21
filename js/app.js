/* TaskFlow — app.js */
(function () {
  'use strict';

  // ---------- Constants ----------
  const STORAGE_KEYS = {
    tasks: 'taskflow.tasks',
    theme: 'taskflow.theme',
    categories: 'taskflow.categories',
  };

  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

  // ---------- State ----------
  const state = {
    tasks: [],
    categories: ['General', 'Work', 'Personal', 'Shopping'],
    filter: 'all',
    sort: 'created-desc',
    categoryFilter: 'all',
    searchQuery: '',
    editingId: null,
  };

  // ---------- DOM refs ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    searchInput: $('#searchInput'),
    themeToggle: $('#themeToggle'),
    addTaskBtn: $('#addTaskBtn'),
    emptyAddBtn: $('#emptyAddBtn'),
    taskList: $('#taskList'),
    emptyState: $('#emptyState'),
    statTotal: $('#statTotal'),
    statActive: $('#statActive'),
    statCompleted: $('#statCompleted'),
    statOverdue: $('#statOverdue'),
    countAll: $('#countAll'),
    countActive: $('#countActive'),
    countCompleted: $('#countCompleted'),
    countOverdue: $('#countOverdue'),
    sortSelect: $('#sortSelect'),
    categoryFilter: $('#categoryFilter'),
    footerCount: $('#footerCount'),
    exportBtn: $('#exportBtn'),
    importBtn: $('#importBtn'),
    clearCompletedBtn: $('#clearCompletedBtn'),
    importFile: $('#importFile'),
    modalBackdrop: $('#modalBackdrop'),
    modalTitle: $('#modalTitle'),
    modalClose: $('#modalClose'),
    taskForm: $('#taskForm'),
    taskId: $('#taskId'),
    titleInput: $('#titleInput'),
    titleError: $('#titleError'),
    descInput: $('#descInput'),
    prioritySelect: $('#prioritySelect'),
    dueDateInput: $('#dueDateInput'),
    categorySelect: $('#categorySelect'),
    newCategoryInput: $('#newCategoryInput'),
    cancelBtn: $('#cancelBtn'),
    saveBtn: $('#saveBtn'),
    toastContainer: $('#toastContainer'),
  };

  // ---------- Storage ----------
  function loadState() {
    try {
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');
      state.tasks = Array.isArray(tasks) ? tasks : [];
    } catch (e) {
      state.tasks = [];
    }
    try {
      const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || 'null');
      if (Array.isArray(cats) && cats.length) state.categories = cats;
    } catch (e) { /* keep defaults */ }
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
  }
  function saveCategories() {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
  }
  function saveTheme() {
    const dark = document.documentElement.classList.contains('dark');
    localStorage.setItem(STORAGE_KEYS.theme, dark ? 'dark' : 'light');
  }

  // ---------- Utils ----------
  function uid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }
  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function isOverdue(task) {
    if (task.completed || !task.dueDate) return false;
    return task.dueDate < todayISO();
  }
  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- Toast ----------
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 200);
    }, 3000);
  }

  // ---------- Theme ----------
  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    saveTheme();
  }

  // ---------- Filtering / Sorting ----------
  function getFilteredTasks() {
    let list = state.tasks.slice();
    // search
    const q = state.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }
    // category filter
    if (state.categoryFilter !== 'all') {
      list = list.filter((t) => t.category === state.categoryFilter);
    }
    // status filter
    switch (state.filter) {
      case 'active':
        list = list.filter((t) => !t.completed);
        break;
      case 'completed':
        list = list.filter((t) => t.completed);
        break;
      case 'overdue':
        list = list.filter((t) => isOverdue(t));
        break;
    }
    // sort
    list.sort((a, b) => {
      switch (state.sort) {
        case 'created-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'due-asc': {
          const ad = a.dueDate || '9999-12-31';
          const bd = b.dueDate || '9999-12-31';
          return ad.localeCompare(bd);
        }
        case 'due-desc': {
          const ad = a.dueDate || '0000-00-00';
          const bd = b.dueDate || '0000-00-00';
          return bd.localeCompare(ad);
        }
        case 'priority':
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return list;
  }

  // ---------- Counts ----------
  function counts() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const overdue = state.tasks.filter(isOverdue).length;
    return { total, active, completed, overdue };
  }

  // ---------- Render ----------
  function render() {
    const c = counts();
    dom.statTotal.textContent = c.total;
    dom.statActive.textContent = c.active;
    dom.statCompleted.textContent = c.completed;
    dom.statOverdue.textContent = c.overdue;

    dom.countAll.textContent = c.total;
    dom.countActive.textContent = c.active;
    dom.countCompleted.textContent = c.completed;
    dom.countOverdue.textContent = c.overdue;

    dom.footerCount.textContent = `${c.total} task${c.total === 1 ? '' : 's'} · ${c.completed} completed`;

    // category filter options
    const currentCat = dom.categoryFilter.value;
    const catOptions = ['all', ...state.categories];
    dom.categoryFilter.innerHTML = catOptions
      .map((cat) => {
        if (cat === 'all') return `<option value="all">All categories</option>`;
        return `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
      })
      .join('');
    if (catOptions.includes(currentCat)) dom.categoryFilter.value = currentCat;
    else dom.categoryFilter.value = 'all';
    state.categoryFilter = dom.categoryFilter.value;

    // category select in modal
    const modalCat = dom.categorySelect.value || 'General';
    dom.categorySelect.innerHTML = state.categories
      .map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)
      .join('') + `<option value="__new__">+ New category…</option>`;
    if (state.categories.includes(modalCat)) dom.categorySelect.value = modalCat;
    else dom.categorySelect.value = state.categories[0] || 'General';

    const list = getFilteredTasks();
    if (list.length === 0) {
      dom.taskList.innerHTML = '';
      dom.taskList.classList.add('hidden');
      dom.emptyState.classList.remove('hidden');
    } else {
      dom.emptyState.classList.add('hidden');
      dom.taskList.classList.remove('hidden');
      dom.taskList.innerHTML = list.map(renderCard).join('');
    }
  }

  function renderCard(t) {
    const overdue = isOverdue(t);
    const priorityLabel = t.priority.charAt(0).toUpperCase() + t.priority.slice(1);
    const dueHtml = t.dueDate
      ? `<span class="task-due ${overdue ? 'overdue' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          ${escapeHtml(formatDate(t.dueDate))}${overdue ? ' · Overdue' : ''}
        </span>`
      : '';
    return `
      <article class="task-card ${t.completed ? 'completed' : ''} ${overdue ? 'overdue' : ''}" data-id="${escapeHtml(t.id)}">
        <div class="task-card-top">
          <button class="checkbox ${t.completed ? 'checked' : ''}" data-action="toggle" aria-label="${t.completed ? 'Mark incomplete' : 'Mark complete'}" aria-pressed="${t.completed}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
          <div class="task-body">
            <h3 class="task-title">${escapeHtml(t.title)}</h3>
            ${t.description ? `<p class="task-desc">${escapeHtml(t.description)}</p>` : ''}
            <div class="task-meta">
              <span class="badge badge-priority-${t.priority}">${priorityLabel}</span>
              ${t.category ? `<span class="badge badge-category">${escapeHtml(t.category)}</span>` : ''}
              ${dueHtml}
            </div>
          </div>
          <div class="task-actions">
            <button class="action-btn" data-action="edit" aria-label="Edit task" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="action-btn delete" data-action="delete" aria-label="Delete task" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // ---------- Modal ----------
  function openModal(task = null) {
    state.editingId = task ? task.id : null;
    dom.modalTitle.textContent = task ? 'Edit Task' : 'Add Task';
    dom.saveBtn.textContent = task ? 'Save changes' : 'Save';

    dom.taskId.value = task ? task.id : '';
    dom.titleInput.value = task ? task.title : '';
    dom.descInput.value = task ? (task.description || '') : '';
    dom.prioritySelect.value = task ? task.priority : 'medium';
    dom.dueDateInput.value = task ? (task.dueDate || '') : '';
    dom.newCategoryInput.classList.add('hidden');
    dom.newCategoryInput.value = '';

    // populate category select
    dom.categorySelect.innerHTML = state.categories
      .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
      .join('') + `<option value="__new__">+ New category…</option>`;
    if (task && state.categories.includes(task.category)) {
      dom.categorySelect.value = task.category;
    } else {
      dom.categorySelect.value = state.categories[0] || 'General';
    }

    dom.titleError.textContent = '';
    dom.modalBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => dom.titleInput.focus(), 50);
  }

  function closeModal() {
    dom.modalBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
    state.editingId = null;
  }

  function handleCategoryChange() {
    if (dom.categorySelect.value === '__new__') {
      dom.newCategoryInput.classList.remove('hidden');
      dom.newCategoryInput.focus();
    } else {
      dom.newCategoryInput.classList.add('hidden');
      dom.newCategoryInput.value = '';
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const title = dom.titleInput.value.trim();
    if (!title) {
      dom.titleError.textContent = 'Title is required.';
      dom.titleInput.focus();
      return;
    }
    if (title.length > 120) {
      dom.titleError.textContent = 'Title must be 120 characters or fewer.';
      return;
    }
    const desc = dom.descInput.value.trim();
    if (desc.length > 500) {
      toast('Description too long (max 500 chars).', 'error');
      return;
    }

    let category = dom.categorySelect.value;
    if (category === '__new__') {
      const newCat = dom.newCategoryInput.value.trim();
      if (!newCat) {
        toast('Enter a category name.', 'error');
        dom.newCategoryInput.focus();
        return;
      }
      if (!state.categories.includes(newCat)) {
        state.categories.push(newCat);
        saveCategories();
      }
      category = newCat;
    }

    const now = new Date().toISOString();
    if (state.editingId) {
      const idx = state.tasks.findIndex((t) => t.id === state.editingId);
      if (idx !== -1) {
        state.tasks[idx] = {
          ...state.tasks[idx],
          title,
          description: desc,
          priority: dom.prioritySelect.value,
          dueDate: dom.dueDateInput.value || null,
          category,
          updatedAt: now,
        };
      }
      toast('Task updated.', 'success');
    } else {
      state.tasks.unshift({
        id: uid(),
        title,
        description: desc,
        priority: dom.prioritySelect.value,
        dueDate: dom.dueDateInput.value || null,
        category,
        completed: false,
        createdAt: now,
        updatedAt: now,
      });
      toast('Task added.', 'success');
    }
    saveTasks();
    render();
    closeModal();
  }

  // ---------- Task actions ----------
  function toggleTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    t.updatedAt = new Date().toISOString();
    saveTasks();
    render();
    toast(t.completed ? 'Task completed.' : 'Task reopened.', 'success');
  }

  function deleteTask(id) {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
    toast('Task deleted.', 'info');
  }

  function editTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (t) openModal(t);
  }

  // ---------- List click delegation ----------
  function handleListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-id]');
    if (!card) return;
    const id = card.dataset.id;
    const action = btn.dataset.action;
    if (action === 'toggle') toggleTask(id);
    else if (action === 'edit') editTask(id);
    else if (action === 'delete') deleteTask(id);
  }

  // ---------- Export / Import ----------
  function exportTasks() {
    const data = JSON.stringify({ tasks: state.tasks, categories: state.categories, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-export-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Exported tasks.', 'success');
  }

  function importTasks(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = Array.isArray(parsed.tasks) ? parsed.tasks : Array.isArray(parsed) ? parsed : null;
        if (!incoming) throw new Error('Invalid format');
        // merge by id
        const byId = new Map(state.tasks.map((t) => [t.id, t]));
        let added = 0;
        incoming.forEach((t) => {
          if (t && t.id && t.title) {
            if (!byId.has(t.id)) added++;
            byId.set(t.id, { ...t });
          }
        });
        state.tasks = Array.from(byId.values());
        if (Array.isArray(parsed.categories)) {
          parsed.categories.forEach((c) => {
            if (!state.categories.includes(c)) state.categories.push(c);
          });
          saveCategories();
        }
        saveTasks();
        render();
        toast(`Imported ${incoming.length} task(s).`, 'success');
      } catch (err) {
        toast('Import failed: invalid file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function clearCompleted() {
    const n = state.tasks.filter((t) => t.completed).length;
    if (n === 0) { toast('No completed tasks to clear.', 'info'); return; }
    if (!confirm(`Clear ${n} completed task(s)?`)) return;
    state.tasks = state.tasks.filter((t) => !t.completed);
    saveTasks();
    render();
    toast(`Cleared ${n} task(s).`, 'success');
  }

  // ---------- Event wiring ----------
  function wireEvents() {
    dom.addTaskBtn.addEventListener('click', () => openModal());
    dom.emptyAddBtn.addEventListener('click', () => openModal());
    dom.themeToggle.addEventListener('click', toggleTheme);
    dom.modalClose.addEventListener('click', closeModal);
    dom.cancelBtn.addEventListener('click', closeModal);
    dom.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === dom.modalBackdrop) closeModal();
    });
    dom.taskForm.addEventListener('submit', handleFormSubmit);
    dom.categorySelect.addEventListener('change', handleCategoryChange);

    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      render();
    });

    $$('.filter-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.filter-tab').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        state.filter = btn.dataset.filter;
        render();
      });
    });

    dom.sortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      render();
    });
    dom.categoryFilter.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      render();
    });

    dom.taskList.addEventListener('click', handleListClick);

    dom.exportBtn.addEventListener('click', exportTasks);
    dom.importBtn.addEventListener('click', () => dom.importFile.click());
    dom.importFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importTasks(file);
      e.target.value = '';
    });
    dom.clearCompletedBtn.addEventListener('click', clearCompleted);

    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dom.modalBackdrop.classList.contains('hidden')) {
        closeModal();
      }
      // Ctrl/Cmd+K focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dom.searchInput.focus();
      }
      // 'n' opens new task when not typing
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (!typing && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        openModal();
      }
    });
  }

  // ---------- Init ----------
  function init() {
    loadState();
    wireEvents();
    render();
    // seed demo data only if empty
    if (state.tasks.length === 0) {
      seedDemo();
    }
  }

  function seedDemo() {
    const now = new Date().toISOString();
    const demos = [
      { title: 'Design homepage mockup', description: 'Create wireframes and high-fidelity mockups for the new homepage.', priority: 'high', dueDate: offsetDate(-1), category: 'Work' },
      { title: 'Buy groceries', description: 'Milk, eggs, bread, vegetables.', priority: 'medium', dueDate: offsetDate(1), category: 'Shopping' },
      { title: 'Read "Atomic Habits"', description: 'Finish chapters 5-8.', priority: 'low', dueDate: offsetDate(7), category: 'Personal' },
      { title: 'Team standup notes', description: 'Summarize action items from Monday standup.', priority: 'medium', dueDate: null, category: 'Work' },
    ];
    demos.forEach((d, i) => {
      state.tasks.push({
        id: uid(),
        title: d.title,
        description: d.description,
        priority: d.priority,
        dueDate: d.dueDate,
        category: d.category,
        completed: i === 3,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        updatedAt: now,
      });
    });
    saveTasks();
    render();
  }

  function offsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
