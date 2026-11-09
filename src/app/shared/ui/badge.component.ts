import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CategoryColor } from '../../core/models/category.model';
import { TaskPriority, TaskStatus } from '../../core/models/task.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
      [class]="badgeClasses()"
    >
      <span class="h-1.5 w-1.5 rounded-full" [class]="dotClass()"></span>
      {{ label() }}
    </span>
  `,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();

  readonly label = computed(() => {
    switch (this.priority()) {
      case 'critical':
        return 'Krytyczny';
      case 'high':
        return 'Wysoki';
      case 'medium':
        return 'Średni';
      case 'low':
        return 'Niski';
    }
  });

  readonly badgeClasses = computed(() => {
    switch (this.priority()) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 ring-rose-600/20';
      case 'high':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      case 'medium':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
      case 'low':
        return 'bg-slate-100 text-slate-600 ring-slate-500/20';
    }
  });

  readonly dotClass = computed(() => {
    switch (this.priority()) {
      case 'critical':
        return 'bg-rose-600';
      case 'high':
        return 'bg-amber-500';
      case 'medium':
        return 'bg-indigo-500';
      case 'low':
        return 'bg-slate-400';
    }
  });
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
      [class]="statusClasses()"
    >
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<TaskStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'todo':
        return 'Do zrobienia';
      case 'in_progress':
        return 'W trakcie';
      case 'review':
        return 'Code Review';
      case 'done':
        return 'Ukończone';
    }
  });

  readonly statusClasses = computed(() => {
    switch (this.status()) {
      case 'todo':
        return 'bg-slate-100 text-slate-700 ring-slate-300';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'review':
        return 'bg-purple-50 text-purple-700 ring-purple-600/20';
      case 'done':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    }
  });
}

@Component({
  selector: 'app-category-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
      [class]="colorClasses()"
    >
      <span class="opacity-70">[{{ code() }}]</span>
      <span>{{ name() }}</span>
    </span>
  `,
})
export class CategoryBadgeComponent {
  readonly name = input.required<string>();
  readonly code = input.required<string>();
  readonly color = input<CategoryColor>('indigo');

  readonly colorClasses = computed(() => {
    switch (this.color()) {
      case 'indigo':
        return 'bg-indigo-50 text-indigo-700';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700';
      case 'rose':
        return 'bg-rose-50 text-rose-700';
      case 'amber':
        return 'bg-amber-50 text-amber-700';
      case 'sky':
        return 'bg-sky-50 text-sky-700';
    }
  });
}
