import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskStatus } from '../../../core/models/task.model';
import { TasksStore } from '../../../store/tasks.store';
import { UserContextStore } from '../../../store/user-context.store';
import { BulkActionsBarComponent } from '../components/bulk-actions-bar.component';
import { TaskCardComponent } from '../components/task-card.component';
import { TaskFilterBarComponent } from '../components/task-filter-bar.component';

@Component({
  selector: 'app-tasks-board-page',
  standalone: true,
  imports: [
    RouterLink,
    TaskFilterBarComponent,
    BulkActionsBarComponent,
    TaskCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Nagłówek sekcji -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Tablica Zadań i Kategorii
          </h1>
          <p class="text-sm text-slate-500">
            Zarządzaj zadaniami zespołu, filtruj po tagach technicznych i aktualizuj podzadania w czasie rzeczywistym.
          </p>
        </div>

        <div class="flex items-center gap-2 text-xs text-slate-600">
          <span class="rounded-lg bg-white border border-slate-200 px-3 py-1.5 font-medium">
            Widoczne: <strong class="text-slate-900">{{ tasksStore.filteredTasks().length }}</strong> z {{ tasksStore.tasks().length }}
          </span>
        </div>
      </div>

      <!-- Pasek filtrów -->
      <app-task-filter-bar
        [filter]="tasksStore.filter()"
        [categories]="tasksStore.categories()"
        [availableTags]="tasksStore.availableTags()"
        (queryChanged)="tasksStore.searchByQuery($event)"
        (filterChanged)="tasksStore.updateFilter($event)"
        (resetRequested)="tasksStore.resetFilters()"
      />

      <!-- Pasek akcji masowych (Bulk Actions) -->
      <app-bulk-actions-bar
        [selectedCount]="tasksStore.selectedTaskIds().length"
        (bulkStatusChange)="tasksStore.bulkUpdateStatus($event)"
        (clearSelection)="tasksStore.clearSelection()"
      />

      <!-- Lista zadań -->
      @if (tasksStore.filteredTasks().length > 0) {
        <div class="space-y-4">
          @for (task of tasksStore.filteredTasks(); track task.id) {
            <app-task-card
              [task]="task"
              [category]="tasksStore.categoriesMap().get(task.categoryId)"
              [assignee]="task.assigneeId ? userStore.usersMap().get(task.assigneeId) : undefined"
              [selected]="tasksStore.selectedTaskIds().includes(task.id)"
              [referenceDateIso]="tasksStore.referenceDateIso()"
              (selectionToggled)="tasksStore.toggleTaskSelection($event)"
              (statusChanged)="onStatusChange($event)"
              (subtaskToggled)="tasksStore.toggleSubtask($event)"
              (tagClicked)="tasksStore.updateFilter({ tag: $event })"
              (deleteRequested)="onDeleteTask($event)"
            />
          }
        </div>
      } @else {
        <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <p class="text-base font-semibold text-slate-800">
            Brak zadań spełniających wybrane kryteria filtrowania
          </p>
          <p class="text-xs text-slate-500 max-w-md mx-auto">
            Spróbuj zmienić frazę wyszukiwania, wyczyścić filtr tagów lub utworzyć nowe zadanie.
          </p>
          <div class="pt-2 flex justify-center gap-3">
            <button
              type="button"
              (click)="tasksStore.resetFilters()"
              class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Wyczyść wszystkie filtry
            </button>
            <a
              routerLink="/tasks/new"
              class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              + Utwórz zadanie
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class TasksBoardPageComponent {
  readonly tasksStore = inject(TasksStore);
  readonly userStore = inject(UserContextStore);

  onStatusChange(event: { taskId: string; status: TaskStatus }): void {
    this.tasksStore.updateTask({
      id: event.taskId,
      changes: { status: event.status },
      logAction: 'STATUS_CHANGED',
      logDetails: `Zmieniono status zadania na '${event.status}'`,
    });
  }

  onDeleteTask(taskId: string): void {
    if (window.confirm('Czy na pewno chcesz trwale usunąć to zadanie?')) {
      this.tasksStore.deleteTask(taskId);
    }
  }
}
