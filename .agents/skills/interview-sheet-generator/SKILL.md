---
name: interview-sheet-generator
description: >-
  Generuje ustrukturyzowany arkusz oceny kandydata oraz scenariusz rozmowy
  rekrutacyjnej na podstawie błędów zaszytych w aplikacji. Użyj tego skila, gdy
  użytkownik przygotowuje się do rozmowy i potrzebuje ściągi rekrutera.
---

# Generator Arkusza Oceny i Scenariusza Rozmowy

Ten skill tworzy przejrzysty dokument dla osoby prowadzącej rozmowę techniczną (zapisywany domyślnie w `.interviewer/interview-sheet.md` lub jako artefakt).

## Struktura Generowanego Arkusza

### 1. Metryczka Scenariusza
* **Poziom docelowy:** Junior / Mid / Senior.
* **Szacowany czas części praktycznej:** np. 45 minut.
* **Główne sprawdzane kompetencje:** (np. Angular Signals, RxJS Race Conditions, Change Detection `OnPush`, Architektura serwisów).

### 2.Wprowadzenie dla Kandydata (Prompt Startowy)
Krótki, naturalny opis zadania, który rekruter może przeczytać lub wkleić kandydatowi na początku spotkania.
> *Przykład:* „Użytkownicy zgłaszają, że podczas korzystania z widoku tablicy zadań aplikacja z czasem działa coraz wolniej, a filtrowanie po nazwie czasami pokazuje nieaktualne wyniki. Dodatkowo chcielibyśmy dodać licznik zadań pilnych, ale obecny kod wydaje się nie odświeżać poprawnie widoku. Zróbmy wspólnie przegląd tego modułu i naprawmy znalezione problemy.”

### 3. Mapa Pułapek i Punktacja (Klucz dla Rekrutera)
Tabela lub lista wszystkich błędów w danym scenariuszu:
* **Lokalizacja:** Dokładny plik i linia.
* **Co obserwować u kandydata:** Czy potrafi użyć Angular DevTools / zakładki Network / analizy kodu statycznego?
* **Pytania naprowadzające (Hints):** Co zapytać, jeśli kandydat nie widzi problemu przez 5 minut?
* **Pytania pogłębiające (Follow-up dla Seniora):** Np. *„Naprawiłeś to używając `switchMap`. A co by się stało, gdyby to nie było wyszukiwanie, tylko zapisywanie zmian w zadaniu?”*.

### 4. Matryca Oceny (Rubric)
Podział na kryteria (1–5 pkt):
1. **Diagnostyka i Debugging** (jak szybko i metodycznie namierza źródło błędu).
2. **Znajomość Nowoczesnego Angulara** (Signals, `computed`, `OnPush`, nowy Control Flow, `inject`).
3. **Praktyczna znajomość RxJS** (operatory spłaszczające, cykl życia subskrypcji, obsługa błędów).
4. **Jakość Kodu i Architektura** (TypeScript, niemutowalność, separacja odpowiedzialności).
5. **Komunikacja** (jak tłumaczy swój tok myślenia).
