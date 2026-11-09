import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, throwError, timer } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    retry({
      count: req.method === 'GET' ? 1 : 0,
      delay: () => timer(300),
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        toastService.error(
          'Brak połączenia z API (json-server)',
          'Upewnij się, że serwer na http://localhost:3000 jest uruchomiony (npm start).'
        );
      } else if (error.status >= 500) {
        toastService.error(
          `Błąd serwera (${error.status})`,
          error.error?.message || 'Wystąpił wewnętrzny błąd po stronie json-server.'
        );
      }
      return throwError(() => error);
    })
  );
};
