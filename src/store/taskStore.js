let tasks = [];

function reset() {
  tasks = [];
}

function save(task) {
  tasks.push(task);
}

function findById(id) {
  return tasks.find((task) => task.id === id);
}

function listForUser(userId) {
  return tasks.filter((task) => task.userId === userId);
}

function removeById(id) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return false;
  }
  tasks.splice(index, 1);
  return true;
}

module.exports = { save, findById, listForUser, removeById, reset };
