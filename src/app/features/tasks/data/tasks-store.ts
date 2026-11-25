import { moveItemInArray } from '@angular/cdk/drag-drop';
import { computed, DestroyRef, effect, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  firstValueFrom,
  forkJoin,
  map,
  mergeMap,
  of,
  Subject,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { Task, TaskFilter, UndoToastState } from '../../../core/models/task.model';
import { AuthStore } from '../../../core/services/auth-store';
import { TasksApi } from './tasks-api';

const UNDO_TIMEOUT_MS = 5000;

interface ToggleRequest {
  readonly task: Task;
  readonly nextCompleted: boolean;
  readonly previousAll: Task[];
  readonly previousSearch: Task[] | null;
}

@Service({ autoProvided: false })
export class TasksStore {
  private readonly tasksApi = inject(TasksApi);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _allTasks = signal<Task[]>([]);
  private readonly _searchResults = signal<Task[] | null>(null);
  private readonly _visibleTasks = signal<Task[]>([]);
  private readonly _filter = signal<TaskFilter>('all');
  private readonly _searchQuery = signal('');
  private readonly _isLoading = signal(false);
  private readonly _isSearching = signal(false);
  private readonly _isCreating = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _undoToast = signal<UndoToastState | null>(null);

  private readonly loadTrigger$ = new Subject<void>();
  private readonly toggleTrigger$ = new Subject<ToggleRequest>();

  readonly filter = this._filter.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly visibleTasks = this._visibleTasks.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSearching = this._isSearching.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly error = this._error.asReadonly();
  readonly undoToast = this._undoToast.asReadonly();

  readonly totalCount = computed(() => this._allTasks().length);
  readonly activeCount = computed(() => this._allTasks().filter((task) => !task.completed).length);
  readonly completedCount = computed(() => this._allTasks().filter((task) => task.completed).length);

  readonly canReorder = computed(
    () => this._filter() === 'all' && this._searchQuery().trim().length === 0,
  );

  constructor() {
    this.setupLoadStream();
    this.setupSearchStream();
    this.setupToggleStream();
    this.setupVisibleTasksSync();
    this.loadTasks();
  }

  loadTasks(): void {
    this.loadTrigger$.next();
  }

  setFilter(filter: TaskFilter): void {
    this._filter.set(filter);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  addTask(rawTitle: string): void {
    const title = rawTitle.trim();
    const userId = this.authStore.user()?.id;
    if (!title || !userId || this._isCreating()) {
      return;
    }

    const currentTasks = this._allTasks();
    const nextOrder =
      currentTasks.length > 0 ? Math.min(...currentTasks.map((task) => task.order)) - 1 : 0;

    this._isCreating.set(true);
    this._error.set(null);

    this.tasksApi
      .createTask({
        userId,
        title,
        completed: false,
        order: nextOrder,
        createdAt: new Date().toISOString(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdTask) => {
          this._allTasks.update((tasks) => this.sortByOrder([createdTask, ...tasks]));
          this.syncSearchResultOnAdd(createdTask);
          this._isCreating.set(false);
        },
        error: (err: Error) => {
          this._error.set(err.message || 'Failed to add task.');
          this._isCreating.set(false);
        },
      });
  }

  toggleTask(task: Task): void {
    const nextCompleted = !task.completed;
    const previousAll = this._allTasks();
    const previousSearch = this._searchResults();

    this._error.set(null);
    this._allTasks.update((tasks) =>
      tasks.map((item) => (item.id === task.id ? { ...item, completed: nextCompleted } : item)),
    );
    this._searchResults.update((results) =>
      results
        ? results.map((item) =>
            item.id === task.id ? { ...item, completed: nextCompleted } : item,
          )
        : null,
    );

    this.toggleTrigger$.next({
      task,
      nextCompleted,
      previousAll,
      previousSearch,
    });
  }

  deleteTask(task: Task): void {
    const previousAll = this._allTasks();
    const previousSearch = this._searchResults();

    this._error.set(null);
    this._allTasks.update((tasks) => tasks.filter((item) => item.id !== task.id));
    this._searchResults.update((results) =>
      results ? results.filter((item) => item.id !== task.id) : null,
    );

    this.showUndoToast(`Task "${task.title}" deleted`, [task]);

    this.tasksApi
      .deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: Error) => {
          this._allTasks.set(previousAll);
          this._searchResults.set(previousSearch);
          this.dismissUndoToast();
          this._error.set(err.message || 'Failed to delete task.');
        },
      });
  }

  clearCompleted(): void {
    const completedTasks = this._allTasks().filter((task) => task.completed);
    if (completedTasks.length === 0) {
      return;
    }

    const completedIds = new Set(completedTasks.map((task) => task.id));
    const previousAll = this._allTasks();
    const previousSearch = this._searchResults();

    this._error.set(null);
    this._allTasks.update((tasks) => tasks.filter((task) => !completedIds.has(task.id)));
    this._searchResults.update((results) =>
      results ? results.filter((task) => !completedIds.has(task.id)) : null,
    );

    const label =
      completedTasks.length === 1
        ? `Task "${completedTasks[0].title}" deleted`
        : `${completedTasks.length} completed tasks cleared`;
    this.showUndoToast(label, completedTasks);

    forkJoin(completedTasks.map((task) => this.tasksApi.deleteTask(task.id)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: Error) => {
          this._allTasks.set(previousAll);
          this._searchResults.set(previousSearch);
          this.dismissUndoToast();
          this._error.set(err.message || 'Failed to clear completed tasks.');
        },
      });
  }

  async undoDelete(): Promise<void> {
    const snapshot = this._undoToast();
    if (!snapshot || snapshot.deletedTasks.length === 0) {
      return;
    }

    const tasksToRestore = snapshot.deletedTasks;
    const previousAll = this._allTasks();
    const previousSearch = this._searchResults();

    this.dismissUndoToast();
    this._error.set(null);

    this._allTasks.update((tasks) => this.sortByOrder([...tasks, ...tasksToRestore]));
    for (const restored of tasksToRestore) {
      this.syncSearchResultOnAdd(restored);
    }

    try {
      await firstValueFrom(
        forkJoin(tasksToRestore.map((task) => this.tasksApi.restoreTask(task))),
      );
    } catch (err) {
      this._allTasks.set(previousAll);
      this._searchResults.set(previousSearch);
      const message = err instanceof Error ? err.message : 'Failed to restore deleted task.';
      this._error.set(message);
    }
  }

  dismissUndoToast(): void {
    this._undoToast.set(null);
  }

  reorderTasks(previousIndex: number, currentIndex: number): void {
    if (!this.canReorder() || previousIndex === currentIndex) {
      return;
    }

    const tasks = this._allTasks();
    moveItemInArray(tasks, previousIndex, currentIndex);

    tasks.forEach((task, index) => {
      (task as { order: number }).order = index;
    });

    this._error.set(null);
    this._allTasks.set(tasks);

    forkJoin(tasks.map((task) => this.tasksApi.updateTask(task.id, { order: task.order })))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: Error) => {
          this._allTasks.set(tasks);
          this._error.set(err.message || 'Failed to save task order.');
        },
      });
  }

  private setupLoadStream(): void {
    this.loadTrigger$
      .pipe(
        switchMap(() => {
          const userId = this.authStore.user()?.id;
          if (!userId) {
            return EMPTY;
          }

          this._isLoading.set(true);
          this._error.set(null);

          return this.tasksApi.getTasks(userId).pipe(
            tap((tasks) => {
              this._allTasks.set(this.sortByOrder(tasks));
              this._isLoading.set(false);
            }),
            catchError((err: Error) => {
              this._error.set(err.message || 'Failed to load tasks.');
              this._isLoading.set(false);
              return of([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private setupSearchStream(): void {
    toObservable(this._searchQuery)
      .pipe(
        map((query) => query.trim()),
        mergeMap((query) => {
          const userId = this.authStore.user()?.id;
          if (!query || !userId) {
            this._searchResults.set(null);
            this._isSearching.set(false);
            return EMPTY;
          }

          this._isSearching.set(true);
          this._error.set(null);

          return this.tasksApi.getTasks(userId, query).pipe(
            tap((tasks) => {
              this._searchResults.set(this.sortByOrder(tasks));
              this._isSearching.set(false);
            }),
          );
        }),
        catchError((err: Error) => {
          this._error.set(err.message || 'Search request failed.');
          this._isSearching.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private setupToggleStream(): void {
    this.toggleTrigger$
      .pipe(
        switchMap(({ task, nextCompleted, previousAll, previousSearch }) =>
          this.tasksApi.updateTask(task.id, { completed: nextCompleted }).pipe(
            catchError((err: Error) => {
              this._allTasks.set(previousAll);
              this._searchResults.set(previousSearch);
              this._error.set(err.message || 'Failed to update task.');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private setupVisibleTasksSync(): void {
    effect(() => {
      const source = this._searchResults() ?? this._allTasks();
      const currentFilter = this._filter();

      if (currentFilter === 'active') {
        this._visibleTasks.set(source.filter((task) => !task.completed));
        return;
      }

      if (currentFilter === 'completed') {
        this._visibleTasks.set(source.filter((task) => task.completed));
        return;
      }

      this._visibleTasks.set([...source]);
    });
  }

  private showUndoToast(message: string, deletedTasks: readonly Task[]): void {
    this._undoToast.set({ message, deletedTasks });
    timer(UNDO_TIMEOUT_MS).subscribe(() => {
      this._undoToast.set(null);
    });
  }

  private syncSearchResultOnAdd(task: Task): void {
    const query = this._searchQuery().trim().toLowerCase();
    if (!query || this._searchResults() === null) {
      return;
    }

    if (task.title.toLowerCase().includes(query)) {
      this._searchResults.update((results) =>
        results ? this.sortByOrder([...results.filter((item) => item.id !== task.id), task]) : null,
      );
    }
  }

  private sortByOrder(tasks: readonly Task[]): Task[] {
    return [...tasks].sort((a, b) => a.order - b.order);
  }
}
