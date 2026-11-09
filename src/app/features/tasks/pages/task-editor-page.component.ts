import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CanComponentDeactivate } from '../../../core/guards/unsaved-changes.guard';
import {
  Subtask,
  TaskPriority,
  TaskStatus,
  TaskUpsertPayload,
} from '../../../core/models/task.model';
import { TasksApiService } from '../../../core/services/tasks-api.service';
import { workloadConsistencyValidator } from '../../../shared/validators/due-date.validator';
import { uniqueTaskTitleValidator } from '../../../shared/validators/task-title-unique.validator';
import { TasksStore } from '../../../store/tasks.store';
import { UserContextStore } from '../../../store/user-context.store';

@Component({
  selector: 'app-task-editor-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <a
            routerLink="/tasks"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
          >
            ← Powrót do tablicy zadań
          </a>
          <h1 class="mt-1 text-2xl font-bold text-slate-900">
            {{ isEditMode() ? 'Edycja zadania ' + id() : 'Nowe zadanie w projekcie' }}
          </h1>
          <p class="text-xs text-slate-500">
            Formularz wykorzystuje ReactiveForms, dynamiczny FormArray podzadań, walidator asynchroniczny duplikatów tytułu oraz guard canDeactivate.
          </p>
        </div>
      </div>

      <form
        [formGroup]="taskForm"
        (ngSubmit)="onSubmit()"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
      >
        <!-- Tytuł z walidacją asynchroniczną -->
        <div>
          <div class="flex items-center justify-between">
            <label for="title" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Tytuł zadania *
            </label>
            @if (taskForm.controls.title.pending) {
              <span class="text-xs font-medium text-indigo-600 animate-pulse">
                Sprawdzanie unikalności tytułu w json-server...
              </span>
            }
          </div>
          <input
            id="title"
            type="text"
            formControlName="title"
            placeholder="Np. Optymalizacja strategii OnPush w widoku tablicy"
            class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
          @if (taskForm.controls.title.touched && taskForm.controls.title.errors; as errors) {
            <div class="mt-1 text-xs font-medium text-rose-600">
              @if (errors['required']) {
                <span>Tytuł zadania jest wymagany.</span>
              } @else if (errors['minlength']) {
                <span>Tytuł musi mieć co najmniej 5 znaków.</span>
              } @else if (errors['duplicateTitle']) {
                <span>Zadanie o tym tytule już istnieje w bazie json-server!</span>
              }
            </div>
          }
        </div>

        <!-- Opis -->
        <div>
          <label for="description" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Opis techniczny i kryteria akceptacji *
          </label>
          <textarea
            id="description"
            rows="3"
            formControlName="description"
            placeholder="Opisz kontekst biznesowy lub techniczny zadania (dodaj [SIMULATE_ERROR] w tytule, aby przetestować błąd 500 z middleware)..."
            class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
          ></textarea>
        </div>

        <!-- Wiersz: Kategoria, Wykonawca, Status, Priorytet -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="categoryId" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Kategoria *
            </label>
            <select
              id="categoryId"
              formControlName="categoryId"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
            >
              @for (cat of tasksStore.categories(); track cat.id) {
                <option [value]="cat.id">[{{ cat.code }}] {{ cat.name }}</option>
              }
            </select>
          </div>

          <div>
            <label for="assigneeId" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Przypisany wykonawca
            </label>
            <select
              id="assigneeId"
              formControlName="assigneeId"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
            >
              <option [ngValue]="null">— Nieprzypisane —</option>
              @for (user of userStore.users(); track user.id) {
                <option [value]="user.id">{{ user.name }} ({{ user.title }})</option>
              }
            </select>
          </div>

          <div>
            <label for="status" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Status
            </label>
            <select
              id="status"
              formControlName="status"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="todo">Do zrobienia</option>
              <option value="in_progress">W trakcie</option>
              <option value="review">Code Review</option>
              <option value="done">Ukończone</option>
            </select>
          </div>

          <div>
            <label for="priority" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Priorytet
            </label>
            <select
              id="priority"
              formControlName="priority"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
              <option value="critical">Krytyczny</option>
            </select>
          </div>
        </div>

        <!-- Wiersz: Estymacja, Zaraportowany czas, Termin wykonania -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label for="estimateHours" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Estymacja (h) *
            </label>
            <input
              id="estimateHours"
              type="number"
              step="0.5"
              min="0.5"
              formControlName="estimateHours"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label for="loggedHours" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Zaraportowano (h)
            </label>
            <input
              id="loggedHours"
              type="number"
              step="0.5"
              min="0"
              formControlName="loggedHours"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label for="dueDate" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Termin (Due Date)
            </label>
            <input
              id="dueDate"
              type="date"
              formControlName="dueDate"
              class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        <!-- Komunikaty walidatora krzyżowego grupy (workloadConsistencyValidator) -->
        @if (taskForm.errors; as groupErrors) {
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-medium text-amber-800">
            @if (groupErrors['doneWithoutLoggedHours']) {
              <p>Zadanie oznaczone jako „Ukończone” musi mieć zaraportowane więcej niż 0 godzin pracy.</p>
            }
            @if (groupErrors['excessiveLoggedHours']) {
              <p>Liczba zaraportowanych godzin przekracza ponad 3-krotnie pierwotną estymację – zaktualizuj estymację zadania.</p>
            }
          </div>
        }

        <!-- Tagi (rozdzielone przecinkami) -->
        <div>
          <label for="tagsInput" class="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Tagi techniczne (oddzielone przecinkami)
          </label>
          <input
            id="tagsInput"
            type="text"
            formControlName="tagsInput"
            placeholder="np. rxjs, signals, onpush, architecture"
            class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900"
          />
        </div>

        <!-- Dynamiczna lista podzadań (FormArray) -->
        <div class="space-y-3 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                Lista kontrolna podzadań (FormArray: {{ subtasksArray.length }})
              </h2>
              <p class="text-[11px] text-slate-500">
                Dodaj kroki weryfikacyjne dla tego zadania.
              </p>
            </div>
            <button
              type="button"
              (click)="addSubtask()"
              class="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              + Dodaj podzadanie
            </button>
          </div>

          <div formArrayName="subtasks" class="space-y-2">
            @for (subGroup of subtasksArray.controls; track subGroup; let idx = $index) {
              <div [formGroupName]="idx" class="flex items-center gap-2">
                <input
                  type="checkbox"
                  formControlName="completed"
                  class="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <input
                  type="text"
                  formControlName="title"
                  placeholder="Tytuł kroku / podzadania..."
                  class="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900"
                />
                <button
                  type="button"
                  (click)="removeSubtask(idx)"
                  class="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Usuń
                </button>
              </div>
            } @empty {
              <p class="text-xs italic text-slate-400">
                Brak zdefiniowanych podzadań. Kliknij „+ Dodaj podzadanie”, aby utworzyć listę kontrolną.
              </p>
            }
          </div>
        </div>

        <!-- Stopka przycisków -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <a
            routerLink="/tasks"
            class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Anuluj
          </a>
          <button
            type="submit"
            [disabled]="taskForm.invalid || taskForm.pending"
            class="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ isEditMode() ? 'Zapisz zmiany w zadaniu' : 'Utwórz zadanie' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class TaskEditorPageComponent implements OnInit, CanComponentDeactivate {
  // Parametr ścieżki /tasks/:id/edit zbindowany przez withComponentInputBinding()
  readonly id = input<string | undefined>(undefined);

  readonly tasksStore = inject(TasksStore);
  readonly userStore = inject(UserContextStore);
  private readonly fb = inject(FormBuilder);
  private readonly tasksApi = inject(TasksApiService);
  private readonly router = inject(Router);

  private readonly savedSuccessfully = signal(false);
  private readonly loadedTaskId = signal<string | null>(null);

  readonly isEditMode = computed(() => Boolean(this.id()));

  readonly taskForm = this.fb.group(
    {
      title: [
        '',
        [Validators.required, Validators.minLength(5)],
        [uniqueTaskTitleValidator(this.tasksApi, () => this.id() ?? null)],
      ],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: ['cat-arch', [Validators.required]],
      assigneeId: ['u-2' as string | null],
      status: ['todo' as TaskStatus, [Validators.required]],
      priority: ['medium' as TaskPriority, [Validators.required]],
      estimateHours: [2, [Validators.required, Validators.min(0.5)]],
      loggedHours: [0, [Validators.required, Validators.min(0)]],
      dueDate: ['2026-11-10' as string | null],
      tagsInput: ['angular, signals'],
      subtasks: this.fb.array<FormGroup>([]),
    },
    { validators: [workloadConsistencyValidator()] }
  );

  constructor() {
    effect(() => {
      const targetId = this.id();
      const tasks = this.tasksStore.tasks();
      if (targetId && tasks.length > 0 && this.loadedTaskId() !== targetId) {
        const existing = tasks.find((t) => t.id === targetId);
        if (existing) {
          this.populateForm(existing);
          this.loadedTaskId.set(targetId);
        }
      }
    });
  }

  get subtasksArray(): FormArray<FormGroup> {
    return this.taskForm.controls.subtasks;
  }

  ngOnInit(): void {
    const targetId = this.id();
    if (!targetId) {
      this.addSubtask('Przeprowadzić analizę techniczną rozwiązania');
    }
  }

  private populateForm(task: {
    title: string;
    description: string;
    categoryId: string;
    assigneeId: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    estimateHours: number;
    loggedHours: number;
    dueDate: string | null;
    tags: string[];
    subtasks: Subtask[];
  }): void {
    this.subtasksArray.clear();
    for (const sub of task.subtasks) {
      this.subtasksArray.push(
        this.fb.group({
          id: [sub.id],
          title: [sub.title, [Validators.required]],
          completed: [sub.completed],
        })
      );
    }

    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      categoryId: task.categoryId,
      assigneeId: task.assigneeId,
      status: task.status,
      priority: task.priority,
      estimateHours: task.estimateHours,
      loggedHours: task.loggedHours,
      dueDate: task.dueDate,
      tagsInput: task.tags.join(', '),
    });
    this.taskForm.markAsPristine();
  }

  addSubtask(initialTitle = ''): void {
    this.subtasksArray.push(
      this.fb.group({
        id: [`st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`],
        title: [initialTitle, [Validators.required]],
        completed: [false],
      })
    );
    this.taskForm.markAsDirty();
  }

  removeSubtask(index: number): void {
    this.subtasksArray.removeAt(index);
    this.taskForm.markAsDirty();
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const raw = this.taskForm.getRawValue();
    const tags = (raw.tagsInput ?? '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const subtasks: Subtask[] = this.subtasksArray.controls.map((ctrl) => ({
      id: ctrl.get('id')?.value || `st-${Date.now()}`,
      title: ctrl.get('title')?.value?.trim() || 'Krok zadaniowy',
      completed: Boolean(ctrl.get('completed')?.value),
    }));

    const payload: TaskUpsertPayload = {
      title: (raw.title ?? '').trim(),
      description: (raw.description ?? '').trim(),
      categoryId: raw.categoryId ?? 'cat-arch',
      assigneeId: raw.assigneeId || null,
      reporterId: this.userStore.currentUserId(),
      status: (raw.status ?? 'todo') as TaskStatus,
      priority: (raw.priority ?? 'medium') as TaskPriority,
      tags,
      estimateHours: Number(raw.estimateHours ?? 1),
      loggedHours: Number(raw.loggedHours ?? 0),
      dueDate: raw.dueDate || null,
      subtasks,
    };

    const targetId = this.id();
    if (targetId) {
      this.tasksStore.updateTask({
        id: targetId,
        changes: payload,
        onSuccess: () => {
          this.savedSuccessfully.set(true);
          this.router.navigate(['/tasks']);
        },
      });
    } else {
      this.tasksStore.createTask({
        payload,
        onSuccess: () => {
          this.savedSuccessfully.set(true);
          this.router.navigate(['/tasks']);
        },
      });
    }
  }

  hasUnsavedChanges(): boolean {
    return this.taskForm.dirty && !this.savedSuccessfully();
  }
}
