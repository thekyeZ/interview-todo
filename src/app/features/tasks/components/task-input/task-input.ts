import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';

@Component({
  selector: 'app-task-input',
  imports: [FormField],
  templateUrl: './task-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskInput {
  readonly isCreating = input(false);
  readonly addTask = output<string>();

  protected readonly taskModel = signal({ title: '' });
  protected readonly taskForm = form(this.taskModel);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const title = this.taskModel().title.trim();
    if (!title || this.isCreating()) {
      return;
    }

    this.addTask.emit(title);
    this.taskModel.set({ title: '' });
  }
}
