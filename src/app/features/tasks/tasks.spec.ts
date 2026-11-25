import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/config/api-config';
import { Task } from '../../core/models/task.model';
import { AuthUser } from '../../core/models/user.model';
import { AuthStore } from '../../core/services/auth-store';
import { Tasks } from './tasks';

describe('Tasks', () => {
  let fixture: ComponentFixture<Tasks>;
  let httpMock: HttpTestingController;

  const mockUser: AuthUser = {
    id: 'u-1',
    email: 'alex@work.com',
    name: 'Alex Morgan',
    isDemo: false,
  };

  const mockTasks: Task[] = [
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
      title: 'Send contract to design partner',
      completed: true,
      order: 1,
      createdAt: '2026-11-19T14:20:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tasks],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
        {
          provide: AuthStore,
          useValue: {
            user: signal<AuthUser | null>(mockUser).asReadonly(),
            logout: () => undefined,
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Tasks);
    await fixture.whenStable();

    const loadReq = httpMock.expectOne(
      'http://localhost:3000/tasks?userId=u-1&_sort=order&_order=asc',
    );
    loadReq.flush(mockTasks);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders user email, tasks, filter counts, and remaining label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('alex@work.com');
    expect(el.textContent).toContain('Finalize Q3 product architecture notes');
    expect(el.textContent).toContain('Send contract to design partner');
    expect(el.textContent).toContain('1 task remaining');
  });

  it('filters tasks when clicking Active and Completed pills', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const filterTabs = el.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    filterTabs[1].click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Finalize Q3 product architecture notes');
    expect(el.textContent).not.toContain('Send contract to design partner');

    filterTabs[2].click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Send contract to design partner');
    expect(el.textContent).not.toContain('Finalize Q3 product architecture notes');
  });

  it('shows undo banner when deleting a task', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const deleteBtn = el.querySelector<HTMLButtonElement>(
      'button[aria-label="Delete Finalize Q3 product architecture notes"]',
    );

    deleteBtn?.click();
    await fixture.whenStable();

    const deleteReq = httpMock.expectOne('http://localhost:3000/tasks/t-1');
    deleteReq.flush({});
    await fixture.whenStable();

    expect(el.textContent).toContain('Task "Finalize Q3 product architecture notes" deleted');
    expect(el.textContent).toContain('Undo');
  });
});
