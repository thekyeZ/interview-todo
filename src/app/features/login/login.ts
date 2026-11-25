import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, readonly } from '@angular/forms/signals';
import { DEMO_ACCOUNT } from '../../core/config/api-config';
import { AuthStore } from '../../core/services/auth-store';

type LoginTab = 'standard' | 'demo';
type AuthView = 'signin' | 'signup';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly authStore = inject(AuthStore);

  protected readonly view = signal<AuthView>('signin');
  protected readonly activeTab = signal<LoginTab>('standard');
  protected readonly showPassword = signal(false);
  protected readonly showForgotHint = signal(false);

  protected readonly isDemoMode = computed(
    () => this.view() === 'signin' && this.activeTab() === 'demo',
  );

  protected readonly credentialsModel = signal({
    email: '',
    password: '',
  });

  protected readonly authForm = form(this.credentialsModel, (schemaPath) => {
    readonly(schemaPath.email, { when: () => this.isDemoMode() });
    readonly(schemaPath.password, { when: () => this.isDemoMode() });
  });

  protected readonly submitLabel = computed(() => {
    if (this.view() === 'signup') {
      return 'Create Account';
    }
    return this.isDemoMode() ? 'Enter Workspace' : 'Sign In';
  });

  protected switchTab(tab: LoginTab): void {
    if (this.activeTab() === tab) {
      return;
    }

    this.activeTab.set(tab);
    this.showForgotHint.set(false);

    if (tab === 'demo') {
      this.credentialsModel.set({
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
      });
    } else {
      this.credentialsModel.set({ email: '', password: '' });
      this.authForm().reset();
    }
  }

  protected toggleAuthView(): void {
    const nextView: AuthView = this.view() === 'signin' ? 'signup' : 'signin';
    this.view.set(nextView);
    this.activeTab.set('standard');
    this.showForgotHint.set(false);
    this.credentialsModel.set({ email: '', password: '' });
    this.authForm().reset();
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected toggleForgotHint(): void {
    this.showForgotHint.update((visible) => !visible);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();

    if (this.isDemoMode()) {
      void this.authStore.enterDemoWorkspace();
      return;
    }

    void this.authStore.enterWorkspace(this.credentialsModel().email);
  }
}
