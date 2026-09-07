const crypto = require('crypto');
const taskStore = require('../src/store/taskStore');

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

beforeEach(() => {
  taskStore.reset();
});

describe('taskStore.listByUserId scoping stays correct as the store grows', () => {
  it('only returns tasks belonging to the requested user, never other users\' tasks', () => {
    const userA = 'user-a';
    const userB = 'user-b';

    taskStore.create(makeTask(userA, { title: 'A1' }));
    taskStore.create(makeTask(userB, { title: 'B1' }));
    taskStore.create(makeTask(userA, { title: 'A2' }));
    taskStore.create(makeTask(userB, { title: 'B2' }));
    taskStore.create(makeTask(userB, { title: 'B3' }));

    const aTasks = taskStore.listByUserId(userA);
    const bTasks = taskStore.listByUserId(userB);

    expect(aTasks.map((t) => t.title).sort()).toEqual(['A1', 'A2']);
    expect(bTasks.map((t) => t.title).sort()).toEqual(['B1', 'B2', 'B3']);
  });

  it('returns an empty list for a user with no tasks, even when other users have many', () => {
    for (let i = 0; i < 20; i += 1) {
      taskStore.create(makeTask('busy-user'));
    }

    expect(taskStore.listByUserId('lonely-user')).toEqual([]);
  });

  it('reflects update/remove/toggleComplete for the owning user only', () => {
    const userA = 'user-a';
    const userB = 'user-b';
    const taskA = taskStore.create(makeTask(userA, { completed: false, priority: 'low' }));
    taskStore.create(makeTask(userB, { completed: false }));

    taskStore.update(taskA.id, { priority: 'high' });
    expect(taskStore.listByUserId(userA)[0].priority).toBe('high');
    expect(taskStore.listByUserId(userB)[0].priority).toBe('low');

    taskStore.toggleComplete(taskA.id);
    expect(taskStore.listByUserId(userA)[0].completed).toBe(true);
    expect(taskStore.listByUserId(userB)[0].completed).toBe(false);

    taskStore.remove(taskA.id);
    expect(taskStore.listByUserId(userA)).toEqual([]);
    expect(taskStore.listByUserId(userB)).toHaveLength(1);
  });

  it('keeps the per-user index consistent if a task is reassigned to a different owner', () => {
    const userA = 'user-a';
    const userB = 'user-b';
    const task = taskStore.create(makeTask(userA, { title: 'Reassign me' }));

    taskStore.update(task.id, { userId: userB });

    expect(taskStore.listByUserId(userA)).toEqual([]);
    expect(taskStore.listByUserId(userB).map((t) => t.title)).toEqual(['Reassign me']);
  });
});
