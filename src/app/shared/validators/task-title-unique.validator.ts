import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';
import { TasksApiService } from '../../core/services/tasks-api.service';

export function uniqueTaskTitleValidator(
  tasksApi: TasksApiService,
  getExcludeTaskId: () => string | null
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const rawValue = (control.value ?? '').toString().trim();
    if (rawValue.length < 4) {
      return of(null);
    }

    return timer(350).pipe(
      switchMap(() =>
        tasksApi.checkTitleExists(rawValue, getExcludeTaskId()).pipe(
          map((exists) => (exists ? { duplicateTitle: true } : null)),
          catchError(() => of(null))
        )
      )
    );
  };
}
