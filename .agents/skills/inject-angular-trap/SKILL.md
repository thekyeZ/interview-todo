---
name: inject-angular-trap
description: >-
  Wstrzykuje kontrolowane błędy, antypatterny Angular/RxJS/Signals, problemy
  wydajnościowe oraz błędy kompilacji do kodu aplikacji rekrutacyjnej. Użyj
  tego skila, gdy użytkownik prosi o dodanie pułapki rekrutacyjnej, zepsucie
  komponentu lub przygotowanie zadania dla kandydata.
---

# Wstrzykiwanie Pułapki Rekrutacyjnej (Angular)

Ten skill prowadzi przez proces celowego i kontrolowanego wprowadzania błędów oraz antypatternów do kodu aplikacji Angularowej na potrzeby rozmów technicznych.

## Zasady Bezwzględne

1. **Zero Spoilerów w Kodzie:** Nigdy nie dodawaj komentarzy wskazujących na błąd (`// TODO`, `// BUG`, `// fix this`) ani sugestywnych nazw zmiennych (`leakySub`, `badMethod`).
2. **Realizm Biznesowy:** Kod zawierający antypattern musi wyglądać jak realistyczny dług techniczny powstały w codziennej pracy (np. podczas szybkiego dowożenia feature'a).
3. **Kontrola Zasięgu:** Jeśli użytkownik nie poprosił o **błąd kompilacji**, wprowadzony antypattern musi się poprawnie kompilować (`ng build` / `ng serve`), a problem powinien objawiać się w runtime, wydajności lub architekturze.

## Procedura Krok po Kroku

### Krok 1: Dobór Pułapki z Katalogu
Przeczytaj katalog wzorców w pliku [angular-antipatterns.md](./references/angular-antipatterns.md) i wybierz antypattern pasujący do:
* **Poziomu kandydata:** Junior / Mid / Senior.
* **Obszaru tematycznego:** Signals, RxJS, Change Detection (`OnPush`), Komunikacja HTTP (`json-server`), Architektura / DI, TypeScript / Błędy kompilacji, Szablony HTML.

### Krok 2: Analiza Docelowego Komponentu / Serwisu
1. Odczytaj docelowy plik w `src/app/`.
2. Zidentyfikuj naturalne miejsce biznesowe, w którym dany antypattern ma sens (np. wyszukiwarka zadań, aktualizacja statusu zadania na tablicy, licznik statystyk projektu, formularz edycji).

### Krok 3: Wstrzyknięcie Antypatternu
1. Zmodyfikuj kod w `src/app/` zgodnie z wybranym wzorcem.
2. Upewnij się, że formatowanie kodu i styl nazewnictwa są spójne z resztą pliku.

### Krok 4: Zapis w Kluczu Odpowiedzi (`.interviewer/answer-key.md`)
Zaktualizuj (lub utwórz) plik `.interviewer/answer-key.md`, dopisując nową pozycję według szablonu:

```markdown
### [ID-PUŁAPKI] Krótki tytuł błędu (Poziom: Junior/Mid/Senior)
- **Plik i lokalizacja:** `src/app/...` (metoda / linia)
- **Kategoria:** RxJS / Signals / Change Detection / Architektura / Kompilacja
- **Mechanizm błędu:** Dlaczego ten kod działa źle lub jest antypatternem?
- **Objaw w aplikacji:** Jak kandydat może to zauważyć w UI, DevTools lub konsoli?
- **Oczekiwane rozwiązanie:** Jak wygląda prawidłowy refaktoring?
```
