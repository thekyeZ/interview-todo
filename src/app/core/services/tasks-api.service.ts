import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Task, TaskStatus, TaskUpsertPayload } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TasksApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly endpoint = `${this.baseUrl}/tasks`;

  getTasks(searchQuery?: string): Observable<Task[]> {
    let params = new HttpParams().set('_sort', 'updatedAt').set('_order', 'desc');
    if (searchQuery && searchQuery.trim().length > 0) {
      params = params.set('q', searchQuery.trim());
    }
    return this.http.get<Task[]>(this.endpoint, { params });
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.endpoint}/${id}`);
  }

  checkTitleExists(title: string, excludeTaskId?: string | null): Observable<boolean> {
    const normalized = title.trim().toLowerCase();
    const params = new HttpParams().set('q', title.trim());
    return this.http.get<Task[]>(this.endpoint, { params }).pipe(
      map((tasks) =>
        tasks.some(
          (task) =>
            task.title.trim().toLowerCase() === normalized &&
            (!excludeTaskId || task.id !== excludeTaskId)
        )
      )
    );
  }

  createTask(payload: TaskUpsertPayload): Observable<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...payload,
      id: `t-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    return this.http.post<Task>(this.endpoint, newTask);
  }

  updateTask(id: string, changes: Partial<Task>): Observable<Task> {
    const updatedChanges: Partial<Task> = {
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    return this.http.patch<Task>(`${this.endpoint}/${id}`, updatedChanges);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  bulkUpdateStatus(ids: string[], status: TaskStatus): Observable<Task[]> {
    const requests = ids.map((id) => this.updateTask(id, { status }));
    return forkJoin(requests);
  }

  bulkDelete(ids: string[]): Observable<void[]> {
    const requests = ids.map((id) => this.deleteTask(id));
    return forkJoin(requests);
  }
}
