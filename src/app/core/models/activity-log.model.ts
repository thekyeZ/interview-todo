export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'SUBTASK_TOGGLED'
  | 'RESCHEDULED'
  | 'DELETED'
  | 'BULK_UPDATED';

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  action: ActivityAction;
  details: string;
  timestamp: string;
}
