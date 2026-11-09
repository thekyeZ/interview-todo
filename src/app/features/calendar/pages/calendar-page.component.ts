import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PriorityBadgeComponent,
  StatusBadgeComponent,
} from '../../../shared/ui/badge.component';
import { TasksStore } from '../../../store/tasks.store';
import { UserContextStore } from '../../../store/user-context.store';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [RouterLink, PriorityBadgeComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Nagłówek widoku -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Kalendarz i Oś Czasu (Deadlines & Workload)
          </h1>
          <p class="text-sm text-slate-500">
            Planowanie obłożenia dziennego względem limitu pojemności ({{ userStore.currentUser()?.dailyCapacityHours ?? 8 }}h/dzień) oraz szybkie przeplanowywanie zaległości.
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600">
          Data odniesienia sprintu: <strong class="text-slate-900">{{ tasksStore.referenceDateIso() }}</strong>
        </div>
      </div>

      <!-- Radar zadań przeterminowanych -->
      @if (tasksStore.overdueTasks().length > 0) {
        <section class="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                !
              </span>
              <h2 class="text-sm font-bold text-rose-900">
                Radar zaległości: {{ tasksStore.overdueTasks().length }} zadania po terminie wykonania
              </h2>
            </div>
            <span class="text-xs text-rose-700">
              Użyj szybkich akcji poniżej, aby przeplanować termin na dzisiaj lub jutro.
            </span>
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            @for (task of tasksStore.overdueTasks(); track task.id) {
              <div class="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3 shadow-sm">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[11px] font-semibold text-rose-600">
                      Termin: {{ task.dueDate }}
                    </span>
                    <app-priority-badge [priority]="task.priority" />
                  </div>
                  <p class="text-xs font-bold text-slate-900">{{ task.title }}</p>
                </div>

                <div class="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    (click)="tasksStore.rescheduleTask(task.id, '2026-11-09')"
                    class="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Na dziś
                  </button>
                  <button
                    type="button"
                    (click)="tasksStore.rescheduleTask(task.id, '2026-11-10')"
                    class="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Jutro
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Kolumny dni / koszyków czasowych -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        @for (bucket of tasksStore.calendarBuckets(); track bucket.key) {
          <section
            class="flex flex-col rounded-2xl border bg-white p-4 shadow-sm"
            [class.border-rose-300]="bucket.isOverdue"
            [class.border-indigo-400]="bucket.isToday"
            [class.ring-2]="bucket.isToday"
            [class.ring-indigo-200]="bucket.isToday"
            [class.border-slate-200]="!bucket.isOverdue && !bucket.isToday"
          >
            <!-- Nagłówek kolumny -->
            <div class="pb-3 border-b border-slate-100">
              <div class="flex items-center justify-between">
                <h3
                  class="text-sm font-bold"
                  [class.text-rose-700]="bucket.isOverdue"
                  [class.text-indigo-700]="bucket.isToday"
                  [class.text-slate-900]="!bucket.isOverdue && !bucket.isToday"
                >
                  {{ bucket.label }}
                </h3>
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {{ bucket.tasks.length }}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">{{ bucket.sublabel }}</p>

              <!-- Suma godzin zaplanowanych w tym koszyku -->
              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-slate-500">Obciążenie otwarte:</span>
                <span
                  class="font-bold"
                  [class.text-rose-600]="bucket.totalEstimateHours > (userStore.currentUser()?.dailyCapacityHours ?? 8)"
                  [class.text-slate-800]="bucket.totalEstimateHours <= (userStore.currentUser()?.dailyCapacityHours ?? 8)"
                >
                  {{ bucket.totalEstimateHours }}h
                </span>
              </div>
            </div>

            <!-- Lista kart w kolumnie -->
            <div class="mt-3 flex-1 space-y-2.5">
              @for (task of bucket.tasks; track task.id) {
                <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2 hover:border-slate-200 transition">
                  <div class="flex items-center justify-between gap-1">
                    <app-priority-badge [priority]="task.priority" />
                    <span class="text-[11px] font-semibold text-slate-500">
                      {{ task.estimateHours }}h
                    </span>
                  </div>

                  <a
                    [routerLink]="['/tasks', task.id, 'edit']"
                    class="block text-xs font-bold text-slate-800 hover:text-indigo-600 transition"
                    [class.line-through]="task.status === 'done'"
                  >
                    {{ task.title }}
                  </a>

                  <div class="flex items-center justify-between pt-1">
                    <app-status-badge [status]="task.status" />

                    @if (task.assigneeId && userStore.usersMap().get(task.assigneeId); as user) {
                      <span
                        class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        [class]="user.avatarColor"
                        [title]="user.name"
                      >
                        {{ user.avatar }}
                      </span>
                    }
                  </div>

                  <!-- Szybkie przesunięcie daty -->
                  <div class="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span class="text-slate-400">Przenieś:</span>
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        (click)="tasksStore.rescheduleTask(task.id, '2026-11-09')"
                        class="rounded px-1.5 py-0.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                      >
                        Dziś
                      </button>
                      <button
                        type="button"
                        (click)="tasksStore.rescheduleTask(task.id, '2026-11-10')"
                        class="rounded px-1.5 py-0.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                      >
                        Jutro
                      </button>
                      <button
                        type="button"
                        (click)="tasksStore.rescheduleTask(task.id, '2026-11-11')"
                        class="rounded px-1.5 py-0.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                      >
                        +2d
                      </button>
                    </div>
                  </div>
                </div>
              } @empty {
                <p class="py-8 text-center text-xs italic text-slate-400">
                  Brak zaplanowanych zadań
                </p>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
})
export class CalendarPageComponent {
  readonly tasksStore = inject(TasksStore);
  readonly userStore = inject(UserContextStore);
}
