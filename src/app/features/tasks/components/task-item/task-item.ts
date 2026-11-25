import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Task } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskItem {
  readonly task = input.required<Task>();

  readonly toggle = output<Task>();
  readonly remove = output<Task>();

  protected onRowClick(): void {
    this.toggle.emit(this.task());
  }

  protected onToggleClick(event: Event): void {
    event.stopPropagation();
    this.toggle.emit(this.task());
  }

  protected onRemoveClick(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.task());
  }
}
