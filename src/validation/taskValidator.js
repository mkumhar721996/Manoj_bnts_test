const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function validate(payload) {
  const errors = [];

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description : '';
  const dueDate = typeof payload.dueDate === 'string' ? payload.dueDate.trim() : '';
  const priority = typeof payload.priority === 'string' ? payload.priority : '';
  const category = typeof payload.category === 'string' ? payload.category : '';
  const tags = Array.isArray(payload.tags) ? payload.tags : [];

  if (!title) {
    errors.push('Title is required.');
  }

  if (dueDate && !DATE_FORMAT.test(dueDate)) {
    errors.push('Due date must be in YYYY-MM-DD format.');
  }

  return { errors, title, description, dueDate, priority, tags, category };
}

module.exports = { validate };
