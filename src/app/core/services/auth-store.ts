import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_USER, DEMO_USER } from '../config/api-config';
import { AuthUser } from '../models/user.model';

const STORAGE_KEY = 'minimal_todo_auth_user';

@Service()
export class AuthStore {
  private readonly router = inject(Router);

  private readonly _user = signal<AuthUser>(this.readStoredUser() ?? DEFAULT_USER);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  async enterWorkspace(email?: string): Promise<boolean> {
    const trimmedEmail = email?.trim().toLowerCase() ?? '';
    const nextUser: AuthUser =
      trimmedEmail === DEMO_USER.email
        ? DEMO_USER
        : trimmedEmail.length > 0
          ? {
              ...DEFAULT_USER,
              email: trimmedEmail,
              name: this.deriveDisplayName(trimmedEmail),
            }
          : DEFAULT_USER;

    this._user.set(nextUser);
    this.persistUser(nextUser);
    return this.router.navigateByUrl('/tasks');
  }

  async enterDemoWorkspace(): Promise<boolean> {
    this._user.set(DEMO_USER);
    this.persistUser(DEMO_USER);
    return this.router.navigateByUrl('/tasks');
  }

  logout(): void {
    this._user.set(DEFAULT_USER);
    this.removeStoredUser();
    void this.router.navigateByUrl('/login');
  }

  private deriveDisplayName(email: string): string {
    const prefix = email.split('@')[0] ?? 'User';
    return prefix
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<AuthUser>;
      if (typeof parsed.id === 'string' && typeof parsed.email === 'string') {
        return {
          id: parsed.id,
          email: parsed.email,
          name: typeof parsed.name === 'string' ? parsed.name : parsed.email,
          isDemo: Boolean(parsed.isDemo),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private persistUser(user: AuthUser): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Storage may be unavailable in restricted contexts.
    }
  }

  private removeStoredUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable in restricted contexts.
    }
  }
}
