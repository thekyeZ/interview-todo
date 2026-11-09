import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tasks',
  },
  {
    path: 'tasks',
    loadChildren: () =>
      import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES),
  },
  {
    path: 'calendar',
    loadChildren: () =>
      import('./features/calendar/calendar.routes').then(
        (m) => m.CALENDAR_ROUTES
      ),
  },
  {
    path: 'analytics',
    loadChildren: () =>
      import('./features/analytics/analytics.routes').then(
        (m) => m.ANALYTICS_ROUTES
      ),
  },
  {
    path: 'activity-log',
    loadChildren: () =>
      import('./features/activity-log/activity-log.routes').then(
        (m) => m.ACTIVITY_LOG_ROUTES
      ),
  },
  {
    path: '**',
    redirectTo: 'tasks',
  },
];
