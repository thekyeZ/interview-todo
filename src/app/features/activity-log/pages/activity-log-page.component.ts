import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ActivityAction } from '../../../core/models/activity-log.model';
import { ActivityLogStore } from '../../../store/activity-log.store';
import { UserContextStore } from '../../../store/user-context.store';

@Component({
  selector: 'app-activity-log-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Nagłówek z przełącznikiem Live Polling -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            Historia Zmian (Activity Log & Audit Trail)
          </h1>
          <p class="text-sm text-slate-500">
            Rejestr wszystkich operacji wykonanych na zadaniach wraz z automatyczną synchronizacją wpisów.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <label class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <input
              type="checkbox"
              [checked]="autoRefreshEnabled()"
              (change)="toggleAutoRefresh($event)"
              class="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <span>Automatyczne odświeżanie dziennika (co 4s)</span>
          </label>

          <button
            type="button"
            (click)="activityStore.loadLogs()"
            class="rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            Odśwież teraz
          </button>
        </div>
      </div>

      <!-- Pasek filtrów dziennika -->
      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          @for (item of actionFilters; track item.value) {
            <button
              type="button"
              (click)="activityStore.setActionFilter(item.value)"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              [class.bg-indigo-600]="activityStore.actionFilter() === item.value"
              [class.text-white]="activityStore.actionFilter() === item.value"
              [class.bg-slate-100]="activityStore.actionFilter() !== item.value"
              [class.text-slate-700]="activityStore.actionFilter() !== item.value"
            >
              {{ item.label }}
              <span class="ml-1 opacity-75">
                ({{ activityStore.actionCounts()[item.value] || 0 }})
              </span>
            </button>
          }
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <select
            [value]="activityStore.userFilter()"
            (change)="onUserFilterChange($event)"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Wszyscy użytkownicy</option>
            @for (user of userStore.users(); track user.id) {
              <option [value]="user.id">{{ user.name }}</option>
            }
          </select>

          <input
            type="search"
            [value]="activityStore.searchQuery()"
            (input)="onSearchChange($event)"
            placeholder="Szukaj w historii..."
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
      </section>

      <!-- Lista wpisów audytowych -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        @for (log of activityStore.filteredLogs(); track log.id) {
          <div class="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70 transition">
            <div class="flex items-start gap-3">
              @if (userStore.usersMap().get(log.userId); as author) {
                <div
                  class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  [class]="author.avatarColor"
                >
                  {{ author.avatar }}
                </div>
              } @else {
                <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-400 text-xs font-bold text-white">
                  SYS
                </div>
              }

              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold text-slate-900">
                    {{ userStore.usersMap().get(log.userId)?.name ?? log.userId }}
                  </span>
                  <span
                    class="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    [class.bg-emerald-50]="log.action === 'CREATED'"
                    [class.text-emerald-700]="log.action === 'CREATED'"
                    [class.bg-blue-50]="log.action === 'STATUS_CHANGED' || log.action === 'UPDATED'"
                    [class.text-blue-700]="log.action === 'STATUS_CHANGED' || log.action === 'UPDATED'"
                    [class.bg-indigo-50]="log.action === 'SUBTASK_TOGGLED' || log.action === 'BULK_UPDATED'"
                    [class.text-indigo-700]="log.action === 'SUBTASK_TOGGLED' || log.action === 'BULK_UPDATED'"
                    [class.bg-amber-50]="log.action === 'RESCHEDULED'"
                    [class.text-amber-700]="log.action === 'RESCHEDULED'"
                    [class.bg-rose-50]="log.action === 'DELETED'"
                    [class.text-rose-700]="log.action === 'DELETED'"
                  >
                    {{ log.action }}
                  </span>
                  <a
                    [routerLink]="['/tasks', log.taskId, 'edit']"
                    class="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    {{ log.taskTitle }} ({{ log.taskId }})
                  </a>
                </div>
                <p class="text-xs text-slate-600">{{ log.details }}</p>
              </div>
            </div>

            <div class="text-right text-[11px] font-mono text-slate-400 shrink-0">
              {{ log.timestamp | date: 'yyyy-MM-dd HH:mm:ss' }}
            </div>
          </div>
        } @empty {
          <div class="p-12 text-center text-xs text-slate-400">
            Brak wpisów w dzienniku aktywności dla wybranych kryteriów.
          </div>
        }
      </section>
    </div>
  `,
})
export class ActivityLogPageComponent implements OnInit {
  readonly activityStore = inject(ActivityLogStore);
  readonly userStore = inject(UserContextStore);

  readonly autoRefreshEnabled = signal(true);

  readonly actionFilters: Array<{ label: string; value: ActivityAction | 'ALL' }> = [
    { label: 'Wszystkie', value: 'ALL' },
    { label: 'Utworzone', value: 'CREATED' },
    { label: 'Zmiana statusu', value: 'STATUS_CHANGED' },
    { label: 'Podzadania', value: 'SUBTASK_TOGGLED' },
    { label: 'Przeplanowane', value: 'RESCHEDULED' },
    { label: 'Masowe', value: 'BULK_UPDATED' },
  ];

  ngOnInit(): void {
    this.activityStore.loadLogs();
    interval(4000).subscribe(() => {
      if (this.autoRefreshEnabled()) {
        this.activityStore.loadLogs();
      }
    });
  }

  toggleAutoRefresh(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.autoRefreshEnabled.set(checked);
    if (checked) {
      interval(4000).subscribe(() => {
        if (this.autoRefreshEnabled()) {
          this.activityStore.loadLogs();
        }
      });
    }
  }

  onUserFilterChange(event: Event): void {
    const userId = (event.target as HTMLSelectElement).value;
    this.activityStore.setUserFilter(userId);
  }

  onSearchChange(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.activityStore.setSearchQuery(query);
  }
}
