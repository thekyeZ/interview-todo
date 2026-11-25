import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authHeaderInterceptor } from './core/interceptors/auth-header-interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authHeaderInterceptor, httpErrorInterceptor])),
  ],
};
