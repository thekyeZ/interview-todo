import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';
import { TaskEditorPageComponent } from './pages/task-editor-page.component';
import { TasksBoardPageComponent } from './pages/tasks-board-page.component';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksBoardPageComponent,
  },
  {
    path: 'new',
    component: TaskEditorPageComponent,
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    component: TaskEditorPageComponent,
    canDeactivate: [unsavedChangesGuard],
  },
];
