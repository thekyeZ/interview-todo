import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActiveUserTokenService } from '../../store/user-context.store';

export const userContextInterceptor: HttpInterceptorFn = (req, next) => {
  const activeUserToken = inject(ActiveUserTokenService);
  const activeUserId = activeUserToken.currentUserId() || 'u-2';

  const clonedRequest = req.clone({
    setHeaders: {
      'X-User-Id': activeUserId,
    },
  });

  return next(clonedRequest);
};
