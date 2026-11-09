---
name: scenario-reset
description: >-
  Zarządza wariantami scenariuszy rekrutacyjnych (gałęziami Git), przełącza
  poziomy trudności zadań oraz resetuje stan repozytorium i bazy db.json po
  zakończonej rozmowie z kandydatem.
---

# Zarządzanie Scenariuszami i Reset Środowiska

Ten skill definiuje procedury utrzymania porządku w repozytorium pomiędzy kolejnymi rozmowami rekrutacyjnymi oraz zarządzania wariantami zadań.

## Rekomendowana Konwencja Gałęzi (Branches)

1. **`main` (lub `clean-base`)** – Czysta, w pełni działająca i poprawnie napisana aplikacja referencyjna (utrzymywana przez agenta `angular-architect`) oraz wzorcowy plik `db.seed.json`.
2. **`scenario/junior-basics`** – Wariant z prostszymi błędami (szablony HTML, `@for track`, brakujące typy, podstawowe błędy HTTP i kompilacji).
3. **`scenario/mid-reactive`** – Wariant skupiony na RxJS, wyciekach pamięci, `switchMap` vs `mergeMap`, funkcji w szablonach i podstawach Signals.
4. **`scenario/senior-architecture`** – Wariant ze złożonymi błędami w Signals + `OnPush`, mutacją stanu, błędnym użyciem `effect()`, pułapkami w `catchError` oraz problemami architektonicznymi DI.

## Procedury Operacyjne

### Procedura A: Reset Po Rozmowie z Kandydatem
Gdy użytkownik prosi o zresetowanie środowiska po spotkaniu:
1. Sprawdź status repozytorium (`git status`).
2. Jeśli użytkownik nie chce zachować zmian kandydata do późniejszej analizy, wycofaj modyfikacje w kodzie oraz przywróć początkowy stan pliku `db.json` (z pliku bazowego `db.seed.json` lub `git checkout -- db.json`), ponieważ w trakcie rozmowy kandydat mógł usunąć lub zmodyfikować rekordy przez `json-server`.
3. Jeśli użytkownik chce zachować pracę kandydata, utwórz tymczasowy branch archiwalny (np. `archive/candidate-YYYY-MM-DD`) i przywróć główny branch scenariusza do stanu wyjściowego.

### Procedura B: Tworzenie Nowego Scenariusza z Czystej Bazy
1. Utwórz nową gałąź na bazie czystej wersji aplikacji (`clean-base` / `main`).
2. Wywołaj proces wstrzykiwania wybranych błędów (we współpracy ze skilem `inject-angular-trap` oraz agentem `chaos-saboteur`).
3. Wygeneruj arkusz oceny (`interview-sheet-generator`).
4. Uruchom audyt `no-spoilers-check` i spłaszcz historię commitów na gałęzi scenariusza, aby `git log` nie zdradzał kandydatowi, które pliki zostały celowo popsute.
