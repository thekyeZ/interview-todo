import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-config';
import { CreateTaskPayload, Task, UpdateTaskPayload } from '../../../core/models/task.model';

@Service()
export class TasksApi {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getTasks(userId: string, query?: string): Observable<Task[]> {
    let params = new HttpParams()
      .set('userId', userId)
      .set('_sort', 'order')
      .set('_order', 'asc');

    const trimmedQuery = query?.trim();
    if (trimmedQuery) {
      params = params.set('q', trimmedQuery);
    }

    return this.http.get<Task[]>(`${this.apiBaseUrl}/tasks`, { params });
  }

  createTask(payload: CreateTaskPayload): Observable<Task> {
    return this.http.post<Task>(`${this.apiBaseUrl}/tasks`, payload);
  }

  restoreTask(task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiBaseUrl}/tasks`, task);
  }

  updateTask(id: string, changes: UpdateTaskPayload): Observable<Task> {
    return this.http.patch<Task>(`${this.apiBaseUrl}/tasks/${id}`, changes);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/tasks/${id}`);
  }
}
