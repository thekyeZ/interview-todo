import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UndoToastState } from '../../../../core/models/task.model';

@Component({
  selector: 'app-undo-toast',
  templateUrl: './undo-toast.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UndoToast {
  readonly toast = input<UndoToastState | null>(null);

  readonly undo = output<void>();
  readonly dismiss = output<void>();
}
