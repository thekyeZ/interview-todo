import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category } from '../../../core/models/category.model';
import {
  TaskFilter,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';

@Component({
  selector: 'app-task-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <!-- Górny wiersz: wyszukiwarka + przełącznik Tylko moje zadania + sortowanie -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="relative flex-1">
          <input
            type="search"
            [value]="filter().query"
            (input)="onSearchInput($event)"
            placeholder="Szukaj zadań po tytule, opisie lub tagu technicznym..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          @if (filter().query) {
            <button
              type="button"
              (click)="queryChanged.emit('')"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Wyczyść
            </button>
          }
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              [checked]="filter().onlyMyTasks"
              (change)="onOnlyMyTasksToggle($event)"
            />
            <span>Tylko przypisane do mnie</span>
          </label>

          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-500">Sortuj:</span>
            <select
              [value]="filter().sortBy"
              (change)="onSortChange($event)"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="dueDate">Termin wykonania (Due Date)</option>
              <option value="priority">Priorytet (Krytyczne najpierw)</option>
              <option value="updatedAt">Ostatnio modyfikowane</option>
              <option value="estimateHours">Estymacja (malejąco)</option>
            </select>
          </div>

          <button
            type="button"
            (click)="resetRequested.emit()"
            class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Resetuj filtry
          </button>
        </div>
      </div>

      <!-- Dolny wiersz: filtry kategorii, statusów, priorytetów i tagów -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-slate-100">
        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Kategoria
          </label>
          <select
            [value]="filter().categoryId"
            (change)="onCategoryChange($event)"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Wszystkie kategorie</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">[{{ cat.code }}] {{ cat.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Status zadania
          </label>
          <select
            [value]="filter().status"
            (change)="onStatusChange($event)"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="todo">Do zrobienia</option>
            <option value="in_progress">W trakcie</option>
            <option value="review">Code Review</option>
            <option value="done">Ukończone</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Priorytet
          </label>
          <select
            [value]="filter().priority"
            (change)="onPriorityChange($event)"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Wszystkie priorytety</option>
            <option value="critical">Krytyczny</option>
            <option value="high">Wysoki</option>
            <option value="medium">Średni</option>
            <option value="low">Niski</option>
          </select>
        </div>

        <div>
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Tag techniczny
          </label>
          <select
            [value]="filter().tag"
            (change)="onTagChange($event)"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="all">Wszystkie tagi ({{ availableTags().length }})</option>
            @for (tag of availableTags(); track tag) {
              <option [value]="tag">#{{ tag }}</option>
            }
          </select>
        </div>
      </div>
    </section>
  `,
})
export class TaskFilterBarComponent {
  readonly filter = input.required<TaskFilter>();
  readonly categories = input.required<Category[]>();
  readonly availableTags = input.required<string[]>();

  readonly queryChanged = output<string>();
  readonly filterChanged = output<Partial<TaskFilter>>();
  readonly resetRequested = output<void>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.queryChanged.emit(value);
  }

  onOnlyMyTasksToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filterChanged.emit({ onlyMyTasks: checked });
  }

  onSortChange(event: Event): void {
    const sortBy = (event.target as HTMLSelectElement).value as TaskFilter['sortBy'];
    this.filterChanged.emit({ sortBy });
  }

  onCategoryChange(event: Event): void {
    const categoryId = (event.target as HTMLSelectElement).value;
    this.filterChanged.emit({ categoryId });
  }

  onStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as TaskStatus | 'all';
    this.filterChanged.emit({ status });
  }

  onPriorityChange(event: Event): void {
    const priority = (event.target as HTMLSelectElement).value as TaskPriority | 'all';
    this.filterChanged.emit({ priority });
  }

  onTagChange(event: Event): void {
    const tag = (event.target as HTMLSelectElement).value;
    this.filterChanged.emit({ tag });
  }
}
