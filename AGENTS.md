
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use RxJS as the primary reactive paradigm across API calls, services, and data flows up to presentational components; reserve signals strictly for UI-layer state
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived UI state
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management & Reactivity

- **RxJS for Data & Application Flows (API -> Services -> Presentational Components)**:
  - Use RxJS (`Observable`, `BehaviorSubject`, `Subject`, and operators) as the main reactive paradigm for HTTP/API calls, services, domain/application state, and data streams passed down to presentational components.
  - Favor declarative, composable pipelines (`switchMap`, `combineLatest`, `map`, `catchError`, `shareReplay`, etc.) over imperative subscriptions.
  - Avoid manual `.subscribe()` in components; consume streams with the `async` pipe or bridge them at the UI boundary with `@angular/core/rxjs-interop` (`toSignal()`). When a manual subscription is unavoidable for a side effect, always clean it up with `takeUntilDestroyed()`.
- **Signals for UI State Only**:
  - Limit signals (`signal()`, `computed()`, `input()`) strictly to the UI layer (e.g., local view state such as toggles, active tabs, expansion/modal state, component inputs, and derived display state).
  - Do NOT use signals as the primary state or data-fetching mechanism in services or API layers.
  - Keep state transformations pure and predictable.
  - Do NOT use `mutate` on signals; use `update` or `set` instead.

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the `async` pipe to subscribe to observables in templates
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Expose API calls, business logic, and shared state as RxJS `Observable` streams (not signals)
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
