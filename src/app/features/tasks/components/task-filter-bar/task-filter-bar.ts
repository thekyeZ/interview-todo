import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TaskFilter } from '../../../../core/models/task.model';

@Component({
  selector: 'app-task-filter-bar',
  templateUrl: './task-filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFilterBar {
  readonly activeFilter = input.required<TaskFilter>();
  readonly searchQuery = input.required<string>();
  readonly totalCount = input.required<number>();
  readonly activeCount = input.required<number>();
  readonly completedCount = input.required<number>();
  readonly isSearching = input(false);

  readonly filterChange = output<TaskFilter>();
  readonly searchChange = output<string>();

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChange.emit(value);
  }

  protected clearSearch(): void {
    this.searchChange.emit('');
  }
}
