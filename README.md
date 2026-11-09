# Interview Todo (TaskFlow) — Angular Recruitment Platform

Aplikacja typu **Rozbudowany Todo & Productivity Manager** zbudowana w najnowszym Angularze (`v19`), służąca do przeprowadzania technicznych rozmów rekrutacyjnych (Live Coding, Code Review, Debugging, Architecture Discussion).

## Stack Technologiczny

* **Frontend:** Angular 19 (Standalone Components, Signals, `computed()`, `effect()`, `input()`, `output()`, nowy Control Flow `@if` / `@for`, `ChangeDetectionStrategy.OnPush`, `withComponentInputBinding()`).
* **Zarządzanie stanem:** `@ngrx/signals` (`SignalStore` z `withState`, `withComputed`, `withMethods`, `rxMethod`, `patchState`) + `@ngrx/operators` (`tapResponse`).
* **Asynchroniczność i formularze:** RxJS (`switchMap`, `debounceTime`, `distinctUntilChanged`, `forkJoin`, `retry`, `catchError`, `takeUntilDestroyed`) + `ReactiveFormsModule` (`FormArray`, walidatory synchroniczne i asynchroniczne).
* **Stylowanie:** Tailwind CSS + własne komponenty UI (`shared/ui/`).
* **Mock Backend:** `json-server` (`v0.17.4`) z symulacją opóźnienia sieciowego (`400ms`), obsługą pełnotekstowego wyszukiwania `?q=` oraz dedykowanym middlewarem (`server/middleware.cjs`).

## Szybki Start

### 1. Uruchomienie aplikacji oraz Mock API jednocześnie
```bash
npm start
```
* Aplikacja Angular uruchomi się pod adresem: `http://localhost:4200`
* Serwer `json-server` uruchomi się pod adresem: `http://localhost:3000` (z opóźnieniem `400ms`)

### 2. Reset bazy danych po rozmowie z kandydatem
Aby przywrócić plik `db.json` do czystego stanu początkowego z pliku `db.seed.json`:
```bash
npm run db:reset
```

### 3. Budowanie produkcyjne
```bash
npm run build
```

## Główne Moduły Biznesowe

1. **Tablica Zadań (`/tasks`)** – wielokryterialne filtrowanie, wyszukiwarka live (`rxMethod`), odhaczanie podzadań na karcie, operacje masowe (`forkJoin`) oraz edytor zadań (`/tasks/new`, `/tasks/:id/edit`) z `FormArray`, walidatorem asynchronicznym i ochroną `canDeactivate`.
2. **Kalendarz i Terminy (`/calendar`)** – oś czasu zadań, radar zaległości oraz kontrola dziennego obciążenia godzinowego względem limitu użytkownika (`dailyCapacityHours`).
3. **Statystyki Produktywności (`/analytics`)** – karty KPI, bilans godzin estymowanych vs zaraportowanych, rozkład kategorii oraz mapa obciążenia członków zespołu.
4. **Historia Zmian (`/activity-log`)** – dziennik audytowy wszystkich operacji z filtrowaniem oraz opcjonalnym auto-odświeżaniem (`interval` + `takeUntilDestroyed`).
