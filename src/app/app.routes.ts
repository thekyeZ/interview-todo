import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Sign in — Tasks.',
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/tasks').then((m) => m.Tasks),
    title: 'Todo. — Minimal Tasks',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tasks',
  },
  {
    path: '**',
    redirectTo: 'tasks',
  },
];
