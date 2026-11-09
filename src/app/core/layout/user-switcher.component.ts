import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserContextStore } from '../../store/user-context.store';

@Component({
  selector: 'app-user-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
      @if (userStore.currentUser(); as active) {
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          [class]="active.avatarColor"
        >
          {{ active.avatar }}
        </div>
        <div class="hidden sm:block">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-slate-900">{{ active.name }}</span>
            <span
              class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600"
            >
              {{ active.role }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500">
            {{ active.title }} • Limit: {{ active.dailyCapacityHours }}h/dzień
          </p>
        </div>
      }

      <div class="border-l border-slate-200 pl-2">
        <label class="sr-only" for="active-user-select">Przełącz użytkownika</label>
        <select
          id="active-user-select"
          class="cursor-pointer rounded-md border-0 bg-slate-50 py-1 pl-2 pr-6 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600"
          [value]="userStore.currentUserId()"
          (change)="onUserChange($event)"
        >
          @for (user of userStore.users(); track user.id) {
            <option [value]="user.id">
              {{ user.name }} ({{ user.role }})
            </option>
          }
        </select>
      </div>
    </div>
  `,
})
export class UserSwitcherComponent {
  readonly userStore = inject(UserContextStore);

  onUserChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.userStore.switchUser(select.value);
    }
  }
}
