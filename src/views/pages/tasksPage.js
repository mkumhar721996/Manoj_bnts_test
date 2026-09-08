const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

const STATUS_OPTIONS = ['open', 'in-progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
const SORT_OPTIONS = [
  { id: 'createdAt', label: 'Date Created' },
  { id: 'dueDate', label: 'Due Date' },
  { id: 'priority', label: 'Priority' },
];

function optionsFor(values, selected) {
  return values
    .map(
      (value) =>
        `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`
    )
    .join('');
}

function renderTaskList(items) {
  return `<ul id="task-list">${items
    .map(
      (task) => `
    <li class="post">
      <div>
        <div class="post-author">${escapeHtml(task.title)}</div>
        <div class="post-meta">Status: ${escapeHtml(task.status)} · Priority: ${escapeHtml(
        task.priority
      )} · Tag: ${escapeHtml(task.tag)} · Category: ${escapeHtml(task.category)} · Due: ${escapeHtml(
        task.dueDate
      )}</div>
        ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
      </div>
    </li>`
    )
    .join('')}</ul>`;
}

function renderPagination(page, totalPages) {
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return `
  <div id="pagination">
    <span>Page ${page} of ${totalPages}</span>
    ${page > 1 ? `<a id="prev-page" href="?page=${prevPage}">Previous</a>` : ''}
    ${page < totalPages ? `<a id="next-page" href="?page=${nextPage}">Next</a>` : ''}
  </div>`;
}

function renderTasksPage({
  items = [],
  totalCount = 0,
  page = 1,
  totalPages = 1,
  filters = {},
} = {}) {
  const { q = '', status = '', priority = '', tag = '', category = '', sortBy = 'createdAt' } = filters;

  const listOrEmpty =
    items.length === 0
      ? '<p id="empty-tasks">No tasks match your search or filters</p>'
      : renderTaskList(items);

  const body = `
<div class="status-screen">
  <div class="card">
    <h2>Tasks</h2>
    <form id="task-filters" action="/tasks" method="get">
      <div class="field">
        <label for="task-search">Search</label>
        <input type="text" id="task-search" name="q" value="${escapeHtml(q)}">
      </div>

      <div class="field">
        <label for="task-status">Status</label>
        <select id="task-status" name="status">
          <option value="">Any</option>
          ${optionsFor(STATUS_OPTIONS, status)}
        </select>
      </div>

      <div class="field">
        <label for="task-priority">Priority</label>
        <select id="task-priority" name="priority">
          <option value="">Any</option>
          ${optionsFor(PRIORITY_OPTIONS, priority)}
        </select>
      </div>

      <div class="field">
        <label for="task-tag">Tag</label>
        <input type="text" id="task-tag" name="tag" value="${escapeHtml(tag)}">
      </div>

      <div class="field">
        <label for="task-category">Category</label>
        <input type="text" id="task-category" name="category" value="${escapeHtml(category)}">
      </div>

      <div class="field">
        <label for="task-sort">Sort by</label>
        <select id="task-sort" name="sortBy">
          ${SORT_OPTIONS.map(
            (option) =>
              `<option value="${option.id}"${option.id === sortBy ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
          ).join('')}
        </select>
      </div>

      <button class="btn btn-brand" type="submit">Apply</button>
      <a id="clear-filters-action" href="/tasks">Clear filters</a>
    </form>

    <p id="task-total-count">${totalCount} task${totalCount === 1 ? '' : 's'} found</p>

    ${listOrEmpty}

    ${renderPagination(page, totalPages)}
  </div>
</div>
`;

  return renderLayout('Tasks', body);
}

module.exports = { renderTasksPage };
