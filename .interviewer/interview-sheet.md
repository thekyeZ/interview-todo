# Arkusz Oceny Kandydata i Scenariusz Rozmowy (`interview-sheet.md`)

## 1. Metryczka Scenariusza
* **Nazwa scenariusza (gałąź):** `scenario/mid-senior-reactive-arch`
* **Poziom docelowy:** Mid / Senior Angular Developer
* **Szacowany czas części praktycznej:** 45–60 minut
* **Główne sprawdzane kompetencje:**
  * **RxJS & `@ngrx/signals` (`rxMethod`):** Operatory spłaszczające (`switchMap` vs `mergeMap` vs `concatMap`), odporność strumieni na błędy (`catchError` / `tapResponse`), zarządzanie cyklem życia subskrypcji (`takeUntilDestroyed`, `toObservable`).
  * **Angular Signals & Immutability:** Referencyjne porównywanie stanu (`Object.is`), unikanie mutacji in-place, stan pochodny `computed()` vs antypattern `effect()` + `signal.set()`, dynamiczne śledzenie zależności w `computed()`.
  * **Dependency Injection:** Hierarchia injektorów (`providedIn: 'root'` vs lokalne `providers` w `@Component`).
  * **Wydajność Szablonów i `OnPush`:** Mechanizm śledzenia elementów `@for (...; track ...)`, memoizacja obliczeń przez `computed()` zamiast metod w szablonie HTML.

---

## 2. Wprowadzenie dla Kandydata (Prompt Startowy)

> *„Pracujemy nad aplikacją **TaskFlow** do zarządzania zadaniami sprintu, obciążeniem zespołu i dziennikiem audytowym. Backend to lokalny `json-server` z realistycznym opóźnieniem sieciowym (400ms).*
> *Zespół QA zgłosił przed wdrożeniem kilka problemów:*
> 1. *Na **Tablicy Zadań** wyszukiwarka potrafi zwracać nieaktualne wyniki przy szybkim pisaniu, a przy szybkim odhaczaniu kilku podzadań (subtasks) na karcie zadania część kliknięć nie zapisuje się na serwerze.*
> 2. *W widoku **Kalendarza** przyciski szybkiego przeplanowania zaległych zadań (`Na dziś` / `Jutro`) pokazują powiadomienie o sukcesie, ale nie przenoszą zadania do odpowiedniej kolumny, a przełączenie aktywnego użytkownika w górnym pasku nie zmienia limitu godzin w Kalendarzu.*
> 3. *Po odwiedzeniu **Historii Zmian (Activity Log)** i przełączeniu automatycznego odświeżania aplikacja zaczyna wysyłać coraz więcej zapytań w tle, nawet po wyjściu z tego widoku. Chcielibyśmy też zrobić szybki przegląd jakości kodu w **Statystykach** oraz komponencie **Karty Zadania**.*
>
> *Zróbmy wspólnie sesję debuggingu i code review — możesz korzystać z Chrome DevTools (zakładka Network/Console) i modyfikować kod na żywo.”*

---

## 3. Mapa Pułapek, Podpowiedzi (Hints) i Pytania Pogłębiające (Follow-up)

| ID | Zadanie / Pułapka | Lokalizacja (Plik i Linie) | Co obserwować u kandydata | Pytania naprowadzające (Hints) | Pytanie pogłębiające (Follow-up dla Seniora) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TRAP-01** (`RXJS-01`) | Wyszukiwarka zadań: `mergeMap`, brak `debounceTime`, zewnętrzny `catchError` zabijający `rxMethod` | `src/app/store/tasks.store.ts` (**458–478**) | Czy otwiera zakładkę Network? Czy oprócz zamiany `mergeMap` -> `switchMap` zauważa niebezpieczne położenie `catchError` na głównym strumieniu? | **H1:** Spójrz w Network podczas wpisywania frazy.<br>**H2:** Dlaczego w `searchByQuery` użyto `mergeMap`?<br>**H3:** Co się stanie ze strumieniem `rxMethod`, jeśli `tasksApi.getTasks()` rzuci błąd 500? | *„Przeniosłeś `catchError` (lub użyłeś `tapResponse`) wewnątrz `switchMap`. Dlaczego błąd złapany na głównym strumieniu `pipe()` kończy działanie `rxMethod` i jak pod spodem zaimplementowany jest `rxMethod` w `@ngrx/signals`?”* |
| **TRAP-02** (`RXJS-02`) | Odhaczanie podzadań: `switchMap` anulujący zapisy `PATCH` i nadpisywanie stanu | `src/app/store/tasks.store.ts` (**579–620**) | Czy widzi anulowane (`canceled`) żądania `PATCH` w Network? Czy rozumie różnicę między operatorami dla odczytu (`GET`) i zapisu (`PATCH`)? | **H1:** Zaznacz szybko 3 podzadania i spójrz w Network.<br>**H2:** Jaki operator spłaszczający jest w `toggleSubtask` (linia 581)?<br>**H3:** Skąd brany jest stan `targetTask.subtasks` przy drugim kliknięciu? | *„Gdybyśmy zamienili `switchMap` na `mergeMap` bez optymistycznej aktualizacji `store.tasks()`, jaki błąd współbieżności byśmy wywołali? Kiedy w mutacjach wybrać `concatMap`, a kiedy `exhaustMap`?”* |
| **TRAP-03** (`SIGNALS-01`) | Przeplanowanie zadania: mutacja `target.dueDate` in-place + `patchState` z tą samą referencją tablicy | `src/app/store/tasks.store.ts` (**622–647**) | Czy analizuje dlaczego `computed()` (`overdueTasks`, `calendarBuckets`) nie przeliczyły się mimo wywołania `patchState`? | **H1:** Kliknij `Na dziś` w Kalendarzu i sprawdź metodę `rescheduleTask` (linia 622).<br>**H2:** Czy `currentTasks` przekazywane do `patchState` w linii 631 to nowa tablica, czy ta sama referencja? | *„Jak dokładnie działa domyślny komparator `equal` (`Object.is`) w Angular Signals i jak przebiega propagacja `dirty` / `check` w leniwym grafie `computed()`?”* |
| **TRAP-04** (`DI-01`) | Rozjazd kontekstu użytkownika: `providers: [UserContextStore]` w komponencie Kalendarza | `src/app/features/calendar/pages/calendar-page.component.ts` (**14**) | Jak szybko namierza przyczynę braku reakcji Kalendarza na zmianę użytkownika w `UserSwitcherComponent`? | **H1:** Przełącz użytkownika w nagłówku na Annę Nowak (limit 6h) i spójrz na limit w Kalendarzu (nadal 8h).<br>**H2:** Spójrz na dekorator `@Component` w `calendar-page.component.ts`. | *„W jakich scenariuszach architektonicznych celowo dodalibyśmy `SignalStore` do tablicy `providers` konkretnego komponentu lub ścieżki routingu (`Route.providers`), zamiast używać `providedIn: 'root'`?”* |
| **TRAP-05** (`PERF-01`) | Wydajność listy i karty zadania: `track $index` oraz metody w szablonie HTML zamiast `computed()` | `tasks-board-page.component.ts` (**60**), `task-card.component.ts` (**124–131, 188–196, 219–240**) | Czy podczas przeglądu kodu zauważa oba `track $index` oraz wielokrotne wywołania `isTaskOverdue()` i `calculateSubtasksProgress()`? | **H1:** Spójrz na pętle `@for` w `tasks-board-page` (l. 60) i `task-card` (l. 131).<br>**H2:** Ile razy podczas jednego renderu karty wywołuje się `isTaskOverdue()` i `getCompletedSubtasksCount()`? | *„Czym różni się zachowanie `track $index` od `track item.id` pod kątem stanu lokalnego komponentów dzieci i animacji DOM oraz kiedy `track $index` jest akceptowalne?”* |
| **TRAP-06** (`MEM-01` & `SIGNALS-02`) | Wyciek i duplikacja `interval(4000)` w Activity Log + `effect()` zamiast `computed()` i warunkowy odczyt w Analytics | `activity-log-page.component.ts` (**174–193**), `analytics-page.component.ts` (**247–281**) | Czy zauważa zarówno brak `takeUntilDestroyed`, jak i tworzenie nowych timerów w `toggleAutoRefresh`? Czy wyłapuje antypattern `effect()` w `AnalyticsPageComponent`? | **H1:** Przełącz kilka razy checkbox auto-odświeżania w Historii Zmian i wyjdź z widoku.<br>**H2:** Spójrz na `toggleAutoRefresh` (l. 183).<br>**H3:** W `analytics-page.component.ts` (l. 247–281) sprawdź jak wyliczane są `displayedCategories` i `capacityRiskSummary`. | *„Dlaczego używanie `effect()` do synchronizacji jednego sygnału z drugim (`displayedCategories.set(...)`) jest antypatternem w Angularze? Jak zachowuje się `computed()`, gdy odczyt sygnału następuje po zwarciu logicznym `&&`?”* |

---

## 4. Matryca Oceny Kandydata (Rubric 1–5 pkt)

| Kryterium | 1 pkt (Poniżej oczekiwań) | 3 pkt (Solidny Mid) | 5 pkt (Mocny Senior) | Ocena (1–5) | Notatki Rekrutera |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **1. Diagnostyka i Debugging** | Zgaduje na ślepo, nie zagląda do zakładki Network ani nie śledzi przepływu danych. | Sprawnie używa DevTools Network do namierzenia zduplikowanych/anulowanych żądań i szybko lokalizuje metody w Store. | Systematycznie stawia hipotezy, łączy objawy UI z mechaniką frameworka (Signals/DI/RxJS) bez konieczności podpowiedzi. | `[   / 5 ]` | |
| **2. Nowoczesny Angular (Signals & Control Flow)** | Mutuje stan, nie rozumie różnicy między `computed()` a metodą lub `effect()`, zostawia `track $index`. | Naprawia mutację przez `.map()`, zamienia metody i `effect()` na `computed()`, poprawia `track task.id`. | Rozumie podszewkę grafu zależności Signals (`Object.is`, dynamic tracking), pisze czysty, deklaratywny kod z `toObservable` / `computed`. | `[   / 5 ]` | |
| **3. Praktyczna znajomość RxJS i `@ngrx/signals`** | Myli `switchMap` z `mergeMap`, zostawia wyciek pamięci lub kładzie `catchError` na głównym strumieniu. | Dobiera właściwe operatory (`switchMap` do szukania, `concatMap` do zapisu), dodaje `debounceTime` i `takeUntilDestroyed`. | Stosuje `tapResponse`, projektuje reaktywny timer z `switchMap(() => enabled ? interval(4000) : EMPTY)` i omawia Optimistic UI. | `[   / 5 ]` | |
| **4. Jakość Kodu i Architektura (DI & Immutability)** | Nie potrafi wyjaśnić błędu z `providers: [UserContextStore]`, wprowadza chaotyczne poprawki. | Szybko usuwa lokalnego providera w Kalendarzu, zachowuje niemutowalność stanu i spójny styl kodu. | Tłumaczy architekturę hierarchii DI, dba o separację odpowiedzialności między komponentem a `SignalStore`. | `[   / 5 ]` | |
| **5. Komunikacja i Argumentacja Techniczna** | Ma trudności z wyjaśnieniem dlaczego dany kod nie działa, wprowadza zmiany metodą prób i błędów. | Jasno komunikuje swój tok myślenia podczas analizy błędów i trafnie odpowiada na pytania pomocnicze. | Prowadzi partnerską dyskusję architektoniczną, precyzyjnie omawia kompromisy (trade-offs) i zachowania brzegowe. | `[   / 5 ]` | |
| **SUMA PUNKTÓW** | **Próg Mid:** min. 14 / 25 pkt | **Próg Senior:** min. 21 / 25 pkt | | **`[   / 25 ]`** | **Rekomendacja:** `Mid / Senior / No-hire` |
