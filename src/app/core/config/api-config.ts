import { InjectionToken } from '@angular/core';
import { AuthUser } from '../models/user.model';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});

export const DEFAULT_USER: AuthUser = {
  id: 'u-1',
  email: 'alex@work.com',
  name: 'Alex Morgan',
  isDemo: false,
};

export const DEMO_USER: AuthUser = {
  id: 'u-2',
  email: 'demo@tasks.minimal',
  name: 'Demo User',
  isDemo: true,
};

export const DEMO_ACCOUNT = {
  email: DEMO_USER.email,
  password: 'calm-workflow-2025',
} as const;
