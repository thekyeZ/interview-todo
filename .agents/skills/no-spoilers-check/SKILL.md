---
name: no-spoilers-check
description: >-
  Przeprowadza audyt bezpieczeństwa rekrutacyjnego (Zero Spoilers) przed
  rozmową z kandydatem. Użyj tego skila, gdy użytkownik chce sprawdzić, czy w
  kodzie, nazwach zmiennych lub historii Git nie zostały podpowiedzi zdradzające
  lokalizację celowych błędów.
---

# Audyt „Zero Spoilerów” Przed Rozmową Rekrutacyjną

Ten skill służy do weryfikacji, czy repozytorium jest gotowe do udostępnienia kandydatowi i nie zawiera żadnych nieumyślnych wskazówek ułatwiających znalezienie zaszytych błędów.

## Lista Kontrolna Audytu (Krok po Kroku)

### Krok 1: Skanowanie Komentarzy w `src/`
Przeszukaj katalog `src/` pod kątem podejrzanych słów kluczowych w komentarzach (`//` oraz `/* */`, `<!-- -->`):
* Słowa kluczowe: `TODO`, `FIXME`, `BUG`, `HACK`, `LEAK`, `ANTIPATTERN`, `TRAP`, `INTERVIEW`, `CANDIDATE`, `BŁĄD`, `PUŁAPKA`, `WYCIEK`, `NAPRAW`.
* Każdy znaleziony komentarz tego typu należy usunąć lub zastąpić neutralnym komentarzem biznesowym.

### Krok 2: Weryfikacja Nazewnictwa Symboli
Sprawdź nazwy klas, metod, pól, sygnałów i zmiennych w zmodyfikowanych plikach:
* **Niedozwolone nazwy:** `leakySubscription`, `brokenEffect`, `slowCalculation()`, `badSignal`, `wrongOperator`, `unsafeData`.
* **Wymagane nazwy:** Neutralne, domenowe (np. `taskSyncSub`, `syncFilterState`, `computeBoardSummary()`, `activeTaskState`).

### Krok 3: Weryfikacja Logów Konsoli (`console.log` / `console.warn`)
Sprawdź wywołania `console.*` w `src/`:
* Usuń logi debugujące pozostawione podczas tworzenia pułapek, chyba że są one celowym elementem zadania (np. pokazują w konsoli wielokrotne wywołanie efektu – wtedy treść logu musi brzmieć jak produkcyjny logger, np. `[BoardSync] State synchronized`).

### Krok 4: Izolacja Katalogu `.interviewer/`
Sprawdź, czy w repozytorium znajduje się katalog `.interviewer/` (lub pliki ze ściągą dla rekrutera):
* Ostrzeż użytkownika, jeśli pliki z kluczem odpowiedzi znajdują się w drzewie roboczym, które będzie widoczne w IDE kandydata podczas rozmowy (zaproponuj przeniesienie ich poza repozytorium na czas rozmowy lub na osobny, nieudostępniany branch).

### Krok 5: Kontrola Historii Git (`git log`)
Sprawdź ostatnie commity na aktualnej gałęzi:
* Jeśli w `git log` widnieją commity typu `"Inject memory leak in task list"` lub `"Add OnPush bug"`, przypomnij użytkownikowi o spłaszczeniu historii (`git commit --amend` / `squash` z neutralnym opisem np. `"Initial project setup"`), aby kandydat nie odkrył wszystkich błędów komendą `git show` lub wtyczką GitLens w IDE!

## Format Raportu Końcowego
Zwróć zwięzłą tabelę ze statusem każdego z 5 kroków (`PASS` / `WARN` / `FAIL`) oraz listą miejsc wymagających oczyszczenia.
