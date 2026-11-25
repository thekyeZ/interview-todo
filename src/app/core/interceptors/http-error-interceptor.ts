import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const message =
          error.status === 0
            ? 'Network error: unable to connect to the API server.'
            : typeof error.error?.message === 'string'
              ? error.error.message
              : `Request failed with status ${error.status}.`;

        return throwError(() => new Error(message));
      }

      return throwError(() => error);
    }),
  );
};
