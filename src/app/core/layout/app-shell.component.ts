import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ActivityLogStore } from '../../store/activity-log.store';
import { TasksStore } from '../../store/tasks.store';
import { GlobalLoadingService } from '../services/global-loading.service';
import { ToastService } from '../services/toast.service';
import { UserSwitcherComponent } from './user-switcher.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UserSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <!-- Globalny pasek ładowania HTTP (sterowany przez loadingInterceptor) -->
      @if (loadingService.isLoading()) {
        <div class="fixed top-0 left-0 right-0 z-50 h-1 bg-indigo-100 overflow-hidden">
          <div class="h-full w-1/3 bg-indigo-600 animate-pulse rounded-r-full"></div>
        </div>
      }

      <!-- Top Header -->
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div class="flex items-center gap-6">
            <a routerLink="/tasks" class="flex items-center gap-2.5 group">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-sm group-hover:bg-indigo-700 transition">
                TF
              </div>
              <div>

              </div>
            </a>

            <!-- Nawigacja główna (4 moduły biznesowe) -->
            <nav class="hidden md:flex items-center gap-1">
              <a
                routerLink="/tasks"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>Zadania</span>
                <span class="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {{ tasksStore.tasks().length }}
                </span>
              </a>

              <a
                routerLink="/calendar"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>Kalendarz i Terminy</span>
                @if (tasksStore.overdueTasks().length > 0) {
                  <span class="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {{ tasksStore.overdueTasks().length }} zaległe
                  </span>
                }
              </a>

              <a
                routerLink="/analytics"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>Statystyki Produktywności</span>
                <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {{ tasksStore.productivityMetrics().completionRatePercent }}%
                </span>
              </a>

              <a
                routerLink="/activity-log"
                routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>Historia Zmian</span>
              </a>
            </nav>
          </div>

          <div class="flex items-center gap-3">
            <a
              routerLink="/tasks/new"
              class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              <span>+ Nowe zadanie</span>
            </a>
            <app-user-switcher />
          </div>
        </div>

        <!-- Nawigacja mobilna -->
        <div class="flex md:hidden border-t border-slate-100 px-4 py-2 gap-2 overflow-x-auto">
          <a routerLink="/tasks" routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold" class="rounded-lg px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">
            Zadania ({{ tasksStore.tasks().length }})
          </a>
          <a routerLink="/calendar" routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold" class="rounded-lg px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">
            Kalendarz
          </a>
          <a routerLink="/analytics" routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold" class="rounded-lg px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">
            Statystyki
          </a>
          <a routerLink="/activity-log" routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold" class="rounded-lg px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">
            Historia Zmian
          </a>
        </div>
      </header>

      <!-- Banner ostrzegawczy jeśli json-server nie odpowiada -->
      @if (tasksStore.error(); as errorMsg) {
        <div class="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium">
          <div class="mx-auto max-w-7xl flex items-center justify-between">
            <span>{{ errorMsg }} Uruchom środowisko komendą: <code class="bg-rose-800 px-1.5 py-0.5 rounded">npm start</code></span>
            <button
              type="button"
              (click)="tasksStore.loadInitialData()"
              class="rounded bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30"
            >
              Ponów połączenie
            </button>
          </div>
        </div>
      }

      <!-- Główna zawartość widoku -->
      <main class="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <router-outlet />
      </main>

      <!-- Kontener powiadomień Toast -->
      <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        @for (toast of toastService.toasts(); track toast.id) {
          <div
            class="pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-3.5 shadow-lg transition-all bg-white"
            [class.border-emerald-200]="toast.type === 'success'"
            [class.border-rose-200]="toast.type === 'error'"
            [class.border-indigo-200]="toast.type === 'info'"
            [class.border-amber-200]="toast.type === 'warning'"
          >
            <div>
              <p
                class="text-xs font-bold"
                [class.text-emerald-800]="toast.type === 'success'"
                [class.text-rose-800]="toast.type === 'error'"
                [class.text-indigo-800]="toast.type === 'info'"
                [class.text-amber-800]="toast.type === 'warning'"
              >
                {{ toast.title }}
              </p>
              @if (toast.message) {
                <p class="mt-0.5 text-xs text-slate-600">{{ toast.message }}</p>
              }
            </div>
            <button
              type="button"
              (click)="toastService.dismiss(toast.id)"
              class="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class AppShellComponent {
  readonly tasksStore = inject(TasksStore);
  readonly activityStore = inject(ActivityLogStore);
  readonly loadingService = inject(GlobalLoadingService);
  readonly toastService = inject(ToastService);
}
