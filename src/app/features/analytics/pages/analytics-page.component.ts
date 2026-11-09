import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CategoryBadgeComponent } from '../../../shared/ui/badge.component';
import { ProgressBarComponent } from '../../../shared/ui/progress-bar.component';
import { CategoryDistributionItem, TasksStore } from '../../../store/tasks.store';

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [CategoryBadgeComponent, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Statystyki Produktywności i Obciążenia Zespołu
        </h1>
        <p class="text-sm text-slate-500">
          Wskaźniki KPI, realizacja budżetu godzinowego oraz obłożenie zespołu w bieżącym sprincie.
        </p>
      </div>

      <!-- Karty KPI -->
      @if (tasksStore.productivityMetrics(); as kpi) {
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Wskaźnik ukończenia (Completion Rate)
            </span>
            <div class="flex items-baseline justify-between">
              <span class="text-3xl font-extrabold text-slate-900">
                {{ kpi.completionRatePercent }}%
              </span>
              <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {{ kpi.completedTasks }} / {{ kpi.totalTasks }} zadań
              </span>
            </div>
            <app-progress-bar [value]="kpi.completionRatePercent" tone="emerald" />
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bilans godzin (Logged vs Estimate)
            </span>
            <div class="flex items-baseline justify-between">
              <span class="text-3xl font-extrabold text-slate-900">
                {{ kpi.totalLoggedHours }}h
                <span class="text-base font-medium text-slate-400">/ {{ kpi.totalEstimatedHours }}h</span>
              </span>
              <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {{ kpi.estimationAccuracyPercent }}% realizacji
              </span>
            </div>
            <app-progress-bar [value]="kpi.estimationAccuracyPercent" tone="indigo" />
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Postęp kroków (Subtasks Checklist)
            </span>
            <div class="flex items-baseline justify-between">
              <span class="text-3xl font-extrabold text-slate-900">
                {{ kpi.subtasksCompleted }}
                <span class="text-base font-medium text-slate-400">/ {{ kpi.subtasksTotal }}</span>
              </span>
              <span class="text-xs font-medium text-slate-500">
                W trakcie: {{ kpi.inProgressTasks }} zadań
              </span>
            </div>
            <app-progress-bar
              [value]="kpi.subtasksTotal > 0 ? (kpi.subtasksCompleted / kpi.subtasksTotal) * 100 : 0"
              tone="indigo"
            />
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ryzyko i Zadania Krytyczne
            </span>
            <div class="flex items-baseline justify-between">
              <span
                class="text-3xl font-extrabold"
                [class.text-rose-600]="kpi.overdueTasks > 0"
                [class.text-slate-900]="kpi.overdueTasks === 0"
              >
                {{ kpi.overdueTasks }} zaległe
              </span>
              <span class="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                {{ kpi.criticalOpenCount }} critical
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Zadania wymagające natychmiastowej interwencji w sprincie.
            </p>
          </div>
        </section>
      }

      <!-- Dwie kolumny: Rozkład po kategoriach + Obciążenie członków zespołu -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Rozkład po kategoriach -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900">
                Produktywność według Kategorii
              </h2>
              <p class="text-xs text-slate-500">
                Zestawienie postępu prac i budżetu czasowego dla każdego obszaru architektonicznego.
              </p>
            </div>
            <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                [checked]="onlyActiveCategories()"
                (change)="toggleActiveCategories($event)"
                class="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
              />
              <span>Tylko otwarte kategorie</span>
            </label>
          </div>

          <div class="space-y-4">
            @for (item of displayedCategories(); track item.category.id) {
              <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <app-category-badge
                    [name]="item.category.name"
                    [code]="item.category.code"
                    [color]="item.category.color"
                  />
                  <div class="flex items-center gap-3 text-xs text-slate-600">
                    <span>Zadania: <strong>{{ item.completedCount }}/{{ item.totalCount }}</strong></span>
                    <span>Godziny: <strong>{{ item.loggedHours }}h / {{ item.estimatedHours }}h</strong></span>
                  </div>
                </div>

                <app-progress-bar
                  [value]="item.completionPercent"
                  [label]="item.category.description"
                  [showLabel]="true"
                  [tone]="item.completionPercent === 100 ? 'emerald' : 'indigo'"
                />
              </div>
            }
          </div>
        </section>

        <!-- Obciążenie członków zespołu (Workload Heatmap) -->
        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-slate-900">
                Obciążenie Członków Zespołu (Workload vs Daily Capacity)
              </h2>
              <p class="text-xs text-slate-500">
                Analiza pozostałych godzin estymowanych dla otwartych zadań względem dziennej dostępności.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  [checked]="showCapacityDetails()"
                  (change)="toggleCapacityDetails($event)"
                  class="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                />
                <span>Diagnostyka rezerw</span>
              </label>
              <select
                [value]="selectedFocusUserId()"
                (change)="onFocusUserChange($event)"
                class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="all">Cały zespół</option>
                @for (member of tasksStore.userWorkloads(); track member.userId) {
                  <option [value]="member.userId">{{ member.userName }}</option>
                }
              </select>
            </div>
          </div>

          <div class="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3.5 py-2.5 text-xs font-medium text-indigo-900">
            {{ capacityRiskSummary() }}
          </div>

          <div class="space-y-4">
            @for (member of tasksStore.userWorkloads(); track member.userId) {
              <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                      [class]="member.avatarColor"
                    >
                      {{ member.avatar }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-900">{{ member.userName }}</p>
                      <p class="text-xs text-slate-500">
                        {{ member.userTitle }} • Limit dzienny: {{ member.dailyCapacityHours }}h
                      </p>
                    </div>
                  </div>

                  @if (member.isOverloaded) {
                    <span class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                      Przeciążenie ({{ member.utilizationPercent }}%)
                    </span>
                  } @else {
                    <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Optymalne ({{ member.utilizationPercent }}%)
                    </span>
                  }
                </div>

                <app-progress-bar
                  [value]="member.utilizationPercent"
                  [tone]="member.isOverloaded ? 'rose' : 'emerald'"
                />

                <div class="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
                  <span>Przypisane: <strong>{{ member.assignedTasksCount }}</strong> (aktywne: {{ member.activeTasksCount }}, ukończone: {{ member.completedTasksCount }})</span>
                  <span>Pozostało do wykonania: <strong>{{ member.remainingEstimatedHours }}h</strong></span>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AnalyticsPageComponent {
  readonly tasksStore = inject(TasksStore);

  readonly onlyActiveCategories = signal(false);
  readonly showCapacityDetails = signal(false);
  readonly selectedFocusUserId = signal<string>('all');
  readonly displayedCategories = signal<CategoryDistributionItem[]>([]);

  readonly capacityRiskSummary = computed(() => {
    if (
      this.showCapacityDetails() &&
      this.tasksStore.userWorkloads().some((m) => m.isOverloaded)
    ) {
      const focusId = this.selectedFocusUserId();
      const overloaded = this.tasksStore
        .userWorkloads()
        .filter((m) => m.isOverloaded);
      if (focusId !== 'all') {
        const target = this.tasksStore
          .userWorkloads()
          .find((m) => m.userId === focusId);
        return target
          ? `Profil ${target.userName}: wykorzystanie ${target.utilizationPercent}% (${target.remainingEstimatedHours}h pozostało).`
          : 'Brak danych dla wybranego członka zespołu.';
      }
      return `Przeciążenie wykryte u ${overloaded.length} os. w zespole – zalecana relokacja zadań.`;
    }
    return 'Włącz tryb diagnostyki obłożenia, aby wyświetlić szczegółową prognozę rezerw.';
  });

  constructor() {
    effect(() => {
      const allCategories = this.tasksStore.categoryDistribution();
      const onlyActive = this.onlyActiveCategories();
      this.displayedCategories.set(
        onlyActive
          ? allCategories.filter((item) => item.completionPercent < 100)
          : allCategories
      );
    });
  }

  toggleActiveCategories(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.onlyActiveCategories.set(checked);
  }

  toggleCapacityDetails(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.showCapacityDetails.set(checked);
  }

  onFocusUserChange(event: Event): void {
    const userId = (event.target as HTMLSelectElement).value;
    this.selectedFocusUserId.set(userId);
  }
}
