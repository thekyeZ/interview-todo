import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/api-config';
import { Task } from '../../../core/models/task.model';
import { AuthUser } from '../../../core/models/user.model';
import { AuthStore } from '../../../core/services/auth-store';
import { TasksStore } from './tasks-store';

describe('TasksStore', () => {
  let store: TasksStore;
  let httpMock: HttpTestingController;

  const mockAuthUser: AuthUser = {
    id: 'u-1',
    email: 'alex@work.com',
    name: 'Alex Morgan',
    isDemo: false,
  };

  const initialTasks: Task[] = [
    {
      id: 't-1',
      userId: 'u-1',
      title: 'Finalize Q3 product architecture notes',
      completed: false,
      order: 0,
      createdAt: '2026-11-20T09:00:00.000Z',
    },
    {
      id: 't-2',
      userId: 'u-1',
      title: 'Call electrician for studio lighting',
      completed: false,
      order: 1,
      createdAt: '2026-11-20T10:15:00.000Z',
    },
    {
      id: 't-3',
      userId: 'u-1',
      title: 'Send contract to design partner',
      completed: true,
      order: 2,
      createdAt: '2026-11-19T14:20:00.000Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TasksStore,
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
        {
          provide: AuthStore,
          useValue: {
            user: signal<AuthUser | null>(mockAuthUser).asReadonly(),
          },
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(TasksStore);

    const loadReq = httpMock.expectOne(
      'http://localhost:3000/tasks?userId=u-1&_sort=order&_order=asc',
    );
    loadReq.flush(initialTasks);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads tasks and computes accurate filter counts', () => {
    expect(store.totalCount()).toBe(3);
    expect(store.activeCount()).toBe(2);
    expect(store.completedCount()).toBe(1);
    expect(store.visibleTasks().length).toBe(3);

    store.setFilter('active');
    expect(store.visibleTasks().map((t) => t.id)).toEqual(['t-1', 't-2']);

    store.setFilter('completed');
    expect(store.visibleTasks().map((t) => t.id)).toEqual(['t-3']);
  });

  it('prepends newly created tasks with lowest order', () => {
    store.addTask('Draft release changelog');

    const req = httpMock.expectOne('http://localhost:3000/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Draft release changelog');
    expect(req.request.body.order).toBe(-1);

    req.flush({
      id: 't-4',
      ...req.request.body,
    });

    expect(store.totalCount()).toBe(4);
    expect(store.visibleTasks()[0].id).toBe('t-4');
  });

  it('toggles completion optimistically and rolls back on error', () => {
    store.toggleTask(initialTasks[0]);
    expect(store.activeCount()).toBe(1);
    expect(store.completedCount()).toBe(2);

    const req = httpMock.expectOne('http://localhost:3000/tasks/t-1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(store.activeCount()).toBe(2);
    expect(store.completedCount()).toBe(1);
    expect(store.error()).toBeTruthy();
  });

  it('deletes a task, shows undo toast, and restores on undo', async () => {
    store.deleteTask(initialTasks[1]);

    expect(store.totalCount()).toBe(2);
    expect(store.undoToast()?.message).toBe('Task "Call electrician for studio lighting" deleted');

    const deleteReq = httpMock.expectOne('http://localhost:3000/tasks/t-2');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});

    const undoPromise = store.undoDelete();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const restoreReq = httpMock.expectOne('http://localhost:3000/tasks');
    expect(restoreReq.request.method).toBe('POST');
    expect(restoreReq.request.body.id).toBe('t-2');
    restoreReq.flush(initialTasks[1]);

    await undoPromise;

    expect(store.undoToast()).toBeNull();
    expect(store.totalCount()).toBe(3);
    expect(store.visibleTasks()[1].id).toBe('t-2');
  });

  it('clears completed tasks via DELETE requests', () => {
    store.clearCompleted();

    expect(store.completedCount()).toBe(0);
    expect(store.totalCount()).toBe(2);
    expect(store.undoToast()).not.toBeNull();

    const deleteReq = httpMock.expectOne('http://localhost:3000/tasks/t-3');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush({});
  });

  it('reorders tasks and persists updated order indices', () => {
    store.reorderTasks(0, 2);

    expect(store.visibleTasks().map((t) => t.id)).toEqual(['t-2', 't-3', 't-1']);

    const req1 = httpMock.expectOne('http://localhost:3000/tasks/t-2');
    const req2 = httpMock.expectOne('http://localhost:3000/tasks/t-3');
    const req3 = httpMock.expectOne('http://localhost:3000/tasks/t-1');

    expect(req1.request.body).toEqual({ order: 0 });
    expect(req2.request.body).toEqual({ order: 1 });
    expect(req3.request.body).toEqual({ order: 2 });

    req1.flush({ ...initialTasks[1], order: 0 });
    req2.flush({ ...initialTasks[2], order: 1 });
    req3.flush({ ...initialTasks[0], order: 2 });
  });
});
