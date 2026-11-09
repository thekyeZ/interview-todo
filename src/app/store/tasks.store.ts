import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { Category } from '../core/models/category.model';
import {
  Task,
  TaskFilter,
  TaskPriority,
  TaskStatus,
  TaskUpsertPayload,
} from '../core/models/task.model';
import { CategoriesApiService } from '../core/services/categories-api.service';
import { TasksApiService } from '../core/services/tasks-api.service';
import { ToastService } from '../core/services/toast.service';
import { ActivityLogStore } from './activity-log.store';
import { UserContextStore } from './user-context.store';

export interface ProductivityKpiMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRatePercent: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
  estimationAccuracyPercent: number;
  criticalOpenCount: number;
  subtasksCompleted: number;
  subtasksTotal: number;
}

export interface CategoryDistributionItem {
  category: Category;
  totalCount: number;
  completedCount: number;
  inProgressCount: number;
  todoCount: number;
  estimatedHours: number;
  loggedHours: number;
  completionPercent: number;
}

export interface UserWorkloadSummary {
  userId: string;
  userName: string;
  userTitle: string;
  avatar: string;
  avatarColor: string;
  dailyCapacityHours: number;
  assignedTasksCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  remainingEstimatedHours: number;
  utilizationPercent: number;
  isOverloaded: boolean;
}

export interface CalendarDayBucket {
  key: string;
  label: string;
  sublabel: string;
  dateIso: string | null;
  isOverdue: boolean;
  isToday: boolean;
  tasks: Task[];
  totalEstimateHours: number;
}

interface TasksState {
  tasks: Task[];
  categories: Category[];
  filter: TaskFilter;
  selectedTaskIds: string[];
  loading: boolean;
  error: string | null;
  referenceDateIso: string; // Data odniesienia dla widoku Kalendarza (domyślnie 2026-11-09)
}

const initialFilter: TaskFilter = {
  query: '',
  categoryId: 'all',
  status: 'all',
  priority: 'all',
  tag: 'all',
  onlyMyTasks: false,
  sortBy: 'dueDate',
};

const initialState: TasksState = {
  tasks: [],
  categories: [],
  filter: initialFilter,
  selectedTaskIds: [],
  loading: false,
  error: null,
  referenceDateIso: '2026-11-09',
};

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function addDaysIso(baseIso: string, offsetDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

export const TasksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store, userStore = inject(UserContextStore)) => {
    const categoriesMap = computed(() => {
      const map = new Map<string, Category>();
      for (const cat of store.categories()) {
        map.set(cat.id, cat);
      }
      return map;
    });

    const availableTags = computed(() => {
      const tagSet = new Set<string>();
      for (const task of store.tasks()) {
        for (const tag of task.tags) {
          tagSet.add(tag);
        }
      }
      return Array.from(tagSet).sort();
    });

    const filteredTasks = computed(() => {
      const currentFilter = store.filter();
      const activeUserId = userStore.currentUserId();
      const q = currentFilter.query.trim().toLowerCase();

      const filtered = store.tasks().filter((task) => {
        if (
          currentFilter.categoryId !== 'all' &&
          task.categoryId !== currentFilter.categoryId
        ) {
          return false;
        }
        if (
          currentFilter.status !== 'all' &&
          task.status !== currentFilter.status
        ) {
          return false;
        }
        if (
          currentFilter.priority !== 'all' &&
          task.priority !== currentFilter.priority
        ) {
          return false;
        }
        if (
          currentFilter.tag !== 'all' &&
          !task.tags.includes(currentFilter.tag)
        ) {
          return false;
        }
        if (currentFilter.onlyMyTasks && task.assigneeId !== activeUserId) {
          return false;
        }
        if (q.length > 0) {
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description.toLowerCase().includes(q);
          const matchesTag = task.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesTag) {
            return false;
          }
        }
        return true;
      });

      return [...filtered].sort((a, b) => {
        switch (currentFilter.sortBy) {
          case 'priority':
            return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
          case 'estimateHours':
            return b.estimateHours - a.estimateHours;
          case 'updatedAt':
            return b.updatedAt.localeCompare(a.updatedAt);
          case 'dueDate':
          default: {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
          }
        }
      });
    });

    const overdueTasks = computed(() => {
      const today = store.referenceDateIso();
      return store
        .tasks()
        .filter(
          (t) => t.status !== 'done' && t.dueDate !== null && t.dueDate < today
        );
    });

    const calendarBuckets = computed<CalendarDayBucket[]>(() => {
      const todayIso = store.referenceDateIso();
      const tomorrowIso = addDaysIso(todayIso, 1);
      const dayPlus2Iso = addDaysIso(todayIso, 2);
      const dayPlus3Iso = addDaysIso(todayIso, 3);
      const allTasks = store.tasks();

      const buildBucket = (
        key: string,
        label: string,
        sublabel: string,
        dateIso: string | null,
        predicate: (t: Task) => boolean,
        isOverdue = false,
        isToday = false
      ): CalendarDayBucket => {
        const bucketTasks = allTasks.filter(predicate);
        const totalEstimateHours = bucketTasks
          .filter((t) => t.status !== 'done')
          .reduce((acc, t) => acc + t.estimateHours, 0);
        return {
          key,
          label,
          sublabel,
          dateIso,
          isOverdue,
          isToday,
          tasks: bucketTasks,
          totalEstimateHours,
        };
      };

      return [
        buildBucket(
          'overdue',
          'Przeterminowane',
          `Przed ${todayIso}`,
          null,
          (t) => t.status !== 'done' && t.dueDate !== null && t.dueDate < todayIso,
          true,
          false
        ),
        buildBucket(
          'today',
          'Dzisiaj',
          todayIso,
          todayIso,
          (t) => t.dueDate === todayIso,
          false,
          true
        ),
        buildBucket(
          'tomorrow',
          'Jutro',
          tomorrowIso,
          tomorrowIso,
          (t) => t.dueDate === tomorrowIso
        ),
        buildBucket(
          'day2',
          'Środa / +2 dni',
          dayPlus2Iso,
          dayPlus2Iso,
          (t) => t.dueDate === dayPlus2Iso
        ),
        buildBucket(
          'later',
          'Kolejne dni i backlog',
          `Od ${dayPlus3Iso} lub bez daty`,
          dayPlus3Iso,
          (t) => t.dueDate === null || t.dueDate >= dayPlus3Iso
        ),
      ];
    });

    const productivityMetrics = computed<ProductivityKpiMetrics>(() => {
      const list = store.tasks();
      const today = store.referenceDateIso();
      const totalTasks = list.length;
      const completedTasks = list.filter((t) => t.status === 'done').length;
      const inProgressTasks = list.filter(
        (t) => t.status === 'in_progress' || t.status === 'review'
      ).length;
      const overdueCount = list.filter(
        (t) => t.status !== 'done' && t.dueDate !== null && t.dueDate < today
      ).length;

      const completionRatePercent =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const totalEstimatedHours = list.reduce((sum, t) => sum + t.estimateHours, 0);
      const totalLoggedHours = list.reduce((sum, t) => sum + t.loggedHours, 0);

      const estimationAccuracyPercent =
        Number(totalEstimatedHours) > 0
          ? Math.min(
              100,
              Math.round((Number(totalLoggedHours) / Number(totalEstimatedHours)) * 100)
            )
          : 0;

      const criticalOpenCount = list.filter(
        (t) => t.priority === 'critical' && t.status !== 'done'
      ).length;

      let subtasksCompleted = 0;
      let subtasksTotal = 0;
      for (const task of list) {
        subtasksTotal += task.subtasks.length;
        subtasksCompleted += task.subtasks.filter((s) => s.completed).length;
      }

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks: overdueCount,
        completionRatePercent,
        totalEstimatedHours,
        totalLoggedHours,
        estimationAccuracyPercent,
        criticalOpenCount,
        subtasksCompleted,
        subtasksTotal,
      };
    });

    const categoryDistribution = computed<CategoryDistributionItem[]>(() => {
      const list = store.tasks();
      return store.categories().map((category) => {
        const catTasks = list.filter((t) => t.categoryId === category.id);
        const totalCount = catTasks.length;
        const completedCount = catTasks.filter((t) => t.status === 'done').length;
        const inProgressCount = catTasks.filter(
          (t) => t.status === 'in_progress' || t.status === 'review'
        ).length;
        const todoCount = catTasks.filter((t) => t.status === 'todo').length;
        const estimatedHours = catTasks.reduce((s, t) => s + t.estimateHours, 0);
        const loggedHours = catTasks.reduce((s, t) => s + t.loggedHours, 0);
        const completionPercent =
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          category,
          totalCount,
          completedCount,
          inProgressCount,
          todoCount,
          estimatedHours,
          loggedHours,
          completionPercent,
        };
      });
    });

    const userWorkloads = computed<UserWorkloadSummary[]>(() => {
      const list = store.tasks();
      const users = userStore.users();

      return users.map((user) => {
        const userTasks = list.filter((t) => t.assigneeId === user.id);
        const activeTasks = userTasks.filter((t) => t.status !== 'done');
        const completedTasks = userTasks.filter((t) => t.status === 'done');
        const remainingEstimatedHours = activeTasks.reduce(
          (sum, t) => sum + Math.max(0, t.estimateHours - t.loggedHours),
          0
        );
        const utilizationPercent = Math.round(
          (remainingEstimatedHours / user.dailyCapacityHours) * 100
        );

        return {
          userId: user.id,
          userName: user.name,
          userTitle: user.title,
          avatar: user.avatar,
          avatarColor: user.avatarColor,
          dailyCapacityHours: user.dailyCapacityHours,
          assignedTasksCount: userTasks.length,
          activeTasksCount: activeTasks.length,
          completedTasksCount: completedTasks.length,
          remainingEstimatedHours: Number(remainingEstimatedHours.toFixed(1)),
          utilizationPercent,
          isOverloaded: remainingEstimatedHours > user.dailyCapacityHours,
        };
      });
    });

    return {
      categoriesMap,
      availableTags,
      filteredTasks,
      overdueTasks,
      calendarBuckets,
      productivityMetrics,
      categoryDistribution,
      userWorkloads,
    };
  }),
  withMethods(
    (
      store,
      tasksApi = inject(TasksApiService),
      categoriesApi = inject(CategoriesApiService),
      activityStore = inject(ActivityLogStore),
      toastService = inject(ToastService)
    ) => ({
      loadInitialData: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            forkJoin({
              tasks: tasksApi.getTasks(),
              categories: categoriesApi.getCategories(),
            }).pipe(
              tapResponse({
                next: ({ tasks, categories }) =>
                  patchState(store, {
                    tasks,
                    categories,
                    loading: false,
                  }),
                error: () => {
                  patchState(store, {
                    loading: false,
                    error:
                      'Nie można połączyć się z serwerem json-server na porcie 3000.',
                  });
                },
              })
            )
          )
        )
      ),

      searchByQuery: rxMethod<string>(
        pipe(
          tap((query) =>
            patchState(store, (state) => ({
              filter: { ...state.filter, query },
            }))
          ),
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((query) =>
            tasksApi.getTasks(query).pipe(
              tapResponse({
                next: (tasks) => patchState(store, { tasks }),
                error: () => {
                  toastService.error(
                    'Błąd wyszukiwania',
                    'Nie udało się odświeżyć wyników wyszukiwania z serwera.'
                  );
                },
              })
            )
          )
        )
      ),

      updateFilter(changes: Partial<TaskFilter>): void {
        patchState(store, (state) => ({
          filter: { ...state.filter, ...changes },
        }));
      },

      resetFilters(): void {
        patchState(store, { filter: initialFilter });
        this.searchByQuery('');
      },

      toggleTaskSelection(taskId: string): void {
        patchState(store, (state) => ({
          selectedTaskIds: [...state.selectedTaskIds, taskId],
        }));
      },

      clearSelection(): void {
        patchState(store, { selectedTaskIds: [] });
      },

      createTask: rxMethod<{ payload: TaskUpsertPayload; onSuccess?: () => void }>(
        pipe(
          switchMap(({ payload, onSuccess }) =>
            tasksApi.createTask(payload).pipe(
              tapResponse({
                next: (created) => {
                  patchState(store, (state) => ({
                    tasks: [created, ...state.tasks],
                  }));
                  activityStore.recordActivity({
                    taskId: created.id,
                    taskTitle: created.title,
                    action: 'CREATED',
                    details: `Utworzono nowe zadanie (${created.priority.toUpperCase()}, estymacja ${created.estimateHours}h)`,
                  });
                  toastService.success(
                    'Zadanie utworzone',
                    `Dodano „${created.title}” do listy.`
                  );
                  onSuccess?.();
                },
                error: () => {
                  toastService.error(
                    'Błąd zapisu',
                    'Nie udało się utworzyć nowego zadania.'
                  );
                },
              })
            )
          )
        )
      ),

      updateTask: rxMethod<{
        id: string;
        changes: Partial<Task>;
        logAction?: 'UPDATED' | 'STATUS_CHANGED' | 'RESCHEDULED';
        logDetails?: string;
        onSuccess?: () => void;
      }>(
        pipe(
          switchMap(({ id, changes, logAction = 'UPDATED', logDetails, onSuccess }) =>
            tasksApi.updateTask(id, changes).pipe(
              tapResponse({
                next: (updated) => {
                  patchState(store, (state) => ({
                    tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
                  }));
                  activityStore.recordActivity({
                    taskId: updated.id,
                    taskTitle: updated.title,
                    action: logAction,
                    details:
                      logDetails ?? `Zaktualizowano parametry zadania „${updated.title}”`,
                  });
                  toastService.success(
                    'Zapisano zmiany',
                    `Zadanie „${updated.title}” zostało zaktualizowane.`
                  );
                  onSuccess?.();
                },
                error: () => {
                  toastService.error(
                    'Aktualizacja nieudana',
                    'Serwer odrzucił próbę zapisu zmian w zadaniu.'
                  );
                },
              })
            )
          )
        )
      ),

      toggleSubtask: rxMethod<{ taskId: string; subtaskId: string }>(
        pipe(
          switchMap(({ taskId, subtaskId }) => {
            const targetTask = store.tasks().find((t) => t.id === taskId);
            if (!targetTask) {
              return [];
            }
            const targetSubtask = targetTask.subtasks.find(
              (s) => s.id === subtaskId
            );
            const updatedSubtasks = targetTask.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s
            );

            return tasksApi
              .updateTask(taskId, { subtasks: updatedSubtasks })
              .pipe(
                tapResponse({
                  next: (updated) => {
                    patchState(store, (state) => ({
                      tasks: state.tasks.map((t) =>
                        t.id === taskId ? updated : t
                      ),
                    }));
                    activityStore.recordActivity({
                      taskId: updated.id,
                      taskTitle: updated.title,
                      action: 'SUBTASK_TOGGLED',
                      details: `${!targetSubtask?.completed ? 'Ukończono' : 'Cofnięto'} podzadanie: ${targetSubtask?.title ?? subtaskId}`,
                    });
                  },
                  error: () => {
                    toastService.error(
                      'Błąd podzadania',
                      'Nie udało się zaktualizować statusu podzadania.'
                    );
                  },
                })
              );
          })
        )
      ),

      rescheduleTask(taskId: string, newDueDate: string | null): void {
        const target = store.tasks().find((t) => t.id === taskId);
        if (!target) return;
        this.updateTask({
          id: taskId,
          changes: { dueDate: newDueDate },
          logAction: 'RESCHEDULED',
          logDetails: `Zmieniono termin wykonania z ${target.dueDate ?? 'brak'} na ${newDueDate ?? 'brak'}`,
        });
      },

      deleteTask: rxMethod<string>(
        pipe(
          switchMap((taskId) => {
            const target = store.tasks().find((t) => t.id === taskId);
            return tasksApi.deleteTask(taskId).pipe(
              tapResponse({
                next: () => {
                  patchState(store, (state) => ({
                    tasks: state.tasks.filter((t) => t.id !== taskId),
                    selectedTaskIds: state.selectedTaskIds.filter(
                      (id) => id !== taskId
                    ),
                  }));
                  if (target) {
                    activityStore.recordActivity({
                      taskId: target.id,
                      taskTitle: target.title,
                      action: 'DELETED',
                      details: `Usunięto zadanie „${target.title}”`,
                    });
                  }
                  toastService.info(
                    'Zadanie usunięte',
                    target ? `Usunięto „${target.title}”.` : undefined
                  );
                },
                error: () => {
                  toastService.error(
                    'Błąd usuwania',
                    'Nie udało się usunąć zadania.'
                  );
                },
              })
            );
          })
        )
      ),

      bulkUpdateStatus: rxMethod<TaskStatus>(
        pipe(
          switchMap((status) => {
            const ids = store.selectedTaskIds();
            if (ids.length === 0) return [];
            return tasksApi.bulkUpdateStatus(ids, status).pipe(
              tapResponse({
                next: (updatedTasks) => {
                  const updatedMap = new Map(
                    updatedTasks.map((t) => [t.id, t])
                  );
                  patchState(store, (state) => ({
                    tasks: state.tasks.map((t) => updatedMap.get(t.id) ?? t),
                  }));
                  activityStore.recordActivity({
                    taskId: ids[0],
                    taskTitle: `Operacja masowa (${ids.length} zadań)`,
                    action: 'BULK_UPDATED',
                    details: `Masowo zmieniono status ${ids.length} zadań na '${status}'`,
                  });
                  toastService.success(
                    'Zaktualizowano masowo',
                    `Zmieniono status ${ids.length} zaznaczonych zadań.`
                  );
                },
                error: () => {
                  toastService.error(
                    'Błąd operacji masowej',
                    'Nie udało się zaktualizować wszystkich zaznaczonych zadań.'
                  );
                },
              })
            );
          })
        )
      ),
    })
  ),
  withHooks({
    onInit(store) {
      store.loadInitialData();
    },
  })
);
