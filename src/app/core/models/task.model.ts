export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  assigneeId: string | null;
  reporterId: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  estimateHours: number;
  loggedHours: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}

export interface TaskFilter {
  query: string;
  categoryId: string | 'all';
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  tag: string | 'all';
  onlyMyTasks: boolean;
  sortBy: 'dueDate' | 'priority' | 'updatedAt' | 'estimateHours';
}

export interface TaskUpsertPayload {
  title: string;
  description: string;
  categoryId: string;
  assigneeId: string | null;
  reporterId: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  estimateHours: number;
  loggedHours: number;
  dueDate: string | null;
  subtasks: Subtask[];
}
