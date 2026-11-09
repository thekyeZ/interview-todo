import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (showLabel()) {
        <div class="mb-1 flex items-center justify-between text-xs text-slate-600">
          <span>{{ label() }}</span>
          <span class="font-semibold text-slate-800">{{ clampedPercent() }}%</span>
        </div>
      }
      <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          class="h-full rounded-full transition-all duration-300"
          [class]="barColorClass()"
          [style.width.%]="clampedPercent()"
        ></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  readonly value = input.required<number>();
  readonly label = input<string>('');
  readonly showLabel = input<boolean>(false);
  readonly tone = input<'indigo' | 'emerald' | 'amber' | 'rose'>('indigo');

  readonly clampedPercent = computed(() =>
    Math.max(0, Math.min(100, Math.round(this.value())))
  );

  readonly barColorClass = computed(() => {
    switch (this.tone()) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'rose':
        return 'bg-rose-500';
      case 'indigo':
      default:
        return 'bg-indigo-600';
    }
  });
}
