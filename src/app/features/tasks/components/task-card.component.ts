import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models/category.model';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import {
  CategoryBadgeComponent,
  PriorityBadgeComponent,
  StatusBadgeComponent,
} from '../../../shared/ui/badge.component';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    RouterLink,
    PriorityBadgeComponent,
    StatusBadgeComponent,
    CategoryBadgeComponent,
    ProgressBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
      [class.border-indigo-500]="selected()"
      [class.ring-2]="selected()"
      [class.ring-indigo-200]="selected()"
      [class.border-slate-200]="!selected()"
    >
      <!-- Nagłówek karty -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <input
            type="checkbox"
            [checked]="selected()"
            (change)="selectionToggled.emit(task().id)"
            class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            [attr.aria-label]="'Zaznacz zadanie ' + task().title"
          />

          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-xs font-semibold text-slate-400">
                {{ task().id }}
              </span>
              @if (category(); as cat) {
                <app-category-badge
                  [name]="cat.name"
                  [code]="cat.code"
                  [color]="cat.color"
                />
              }
              <app-priority-badge [priority]="task().priority" />
              <app-status-badge [status]="task().status" />
            </div>

            <h3
              class="text-base font-bold text-slate-900"
              [class.line-through]="task().status === 'done'"
              [class.text-slate-400]="task().status === 'done'"
            >
              {{ task().title }}
            </h3>
          </div>
        </div>

        <!-- Akcje karty -->
        <div class="flex items-center gap-2">
          <select
            [value]="task().status"
            (change)="onQuickStatusChange($event)"
            class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Szybka zmiana statusu"
          >
            <option value="todo">Do zrobienia</option>
            <option value="in_progress">W trakcie</option>
            <option value="review">Code Review</option>
            <option value="done">Ukończone</option>
          </select>

          <a
            [routerLink]="['/tasks', task().id, 'edit']"
            class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Edytuj
          </a>

          <button
            type="button"
            (click)="deleteRequested.emit(task().id)"
            class="rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
          >
            Usuń
          </button>
        </div>
      </div>

      <!-- Opis -->
      <p class="mt-2.5 pl-7 text-sm text-slate-600 leading-relaxed">
        {{ task().description }}
      </p>

      <!-- Tagi -->
      @if (task().tags.length > 0) {
        <div class="mt-3 pl-7 flex flex-wrap items-center gap-1.5">
          @for (tag of task().tags; track tag) {
            <button
              type="button"
              (click)="tagClicked.emit(tag)"
              class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              #{{ tag }}
            </button>
          }
        </div>
      }

      <!-- Podzadania (Checklist inline) -->
      @if (task().subtasks.length > 0) {
        <div class="mt-4 ml-7 rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2.5">
          <app-progress-bar
            [value]="calculateSubtasksProgress()"
            [label]="'Podzadania (' + getCompletedSubtasksCount() + '/' + task().subtasks.length + ')'"
            [showLabel]="true"
            [tone]="calculateSubtasksProgress() === 100 ? 'emerald' : 'indigo'"
          />

          <ul class="space-y-1.5 pt-1">
            @for (sub of task().subtasks; track $index) {
              <li class="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  [checked]="sub.completed"
                  (change)="subtaskToggled.emit({ taskId: task().id, subtaskId: sub.id })"
                  class="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span
                  [class.line-through]="sub.completed"
                  [class.text-slate-400]="sub.completed"
                  [class.text-slate-700]="!sub.completed"
                >
                  {{ sub.title }}
                </span>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Stopka metadanych -->
      <div class="mt-4 pl-7 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div class="flex flex-wrap items-center gap-4">
          <!-- Przypisany użytkownik -->
          <div class="flex items-center gap-1.5">
            <span class="text-slate-400">Wykonawca:</span>
            @if (assignee(); as user) {
              <span class="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <span
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  [class]="user.avatarColor"
                >
                  {{ user.avatar }}
                </span>
                {{ user.name }}
              </span>
            } @else {
              <span class="italic text-amber-600 font-medium">Nieprzypisane</span>
            }
          </div>

          <!-- Bilans czasu -->
          <div>
            <span class="text-slate-400">Czas:</span>
            <span class="ml-1 font-semibold text-slate-700">
              {{ task().loggedHours }}h / {{ task().estimateHours }}h
            </span>
          </div>
        </div>

        <!-- Termin wykonania -->
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400">Termin:</span>
          @if (task().dueDate) {
            <span
              class="rounded px-1.5 py-0.5 font-semibold"
              [class.bg-rose-100]="isTaskOverdue()"
              [class.text-rose-700]="isTaskOverdue()"
              [class.bg-slate-100]="!isTaskOverdue()"
              [class.text-slate-700]="!isTaskOverdue()"
            >
              {{ task().dueDate }}
              @if (isTaskOverdue()) {
                <span class="ml-1 text-[10px] uppercase">(Po terminie)</span>
              }
            </span>
          } @else {
            <span class="text-slate-400 italic">Brak terminu</span>
          }
        </div>
      </div>
    </article>
  `,
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly category = input<Category | undefined>(undefined);
  readonly assignee = input<User | undefined>(undefined);
  readonly selected = input<boolean>(false);
  readonly referenceDateIso = input<string>('2026-11-09');

  readonly selectionToggled = output<string>();
  readonly statusChanged = output<{ taskId: string; status: TaskStatus }>();
  readonly subtaskToggled = output<{ taskId: string; subtaskId: string }>();
  readonly tagClicked = output<string>();
  readonly deleteRequested = output<string>();

  getCompletedSubtasksCount(): number {
    return this.task()
      .subtasks.filter((s) => s.completed)
      .map((s) => s.id).length;
  }

  calculateSubtasksProgress(): number {
    const subtasks = [...this.task().subtasks];
    if (subtasks.length === 0) return 0;
    const completed = this.getCompletedSubtasksCount();
    return Math.round((completed / subtasks.length) * 100);
  }

  isTaskOverdue(): boolean {
    const t = this.task();
    if (t.status === 'done' || !t.dueDate) {
      return false;
    }
    const dueTimestamp = new Date(`${t.dueDate}T23:59:59`).getTime();
    const refTimestamp = new Date(`${this.referenceDateIso()}T23:59:59`).getTime();
    return dueTimestamp < refTimestamp;
  }

  onQuickStatusChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as TaskStatus;
    this.statusChanged.emit({ taskId: this.task().id, status });
  }
}
