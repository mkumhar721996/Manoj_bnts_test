const STATUSES = ['open', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const SORT_FIELDS = ['dueDate', 'priority', 'createdAt'];
const DEFAULT_PAGE_SIZE = 10;

function allowListed(value, allowed) {
  return typeof value === 'string' && allowed.includes(value) ? value : undefined;
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

function validate(query = {}) {
  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : '';
  const status = allowListed(query.status, STATUSES);
  const priority = allowListed(query.priority, PRIORITIES);
  const tag = typeof query.tag === 'string' && query.tag.trim() !== '' ? query.tag.trim().toLowerCase() : undefined;
  const category =
    typeof query.category === 'string' && query.category.trim() !== ''
      ? query.category.trim().toLowerCase()
      : undefined;
  const sortBy = allowListed(query.sortBy, SORT_FIELDS) || 'createdAt';
  const page = toPositiveInt(query.page, 1);
  const pageSize = toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);

  return { q, status, priority, tag, category, sortBy, page, pageSize };
}

module.exports = { validate };
