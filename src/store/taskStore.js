let tasks = new Map();

function reset() {
  tasks = new Map();
}

function create(task) {
  tasks.set(task.id, { ...task });
  return task;
}

function update(id, changes) {
  const existing = tasks.get(id);
  if (!existing) {
    return undefined;
  }
  const updated = { ...existing, ...changes };
  tasks.set(id, updated);
  return updated;
}

function remove(id) {
  tasks.delete(id);
}

function toggleComplete(id) {
  const existing = tasks.get(id);
  if (!existing) {
    return undefined;
  }
  return update(id, { completed: !existing.completed });
}

function listByUserId(userId) {
  return Array.from(tasks.values()).filter((task) => task.userId === userId);
}

module.exports = { create, update, remove, toggleComplete, listByUserId, reset };
