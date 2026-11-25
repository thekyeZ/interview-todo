import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tasks-header',
  imports: [RouterLink],
  templateUrl: './tasks-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksHeader {
  readonly userEmail = input.required<string>();
  readonly logout = output<void>();
}
