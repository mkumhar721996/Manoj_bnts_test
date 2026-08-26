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
