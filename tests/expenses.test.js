const request = require('supertest');
const app = require('../src/app');
const expenseStore = require('../src/store/expenseStore');
const { validate } = require('../src/validation/expenseValidator');

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

beforeEach(() => {
  expenseStore.reset();
});

describe('AC1: tapping add-expense shows a form with amount/category/date/note', () => {
  it('shows an add-expense link on the expense list page', async () => {
    const res = await request(app).get('/expenses');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="add-expense-action"[^>]*href="\/expenses\/new"/);
  });

  it('renders a form with amount, category, date, and note fields', async () => {
    const res = await request(app).get('/expenses/new');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/<input[^>]*name="amount"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*name="category"[^>]*>/);
    expect(res.text).toMatch(/<input[^>]*type="date"[^>]*name="date"[^>]*>/);
    expect(res.text).toMatch(/<textarea[^>]*name="note"[^>]*>/);
  });
});

describe('AC7: empty list shows the no-expenses message', () => {
  it('shows the empty-state message when no expenses have been added', async () => {
    const res = await request(app).get('/expenses');

    expect(res.status).toBe(200);
    expect(res.text).toContain('No expenses yet — add your first one');
    expect(res.text).not.toContain('id="expense-list"');
  });
});

describe('AC4: missing required fields blocks save with a validation error', () => {
  const validPayload = { amount: '10', category: 'Food', date: todayDate(), note: '' };

  it.each(['amount', 'category', 'date'])('rejects a submission missing %s', async (field) => {
    const payload = { ...validPayload, [field]: '' };

    const res = await request(app).post('/expenses').type('form').send(payload);

    expect(res.status).toBe(400);
    const expectedMessage =
      field === 'amount'
        ? 'Amount is required.'
        : field === 'category'
        ? 'Category is required.'
        : 'Date is required.';
    expect(res.text).toContain(expectedMessage);

    const listRes = await request(app).get('/expenses');
    expect(listRes.text).toContain('No expenses yet — add your first one');
  });

  it('redisplays the originally typed amount instead of a parsed NaN', async () => {
    const res = await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: 'abc', category: 'Food', date: todayDate(), note: '' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Amount must be a positive number.');
    expect(res.text).toMatch(/id="expense-amount"[^>]*value="abc"/);
    expect(res.text).not.toContain('NaN');
  });
});

describe('AC2: valid submission puts the new expense at the top of the list', () => {
  it('lists the most recently added expense first', async () => {
    await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: '10', category: 'Food', date: todayDate(), note: '' });

    const res = await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: '20', category: 'Transport', date: todayDate(), note: '' });

    expect(res.status).toBe(200);
    expect(res.text.indexOf('Transport')).toBeLessThan(res.text.indexOf('Food'));
  });
});

describe('AC3: period total updates to include the new expense', () => {
  it('reflects the sum of all expenses in the current period', async () => {
    await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: '10', category: 'Food', date: todayDate(), note: '' });

    const res = await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: '20.50', category: 'Transport', date: todayDate(), note: '' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="period-total"[^>]*>[^<]*30\.50/);
  });
});

describe('AC5: any calendar date is accepted without restriction', () => {
  it('does not flag a past date as invalid', () => {
    const { errors } = validate({
      amount: '10',
      category: 'Food',
      date: '2000-01-01',
      note: '',
    });

    expect(errors).not.toContain('Date is required.');
    expect(errors).toHaveLength(0);
  });

  it('does not flag a future date as invalid', () => {
    const { errors } = validate({
      amount: '10',
      category: 'Food',
      date: '2999-12-31',
      note: '',
    });

    expect(errors).not.toContain('Date is required.');
    expect(errors).toHaveLength(0);
  });

  it('accepts a past date via the HTTP endpoint', async () => {
    const res = await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: '10', category: 'Food', date: '2000-01-01', note: '' });

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('Date is required.');
  });
});

describe('AC6: a saved expense is still present after closing and reopening the browser', () => {
  it('persists the expense across separate requests', async () => {
    await request(app)
      .post('/expenses')
      .type('form')
      .send({ amount: '15', category: 'Groceries', date: todayDate(), note: '' });

    const res = await request(app).get('/expenses');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Groceries');
  });
});

async function createExpense(overrides = {}) {
  const payload = {
    amount: '10',
    category: 'Food',
    date: todayDate(),
    merchant: 'Corner Cafe',
    note: 'lunch',
    ...overrides,
  };
  await request(app).post('/expenses').type('form').send(payload);

  const listRes = await request(app).get('/expenses');
  const match = listRes.text.match(/id="edit-expense-([^"]+)"/);
  return match[1];
}

describe('Edit AC1: editing any field persists the update and reflects it in the list', () => {
  it('pre-fills the edit form with the expense current values', async () => {
    const id = await createExpense();

    const res = await request(app).get(`/expenses/${id}/edit`);

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="expense-amount"[^>]*value="10"/);
    expect(res.text).toMatch(/id="expense-category"[^>]*value="Food"/);
    expect(res.text).toMatch(/id="expense-date"[^>]*value="[^"]*"/);
    expect(res.text).toMatch(/id="expense-merchant"[^>]*value="Corner Cafe"/);
    expect(res.text).toContain('lunch');
  });

  it('persists updated amount/date/category/merchant/note and reflects them in the list', async () => {
    const id = await createExpense();

    const res = await request(app)
      .post(`/expenses/${id}`)
      .type('form')
      .send({
        amount: '42.50',
        category: 'Transport',
        date: todayDate(),
        merchant: 'Metro',
        note: 'train pass',
      });

    expect(res.status).toBe(200);

    const listRes = await request(app).get('/expenses');
    expect(listRes.text).toContain('Transport');
    expect(listRes.text).toContain('42.50');
    expect(listRes.text).toContain('Metro');
    expect(listRes.text).toContain('train pass');
  });
});

describe('Edit AC2: clearing a required field on edit blocks the save with an inline error', () => {
  const validUpdate = { amount: '10', category: 'Food', date: todayDate(), merchant: '', note: '' };

  it.each(['amount', 'category', 'date'])('rejects an edit missing %s and leaves the stored expense unchanged', async (field) => {
    const id = await createExpense();
    const payload = { ...validUpdate, [field]: '' };

    const res = await request(app).post(`/expenses/${id}`).type('form').send(payload);

    expect(res.status).toBe(400);
    const expectedMessage =
      field === 'amount'
        ? 'Amount is required.'
        : field === 'category'
        ? 'Category is required.'
        : 'Date is required.';
    expect(res.text).toContain(expectedMessage);
    expect(res.text).toContain('has-error');

    const listRes = await request(app).get('/expenses');
    expect(listRes.text).toContain('Food');
    expect(listRes.text).toContain('Corner Cafe');
  });
});

describe('Delete AC3: deleting removes the expense immediately with no undo option', () => {
  it('removes the expense from the list and offers no undo', async () => {
    const id = await createExpense();

    const res = await request(app).post(`/expenses/${id}/delete`);

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('Corner Cafe');
    expect(res.text).toContain('No expenses yet — add your first one');
    expect(res.text.toLowerCase()).not.toContain('undo');
  });
});

describe('Delete AC4: initiating delete shows a confirmation prompt before deletion executes', () => {
  it('shows a confirmation page with confirm/cancel controls without deleting', async () => {
    const id = await createExpense();

    const res = await request(app).get(`/expenses/${id}/delete-confirm`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Corner Cafe');
    expect(res.text).toMatch(new RegExp(`id="confirm-delete-action"[^>]*`));
    expect(res.text).toMatch(/action="\/expenses\/[^"]+\/delete"/);
    expect(res.text).toMatch(/id="cancel-delete-action"/);

    const listRes = await request(app).get('/expenses');
    expect(listRes.text).toContain('Corner Cafe');
  });
});

describe('AC5: a standard loading indicator is displayed during save/delete', () => {
  it('includes a hidden loading indicator inside the edit/save form', async () => {
    const id = await createExpense();

    const res = await request(app).get(`/expenses/${id}/edit`);

    expect(res.text).toMatch(/id="save-loading-indicator"[^>]*hidden/);
  });

  it('includes a hidden loading indicator inside the delete confirmation form', async () => {
    const id = await createExpense();

    const res = await request(app).get(`/expenses/${id}/delete-confirm`);

    expect(res.text).toMatch(/id="delete-loading-indicator"[^>]*hidden/);
  });
});

describe('Delete AC6: cancelling the delete confirmation leaves the expense untouched', () => {
  it('never calls the delete endpoint and the expense remains listed', async () => {
    const id = await createExpense();

    const confirmRes = await request(app).get(`/expenses/${id}/delete-confirm`);
    expect(confirmRes.text).toMatch(/id="cancel-delete-action"[^>]*href="\/expenses"/);

    const listRes = await request(app).get('/expenses');
    expect(listRes.text).toContain('Corner Cafe');
  });
});

describe('404 handling: mutation routes reject nonexistent expense ids', () => {
  it('returns 404 for GET /expenses/:id/edit when the expense does not exist', async () => {
    const res = await request(app).get('/expenses/does-not-exist/edit');

    expect(res.status).toBe(404);
  });

  it('returns 404 for POST /expenses/:id when the expense does not exist', async () => {
    const res = await request(app)
      .post('/expenses/does-not-exist')
      .type('form')
      .send({ amount: '10', category: 'Food', date: todayDate(), merchant: '', note: '' });

    expect(res.status).toBe(404);
  });

  it('returns 404 for GET /expenses/:id/delete-confirm when the expense does not exist', async () => {
    const res = await request(app).get('/expenses/does-not-exist/delete-confirm');

    expect(res.status).toBe(404);
  });

  it('returns 404 for POST /expenses/:id/delete when the expense does not exist', async () => {
    const res = await request(app).post('/expenses/does-not-exist/delete');

    expect(res.status).toBe(404);
  });
});

describe('AC7: edit and delete work without authentication or ownership checks', () => {
  it('allows editing with no session cookie or auth header', async () => {
    const id = await createExpense();

    const res = await request(app)
      .post(`/expenses/${id}`)
      .type('form')
      .send({ amount: '5', category: 'Food', date: todayDate(), merchant: '', note: '' });

    expect(res.status).toBe(200);
  });

  it('allows deleting with no session cookie or auth header', async () => {
    const id = await createExpense();

    const res = await request(app).post(`/expenses/${id}/delete`);

    expect(res.status).toBe(200);
  });
});
