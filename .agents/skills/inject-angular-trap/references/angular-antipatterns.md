# Katalog Antypatternów i Błędów Rekrutacyjnych (Najnowszy Angular)

Ten dokument zawiera gotowe wzorce błędów do wykorzystania przez agenta `chaos-saboteur` oraz skill `inject-angular-trap`.

---

## 1. Angular Signals & Nowoczesna Reaktywność

### [SIG-01] Mutacja referencyjna wewnątrz sygnału (Mid / Senior)
* **Na czym polega:** Komponent lub serwis przechowuje tablicę/obiekt w `signal<Task[]>([])`, a podczas aktualizacji modyfikuje tablicę w miejscu (`this.tasks().push(newTask)` lub `this.tasks()[idx].completed = true`) albo wywołuje `this.tasks.set(currentTasks)` z tą samą referencją tablicy.
* **Konsekwencja:** Sygnały w Angularze używają domyślnie porównania `Object.is`. Brak nowej referencji sprawia, że `computed()` zależne od tego sygnału (np. licznik ukończonych zadań) oraz komponenty `OnPush` **nie przeliczają się**.
* **Wzorcowa naprawa:** Aktualizacja niemutowalna przez `this.tasks.update(list => [...list, newTask])` lub `list.map(...)`.

### [SIG-02] Nadużywanie `effect()` do synchronizacji stanu pochodnego (Mid / Senior)
* **Na czym polega:** Zamiast użyć `computed()`, kod definiuje dwa osobne sygnały (np. `tasks` i `filteredTasks`) i w konstruktorze synchronizuje je za pomocą `effect(() => { this.filteredTasks.set(...); })`.
* **Konsekwencja:** Niepotrzebny zapis stanu w efekcie, ryzyko pętli reaktywnych, opóźnienia synchronizacji i trudniejszy w utrzymaniu kod.
* **Wzorcowa naprawa:** Zastąpienie drugiego sygnału i `effect()` deklaratywnym `readonly filteredTasks = computed(() => ...)`.

### [SIG-03] Pułapka warunkowego odczytu sygnału w `computed()` / `effect()` (Senior)
* **Na czym polega:** Wewnątrz `computed()` drugi sygnał jest odczytywany dopiero po instrukcji warunkowej lub po zwarciu logicznym (`if (this.showDetails() && this.selectedTask())`), przez co gdy pierwszy warunek jest `false`, Angular przestaje śledzić zmiany drugiego sygnału do czasu zmiany pierwszego.
* **Wzorcowa naprawa:** Odczytanie potrzebnych sygnałów do stałych na początku funkcji `computed()`, jeśli oba mają wyzwalać przeliczenie, lub świadome wyjaśnienie mechanizmu dynamicznego grafu zależności.

---

## 2. RxJS & Interop (`@angular/core/rxjs-interop`)

### [RXJS-01] Zagnieżdżone `.subscribe()` (Nested Subscriptions – Mid)
* **Na czym polega:** Wewnątrz `route.paramMap.subscribe(params => { this.taskService.getProject(params.get('id')).subscribe(project => { this.userService.getMembers(project.teamId).subscribe(...) }) })`.
* **Konsekwencja:** Brak anulowania poprzednich zapytań przy szybkiej zmianie URL (wyścig danych – wyświetlenie danych ze starego projektu), wyciek pamięci, kod typu „Callback Hell”.
* **Wzorcowa naprawa:** Spłaszczenie strumienia za pomocą operatorów wyższego rzędu (`switchMap`, `combineLatest`) oraz konwersja na sygnał przez `toSignal()` lub użycie `takeUntilDestroyed()`.

### [RXJS-02] Zły operator spłaszczający przy wyszukiwaniu / zapisie (Mid / Senior)
* **Na czym polega:**
  * *Wariant A (Wyszukiwarka):* Użycie `mergeMap` lub `concatMap` zamiast `switchMap` przy wpisywaniu frazy wyszukiwania (szczególnie widoczne, gdy `json-server` ma ustawione opóźnienie).
  * *Wariant B (Usuwanie / Aktualizacja wielu elementów):* Użycie `switchMap` zamiast `mergeMap`/`concatMap` przy klikaniu „Oznacz jako wykonane” na kilku zadaniach pod rząd – kliknięcie kolejnego zadania anuluje request HTTP poprzedniego!
* **Wzorcowa naprawa:** Dobór właściwego operatora (`switchMap` do odczytu/wyszukiwania, `concatMap`/`mergeMap` do mutacji kolejkowanych/równoległych, `exhaustMap` do ochrony przycisku zapisu przed podwójnym kliknięciem).

### [RXJS-03] Śmierć głównego strumienia przez źle umieszczony `catchError` (Senior)
* **Na czym polega:** Strumień nasłuchujący na zmiany filtrów (`filterChanges$.pipe(switchMap(f => this.api.getTasks(f)), catchError(err => of([])))`) ma `catchError` umieszczony **na głównym strumieniu** po `switchMap`, zamiast wewnątrz `switchMap`.
* **Konsekwencja:** Gdy jedno zapytanie HTTP zwróci błąd (np. 500 z `json-server`), `catchError` zwraca pustą tablicę i **kończy (complete)** cały strumień `filterChanges$`. Kolejne zmiany filtrów przez użytkownika przestają działać całkowicie!
* **Wzorcowa naprawa:** Przeniesienie `catchError` do wewnętrznego `pipe()` wewnątrz `switchMap`.

### [RXJS-04] Wyciek pamięci z globalnego serwisu / timera (Junior / Mid)
* **Na czym polega:** Komponent subskrybuje `interval(5000)` lub `Subject` z globalnego serwisu (`providedIn: 'root'`) w `ngOnInit`, loguje lub odświeża dane i nie odsubskrybowuje się przy zniszczeniu komponentu.
* **Konsekwencja:** Po kilkukrotnym przejściu między zakładkami w aplikacji liczba aktywnych subskrypcji i zapytań HTTP do `json-server` rośnie liniowo.
* **Wzorcowa naprawa:** `takeUntilDestroyed(this.destroyRef)` lub `toSignal()`.

---

## 3. Change Detection & Wydajność Szablonów

### [PERF-01] Ciężka funkcja wywoływana w szablonie HTML (Junior / Mid)
* **Na czym polega:** W szablonie komponentu (szczególnie bez `OnPush`) znajduje się wywołanie `{{ calculateProjectProductivity(project.id) }}` lub `@for (task of getSortedAndFilteredTasks(); track task.id)`, które za każdym razem wykonuje kosztowne filtrowanie, sortowanie i mapowanie tablicy.
* **Konsekwencja:** Funkcja wykonuje się dziesiątki razy przy każdym ruchu myszką czy wpisaniu znaku w dowolny input.
* **Wzorcowa naprawa:** Przeniesienie wyliczeń do `computed()` lub czystego `Pipe` (`pure: true`).

### [PERF-02] Błędny `track` w pętli `@for` (Junior / Mid)
* **Na czym polega:** Użycie `@for (task of tasks(); track $index)` na liście zadań, którą można sortować, filtrować, usuwać ze środka i edytować inline.
* **Konsekwencja:** Niepotrzebne przebudowywanie węzłów DOM, utrata fokusu w polach input wewnątrz wiersza oraz błędne przypisanie stanu dzieci po usunięciu elementu z początku listy.
* **Wzorcowa naprawa:** Użycie unikalnego identyfikatora encji: `track task.id`.

### [PERF-03] Konflikt `ChangeDetectionStrategy.OnPush` z asynchroniczną mutacją (Mid / Senior)
* **Na czym polega:** Komponent ma ustawione `OnPush`, ale pobiera dane w klasycznym `.subscribe(data => { this.items = data; })` używając zwykłego pola klasy (nie sygnału i bez `async` pipe / `ChangeDetectorRef.markForCheck()`).
* **Konsekwencja:** Dane przychodzą z `json-server` (widać je w zakładce Network), ale widok komponentu pozostaje pusty aż do momentu, gdy użytkownik kliknie jakiś przycisk wewnątrz tego komponentu.
* **Wzorcowa naprawa:** Przechowywanie danych w `signal()` lub użycie `toSignal()`.

---

## 4. Architektura, Dependency Injection & TypeScript

### [ARCH-01] „God Component” i bezpośrednie wywołania `HttpClient` w widoku (Junior / Mid)
* **Na czym polega:** Komponent UI bezpośrednio wstrzykuje `HttpClient`, buduje adresy URL `http://localhost:3000/tasks?...`, mapuje DTO, zarządza cachem i obsługuje logikę biznesową.
* **Wzorcowa naprawa:** Wydzielenie warstwy serwisowej / fasady stanu oraz separacja komponentów typu Smart (Container) i Dumb (Presentational).

### [ARCH-02] Błędny zakres `providers` w komponencie zamiast singletona (Mid / Senior)
* **Na czym polega:** Serwis przechowujący współdzielony stan (np. `TaskSelectionService` lub `FilterStateService`) jest zadeklarowany jednocześnie w `@Injectable({ providedIn: 'root' })` oraz w tablicy `providers: [FilterStateService]` w jednym z podkomponentów.
* **Konsekwencja:** Dwa komponenty widzą dwie różne instancje serwisu – zmiana filtra w pasku bocznym nie wpływa na listę zadań.
* **Wzorcowa naprawa:** Usunięcie duplikatu z `providers` komponentu (lub świadome użycie hierarchicznego DI tylko tam, gdzie stan ma być izolowany per instancja komponentu).

### [COMP-01] Celowe błędy kompilacji i typowania TypeScript (Junior / Mid / Senior)
* **Przykłady:**
  * Niezgodność typu zwracanego przez `toSignal()` (który domyślnie dodaje `| undefined`, jeśli nie podano `initialValue`) z wymaganym typem w szablonie lub funkcji.
  * Próba zapisu do sygnału `ReadonlySignal` (np. zwróconego z `computed()` lub `asReadonly()`) przez `.set()`.
  * Błędnie skonstruowany typ generyczny w klasie bazowej serwisu HTTP (`BaseApiService<T>`).
  * Nadużycie `any` ukrywające fakt, że `json-server` zwraca `priority` jako `string`, a komponent porównuje je przez `===` z `number`.
