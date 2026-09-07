const taskStore = require('../store/taskStore');

const UPCOMING_WINDOW_DAYS = 7;

function todayDateString() {
  return new Date(Date.now()).toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function computeStatusCounts(tasks) {
  return tasks.reduce(
    (counts, task) => {
      if (task.completed) {
        counts.complete += 1;
      } else {
        counts.incomplete += 1;
      }
      return counts;
    },
    { complete: 0, incomplete: 0 }
  );
}

function computePriorityCounts(tasks) {
  return tasks.reduce(
    (counts, task) => {
      if (task.priority === 'low') {
        counts.low += 1;
      } else if (task.priority === 'medium') {
        counts.medium += 1;
      } else if (task.priority === 'high') {
        counts.high += 1;
      }
      return counts;
    },
    { low: 0, medium: 0, high: 0 }
  );
}

function computeUpcomingDueTasks(tasks, today) {
  const windowEnd = addDays(today, UPCOMING_WINDOW_DAYS);

  return tasks
    .filter((task) => task.dueDate && task.dueDate <= windowEnd)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0))
    .map((task) => ({ ...task, overdue: task.dueDate < today && !task.completed }));
}

function getDashboardData(userId) {
  const tasks = taskStore.listByUserId(userId);
  const today = todayDateString();

  return {
    statusCounts: computeStatusCounts(tasks),
    priorityCounts: computePriorityCounts(tasks),
    upcomingDueTasks: computeUpcomingDueTasks(tasks, today),
  };
}

module.exports = {
  computeStatusCounts,
  computePriorityCounts,
  computeUpcomingDueTasks,
  getDashboardData,
};
