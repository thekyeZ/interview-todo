# TaskFlow — System Zarządzania Zadaniami i Produktywnością Zespołu

Aplikacja typu **Task & Workload Manager** zbudowana w najnowszym Angularze, wspierająca planowanie sprintów, monitorowanie obciążenia zespołu oraz prowadzenie dziennika audytowego zmian.

## Stack Technologiczny

* **Frontend:** Angular (Standalone Components, Signals, nowy Control Flow `@if` / `@for`, `ChangeDetectionStrategy.OnPush`, `ReactiveFormsModule`).
* **Zarządzanie stanem:** `@ngrx/signals` (`SignalStore`) + RxJS.
* **Stylowanie:** Tailwind CSS + dedykowane komponenty UI (`src/app/shared/ui/`).
* **Backend (Mock API):** `json-server` (`v0.17.4`) z symulacją opóźnienia sieciowego (`400ms`), obsługą wyszukiwania pełnotekstowego `?q=` oraz proxy `/api` skonfigurowanym w `proxy.conf.json` (kompatybilne ze StackBlitz WebContainers oraz środowiskiem lokalnym).

## Szybki Start (Lokalnie oraz StackBlitz)

### 1. Uruchomienie aplikacji oraz serwera API jednocześnie
```bash
npm start
```
* Aplikacja Angular uruchamia się pod adresem `http://localhost:4200`
* Serwer `json-server` działa na porcie `3000`, a wszystkie zapytania z aplikacji kierowane są przez ścieżkę `/api/*` (przekierowywaną przez Angular DevServer Proxy).

### 2. Przywrócenie początkowego stanu bazy danych
Aby przywrócić plik `db.json` do stanu początkowego z pliku `db.seed.json`:
```bash
npm run db:reset
```

### 3. Budowanie produkcyjne
```bash
npm run build
```

## Główne Moduły Biznesowe

1. **Tablica Zadań (`/tasks`)** – wielokryterialne filtrowanie, wyszukiwarka zadań, lista kontrolna podzadań na karcie, operacje masowe oraz formularz tworzenia/edycji zadań (`/tasks/new`, `/tasks/:id/edit`).
2. **Kalendarz i Terminy (`/calendar`)** – oś czasu zadań, radar zaległości oraz kontrola dziennego obciążenia godzinowego względem limitu wybranego użytkownika.
3. **Statystyki Produktywności (`/analytics`)** – karty KPI, bilans godzin estymowanych vs zaraportowanych, rozkład kategorii oraz mapa obciążenia członków zespołu.
4. **Historia Zmian (`/activity-log`)** – dziennik audytowy wszystkich operacji z filtrowaniem oraz automatycznym odświeżaniem wpisów.
