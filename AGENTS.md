# Reguły Projektu: Interview Todo (Angular Recruitment Platform)

To repozytorium zawiera **aplikację rekrutacyjną** służącą do przeprowadzania rozmów technicznych (Live Coding, Code Review, Debugging, Architecture Discussion) z kandydatami na stanowiska Angular Developer (Junior / Mid / Senior).

## 1. Najważniejsza Zasada: Ochrona Celowych Błędów (Do Not Auto-Fix!)

> **UWAGA:** W kodzie tej aplikacji znajdują się (lub będą znajdować się) **celowo wprowadzone antypatterny, wycieki pamięci, błędy logiczne, problemy wydajnościowe oraz błędy kompilacji**.

1. **Zakaz samoczynnego naprawiania:** Podczas edycji plików, dodawania nowych funkcji lub refaktoryzacji **NIGDY nie naprawiaj** zauważonych „przy okazji” błędów, wycieków subskrypcji RxJS, mutacji sygnałów, brakujących typów (`any`) czy nieoptymalnych wyrażeń w szablonach HTML, chyba że użytkownik wyraźnie o to poprosi.
2. **Zakaz dodawania komentarzy-spoilerów:** W kodzie źródłowym aplikacji (`src/`) **NIGDY nie umieszczaj komentarzy** zdradzających, że dany fragment kodu jest błędem lub zadaniem rekrutacyjnym (np. zakaz `// TODO: candidate should fix this`, `// BUG: memory leak`, `// ANTIPATTERN`).
3. **Naturalne nazewnictwo:** Wszystkie klasy, metody, zmienne i właściwości muszą nosić naturalne, biznesowe nazwy (np. `loadUserTasks()`, `taskFilter$`, `syncBoardState()`), a nie nazwy sugerujące pułapkę (np. `leakySubscription`, `badSignalUpdate`, `brokenMethod`).
4. **Izolacja ściągi rekrutera:** Wszelkie dokumenty zawierające klucz odpowiedzi, listę zaszytych błędów, kryteria oceny oraz pytania rekrutacyjne muszą być przechowywane poza głównym kodem źródłowym `src/` (np. w dedykowanym katalogu `.interviewer/` ignorowanym lub usuwanym przed udostępnieniem kodu kandydatowi).

## 2. Stack Technologiczny

* **Framework:** Najnowszy Angular (Standalone Components, Signals, `computed()`, `effect()`, `input()`, `output()`, `model()`, nowy Control Flow `@if`, `@for`, `@switch`, `@defer`, `inject()`).
* **Asynchroniczność i stan:** RxJS + Angular Signals (`@angular/core/rxjs-interop`: `toSignal`, `toObservable`, `takeUntilDestroyed`).
* **Backend (Mock API):** Brak dedykowanego backendu – aplikacja komunikuje się przez `HttpClient` z lokalnym serwerem **`json-server`** (operującym na pliku `db.json` oraz opcjonalnych middleware'ach symulujących opóźnienia sieciowe i błędy HTTP).

## 3. Dostępni Agenci i Skile w Projekcie

Podczas pracy nad projektem korzystaj z wyspecjalizowanych agentów (`.agents/agents/`) oraz skili (`.agents/skills/`):

### Agenci (`.agents/agents/`)
* **`angular-architect`** – Buduje czystą, wzorcową bazę aplikacji oraz nowe moduły biznesowe przed wprowadzeniem błędów.
* **`chaos-saboteur`** – Wprowadza kontrolowane błędy, antypatterny i problemy kompilacji dopasowane do poziomu kandydata.
* **`interview-examiner`** – Audytuje kod pod kątem zaszytych pułapek i tworzy/aktualizuje Klucz Odpowiedzi dla Rekrutera.
* **`candidate-simulator`** – Przeprowadza symulację rozmowy („dry run”) z perspektywy kandydata bez dostępu do ściągi.

### Skile (`.agents/skills/`)
* **`inject-angular-trap`** – Procedura i katalog wstrzykiwania pułapek Angular/RxJS/Signals/TS.
* **`mock-backend-builder`** – Tworzenie i rozbudowa relacyjnej bazy `db.json` oraz konfiguracji `json-server`.
* **`no-spoilers-check`** – Audyt repozytorium przed rozmową sprawdzający brak podpowiedzi w kodzie i historii Git.
* **`interview-sheet-generator`** – Generowanie arkusza oceny kandydata i scenariusza rozmowy.
* **`scenario-reset`** – Zarządzanie wariantami zadań (branchami/scenariuszami) oraz resetowanie środowiska po rozmowie.
* **`angular-developer`** – Pisanie najelpszej jakości kodu Angular 
* **`angular-new-app`** – Tworzenie nowej aplikacji Angular 
