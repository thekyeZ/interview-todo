export interface Task {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly completed: boolean;
  readonly order: number;
  readonly createdAt: string;
}

export type TaskFilter = 'all' | 'active' | 'completed';

export type CreateTaskPayload = Omit<Task, 'id'>;

export type UpdateTaskPayload = Partial<Pick<Task, 'title' | 'completed' | 'order'>>;

export interface UndoToastState {
  readonly message: string;
  readonly deletedTasks: readonly Task[];
}
