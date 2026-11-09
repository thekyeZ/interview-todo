import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ActivityLog } from '../models/activity-log.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly endpoint = `${this.baseUrl}/activityLogs`;

  getActivityLogs(): Observable<ActivityLog[]> {
    const params = new HttpParams().set('_sort', 'timestamp').set('_order', 'desc');
    return this.http.get<ActivityLog[]>(this.endpoint, { params });
  }

  createLog(entry: Omit<ActivityLog, 'id' | 'timestamp'>): Observable<ActivityLog> {
    const payload: ActivityLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    return this.http.post<ActivityLog>(this.endpoint, payload);
  }
}
