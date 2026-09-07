const express = require('express');
const crypto = require('crypto');
const requireAuthenticatedUser = require('../middleware/requireAuthenticatedUser');
const taskStore = require('../store/taskStore');
const { validate } = require('../validation/taskValidator');

const router = express.Router();

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 50;

function parsePagination(query) {
  const rawLimit = Number.parseInt(query.limit, 10);
  const rawOffset = Number.parseInt(query.offset, 10);

  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0;

  return { limit, offset };
}

function serialize(task) {
  const { id, title, description, dueDate, priority, tags, category, completed } = task;
  return { id, title, description, dueDate, priority, tags, category, completed };
}

function findOwnedTask(req, res) {
  const task = taskStore.findById(req.params.id);
  if (!task || task.userId !== req.user.id) {
    res.status(404).json({ error: 'Task not found' });
    return undefined;
  }
  return task;
}

router.post('/tasks', requireAuthenticatedUser, (req, res) => {
  const payload = req.body || {};
  const result = validate(payload);

  if (result.errors.length > 0) {
    return res.status(400).json({ errors: result.errors });
  }

  const task = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    title: result.title,
    description: result.description,
    dueDate: result.dueDate,
    priority: result.priority,
    tags: result.tags,
    category: result.category,
    completed: false,
  };
  taskStore.save(task);

  return res.status(201).json(serialize(task));
});

router.get('/tasks', requireAuthenticatedUser, (req, res) => {
  const { limit, offset } = parsePagination(req.query);
  const tasks = taskStore
    .listForUser(req.user.id)
    .slice(offset, offset + limit)
    .map(serialize);
  return res.status(200).json(tasks);
});

router.get('/tasks/:id', requireAuthenticatedUser, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) {
    return undefined;
  }
  return res.status(200).json(serialize(task));
});

router.put('/tasks/:id', requireAuthenticatedUser, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) {
    return undefined;
  }

  const payload = req.body || {};
  const result = validate(payload);

  if (result.errors.length > 0) {
    return res.status(400).json({ errors: result.errors });
  }

  task.title = result.title;
  task.description = result.description;
  task.dueDate = result.dueDate;
  task.priority = result.priority;
  task.tags = result.tags;
  task.category = result.category;

  return res.status(200).json(serialize(task));
});

router.delete('/tasks/:id', requireAuthenticatedUser, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) {
    return undefined;
  }

  taskStore.removeById(task.id);

  return res.status(200).json({ message: 'Task deleted' });
});

router.patch('/tasks/:id/toggle', requireAuthenticatedUser, (req, res) => {
  const task = findOwnedTask(req, res);
  if (!task) {
    return undefined;
  }

  task.completed = !task.completed;

  return res.status(200).json(serialize(task));
});

module.exports = router;
