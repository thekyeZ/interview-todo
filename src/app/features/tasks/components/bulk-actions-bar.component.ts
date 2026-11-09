import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-bulk-actions-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (selectedCount() > 0) {
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-lg">
        <div class="flex items-center gap-3">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold">
            {{ selectedCount() }}
          </span>
          <span class="text-xs font-medium">
            Zaznaczono zadań do operacji zbiorczej (forkJoin)
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-slate-400 mr-1">Ustaw status:</span>
          <button
            type="button"
            (click)="bulkStatusChange.emit('todo')"
            class="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-700 transition"
          >
            Do zrobienia
          </button>
          <button
            type="button"
            (click)="bulkStatusChange.emit('in_progress')"
            class="rounded-lg bg-blue-600/30 text-blue-200 px-2.5 py-1.5 text-xs font-medium hover:bg-blue-600/50 transition"
          >
            W trakcie
          </button>
          <button
            type="button"
            (click)="bulkStatusChange.emit('done')"
            class="rounded-lg bg-emerald-600/30 text-emerald-200 px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-600/50 transition"
          >
            Ukończone
          </button>
          <button
            type="button"
            (click)="clearSelection.emit()"
            class="ml-2 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Odznacz wszystkie
          </button>
        </div>
      </div>
    }
  `,
})
export class BulkActionsBarComponent {
  readonly selectedCount = input.required<number>();
  readonly bulkStatusChange = output<TaskStatus>();
  readonly clearSelection = output<void>();
}
