---
name: mock-backend-builder
description: >-
  Tworzy i rozbudowuje bazę danych db.json oraz konfigurację json-server dla
  aplikacji rekrutacyjnej Angular. Użyj tego skila, gdy użytkownik chce dodać
  nowe encje, wygenerować realistyczne dane testowe lub zasymulować opóźnienia
  sieciowe pod zadania z RxJS.
---

# Rozbudowa Mock Backendu (`json-server`)

Ten skill odpowiada za projektowanie i utrzymanie warstwy danych opartej o `json-server`, tak aby aplikacja Angularowa miała realistyczne środowisko do testowania komunikacji HTTP, stronicowania, filtrowania oraz wyścigów zapytań (race conditions).

## Struktura Danych (`db.json`)

Dbaj o to, aby dane w `db.json` tworzyły spójny, relacyjny model domeny zarządzania projektami i zadaniami (umożliwiający wykorzystanie relacji w `json-server` oraz łączenia strumieni w RxJS):

1. **`projects`** – Projekty (np. `id`, `name`, `code`, `ownerId`, `status`, `budget`, `updatedAt`).
2. **`tasks`** – Zadania powiązane z projektami i użytkownikami (np. `id`, `projectId`, `assigneeId`, `reporterId`, `title`, `description`, `status`, `priority`, `estimateHours`, `spentHours`, `tags`, `dueDate`, `createdAt`).
3. **`users`** – Użytkownicy / członkowie zespołu (np. `id`, `name`, `email`, `role`, `avatarUrl`, `department`, `active`).
4. **`comments`** – Komentarze do zadań (`id`, `taskId`, `authorId`, `content`, `createdAt`).
5. **`activityLogs`** – Historia zmian do widoku audytu/statystyk (`id`, `entityType`, `entityId`, `userId`, `action`, `timestamp`).

## Procedura Rozbudowy Danych

1. **Zachowaj realizm:** Generuj dane po polsku lub angielsku (zgodnie z konwencją projektu), używając realistycznych nazw zadań deweloperskich/biznesowych.
2. **Dane brzegowe (Edge Cases pod rozmowę rekrutacyjną):**
   * Zawsze umieszczaj w `db.json` kilka rekordów testujących warunki brzegowe:
     * Zadanie bez przypisanego użytkownika (`assigneeId: null`).
     * Zadanie z bardzo długim tytułem i opisem (testowanie UI / CSS overflow).
     * Zadanie z przeszłą datą `dueDate` (przeterminowane).
     * Projekt z bardzo dużą liczbą zadań (do testowania problemów wydajnościowych w szablonach Angulara).
     * Niespójność typów danych, jeśli wymaga tego scenariusz (np. jedno ID lub pole liczbowe zapisane jako string).
3. **Symulacja warunków sieciowych:**
   * Przy konfigurowaniu skryptów uruchomieniowych w `package.json` przygotuj warianty uruchomienia `json-server`:
     * Standardowy (szybki).
     * Z opóźnieniem sieciowym (np. flaga `--delay 600` w `json-server` v0.17 lub odpowiedni middleware), który pozwala kandydatowi zauważyć migotanie UI, brak loaderów oraz błędy `mergeMap` vs `switchMap`.
