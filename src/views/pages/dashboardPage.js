const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderDashboardPage({ statusCounts, priorityCounts, upcomingDueTasks = [] } = {}) {
  const upcoming =
    upcomingDueTasks.length === 0
      ? '<p id="empty-upcoming-due">No upcoming due tasks — you\'re all caught up</p>'
      : `<ol id="upcoming-due-list">${upcomingDueTasks
          .map(
            (task) => `
      <li class="post${task.overdue ? ' task-overdue' : ''}">
        <div>
          <div class="post-author">${escapeHtml(task.title)}</div>
          <div class="post-meta">Due ${escapeHtml(task.dueDate)}${
            task.overdue ? ' <span class="overdue-badge">Overdue</span>' : ''
          }</div>
        </div>
      </li>`
          )
          .join('')}</ol>`;

  const body = `
<div id="dashboard" class="status-screen">
  <div id="status-summary" class="card">
    <h2>Status Summary</h2>
    <p>Complete: <span id="status-complete-count">${statusCounts.complete}</span></p>
    <p>Incomplete: <span id="status-incomplete-count">${statusCounts.incomplete}</span></p>
  </div>
  <div id="priority-summary" class="card">
    <h2>Priority Summary</h2>
    <p>Low: <span id="priority-low-count">${priorityCounts.low}</span></p>
    <p>Medium: <span id="priority-medium-count">${priorityCounts.medium}</span></p>
    <p>High: <span id="priority-high-count">${priorityCounts.high}</span></p>
  </div>
  <div id="upcoming-due" class="card">
    <h2>Upcoming Due Tasks</h2>
    ${upcoming}
  </div>
</div>
`;

  return renderLayout('Dashboard', body);
}

module.exports = { renderDashboardPage };
