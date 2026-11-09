import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component
) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return window.confirm(
    'Masz niezapisane zmiany w formularzu zadania. Czy na pewno chcesz opuścić ten widok i utracić wprowadzone zmiany?'
  );
};
