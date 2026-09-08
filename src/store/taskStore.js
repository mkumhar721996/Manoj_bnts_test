let tasks = [];

function reset() {
  tasks = [];
}

function save(task) {
  tasks.unshift(task);
}

function matchesSearch(task, q) {
  if (!q) {
    return true;
  }
  const title = (task.title || '').toLowerCase();
  const description = (task.description || '').toLowerCase();
  return title.includes(q) || description.includes(q);
}

function matchesFilters(task, { status, priority, tag, category }) {
  if (status && task.status !== status) {
    return false;
  }
  if (priority && task.priority !== priority) {
    return false;
  }
  if (tag && task.tag !== tag) {
    return false;
  }
  if (category && task.category !== category) {
    return false;
  }
  return true;
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function compareBy(sortBy) {
  if (sortBy === 'dueDate') {
    return (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '');
  }
  if (sortBy === 'priority') {
    return (a, b) =>
      (PRIORITY_RANK[a.priority] ?? Number.MAX_SAFE_INTEGER) -
      (PRIORITY_RANK[b.priority] ?? Number.MAX_SAFE_INTEGER);
  }
  return (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '');
}

function list(userId, { q, status, priority, tag, category, sortBy, page, pageSize }) {
  const filtered = tasks
    .filter((task) => task.userId === userId)
    .filter((task) => matchesSearch(task, q))
    .filter((task) => matchesFilters(task, { status, priority, tag, category }))
    .sort(compareBy(sortBy));

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, totalCount, page: currentPage, pageSize, totalPages };
}

module.exports = { reset, save, list };
