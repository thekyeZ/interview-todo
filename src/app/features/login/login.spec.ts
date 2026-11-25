import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { DEMO_ACCOUNT } from '../../core/config/api-config';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
  });

  it('renders standard sign-in view by default', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Tasks.');
    expect(el.textContent).toContain('Sign in');
    expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Sign In');
  });

  it('navigates directly to /tasks when clicking Sign In without credentials', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const submitBtn = el.querySelector<HTMLButtonElement>('button[type="submit"]');

    submitBtn?.click();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tasks');
  });

  it('switches to Demo Access mode with prefilled readonly credentials', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const tabs = el.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs.length).toBe(2);

    tabs[1].click();
    await fixture.whenStable();

    const emailInput = el.querySelector<HTMLInputElement>('#email');
    const passwordInput = el.querySelector<HTMLInputElement>('#password');

    expect(emailInput?.value).toBe(DEMO_ACCOUNT.email);
    expect(passwordInput?.value).toBe(DEMO_ACCOUNT.password);
    expect(emailInput?.readOnly).toBe(true);
    expect(el.textContent).toContain('Sandbox profile active');
    expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Enter Workspace');
  });

  it('toggles password visibility', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const passwordInput = el.querySelector<HTMLInputElement>('#password');
    const toggleBtn = el.querySelector<HTMLButtonElement>('button[aria-label="Show password"]');

    expect(passwordInput?.type).toBe('password');

    toggleBtn?.click();
    await fixture.whenStable();

    expect(passwordInput?.type).toBe('text');
  });
});
