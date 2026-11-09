import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function workloadConsistencyValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const estimate = Number(group.get('estimateHours')?.value ?? 0);
    const logged = Number(group.get('loggedHours')?.value ?? 0);
    const status = group.get('status')?.value;

    if (estimate <= 0) {
      return { invalidEstimate: true };
    }

    if (logged > estimate * 3) {
      return { excessiveLoggedHours: true };
    }

    if (status === 'done' && logged <= 0) {
      return { doneWithoutLoggedHours: true };
    }

    return null;
  };
}
