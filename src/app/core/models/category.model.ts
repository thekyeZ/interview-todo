export type CategoryColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky';

export interface Category {
  id: string;
  name: string;
  code: string;
  color: CategoryColor;
  description: string;
}
