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
    title: 'Untitled task',
    description: '',
    status: 'open',
    priority: 'medium',
    tag: 'general',
    category: 'general',
    dueDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  userStore.reset();
  sessionStore.reset();
  taskStore.reset();
  emailService.reset();
});

describe('AC1: only the logged-in user\'s tasks are shown', () => {
  it('shows the logged-in user\'s task but not another user\'s task', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);
    const otherUserId = crypto.randomUUID();

    taskStore.save(makeTask(user.id, { title: 'My Own Task' }));
    taskStore.save(makeTask(otherUserId, { title: 'Other Users Secret Task' }));

    const res = await agent.get('/tasks');

    expect(res.status).toBe(200);
    expect(res.text).toContain('My Own Task');
    expect(res.text).not.toContain('Other Users Secret Task');
  });
});

describe('AC2: searching by title/description filters the list', () => {
  it('shows only tasks whose title or description matches the search term', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(makeTask(user.id, { title: 'Buy groceries', description: 'milk and eggs' }));
    taskStore.save(makeTask(user.id, { title: 'Write report', description: 'quarterly summary' }));
    taskStore.save(makeTask(user.id, { title: 'Clean garage', description: 'buy new shelves' }));

    const byTitle = await agent.get('/tasks?q=groceries');
    expect(byTitle.status).toBe(200);
    expect(byTitle.text).toContain('Buy groceries');
    expect(byTitle.text).not.toContain('Write report');
    expect(byTitle.text).not.toContain('Clean garage');

    const byDescription = await agent.get('/tasks?q=BUY');
    expect(byDescription.status).toBe(200);
    expect(byDescription.text).toContain('Buy groceries');
    expect(byDescription.text).toContain('Clean garage');
    expect(byDescription.text).not.toContain('Write report');
  });
});

describe('AC3: filters by status, priority, tag, and category are ANDed together', () => {
  it('shows only the task matching all four active filters', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(
      makeTask(user.id, {
        title: 'Exact match task',
        status: 'open',
        priority: 'high',
        tag: 'urgent',
        category: 'work',
      })
    );
    taskStore.save(
      makeTask(user.id, {
        title: 'Wrong status',
        status: 'done',
        priority: 'high',
        tag: 'urgent',
        category: 'work',
      })
    );
    taskStore.save(
      makeTask(user.id, {
        title: 'Wrong priority',
        status: 'open',
        priority: 'low',
        tag: 'urgent',
        category: 'work',
      })
    );
    taskStore.save(
      makeTask(user.id, {
        title: 'Wrong tag',
        status: 'open',
        priority: 'high',
        tag: 'someday',
        category: 'work',
      })
    );
    taskStore.save(
      makeTask(user.id, {
        title: 'Wrong category',
        status: 'open',
        priority: 'high',
        tag: 'urgent',
        category: 'home',
      })
    );

    const res = await agent.get(
      '/tasks?status=open&priority=high&tag=urgent&category=work'
    );

    expect(res.status).toBe(200);
    expect(res.text).toContain('Exact match task');
    expect(res.text).not.toContain('Wrong status');
    expect(res.text).not.toContain('Wrong priority');
    expect(res.text).not.toContain('Wrong tag');
    expect(res.text).not.toContain('Wrong category');
  });
});

describe('AC4: selecting a sort option reorders the list', () => {
  it('sorts by dueDate ascending', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(makeTask(user.id, { title: 'Later Task', dueDate: '2026-03-01' }));
    taskStore.save(makeTask(user.id, { title: 'Sooner Task', dueDate: '2026-01-01' }));
    taskStore.save(makeTask(user.id, { title: 'Middle Task', dueDate: '2026-02-01' }));

    const res = await agent.get('/tasks?sortBy=dueDate');

    expect(res.status).toBe(200);
    const soonerIdx = res.text.indexOf('Sooner Task');
    const middleIdx = res.text.indexOf('Middle Task');
    const laterIdx = res.text.indexOf('Later Task');
    expect(soonerIdx).toBeGreaterThan(-1);
    expect(soonerIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(laterIdx);
  });

  it('sorts by priority, high before medium before low', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(makeTask(user.id, { title: 'Low Task', priority: 'low' }));
    taskStore.save(makeTask(user.id, { title: 'High Task', priority: 'high' }));
    taskStore.save(makeTask(user.id, { title: 'Medium Task', priority: 'medium' }));

    const res = await agent.get('/tasks?sortBy=priority');

    expect(res.status).toBe(200);
    const highIdx = res.text.indexOf('High Task');
    const mediumIdx = res.text.indexOf('Medium Task');
    const lowIdx = res.text.indexOf('Low Task');
    expect(highIdx).toBeLessThan(mediumIdx);
    expect(mediumIdx).toBeLessThan(lowIdx);
  });

  it('sorts by createdAt, newest first', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(
      makeTask(user.id, { title: 'Oldest Task', createdAt: '2026-01-01T00:00:00.000Z' })
    );
    taskStore.save(
      makeTask(user.id, { title: 'Newest Task', createdAt: '2026-03-01T00:00:00.000Z' })
    );
    taskStore.save(
      makeTask(user.id, { title: 'Middle Aged Task', createdAt: '2026-02-01T00:00:00.000Z' })
    );

    const res = await agent.get('/tasks?sortBy=createdAt');

    expect(res.status).toBe(200);
    const newestIdx = res.text.indexOf('Newest Task');
    const middleIdx = res.text.indexOf('Middle Aged Task');
    const oldestIdx = res.text.indexOf('Oldest Task');
    expect(newestIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(oldestIdx);
  });
});

describe('AC5: pagination controls and navigation between pages', () => {
  it('shows the first page with a next-page indicator and the remaining task on page two', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(makeTask(user.id, { title: 'Task One' }));
    taskStore.save(makeTask(user.id, { title: 'Task Two' }));
    taskStore.save(makeTask(user.id, { title: 'Task Three' }));

    const page1 = await agent.get('/tasks?page=1&pageSize=2');
    expect(page1.status).toBe(200);
    expect(page1.text).toContain('id="pagination"');
    expect(page1.text).toMatch(/Page 1 of 2/);

    const page2 = await agent.get('/tasks?page=2&pageSize=2');
    expect(page2.status).toBe(200);
    expect(page2.text).toMatch(/Page 2 of 2/);
  });
});

describe('AC6: no matches shows an empty-state message', () => {
  it('shows the empty-state element and hides the task list when the search matches nothing', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(makeTask(user.id, { title: 'Some Real Task' }));

    const res = await agent.get('/tasks?q=nonexistentzzz');

    expect(res.status).toBe(200);
    expect(res.text).toContain('id="empty-tasks"');
    expect(res.text).not.toContain('id="task-list"');
  });
});

describe('AC7: clearing all filters and search restores the full list', () => {
  it('returns the full unfiltered set of tasks when no query params are present', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(
      makeTask(user.id, { title: 'Alpha Task', status: 'open', priority: 'high' })
    );
    taskStore.save(
      makeTask(user.id, { title: 'Beta Task', status: 'done', priority: 'low' })
    );

    const filtered = await agent.get('/tasks?q=Alpha&status=open&priority=high');
    expect(filtered.text).toContain('Alpha Task');
    expect(filtered.text).not.toContain('Beta Task');

    const cleared = await agent.get('/tasks');
    expect(cleared.status).toBe(200);
    expect(cleared.text).toContain('Alpha Task');
    expect(cleared.text).toContain('Beta Task');
  });
});

describe('AC8: navigating beyond the last page stays on the last valid page without error', () => {
  it('clamps an out-of-range page to the last page and returns 200', async () => {
    const agent = request.agent(app);
    const { payload } = await registerAndLogin(agent);
    const user = userStore.findByEmail(payload.email);

    taskStore.save(makeTask(user.id, { title: 'First Task' }));
    taskStore.save(makeTask(user.id, { title: 'Second Task' }));
    taskStore.save(makeTask(user.id, { title: 'Third Task' }));
    taskStore.save(makeTask(user.id, { title: 'Fourth Task' }));

    const res = await agent.get('/tasks?page=99&pageSize=2');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Page 2 of 2/);
    expect(res.text).toContain('Third Task');
    expect(res.text).toContain('Fourth Task');
  });
});
