import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Task } from '../../core/models/task.model';
import { AuthStore } from '../../core/services/auth-store';
import { TaskFilterBar } from './components/task-filter-bar/task-filter-bar';
import { TaskInput } from './components/task-input/task-input';
import { TaskItem } from './components/task-item/task-item';
import { TasksHeader } from './components/tasks-header/tasks-header';
import { UndoToast } from './components/undo-toast/undo-toast';
import { TasksStore } from './data/tasks-store';

@Component({
  selector: 'app-tasks',
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    TasksHeader,
    TaskInput,
    TaskFilterBar,
    TaskItem,
    UndoToast,
  ],
  providers: [TasksStore],
  templateUrl: './tasks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tasks {
  protected readonly authStore = inject(AuthStore);
  protected readonly tasksStore = inject(TasksStore);

  protected readonly userEmail = computed(() => this.authStore.user()?.email ?? '');

  protected readonly remainingLabel = computed(() => {
    const remaining = this.tasksStore.totalCount();
    return remaining === 1 ? '1 task remaining' : `${remaining} tasks remaining`;
  });

  protected onDrop(event: CdkDragDrop<Task[]>): void {
    this.tasksStore.reorderTasks(event.previousIndex, event.currentIndex);
  }

  protected onUndo(): void {
    void this.tasksStore.undoDelete();
  }

  protected onLogout(): void {
    this.authStore.logout();
  }

  protected stopEvent(event: Event): void {
    event.stopPropagation();
  }
}
