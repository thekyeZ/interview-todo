import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { DEFAULT_USER, DEMO_USER } from '../config/api-config';
import { AuthStore } from './auth-store';

describe('AuthStore', () => {
  let store: AuthStore;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to the standard workspace user without requiring login', () => {
    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(DEFAULT_USER);
  });

  it('enters workspace directly with default user when no email is provided', async () => {
    await store.enterWorkspace();

    expect(store.user()).toEqual(DEFAULT_USER);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('enters workspace with custom email when provided', async () => {
    await store.enterWorkspace('jane.doe@example.com');

    expect(store.user().email).toBe('jane.doe@example.com');
    expect(store.user().id).toBe(DEFAULT_USER.id);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('enters demo workspace and navigates to tasks', async () => {
    await store.enterDemoWorkspace();

    expect(store.user()).toEqual(DEMO_USER);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('navigates to login on logout', () => {
    store.logout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
