import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ActivityAction, ActivityLog } from '../core/models/activity-log.model';
import { ActivityApiService } from '../core/services/activity-api.service';
import { UserContextStore } from './user-context.store';

interface ActivityLogState {
  logs: ActivityLog[];
  actionFilter: ActivityAction | 'ALL';
  userFilter: string | 'ALL';
  searchQuery: string;
  loading: boolean;
  lastSyncedAt: string | null;
}

const initialState: ActivityLogState = {
  logs: [],
  actionFilter: 'ALL',
  userFilter: 'ALL',
  searchQuery: '',
  loading: false,
  lastSyncedAt: null,
};

export const ActivityLogStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ logs, actionFilter, userFilter, searchQuery }) => ({
    filteredLogs: computed(() => {
      const action = actionFilter();
      const user = userFilter();
      const query = searchQuery().trim().toLowerCase();

      return logs().filter((item) => {
        if (action !== 'ALL' && item.action !== action) {
          return false;
        }
        if (user !== 'ALL' && item.userId !== user) {
          return false;
        }
        if (
          query.length > 0 &&
          !item.taskTitle.toLowerCase().includes(query) &&
          !item.details.toLowerCase().includes(query)
        ) {
          return false;
        }
        return true;
      });
    }),
    actionCounts: computed(() => {
      const counts: Record<string, number> = { ALL: logs().length };
      for (const item of logs()) {
        counts[item.action] = (counts[item.action] ?? 0) + 1;
      }
      return counts;
    }),
  })),
  withMethods(
    (
      store,
      activityApi = inject(ActivityApiService),
      userStore = inject(UserContextStore)
    ) => ({
      loadLogs: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() =>
            activityApi.getActivityLogs().pipe(
              tapResponse({
                next: (logs) =>
                  patchState(store, {
                    logs,
                    loading: false,
                    lastSyncedAt: new Date().toISOString(),
                  }),
                error: () => patchState(store, { loading: false }),
              })
            )
          )
        )
      ),
      recordActivity: rxMethod<{
        taskId: string;
        taskTitle: string;
        action: ActivityAction;
        details: string;
      }>(
        pipe(
          switchMap((payload) =>
            activityApi
              .createLog({
                ...payload,
                userId: userStore.currentUserId(),
              })
              .pipe(
                tapResponse({
                  next: (created) =>
                    patchState(store, (state) => ({
                      logs: [created, ...state.logs],
                      lastSyncedAt: created.timestamp,
                    })),
                  error: () => {
                    // Ciche ignorowanie błędu logu audytowego, aby nie blokować głównej akcji biznesowej
                  },
                })
              )
          )
        )
      ),
      setActionFilter(actionFilter: ActivityAction | 'ALL'): void {
        patchState(store, { actionFilter });
      },
      setUserFilter(userFilter: string | 'ALL'): void {
        patchState(store, { userFilter });
      },
      setSearchQuery(searchQuery: string): void {
        patchState(store, { searchQuery });
      },
    })
  )
);
