# Klucz Odpowiedzi dla Rekrutera (`answer-key.md`)
**Scenariusz:** `scenario/mid-senior-reactive-arch`  
**Poziom docelowy:** Mid / Senior Angular Developer  
**Stack:** Angular (Standalone, Signals, `@ngrx/signals`, RxJS, OnPush) + `json-server` (opóźnienie 400ms)

---

## [RXJS-01] (TRAP-01) Race Condition, brak Throttlingu/Debouncingu i „Śmierć Strumienia” w wyszukiwarce zadań

* **Poziom docelowy:** Mid / Senior
* **Dokładna lokalizacja:**
  * Plik: `src/app/store/tasks.store.ts`
  * Struktura: `TasksStore` (`withMethods`) → metoda `searchByQuery: rxMethod<string>(...)`
  * Zakres linii: **458–478**
    * Linie **460–464**: natychmiastowy `tap` aktualizujący `filter.query` bez `debounceTime` / `distinctUntilChanged`.
    * Linie **465–469**: użycie operatora `mergeMap((query) => tasksApi.getTasks(query)...)` zamiast `switchMap`.
    * Linie **470–476**: umieszczenie `catchError` na głównym strumieniu `pipe()` metody `rxMethod` zamiast wewnątrz strumienia HTTP.
* **Objaw w aplikacji (Symptom):**
  1. Wpisanie frazy (np. `"architektura"`) w pasku wyszukiwania wysyła osobne żądanie HTTP `GET /tasks?q=...` dla każdego wciśniętego klawisza (widoczne w zakładce Network).
  2. Przez zastosowanie `mergeMap`, wcześniejsze zapytania nie są anulowane — przy zmiennym czasie odpowiedzi wyniki na tablicy zadań potrafią mrugać i nadpisać się nieaktualną listą (Race Condition).
  3. Jeśli którekolwiek zapytanie zwróci błąd HTTP (np. chwilowy błąd 500 lub wpisanie frazy przy wyłączonym `json-server` / symulacji błędu `?simulateError=true`), `catchError` na głównym strumieniu zwraca `of([])` i **zamyka (completes) cały strumień `rxMethod`**. Od tego momentu wyszukiwarka przestaje reagować na wpisywanie tekstu aż do przeładowania strony (F5).
* **Jak naprowadzić kandydata (Hints):**
  * *Hint 1 (Obserwacja):* „Otwórz zakładkę Network w DevTools i wpisz szybko słowo `stabilność` w wyszukiwarce zadań. Co widzisz w liczbie i kolejności żądań?”
  * *Hint 2 (Architektura RxJS):* „Spójrz na metodę `searchByQuery` w `tasks.store.ts` (linia 458). Jaki operator spłaszczający jest tam użyty i co się stanie, gdy starsze żądanie odpowie później niż nowsze?”
  * *Hint 3 (Obsługa błędów - Senior):* „Co się stanie z `rxMethod`, jeśli jedno z zapytań `tasksApi.getTasks(query)` rzuci błąd HTTP? Gdzie dokładnie w łańcuchu `pipe` znajduje się `catchError`?”
* **Oczekiwane rozwiązanie (Green Flags vs Red Flags):**
  * *Rozwiązanie akceptowalne (Mid):* Zamiana `mergeMap` na `switchMap`, dodanie `debounceTime(300)` i `distinctUntilChanged()`, oraz przeniesienie `catchError` do wewnętrznego `pipe()` wywołania `tasksApi.getTasks(query)`.
  * *Rozwiązanie wzorcowe (Senior):* Użycie `debounceTime(300)`, `distinctUntilChanged()`, `switchMap((query) => tasksApi.getTasks(query).pipe(tapResponse({ next: ..., error: ... })))` z `@ngrx/operators` (spójnie z resztą `TasksStore`), rozdzielenie natychmiastowej aktualizacji UI inputa od opóźnionego odpytywania API oraz wyjaśnienie różnicy między zamknięciem strumienia wewnętrznego a zewnętrznego `Subject` w `rxMethod`.
  * *Red Flags:* Pozostawienie `catchError` na głównym `pipe()` (co zabija strumień po pierwszym błędzie); użycie `concatMap` lub `exhaustMap` do wyszukiwarki tekstowej; ręczne subskrybowanie `tasksApi.getTasks()` wewnątrz `tap()`.

```typescript
// Wzorcowa naprawa TRAP-01:
searchByQuery: rxMethod<string>(
  pipe(
    tap((query) =>
      patchState(store, (state) => ({
        filter: { ...state.filter, query },
      }))
    ),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((query) =>
      tasksApi.getTasks(query).pipe(
        tapResponse({
          next: (tasks) => patchState(store, { tasks }),
          error: () => {
            toastService.error(
              'Błąd wyszukiwania',
              'Nie udało się odświeżyć wyników wyszukiwania z serwera.'
            );
          },
        })
      )
    )
  )
),
```

---

## [RXJS-02] (TRAP-02) Anulowanie trwających mutacji (`switchMap` zamiast `concatMap`) przy odhaczaniu podzadań

* **Poziom docelowy:** Mid / Senior
* **Dokładna lokalizacja:**
  * Plik: `src/app/store/tasks.store.ts`
  * Struktura: `TasksStore` (`withMethods`) → metoda `toggleSubtask: rxMethod<{ taskId: string; subtaskId: string }>(...)`
  * Zakres linii: **579–620** (w szczególności `switchMap` w linii **581**, odczyt `store.tasks()` w linii **582** oraz `patchState` dopiero w `next:` w liniach **598–602**).
* **Objaw w aplikacji (Symptom):**
  * Gdy użytkownik na karcie zadania szybko kliknie 2 lub 3 checkboxy podzadań pod rząd (w odstępie mniejszym niż 400ms opóźnienia `json-server`), w zakładce Network pierwsze żądania `PATCH /tasks/:id` mają status `(canceled)`.
  * Ponieważ stan w `store.tasks()` jest aktualizowany dopiero po odpowiedzi serwera (w `next`), drugie kliknięcie odczytuje z `store.tasks()` stary stan sprzed pierwszego kliknięcia i wysyła do API tablicę `subtasks` uwzględniającą wyłącznie ostatnie kliknięcie. Po odświeżeniu widoku wcześniejsze kliknięcia zostają utracone.
* **Jak naprowadzić kandydata (Hints):**
  * *Hint 1 (Reprodukcja):* „Spróbuj na karcie zadania #t-101 szybko zaznaczyć wszystkie trzy podzadania jedno po drugim. Co dzieje się z checkboxami po chwili i co widać w zakładce Network?”
  * *Hint 2 (Analiza operatora):* „Zajrzyj do `toggleSubtask` w `tasks.store.ts` (linia 579). Dlaczego pierwsze żądanie `PATCH` zostało anulowane przez przeglądarkę?”
  * *Hint 3 (Spójność stanu):* „Nawet jeśli zamienisz `switchMap` na inny operator, skąd `toggleSubtask` bierze aktualną listę `targetTask.subtasks` przy drugim kliknięciu? Czy lepiej zastosować Optimistic UI update przed wysłaniem żądania, czy kolejkować operacje?”
* **Oczekiwane rozwiązanie (Green Flags vs Red Flags):**
  * *Rozwiązanie akceptowalne (Mid):* Zamiana `switchMap` na `concatMap` (aby żądania `PATCH` wykonywały się sekwencyjnie jedno po drugim, dzięki czemu każde kolejne wywołanie w `concatMap` odczyta zaktualizowany `store.tasks()` po zakończeniu poprzedniego) LUB zastosowanie aktualizacji optymistycznej przed wywołaniem API.
  * *Rozwiązanie wzorcowe (Senior):* Połączenie **Optimistic UI Update** (natychmiastowy `patchState` przełączający `sub.completed` w nowym obiekcie zadania + rollback w `error`) z `concatMap` (gwarancja zachowania kolejności zapisów `PATCH` na backendzie dla tego samego zasobu).
  * *Red Flags:* Zamiana `switchMap` na `mergeMap` **bez** optymistycznej aktualizacji stanu w `store` (wtedy oba równoległe żądania w `mergeMap` odczytają ten sam początkowy stan `store.tasks()` i drugie nadpisze pierwsze na serwerze — klasyczny Lost Update!); użycie `exhaustMap` (ignorowanie kolejnych kliknięć użytkownika).

---

## [SIGNALS-01] (TRAP-03) Mutacja obiektu in-place wewnątrz sygnału i `patchState` z tą samą referencją tablicy

* **Poziom docelowy:** Mid / Senior
* **Dokładna lokalizacja:**
  * Plik: `src/app/store/tasks.store.ts`
  * Struktura: `TasksStore` (`withMethods`) → metoda `rescheduleTask(taskId: string, newDueDate: string | null): void`
  * Zakres linii: **622–647**
    * Linia **623**: `const currentTasks = store.tasks();`
    * Linie **628–629**: `target.dueDate = newDueDate; target.updatedAt = new Date().toISOString();` (bezpośrednia mutacja właściwości obiektu).
    * Linia **631**: `patchState(store, { tasks: currentTasks });` (przekazanie tej samej referencji tablicy).
    * Linie **633–646**: imperatywne `tasksApi.updateTask(...).subscribe(...)` bez `rxMethod`, bez aktualizacji stanu odpowiedzią z serwera i bez obsługi błędu (`error`).
* **Objaw w aplikacji (Symptom):**
  * W widoku **Kalendarz i Terminy** (`/calendar`) kliknięcie przycisku `Na dziś` lub `Jutro` na karcie w sekcji „Radar zaległości” (lub w kolumnie dnia) wyświetla zielony toast „Zmieniono termin”, ale:
    1. Zadanie **nie znika** z „Radaru zaległości” i **nie przenosi się** do kolumny „Dzisiaj” / „Jutro”.
    2. Licznik zaległych zadań w górnym pasku nawigacji (`AppShellComponent`) nie maleje.
  * Dopiero twarde odświeżenie strony (F5) lub przejście do innego widoku wywołujące nowe pobranie danych pokazuje zadanie we właściwej kolumnie.
* **Jak naprowadzić kandydata (Hints):**
  * *Hint 1 (Obserwacja w UI):* „Przejdź do zakładki Kalendarz i Terminy i kliknij przycisk `Na dziś` przy którymś z zaległych zadań. Toast mówi, że zmieniono termin, ale czy zadanie zmieniło kolumnę?”
  * *Hint 2 (Mechanizm Signals):* „Spójrz na metodę `rescheduleTask` w `tasks.store.ts` (linia 622). W jaki sposób Angular Signals i `computed()` (`overdueTasks`, `calendarBuckets`) sprawdzają, czy wartość sygnału `store.tasks()` uległa zmianie?”
  * *Hint 3 (Refaktoryzacja):* „Jak powinna wyglądać ta metoda, aby zachować niemutowalność stanu i spójność z pozostałymi metodami `rxMethod` w `TasksStore`?”
* **Oczekiwane rozwiązanie (Green Flags vs Red Flags):**
  * *Rozwiązanie akceptowalne (Mid):* Usunięcie mutacji `target.dueDate = ...` i utworzenie nowej referencji tablicy oraz obiektu za pomocą `.map()`:
    `patchState(store, (state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? { ...t, dueDate: newDueDate, updatedAt: new Date().toISOString() } : t) }))`.
  * *Rozwiązanie wzorcowe (Senior):* Przepisanie `rescheduleTask` na delegację do istniejącego `this.updateTask({ id: taskId, changes: { dueDate: newDueDate }, logAction: 'RESCHEDULED', ... })` (lub `rxMethod`), niemutowalna aktualizacja tablicy `tasks` w `patchState` wraz z obsługą błędów (`tapResponse`) oraz wyjaśnienie roli `Object.is` w grafie zależności Angular Signals.
  * *Red Flags:* Próba wymuszenia odświeżenia przez `ChangeDetectorRef.detectChanges()` w komponencie kalendarza (nie zadziała, bo `computed()` w store i tak zwraca zmemoizowaną wartość dopóki referencja `store.tasks()` się nie zmieni!); użycie `JSON.parse(JSON.stringify(currentTasks))`.

---

## [DI-01] (TRAP-04) Rozsynchronizowany stan przez lokalne `providers: [UserContextStore]` w komponencie

* **Poziom docelowy:** Mid / Senior
* **Dokładna lokalizacja:**
  * Plik: `src/app/features/calendar/pages/calendar-page.component.ts`
  * Struktura: dekorator `@Component` klasy `CalendarPageComponent`
  * Zakres linii: linia **14** (`providers: [UserContextStore]`), wstrzyknięcie w linii **202** (`readonly userStore = inject(UserContextStore)`), odczyty w szablonie w liniach **25, 119, 120, 149**.
* **Objaw w aplikacji (Symptom):**
  * Gdy użytkownik przełączy aktywny profil w prawym górnym rogu aplikacji (`UserSwitcherComponent` w nagłówku) np. na **Anna Nowak (Principal Architect, Limit: 6h/dzień)** lub **Maja Wiśniewska (7h/dzień)**:
    * W nagłówku widać nowy profil i limit `6h/dzień`.
    * Na Tablicy Zadań filtr „Tylko przypisane do mnie” działa dla Anny Nowak.
    * Natomiast w widoku **Kalendarz i Terminy** (`/calendar`) opis pod nagłówkiem oraz ostrzeżenia o przekroczeniu dziennego obciążenia w kolumnach nadal pokazują sztywno `8h/dzień` (domyślny profil Piotra Kowalskiego `u-2`).
* **Jak naprowadzić kandydata (Hints):**
  * *Hint 1 (Reprodukcja):* „Będąc w widoku Kalendarza, przełącz użytkownika w prawym górnym rogu na Annę Nowak (ma limit 6h/dzień). Spójrz na podtytuł widoku Kalendarza oraz kolor wskaźnika godzin w kolumnach. Dlaczego limit w Kalendarzu nadal wynosi 8h/dzień?”
  * *Hint 2 (Drzewo DI):* „Skąd `UserSwitcherComponent` i `TasksStore` biorą instancję `UserContextStore`, a skąd bierze ją `CalendarPageComponent`?”
  * *Hint 3 (Dekorator komponentu):* „Spójrz na metadane `@Component` w `calendar-page.component.ts` (linie 10–16).”
* **Oczekiwane rozwiązanie (Green Flags vs Red Flags):**
  * *Rozwiązanie akceptowalne (Mid):* Usunięcie `providers: [UserContextStore]` z dekoratora `@Component` w `calendar-page.component.ts`, aby komponent korzystał z globalnego singletona (`{ providedIn: 'root' }`).
  * *Rozwiązanie wzorcowe (Senior):* Usunięcie lokalnego providera oraz wyjaśnienie hierarchii wstrzykiwania zależności w Angularze (Root EnvironmentInjector vs NodeInjector komponentu) i wskazanie, kiedy lokalny SignalStore w `providers` jest pożądany (stan lokalny widoku niszczony wraz z komponentem), a kiedy jest błędem (współdzielony stan sesji/kontekstu użytkownika).
  * *Red Flags:* Próba przekazywania użytkownika przez `@Input()` lub parametry routingu zamiast usunięcia zbędnego `providers: [UserContextStore]`; brak zrozumienia dlaczego `providedIn: 'root'` został przesłonięty.

---

## [PERF-01] (TRAP-05) Złożoność renderowania w `TaskCardComponent`: `track $index` oraz metody w szablonie HTML zamiast `computed()`

* **Poziom docelowy:** Mid
* **Dokładna lokalizacja:**
  1. Plik: `src/app/features/tasks/pages/tasks-board-page.component.ts`
     * Linia **60**: `@for (task of tasksStore.filteredTasks(); track $index)`
  2. Plik: `src/app/features/tasks/components/task-card.component.ts`
     * Linie **124–128**: wielokrotne wywołania `calculateSubtasksProgress()` oraz `getCompletedSubtasksCount()` w bindowaniach `<app-progress-bar />`.
     * Linia **131**: `@for (sub of task().subtasks; track $index)`
     * Linie **188–196**: pięciokrotne wywołanie `isTaskOverdue()` (tworzące za każdym razem dwie instancje `new Date(...)`) w bindowaniach klas i `@if`.
     * Linie **219–240**: definicje metod `getCompletedSubtasksCount()`, `calculateSubtasksProgress()` (z niepotrzebnym kopiowaniem tablicy `[...this.task().subtasks]`) oraz `isTaskOverdue()`.
* **Objaw w aplikacji (Symptom):**
  * Podczas sortowania, filtrowania lub usuwania zadań na tablicy (`tasks-board-page`), Angular zamiast przepiąć istniejące węzły DOM kart zadań niszczy lub przebudowuje niewłaściwe komponenty z powodu `track $index` (utrata fokusu, zbędne rerendery wszystkich kart).
  * Wewnątrz każdej karty zadania (`TaskCardComponent`) przy każdym cyklu sprawdzania widoku metody `calculateSubtasksProgress()` (wołające wewnętrznie `getCompletedSubtasksCount()`) oraz `isTaskOverdue()` wykonują wielokrotne iteracje `.filter().map()` i parsowanie dat `new Date(...)`.
* **Jak naprowadzić kandydata (Hints):**
  * *Hint 1 (Code Review szablonu):* „Zróbmy Code Review plików `tasks-board-page.component.ts` oraz `task-card.component.ts` pod kątem wydajności renderowania i nowego Control Flow `@for`. Co zwraca Twoją uwagę?”
  * *Hint 2 (Tracking w `@for`):* „Co dzieje się z drzewem DOM, gdy w `@for (task of tasksStore.filteredTasks(); track $index)` zmienimy sortowanie lub usuniemy pierwsze zadanie z listy?”
  * *Hint 3 (Signals w komponencie prezentacyjnym):* „Spójrz na metody w `TaskCardComponent` (linie 219–240) i to, ile razy `isTaskOverdue()` oraz `calculateSubtasksProgress()` są wywoływane w szablonie. Jak możemy je zoptymalizować, skoro `task` i `referenceDateIso` są już sygnałami `input()`?”
* **Oczekiwane rozwiązanie (Green Flags vs Red Flags):**
  * *Rozwiązanie akceptowalne (Mid):*
    * Zamiana `track $index` na `track task.id` w `tasks-board-page.component.ts` (linia 60) oraz na `track sub.id` w `task-card.component.ts` (linia 131).
    * Zamiana metod `getCompletedSubtasksCount()`, `calculateSubtasksProgress()` i `isTaskOverdue()` na sygnały wyliczane `computed()`.
  * *Rozwiązanie wzorcowe (Senior):*
    * Zamiana obu `track $index` na unikalne identyfikatory (`task.id`, `sub.id`).
    * Zastąpienie metod czystymi sygnałami `computed()` (`completedSubtasksCount`, `subtasksProgressPercent`, `isOverdue`), uproszczenie porównywania dat ISO `YYYY-MM-DD` (porównanie leksykograficzne stringów `t.dueDate < this.referenceDateIso()` zamiast wielokrotnego tworzenia `new Date(...)`!) oraz usunięcie zbędnego `.map((s) => s.id)` i `[...this.task().subtasks]`.
  * *Red Flags:* Twierdzenie, że „skoro jest `OnPush`, to metody w szablonie wykonają się tylko raz i nie ma sensu używać `computed()`” (nawet z `OnPush` w jednym cyklu odświeżenia karty `isTaskOverdue()` wykonuje się 5 razy, a `getCompletedSubtasksCount()` 3 razy!); pozostawienie `track $index`.

---

## [MEM-01 & SIGNALS-02] (TRAP-06) Wyciek i zwielokrotnienie `interval(4000)` w Activity Log oraz antypatterny Signals w Analytics (`effect()` zamiast `computed()` i warunkowy odczyt po `&&`)

* **Poziom docelowy:** Mid / Senior
* **Dokładna lokalizacja:**
  1. **Część A (`[MEM-01]` — Activity Log Polling Leak):**
     * Plik: `src/app/features/activity-log/pages/activity-log-page.component.ts`
     * Klasa: `ActivityLogPageComponent`
     * Linie **174–181** (`ngOnInit`): `interval(4000).subscribe(...)` bez `takeUntilDestroyed` / `OnDestroy`.
     * Linie **183–193** (`toggleAutoRefresh`): każde ponowne zaznaczenie checkboxa (`if (checked)`) tworzy **kolejną, równoległą** nieskończoną subskrypcję `interval(4000).subscribe(...)`!
  2. **Część B (`[SIGNALS-02]` — Analytics Reactivity Glitches):**
     * Plik: `src/app/features/analytics/pages/analytics-page.component.ts`
     * Klasa: `AnalyticsPageComponent`
     * Linie **247** oraz **271–281**: pole `readonly displayedCategories = signal<CategoryDistributionItem[]>([]);` aktualizowane w konstruktorze przez `effect(() => { ... this.displayedCategories.set(...); })` zamiast deklaratywnego `computed()`.
     * Linie **249–269** (`capacityRiskSummary`): warunkowy odczyt sygnału `this.selectedFocusUserId()` (linia **254**) wewnątrz bloku `if (this.showCapacityDetails() && this.tasksStore.userWorkloads().some((m) => m.isOverloaded))`.
* **Objaw w aplikacji (Symptom):**
  1. Po wejściu w zakładkę **Historia Zmian** (`/activity-log`), kilkukrotnym przełączeniu checkboxa „Automatyczne odświeżanie dziennika (co 4s)” i przejściu do innej zakładki (np. Zadania lub Statystyki), w zakładce Network nadal co chwilę wysyłane są kaskady zapytań `GET /activityLogs?_sort=timestamp&_order=desc`, a globalny pasek ładowania mruga w tle bez końca.
  2. W zakładce **Statystyki Produktywności** (`/analytics`) stan `displayedCategories` jest nadmiarowo synchronizowany przez `effect()`, a w `capacityRiskSummary` odczyt sygnałów zależy od ścieżki wykonania instrukcji `if`.
* **Jak naprowadzić kandydata (Hints):**
  * *Hint 1 (Obserwacja wycieku w Network):* „Wejdź w zakładkę Historia Zmian, wyłącz i włącz 3 razy checkbox automatycznego odświeżania, a następnie wróć na Tablicę Zadań. Spójrz na pasek ładowania u góry ekranu i zakładkę Network.”
  * *Hint 2 (Cykl życia w `ActivityLogPageComponent`):* „Spójrz na `ngOnInit` oraz `toggleAutoRefresh` w `activity-log-page.component.ts` (linie 174–193). Ile subskrypcji `interval(4000)` żyje po trzykrotnym kliknięciu checkboxa i kiedy są one niszczone?”
  * *Hint 3 (Audyt `AnalyticsPageComponent` - Senior):* „Zajrzyj teraz do `analytics-page.component.ts` (linie 244–281). Czy `effect()` w konstruktorze jest tam właściwym narzędziem do wyliczania `displayedCategories`? I jak działa dynamiczne śledzenie zależności w `capacityRiskSummary`?”
* **Oczekiwane rozwiązanie (Green Flags vs Red Flags):**
  * *Rozwiązanie akceptowalne (Mid):*
    * W `ActivityLogPageComponent`: usunięcie duplikującej subskrypcji z `toggleAutoRefresh` i dodanie `takeUntilDestroyed(this.destroyRef)` (lub `DestroyRef` / `ngOnDestroy`) do `interval(4000)` w `ngOnInit`.
    * W `AnalyticsPageComponent`: zamiana `displayedCategories = signal(...)` + `effect()` na prosty `readonly displayedCategories = computed(() => ...)`.
  * *Rozwiązanie wzorcowe (Senior):*
    * W `ActivityLogPageComponent`: zastąpienie imperatywnego `interval` jednym reaktywnym strumieniem sterowanym przez sygnał `toObservable(this.autoRefreshEnabled).pipe(switchMap((enabled) => enabled ? interval(4000) : EMPTY), takeUntilDestroyed(this.destroyRef))` (gdy checkbox jest wyłączony, timer w ogóle nie tyka w tle!).
    * W `AnalyticsPageComponent`: przepisanie `displayedCategories` na `computed()`, oraz wyciągnięcie odczytów sygnałów (`const showDetails = this.showCapacityDetails(); const workloads = this.tasksStore.userWorkloads(); const focusId = this.selectedFocusUserId();`) na początek `capacityRiskSummary = computed(() => ...)` wraz z wyjaśnieniem, jak Angular buduje graf zależności sygnałów w runtime (śledzone są tylko sygnały faktycznie wywołane podczas ostatniego wykonania funkcji `computed`).
  * *Red Flags:* Pozostawienie tworzenia nowego `interval(4000).subscribe()` w `toggleAutoRefresh`; obrona użycia `effect()` do synchronizacji stanu pochodnego („bo tak łatwiej debugować”).
