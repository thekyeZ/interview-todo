import { Injectable, computed, inject, signal } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { User } from '../core/models/user.model';
import { ToastService } from '../core/services/toast.service';
import { UsersApiService } from '../core/services/users-api.service';

/**
 * Lekki serwis przechowujący ID aktywnego użytkownika dla HttpInterceptorFn,
 * eliminujący cykliczną zależność DI (NG0200) pomiędzy UserContextStore -> HttpClient -> userContextInterceptor.
 */
@Injectable({
  providedIn: 'root',
})
export class ActiveUserTokenService {
  readonly currentUserId = signal<string>('u-2');
}

const DEFAULT_USERS: User[] = [
  {
    id: 'u-1',
    name: 'Anna Nowak',
    email: 'anna.nowak@devstudio.pl',
    role: 'admin',
    title: 'Principal Architect',
    avatar: 'AN',
    avatarColor: 'bg-indigo-600',
    dailyCapacityHours: 6,
    department: 'Architecture',
  },
  {
    id: 'u-2',
    name: 'Piotr Kowalski',
    email: 'piotr.kowalski@devstudio.pl',
    role: 'developer',
    title: 'Senior Angular Developer',
    avatar: 'PK',
    avatarColor: 'bg-emerald-600',
    dailyCapacityHours: 8,
    department: 'Frontend',
  },
  {
    id: 'u-3',
    name: 'Maja Wiśniewska',
    email: 'maja.wisniewska@devstudio.pl',
    role: 'designer',
    title: 'Lead Product Designer',
    avatar: 'MW',
    avatarColor: 'bg-amber-600',
    dailyCapacityHours: 7,
    department: 'Product & UX',
  },
];

interface UserContextState {
  users: User[];
  currentUserId: string;
  loading: boolean;
}

const initialState: UserContextState = {
  users: DEFAULT_USERS,
  currentUserId: 'u-2', // Domyślnie Piotr Kowalski (Senior Angular Developer)
  loading: false,
};

export const UserContextStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ users, currentUserId }) => ({
    currentUser: computed<User | null>(
      () => users().find((u) => u.id === currentUserId()) ?? users()[0] ?? null
    ),
    isAdmin: computed(() => {
      const active = users().find((u) => u.id === currentUserId());
      return active?.role === 'admin';
    }),
    usersMap: computed(() => {
      const map = new Map<string, User>();
      for (const user of users()) {
        map.set(user.id, user);
      }
      return map;
    }),
  })),
  withMethods(
    (
      store,
      usersApi = inject(UsersApiService),
      toastService = inject(ToastService),
      activeUserToken = inject(ActiveUserTokenService)
    ) => ({
      loadUsers: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            usersApi.getUsers().pipe(
              tapResponse({
                next: (users) => {
                  if (users.length === 0) {
                    patchState(store, { loading: false });
                    return;
                  }
                  const resolvedUserId = users.some(
                    (u) => u.id === store.currentUserId()
                  )
                    ? store.currentUserId()
                    : (users[0]?.id ?? 'u-2');
                  activeUserToken.currentUserId.set(resolvedUserId);
                  patchState(store, {
                    users,
                    loading: false,
                    currentUserId: resolvedUserId,
                  });
                },
                error: () => {
                  patchState(store, { loading: false });
                },
              })
            )
          )
        )
      ),
      switchUser(userId: string): void {
        const target = store.users().find((u) => u.id === userId);
        if (!target) {
          return;
        }
        activeUserToken.currentUserId.set(userId);
        patchState(store, { currentUserId: userId });
        toastService.info(
          `Przełączono kontekst użytkownika`,
          `Aktywny profil: ${target.name} (${target.title})`
        );
      },
    })
  ),
  withHooks({
    onInit(store) {
      store.loadUsers();
    },
  })
);
