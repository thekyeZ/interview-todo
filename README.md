# Todo. — Minimalist Angular Application

Minimalistyczna aplikacja typu **Todo** zbudowana w **Angularze v22** z lokalnym serwerem mock API (`json-server`).

## Stack Technologiczny

* **Frontend:** Angular 22 (Zoneless, Standalone Components, `ChangeDetectionStrategy.OnPush`, Signals, `computed()`, `input()`, `output()`, nowy Control Flow `@if` / `@for`, Signal Forms `@angular/forms/signals`, `@Service()`, `inject()`).
* **Asynchroniczność i HTTP:** RxJS + `HttpClient` z funkcjonalnymi interceptorami (`authHeaderInterceptor`, `httpErrorInterceptor`) i proxy `/api` → `http://localhost:3000`.
* **Stylowanie i interakcje:** Tailwind CSS v4 + `@angular/cdk/drag-drop`.
* **Testy:** Vitest (`@angular/build:unit-test`) z `jsdom`.
* **Mock Backend:** `json-server` (`v0.17.4`) na pliku `db.json` (port `3000`, opóźnienie sieciowe `400ms`, pełnotekstowe wyszukiwanie `?q=`).

## Szybki Start

### 1. Instalacja zależności
```bash
npm install
```

### 2. Uruchomienie aplikacji oraz Mock API jednocześnie
```bash
npm start
```
* Aplikacja Angular: `http://localhost:4200` (zapytania `/api/*` przekierowywane są przez `proxy.conf.json` do `json-server`)
* Mock API (`json-server`): `http://localhost:3000`

### 3. Reset bazy danych
Przywrócenie pliku `db.json` do stanu początkowego z `db.seed.json`:
```bash
npm run db:reset
```

### 4. Budowanie i testy
```bash
npm run build
npm test
```

## Zakres Funkcjonalny

1. **Ekran powitalny (`/login`)** — szybkie wejście do workspace'u (*Standard* lub *Demo Access*) bez konieczności podawania hasła.
2. **Lista zadań (`/tasks`)** — dodawanie zadań (`Enter` / `Add`), przełączanie statusu ukończenia, filtrowanie (*All / Active / Completed*) z licznikami, wyszukiwarka inline przez API (`?q=`), zmiana kolejności metodą drag & drop, usuwanie pojedynczych zadań, masowe czyszczenie ukończonych (*Clear completed*) oraz baner cofania (*Undo*).
