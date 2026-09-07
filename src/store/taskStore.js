// Tasks are grouped by owner up front so a dashboard load (listByUserId) never
// has to scan every task in the system - only the requesting user's own.
let tasksByUserId = new Map();
let ownerByTaskId = new Map();

function reset() {
  tasksByUserId = new Map();
  ownerByTaskId = new Map();
}

function tasksMapFor(userId) {
  if (!tasksByUserId.has(userId)) {
    tasksByUserId.set(userId, new Map());
  }
  return tasksByUserId.get(userId);
}

function create(task) {
  const stored = { ...task };
  tasksMapFor(task.userId).set(task.id, stored);
  ownerByTaskId.set(task.id, task.userId);
  return task;
}

function update(id, changes) {
  const ownerId = ownerByTaskId.get(id);
  if (ownerId === undefined) {
    return undefined;
  }

  const existing = tasksByUserId.get(ownerId).get(id);
  const updated = { ...existing, ...changes };

  if (updated.userId !== ownerId) {
    tasksByUserId.get(ownerId).delete(id);
    tasksMapFor(updated.userId).set(id, updated);
    ownerByTaskId.set(id, updated.userId);
  } else {
    tasksByUserId.get(ownerId).set(id, updated);
  }

  return updated;
}

function remove(id) {
  const ownerId = ownerByTaskId.get(id);
  if (ownerId === undefined) {
    return;
  }
  tasksByUserId.get(ownerId).delete(id);
  ownerByTaskId.delete(id);
}

function toggleComplete(id) {
  const ownerId = ownerByTaskId.get(id);
  if (ownerId === undefined) {
    return undefined;
  }
  const existing = tasksByUserId.get(ownerId).get(id);
  return update(id, { completed: !existing.completed });
}

function listByUserId(userId) {
  const userTasks = tasksByUserId.get(userId);
  return userTasks ? Array.from(userTasks.values()) : [];
}

module.exports = { create, update, remove, toggleComplete, listByUserId, reset };
