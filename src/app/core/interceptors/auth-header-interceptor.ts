import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api-config';
import { AuthStore } from '../services/auth-store';

export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);
  const authStore = inject(AuthStore);
  const userId = authStore.user()?.id;

  if (!userId || !req.url.startsWith(apiBaseUrl)) {
    return next(req);
  }

  const requestWithUser = req.clone({
    setHeaders: {
      'X-User-Id': userId,
    },
  });

  return next(requestWithUser);
};
