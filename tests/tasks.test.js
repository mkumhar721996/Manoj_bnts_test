const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const sessionStore = require('../src/store/sessionStore');
const taskStore = require('../src/store/taskStore');

const generateValidPassword = () => `Aa1${crypto.randomBytes(6).toString('hex')}`;

function registrationPayload(overrides = {}) {
  return {
    name: 'Jordan Rivera',
    email: `jordan-${crypto.randomBytes(4).toString('hex')}@example.com`,
    password: generateValidPassword(),
    dateOfBirth: '1990-01-01',
    ...overrides,
  };
}

async function registerUser(overrides = {}) {
  const payload = registrationPayload(overrides);
  const res = await request(app).post('/api/register').send(payload);
  return res.body.sessionToken;
}

function validTaskPayload(overrides = {}) {
  return {
    title: 'Write report',
    description: 'Quarterly report for finance',
    dueDate: '2026-01-31',
    priority: 'high',
    tags: ['work', 'urgent'],
    category: 'Work',
    ...overrides,
  };
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  taskStore.reset();
});

describe('AC1 & AC2: creating a task with valid input', () => {
  it('saves the task with the submitted fields and returns it', async () => {
    const token = await registerUser();
    const payload = validTaskPayload();

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(payload);
  });

  it('includes the newly created task in the task list', async () => {
    const token = await registerUser();
    const payload = validTaskPayload();

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createRes.body.id, title: payload.title })])
    );
  });
});

describe('AC3: invalid input is rejected with an inline error and not saved', () => {
  it('rejects a submission missing the title', async () => {
    const token = await registerUser();
    const payload = validTaskPayload({ title: '' });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/title.*required/i)]));

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body).toHaveLength(0);
  });

  it('rejects a submission with a malformed due date', async () => {
    const token = await registerUser();
    const payload = validTaskPayload({ dueDate: '31-01-2026' });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/due date/i)]));

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body).toHaveLength(0);
  });
});

describe('AC4: editing an existing task persists the new values', () => {
  it('reflects updated values immediately and after a fresh fetch', async () => {
    const token = await registerUser();
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(validTaskPayload());
    const taskId = createRes.body.id;

    const updatedPayload = validTaskPayload({
      title: 'Updated title',
      description: 'Updated description',
      dueDate: '2026-02-15',
      priority: 'low',
      tags: ['personal'],
      category: 'Personal',
    });

    const putRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedPayload);

    expect(putRes.status).toBe(200);
    expect(putRes.body).toMatchObject(updatedPayload);

    const refreshRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toMatchObject(updatedPayload);
  });
});

describe('AC5: deleting a task removes it and the deletion persists', () => {
  it('removes the task from the list and it is gone after a fresh fetch', async () => {
    const token = await registerUser();
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(validTaskPayload());
    const taskId = createRes.body.id;

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body).toHaveLength(0);

    const refreshRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(refreshRes.status).toBe(404);
  });
});

describe('AC6 & AC7: toggling completion status persists', () => {
  it('marks an incomplete task complete and it persists after a fresh fetch', async () => {
    const token = await registerUser();
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(validTaskPayload());
    const taskId = createRes.body.id;

    const toggleRes = await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.completed).toBe(true);

    const refreshRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(refreshRes.body.completed).toBe(true);

    const toggleBackRes = await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(toggleBackRes.status).toBe(200);
    expect(toggleBackRes.body.completed).toBe(false);

    const secondRefreshRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(secondRefreshRes.body.completed).toBe(false);
  });
});

describe('AC8 & AC9: a failed mutation shows an error and preserves prior state', () => {
  it('rejects an invalid edit and leaves the task unchanged', async () => {
    const token = await registerUser();
    const originalPayload = validTaskPayload();
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(originalPayload);
    const taskId = createRes.body.id;

    const putRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(validTaskPayload({ dueDate: 'not-a-date' }));

    expect(putRes.status).toBe(400);
    expect(putRes.body.errors.length).toBeGreaterThan(0);

    const refreshRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(refreshRes.body).toMatchObject(originalPayload);
  });
});

describe('AC10 & AC11: cross-user access is rejected without exposing task data', () => {
  it('rejects view, edit, and delete from another user with a generic 404', async () => {
    const ownerToken = await registerUser();
    const otherToken = await registerUser();
    const originalPayload = validTaskPayload();
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(originalPayload);
    const taskId = createRes.body.id;

    const viewRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(viewRes.status).toBe(404);
    expect(viewRes.body.title).toBeUndefined();
    expect(viewRes.body.description).toBeUndefined();

    const editRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send(validTaskPayload({ title: 'Hijacked' }));
    expect(editRes.status).toBe(404);
    expect(editRes.body.title).toBeUndefined();

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body.title).toBeUndefined();

    const ownerViewRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerViewRes.status).toBe(200);
    expect(ownerViewRes.body).toMatchObject(originalPayload);
  });
});

describe('AC12 & AC13: unauthenticated requests are rejected without touching task data', () => {
  it('rejects create, list, view, edit, delete, and toggle with no Authorization header', async () => {
    const token = await registerUser();
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(validTaskPayload());
    const taskId = createRes.body.id;

    const createAttempt = await request(app).post('/api/tasks').send(validTaskPayload());
    expect(createAttempt.status).toBe(401);
    expect(createAttempt.body.title).toBeUndefined();

    const listAttempt = await request(app).get('/api/tasks');
    expect(listAttempt.status).toBe(401);
    expect(listAttempt.body.length).toBeUndefined();

    const viewAttempt = await request(app).get(`/api/tasks/${taskId}`);
    expect(viewAttempt.status).toBe(401);
    expect(viewAttempt.body.title).toBeUndefined();

    const editAttempt = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send(validTaskPayload({ title: 'Hijacked' }));
    expect(editAttempt.status).toBe(401);
    expect(editAttempt.body.title).toBeUndefined();

    const deleteAttempt = await request(app).delete(`/api/tasks/${taskId}`);
    expect(deleteAttempt.status).toBe(401);

    const toggleAttempt = await request(app).patch(`/api/tasks/${taskId}/toggle`);
    expect(toggleAttempt.status).toBe(401);
    expect(toggleAttempt.body.completed).toBeUndefined();

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toMatchObject(validTaskPayload());
    expect(listRes.body[0].completed).toBe(false);
  });

  it('rejects requests with an unknown bearer token', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${crypto.randomUUID()}`);
    expect(res.status).toBe(401);
    expect(res.body.length).toBeUndefined();
  });
});
