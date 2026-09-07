const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const userStore = require('../src/store/userStore');
const sessionStore = require('../src/store/sessionStore');
const taskStore = require('../src/store/taskStore');
const emailService = require('../src/services/emailService');

const generateValidPassword = () => `longenough${crypto.randomBytes(4).toString('hex')}`;

function registrationPayload(overrides = {}) {
  return {
    name: 'Jordan Rivera',
    email: `jordan-${crypto.randomBytes(4).toString('hex')}@example.com`,
    password: generateValidPassword(),
    ...overrides,
  };
}

function extractSessionToken(res) {
  const setCookie = res.headers['set-cookie'] || [];
  const cookieLine = setCookie.find((line) => line.startsWith('sessionToken='));
  const match = cookieLine && cookieLine.match(/sessionToken=([^;]+)/);
  return match ? match[1] : undefined;
}

async function registerAndLogin(agent, overrides = {}) {
  const payload = registrationPayload(overrides);
  await agent.post('/register').type('form').send(payload);
  const loginRes = await agent
    .post('/login')
    .type('form')
    .send({ email: payload.email, password: payload.password });
  return { payload, loginRes };
}

function makeTask(userId, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    userId,
    title: `Task ${crypto.randomBytes(3).toString('hex')}`,
    completed: false,
    priority: 'low',
    dueDate: null,
    ...overrides,
  };
}

function userIdFor(email) {
  return userStore.findByEmail(email).id;
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  taskStore.reset();
  emailService.reset();
});

describe('AC1: status summary widget shows complete vs incomplete counts', () => {
  it('counts completed and incomplete tasks separately', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(makeTask(userId, { completed: true }));
    taskStore.create(makeTask(userId, { completed: true }));
    taskStore.create(makeTask(userId, { completed: false }));
    taskStore.create(makeTask(userId, { completed: false }));
    taskStore.create(makeTask(userId, { completed: false }));

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="status-complete-count">2</);
    expect(res.text).toMatch(/id="status-incomplete-count">3</);
  });
});

describe('AC2: priority summary widget shows counts broken down by priority', () => {
  it('counts tasks per priority level', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(makeTask(userId, { priority: 'low' }));
    taskStore.create(makeTask(userId, { priority: 'low' }));
    taskStore.create(makeTask(userId, { priority: 'medium' }));
    taskStore.create(makeTask(userId, { priority: 'high' }));
    taskStore.create(makeTask(userId, { priority: 'high' }));

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="priority-low-count">2</);
    expect(res.text).toMatch(/id="priority-medium-count">1</);
    expect(res.text).toMatch(/id="priority-high-count">2</);
  });
});

describe('AC3: upcoming due tasks list is in ascending due-date order', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists tasks ordered by ascending due date', async () => {
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(makeTask(userId, { title: 'Due in 3 days', dueDate: '2026-01-04' }));
    taskStore.create(makeTask(userId, { title: 'Due in 1 day', dueDate: '2026-01-02' }));
    taskStore.create(makeTask(userId, { title: 'Due in 5 days', dueDate: '2026-01-06' }));

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    const idxOne = res.text.indexOf('Due in 1 day');
    const idxThree = res.text.indexOf('Due in 3 days');
    const idxFive = res.text.indexOf('Due in 5 days');
    expect(idxOne).toBeGreaterThan(-1);
    expect(idxThree).toBeGreaterThan(idxOne);
    expect(idxFive).toBeGreaterThan(idxThree);
  });
});

describe('AC4: a task due 8 days from now is excluded from the upcoming due list', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not render a task due 8 days out', async () => {
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(makeTask(userId, { title: 'Due in 8 days', dueDate: '2026-01-09' }));

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).not.toContain('Due in 8 days');
  });
});

describe('AC5: a task due exactly 7 days from now is included in the upcoming due list', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a task due exactly 7 days out', async () => {
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(makeTask(userId, { title: 'Due in 7 days', dueDate: '2026-01-08' }));

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Due in 7 days');
  });
});

describe('AC6: summary widgets show zero counts when the user has no tasks', () => {
  it('renders zero for every count', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="status-complete-count">0</);
    expect(res.text).toMatch(/id="status-incomplete-count">0</);
    expect(res.text).toMatch(/id="priority-low-count">0</);
    expect(res.text).toMatch(/id="priority-medium-count">0</);
    expect(res.text).toMatch(/id="priority-high-count">0</);
  });
});

describe('AC7: upcoming due tasks list shows an empty-state message when there are no tasks', () => {
  it('renders the empty-state marker and no list', async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent);

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-upcoming-due"');
    expect(res.text).not.toContain('id="upcoming-due-list"');
  });
});

describe('AC8: dashboard reflects tasks created, edited, deleted, or toggled elsewhere', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reflects a create', async () => {
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);
    taskStore.create(makeTask(userId, { completed: false, priority: 'low' }));

    const before = await agent.get('/dashboard');
    expect(before.text).toMatch(/id="status-incomplete-count">1</);

    taskStore.create(makeTask(userId, { title: 'New task', completed: false, priority: 'low' }));

    const after = await agent.get('/dashboard');
    expect(after.text).toMatch(/id="status-incomplete-count">2</);
  });

  it('reflects an edit', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);
    const task = taskStore.create(makeTask(userId, { priority: 'low' }));

    const before = await agent.get('/dashboard');
    expect(before.text).toMatch(/id="priority-low-count">1</);
    expect(before.text).toMatch(/id="priority-high-count">0</);

    taskStore.update(task.id, { priority: 'high' });

    const after = await agent.get('/dashboard');
    expect(after.text).toMatch(/id="priority-low-count">0</);
    expect(after.text).toMatch(/id="priority-high-count">1</);
  });

  it('reflects a toggle', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);
    const task = taskStore.create(makeTask(userId, { completed: false }));

    const before = await agent.get('/dashboard');
    expect(before.text).toMatch(/id="status-incomplete-count">1</);
    expect(before.text).toMatch(/id="status-complete-count">0</);

    taskStore.toggleComplete(task.id);

    const after = await agent.get('/dashboard');
    expect(after.text).toMatch(/id="status-incomplete-count">0</);
    expect(after.text).toMatch(/id="status-complete-count">1</);
  });

  it('reflects a delete', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);
    const task = taskStore.create(makeTask(userId, { completed: false }));

    const before = await agent.get('/dashboard');
    expect(before.text).toMatch(/id="status-incomplete-count">1</);

    taskStore.remove(task.id);

    const after = await agent.get('/dashboard');
    expect(after.text).toMatch(/id="status-incomplete-count">0</);
  });
});

describe('AC9: only tasks owned by the authenticated user contribute to the dashboard', () => {
  it('excludes another user\'s tasks from counts and the upcoming due list', async () => {
    const agentA = request.agent(app);
    const { payload: payloadA } = await registerAndLogin(agentA);
    const userIdA = userIdFor(payloadA.email);

    const agentB = request.agent(app);
    const { payload: payloadB } = await registerAndLogin(agentB);
    const userIdB = userIdFor(payloadB.email);

    taskStore.create(makeTask(userIdA, { completed: true }));
    taskStore.create(makeTask(userIdB, { title: 'Bs task', completed: false }));
    taskStore.create(makeTask(userIdB, { title: 'Bs other task', completed: false }));
    taskStore.create(makeTask(userIdB, { title: 'Bs third task', completed: false }));

    const res = await agentA.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="status-complete-count">1</);
    expect(res.text).toMatch(/id="status-incomplete-count">0</);
    expect(res.text).not.toContain('Bs task');
    expect(res.text).not.toContain('Bs other task');
    expect(res.text).not.toContain('Bs third task');
  });
});

describe('AC10: a task with no due date is included in the summary widget counts', () => {
  it('counts a no-due-date task in status and priority totals', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(
      makeTask(userId, { dueDate: null, completed: false, priority: 'medium' })
    );

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/id="status-incomplete-count">1</);
    expect(res.text).toMatch(/id="priority-medium-count">1</);
  });
});

describe('AC11: a task with no due date is excluded from the upcoming due list', () => {
  it('does not render the no-due-date task title in the upcoming list', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(makeTask(userId, { title: 'No due date task', dueDate: null }));

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-upcoming-due"');
    expect(res.text).not.toContain('id="upcoming-due-list"');
    expect(res.text).not.toMatch(/upcoming-due-list[\s\S]*No due date task/);
  });
});

describe('AC12: an overdue incomplete task appears at the top of the upcoming due list', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('places the overdue task first', async () => {
    const start = Date.parse('2026-01-10T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(
      makeTask(userId, { title: 'Overdue task', dueDate: '2026-01-08', completed: false })
    );
    taskStore.create(
      makeTask(userId, { title: 'Future task one', dueDate: '2026-01-12', completed: false })
    );
    taskStore.create(
      makeTask(userId, { title: 'Future task two', dueDate: '2026-01-14', completed: false })
    );

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    const listStart = res.text.indexOf('id="upcoming-due-list"');
    const idxOverdue = res.text.indexOf('Overdue task');
    const idxFutureOne = res.text.indexOf('Future task one');
    const idxFutureTwo = res.text.indexOf('Future task two');

    expect(idxOverdue).toBeGreaterThan(listStart);
    expect(idxOverdue).toBeLessThan(idxFutureOne);
    expect(idxOverdue).toBeLessThan(idxFutureTwo);
  });
});

describe('AC13: an overdue incomplete task is visually flagged as overdue', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks the overdue task with the overdue class/badge and not the others', async () => {
    const start = Date.parse('2026-01-10T00:00:00.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => start);

    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const userId = userIdFor(payload.email);

    taskStore.create(
      makeTask(userId, { title: 'Overdue task', dueDate: '2026-01-08', completed: false })
    );
    taskStore.create(
      makeTask(userId, { title: 'Future task one', dueDate: '2026-01-12', completed: false })
    );

    const res = await agent.get('/dashboard');

    expect(res.status).toBe(200);
    const overdueItemMatch = res.text.match(
      /<li class="post task-overdue">[\s\S]*?Overdue task[\s\S]*?<\/li>/
    );
    expect(overdueItemMatch).not.toBeNull();
    expect(overdueItemMatch[0]).toContain('Overdue');

    const futureItemMatch = res.text.match(/<li class="post">[\s\S]*?Future task one[\s\S]*?<\/li>/);
    expect(futureItemMatch).not.toBeNull();
    expect(futureItemMatch[0]).not.toContain('Overdue');
  });
});

describe('AC14: unauthenticated access to the dashboard redirects to the login page', () => {
  it('redirects to / and does not render the dashboard marker', async () => {
    const res = await request(app).get('/dashboard');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
    expect(res.text).not.toContain('id="dashboard"');
  });
});
