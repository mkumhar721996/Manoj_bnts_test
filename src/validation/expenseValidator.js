const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function validate(payload) {
  const errors = [];

  const rawAmount = typeof payload.amount === 'string' ? payload.amount.trim() : '';
  const category = typeof payload.category === 'string' ? payload.category.trim() : '';
  const date = typeof payload.date === 'string' ? payload.date.trim() : '';
  const note = typeof payload.note === 'string' ? payload.note.trim() : '';

  const amount = rawAmount === '' ? NaN : Number(rawAmount);

  if (!rawAmount) {
    errors.push('Amount is required.');
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }

  if (!category) {
    errors.push('Category is required.');
  }

  if (!date) {
    errors.push('Date is required.');
  } else if (!DATE_FORMAT.test(date)) {
    errors.push('Date must be a valid calendar date.');
  }

  return { errors, amount, category, date, note };
}

module.exports = { validate };
