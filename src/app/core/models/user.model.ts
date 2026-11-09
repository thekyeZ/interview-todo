export type UserRole = 'admin' | 'developer' | 'designer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
  avatarColor: string;
  dailyCapacityHours: number;
  department: string;
}
