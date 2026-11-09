import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GlobalLoadingService {
  private readonly activeRequestsCount = signal(0);

  readonly isLoading = computed(() => this.activeRequestsCount() > 0);
  readonly pendingCount = this.activeRequestsCount.asReadonly();

  increment(): void {
    this.activeRequestsCount.update((count) => count + 1);
  }

  decrement(): void {
    this.activeRequestsCount.update((count) => Math.max(0, count - 1));
  }
}
