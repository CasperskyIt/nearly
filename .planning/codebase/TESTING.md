# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Runner:**
- Karma 6.4.0
- Configured via `@angular-devkit/build-angular:karma` builder in `angular.json`
- Config file: Expected at `karma.conf.js` (not explicitly committed but referenced by Angular CLI)

**Assertion Library:**
- Jasmine 5.6.0
- Type definitions: `@types/jasmine ~5.1.0`

**Run Commands:**
```bash
ng test                    # Run all tests with Karma
npm test                   # Alias for ng test
# Watch mode and coverage run through Karma configuration
```

## Test File Organization

**Location:**
- Co-located with source files in same directory
- Test files placed adjacent to component/service they test

**Naming:**
- Pattern: `[filename].spec.ts`
- Examples: `app.component.spec.ts` (test for `app.component.ts`)

**Structure:**
```
src/
├── app/
│   ├── app.component.ts
│   ├── app.component.spec.ts        # Test file co-located
│   ├── services/
│   │   ├── supabase.service.ts
│   │   └── (supabase.service.spec.ts - would go here)
│   ├── pages/
│   │   └── home/
│   │       ├── home.component.ts
│   │       └── (home.component.spec.ts - would go here)
│   └── components/
│       └── header/
│           ├── header.component.ts
│           └── (header.component.spec.ts - would go here)
```

**Test Discovery:**
- TypeScript config `tsconfig.spec.json` includes all `src/**/*.spec.ts` files
- Polyfills configured: `zone.js` and `zone.js/testing`

## Test Structure

**Suite Organization:**

```typescript
// Pattern from app.component.spec.ts
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'nearly-frontend' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('nearly-frontend');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, nearly-frontend');
  });
});
```

**Patterns:**

1. **Setup Pattern (beforeEach):**
   - Use `TestBed.configureTestingModule()` to configure testing module
   - Import component dependencies explicitly
   - Call `.compileComponents()` for async compilation
   - Mark setup as `async` when using `await`

2. **Component Creation Pattern:**
   - Create fixture with `TestBed.createComponent(ComponentClass)`
   - Access component instance via `fixture.componentInstance`
   - Access native element via `fixture.nativeElement`

3. **Change Detection Pattern:**
   - Call `fixture.detectChanges()` to trigger initial change detection
   - Needed before querying DOM or testing rendered content

4. **Teardown Pattern:**
   - Implicit via Karma/Jasmine cleanup
   - TestBed automatically resets between tests

## Mocking

**Framework:**
- TestBed dependency injection for mocking services
- No explicit mocking library (like jasmine.spyOn) observed in current tests

**Patterns:**

While no explicit mocking examples exist in current test file, Angular mocking patterns would follow:

```typescript
// Potential pattern for service mocking
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ComponentUnderTest],
    providers: [
      {
        provide: SupabaseService,
        useValue: {
          getPlacesNearby: jasmine.createSpy('getPlacesNearby').and.returnValue(Promise.resolve([])),
          loading: signal(false),
          error: signal(null)
        }
      }
    ]
  });
});

// Or using inject() in test
let supabaseService = TestBed.inject(SupabaseService);
spyOn(supabaseService, 'getPlacesNearby').and.returnValue(Promise.resolve(mockPlaces));
```

**What to Mock:**
- External services (SupabaseService, OsmService)
- HTTP calls (HttpClient via TestBed)
- Router operations (Router)
- Browser APIs (localStorage, geolocation)

**What NOT to Mock:**
- Theme and i18n services when testing theme/language behavior
- Angular Material components (test actual rendered output)
- Signal behavior (test actual signal updates)

## Fixtures and Factories

**Test Data:**

No explicit test factories or fixtures found in current codebase. Mock data patterns from source could be adapted:

```typescript
// Pattern from places-list.component.ts
const mockPlaces: Place[] = [
  { id: '1', name: 'Kawiarnia TF', category: 'Coffee', rating: 4.5, lat: 52.2297, lng: 21.0122 },
  { id: '2', name: 'Park Łazienkowski', category: 'Parks', rating: 4.8, lat: 52.2315, lng: 21.0210 },
  // ...
];
```

**Location:**
- Would be in same `*.spec.ts` file as test or in shared `test-helpers.ts`
- No dedicated fixtures directory exists

## Coverage

**Requirements:** Not explicitly configured or enforced

**View Coverage:**
```bash
# Karma coverage configured via angular.json
# To view coverage reports, karma.conf.js would specify coverage reporter
# Typical output to: coverage/ directory
```

**Coverage Provider:**
- `karma-coverage` 2.2.0 installed as dev dependency
- Not actively configured in visible Angular config

## Test Types

**Unit Tests:**
- Scope: Individual components and services
- Approach: TestBed for component testing, direct instantiation for services
- Example: `app.component.spec.ts` tests component creation and rendering
- Pattern: Test component initialization, property values, method calls, DOM output

**Integration Tests:**
- Not observed in current codebase
- Would test multiple components/services working together
- Could test form submission, service communication, routing

**E2E Tests:**
- Framework: Playwright (`@playwright/test` 1.58.2 installed)
- Not actively configured or used in visible test structure
- Would be separate from Karma tests
- Typical location: `e2e/` directory

## Async Testing

**Pattern:**

```typescript
// From app.component.spec.ts
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [AppComponent],
  }).compileComponents();
});
```

**Key Points:**
- Use `async` keyword in `beforeEach` when configuration needs compilation
- Use `fixture.whenStable()` for waiting on promise resolution
- Use `fakeAsync` and `tick()` for timer-based async operations

**For Service Testing:**
```typescript
// Pattern for testing async service methods
it('should load places', fakeAsync(() => {
  const service = TestBed.inject(SupabaseService);
  spyOn(service, 'getPlacesNearby').and.returnValue(Promise.resolve(mockPlaces));

  let result: Place[] = [];
  service.getPlacesNearby(52.2297, 21.0122).then(places => {
    result = places;
  });

  tick();
  expect(result).toEqual(mockPlaces);
}));
```

## Error Testing

**Pattern:**

While not explicitly demonstrated in current spec, error handling would follow:

```typescript
// Pattern for testing error scenarios
it('should handle service errors', async () => {
  const service = TestBed.inject(SupabaseService);
  const errorMessage = 'Failed to fetch places';

  spyOn(service, 'getPlacesNearby').and.returnValue(
    Promise.reject(new Error(errorMessage))
  );

  // Expect empty array or error state
  const result = await service.getPlacesNearby(52.2297, 21.0122);
  expect(result).toEqual([]);
  expect(service.error()).toContain(errorMessage);
});

// Testing error in component
it('should display error message on service failure', async () => {
  const fixture = TestBed.createComponent(HomeComponent);
  const component = fixture.componentInstance;

  const service = TestBed.inject(SupabaseService);
  spyOn(service, 'getPlacesNearby').and.returnValue(
    Promise.reject(new Error('API Error'))
  );

  await component.loadPlacesFromSupabase(52.2297, 21.0122);
  fixture.detectChanges();

  expect(component.isLoading()).toBe(false);
  // Would check for error display in template
});
```

## Best Practices Observed

1. **TestBed Configuration:**
   - Explicit imports of all dependencies
   - Proper async compilation
   - Clean setup/teardown

2. **Component Testing:**
   - Test component instantiation
   - Test rendered output via `nativeElement`
   - Test property values on component instance

3. **Isolation:**
   - Each test file focuses on single component/service
   - No cross-file test dependencies

4. **Naming:**
   - Descriptive test names with "should" pattern
   - Clear intent of what behavior is being tested

---

*Testing analysis: 2026-03-22*
