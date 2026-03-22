# Phase 1: Foundation & Cleanup - Research

**Researched:** 2026-03-22
**Domain:** Angular 19 credential security, component decomposition, logging patterns, Karma/Jasmine test stubs
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Rotate the Supabase anon key (existing key is in git history — must be invalidated)
- **D-02:** Move `supabaseUrl` and `supabaseAnonKey` to `.env` file, sourced via Angular `fileReplacements` in `angular.json`
- **D-03:** Add `.env` to `.gitignore`; provide `.env.example` with placeholder values
- **D-04:** Extract map lifecycle into `MapComponent` (`frontend/src/app/components/map/`)
- **D-05:** Extract place list display into `PlaceListComponent` (already exists at `components/places-list/` — consolidate)
- **D-06:** Extract map state/logic into `MapService` (`frontend/src/app/services/`)
- **D-07:** `HomeComponent` becomes an orchestrator under 100 lines — it wires the above together
- **D-08:** Remove `loadMockData()`, `Math.random()` ratings, and all hardcoded place data entirely (no env flag)
- **D-09:** Replace `console.log`/`console.error` with a `LoggerService` that is a no-op when `environment.production` is true
- **D-10:** Add null guard for `response.elements` in `osm.service.ts`
- **D-11:** Delete `app.component.spec.ts` and replace with a minimal stub that passes (title check only)
- **D-12:** Fix `bypassSecurityTrustHtml` for SVG logo — scope it to Phase 1 since it's in the component being refactored anyway

### Claude's Discretion
- Exact `LoggerService` API design
- Whether to use Angular's `environment.ts` injection or a dedicated log level config
- `MapService` internal structure

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Supabase anon key and URL moved to environment variables (not hardcoded in source) | Angular `fileReplacements` pattern in `angular.json`; `.env` + `environment.ts` bridge; both root and frontend `.gitignore` must be updated |
| FOUND-02 | `HomeComponent` refactored — business logic extracted, template under 100 lines | `MapComponent` new file; `PlacesListComponent` consolidation (existing component has its own mock data to purge); `MapService` new injectable |
| FOUND-03 | Mock/placeholder data and console.log statements removed from production code | `LoggerService` pattern; mock data in both `home.component.ts` AND `places-list.component.ts`; OSM null guard; broken spec stub |
</phase_requirements>

---

## Summary

Phase 1 is pure cleanup: no new routes, no features. The work falls into four independent workstreams that can each be reviewed atomically: (1) credential rotation and env-var wiring, (2) HomeComponent decomposition into MapComponent + PlacesListComponent + MapService, (3) mock data and console log removal, and (4) test stub fix.

The codebase is Angular 19 standalone-component style with Karma/Jasmine for unit tests. No ESLint is configured. TypeScript strict mode is on. All existing components follow the pattern: separate `.html`/`.scss` files, `standalone: true`, `inject()` for DI, Angular signals for reactive state.

The two most important discoveries from reading the actual source files: (a) `angular.json` currently has **no `fileReplacements` configuration at all** — the entire `fileReplacements` block must be added to both `production` and `development` configurations; and (b) the existing `PlacesListComponent` has its **own hardcoded `mockPlaces` array** that must also be removed as part of FOUND-03, not just the mock data in `HomeComponent`.

**Primary recommendation:** Address credential rotation first (it blocks deployment safety), then decompose HomeComponent, then clean up mock data and logs. The broken spec stub is a quick fix that should be done last to confirm the test runner is green after all other changes.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 19.2.x | Framework | Already in project |
| Angular CLI / `@angular-devkit/build-angular` | 19.2.22 | Build toolchain, fileReplacements | Already in project |
| Karma + Jasmine | 6.4 / 5.6 | Unit test runner | Already in project |
| TypeScript | 5.7.2 | Language | Already in project |

No new packages are required for this phase. All work uses capabilities already present in the Angular build toolchain.

---

## Architecture Patterns

### Recommended Project Structure After Phase 1
```
frontend/src/
├── .env                         # gitignored — real credentials
├── .env.example                 # committed — placeholder values
├── app/
│   ├── components/
│   │   ├── map/                 # NEW: MapComponent
│   │   │   ├── map.component.ts
│   │   │   ├── map.component.html
│   │   │   └── map.component.scss
│   │   └── places-list/         # UPDATED: receives @Input() places, emits @Output()
│   │       ├── places-list.component.ts
│   │       ├── places-list.component.html
│   │       └── places-list.component.scss
│   ├── pages/home/              # SLIMMED: orchestrator only, <100 lines
│   ├── services/
│   │   ├── map.service.ts       # NEW: Leaflet map state + marker management
│   │   ├── logger.service.ts    # NEW: production-safe logging
│   │   ├── osm.service.ts       # UPDATED: null guard on response.elements
│   │   └── supabase.service.ts  # UPDATED: console.error → LoggerService
│   └── app.component.spec.ts    # REPLACED: minimal passing stub
└── environments/
    ├── environment.ts           # UPDATED: reads from .env via fileReplacements
    └── environment.prod.ts      # UPDATED: reads from .env via fileReplacements
```

### Pattern 1: Angular fileReplacements for Env Vars

**What:** Angular CLI's `fileReplacements` replaces `environment.ts` with a different file at build time. Combined with a build-time `.env` file, credentials never appear in source.

**The pattern used by this project:** The `environment.prod.ts` already has placeholder values (`'YOUR_SUPABASE_URL'`). The correct approach for this project is to use a single `environment.ts` whose values are injected from a `.env` file at serve/build time. Since Angular CLI does not natively read `.env` files, the simplest compatible approach is:

1. Create `frontend/.env` (gitignored) with the real values as shell variables
2. Keep `environment.ts` with values that are replaced at CI/CD time, OR use a custom `env.js` script that writes `environment.ts` from `.env` before building

However, **the decision-locked approach (D-02) says `fileReplacements` in `angular.json`**. The standard Angular pattern for this is:

- `environment.ts` = development credentials (reads from `.env` or hardcodes dev-safe values)
- `environment.prod.ts` = production credentials placeholder
- `angular.json` `fileReplacements` swaps files on `ng build` (production configuration)

Since the anon key is a *public* browser key (Supabase anon keys are always visible to browser users — RLS is the security layer), the practical implementation is:

**Option A (simplest, project-appropriate):** Keep `environment.ts` with credentials, add it to `.gitignore`, provide `environment.example.ts`, and update `fileReplacements` in `angular.json`. This is the most common Angular approach.

**Option B (what `fileReplacements` was actually designed for):** The `fileReplacements` array in `angular.json` swaps which `environment` file is used per build configuration. This does NOT read `.env` files directly — it swaps source files.

**Verdict for this phase:** The cleanest approach consistent with D-02 and D-03 is:
- `environment.ts` — gitignored, contains real dev credentials
- `environment.example.ts` — committed, placeholder values
- `environment.prod.ts` — gitignored OR configured to read from process.env at CI time
- `angular.json` `fileReplacements` swaps `environment.ts` → `environment.prod.ts` for production builds

Both root `.gitignore` and `frontend/.gitignore` need `environment.ts` added (or a `.env` approach).

**IMPORTANT — `angular.json` currently has NO `fileReplacements` block.** The production configuration only has `budgets` and `outputHashing`. The `fileReplacements` array must be added:

```json
// In angular.json, under "configurations" > "production"
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

This is already the Angular CLI default for new projects — it was simply absent here.

### Pattern 2: Angular Signal-Based Service (MapService)

**What:** A `providedIn: 'root'` injectable service that owns Leaflet map state, exposes it via signals, and provides methods for map operations.

**When to use:** When a component's lifecycle methods (ngAfterViewInit, ngOnDestroy) are dominated by third-party library management. Moving Leaflet init/destroy into a service keeps the component template-focused.

**Constraint:** Leaflet requires a DOM element to initialize. `MapService` cannot create the map itself — it needs to receive the DOM element reference. The component passes `@ViewChild` reference into the service's `initMap(elementId: string)` method.

```typescript
// Source: Angular DI + Leaflet pattern
@Injectable({ providedIn: 'root' })
export class MapService {
  private map!: L.Map;

  initMap(containerId: string, options: L.MapOptions): void {
    this.map = L.map(containerId, options);
  }

  destroyMap(): void {
    if (this.map) { this.map.remove(); }
  }
}
```

### Pattern 3: PlacesListComponent as Presentational Component

**What:** Convert `PlacesListComponent` from a component with internal mock data to a pure presentational component that accepts `@Input() places: Place[]` and emits `@Output() placeSelected`.

The existing component already has the `selectPlace = output<Place>()` signal-output — it just needs to replace its internal `mockPlaces` array with an `@Input()`.

```typescript
// Existing pattern to follow (from header.component.ts, filters.component.ts)
@Component({
  selector: 'app-places-list',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './places-list.component.html',
  styleUrl: './places-list.component.scss'
})
export class PlacesListComponent {
  places = input<Place[]>([]);                     // replaces mockPlaces
  placeSelected = output<Place>();                 // already exists as selectPlace
}
```

### Pattern 4: LoggerService Design

**What:** A thin wrapper around `console` that is a no-op in production. The simplest valid design.

**Claude's discretion area.** Recommended approach: inject `environment` via the service itself (since `environment` is a const import, not an Angular token), check `environment.production` at method call time.

```typescript
// Recommended design
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(message: string, ...args: unknown[]): void {
    if (!environment.production) {
      console.log(message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (!environment.production) {
      console.error(message, ...args);
    }
  }
}
```

**Why not Angular's inject + InjectionToken approach:** Overkill for this codebase. No testing of LoggerService is planned, and the project uses direct environment imports elsewhere. Keep it simple.

### Pattern 5: bypassSecurityTrustHtml Fix (D-12)

**What:** The `getLogo()` method in HomeComponent calls `this.sanitizer.bypassSecurityTrustHtml(logo)`. Since the logo SVG comes from hardcoded theme configuration (not user input), there is no actual XSS risk today. However, the correct approach is to use Angular's `DomSanitizer.sanitize(SecurityContext.HTML, value)` instead of bypass, or render SVGs via `<img src="data:...">` or Angular Material's `mat-icon` with `svgIcon`.

The simplest safe fix: use `sanitizer.sanitize(SecurityContext.HTML, logo)`. Angular will strip unsafe parts of the SVG but preserve safe display. The return type becomes `string | null` instead of `SafeHtml`.

```typescript
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';

getLogo(): string | null {
  const logo = this.theme.logo;
  return logo ? this.sanitizer.sanitize(SecurityContext.HTML, logo) : null;
}
```

Template binding `[innerHTML]="getLogo()"` works directly with `string | null`.

### Pattern 6: Minimal Karma/Jasmine Spec Stub

**What:** Replace the failing `app.component.spec.ts` with the minimum that passes. The current spec fails because `AppComponent` has no `title` property and no `<h1>Hello, nearly-frontend</h1>` in its template.

The component's actual template is `'<router-outlet></router-outlet>'`. A passing stub only needs to test that the component creates:

```typescript
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';  // needed for RouterOutlet
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

**Note:** `RouterOutlet` requires router providers or `RouterTestingModule`. Without it, the test will throw `No provider for Router`. The stub must import router testing support.

### Anti-Patterns to Avoid

- **Duplicating the `Place` interface:** `home.component.ts` defines its own `Place` interface. `places-list.component.ts` defines another. After decomposition, define `Place` once — in `places-list.component.ts` (since PlacesListComponent is the display contract) or in a shared types file. Do not have two `Place` interfaces in the same app.
- **Making MapService a singleton that holds Leaflet Map state globally:** If future phases add multiple map views, a singleton map service becomes a problem. For Phase 1, `providedIn: 'root'` is fine, but design `destroyMap()` carefully so HomeComponent's `ngOnDestroy` can fully clean up.
- **Gitignoring `environment.ts` without committing `environment.example.ts`:** Developers cloning the repo will have no reference for what values are needed. Always commit the example file.
- **Only updating `frontend/.gitignore` for `.env`:** The root `.gitignore` currently only has `/.idea/`. Any `.env` created in the repo root or adjacent to the Angular project will not be ignored. Add `.env` and `src/environments/environment.ts` (if gitignored) to the root `.gitignore` as well.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional logging | Custom log level system | Simple `environment.production` check in LoggerService | No log levels needed in v1; a two-method service is sufficient |
| Environment variable injection | Custom webpack plugin or dotenv-webpack | Angular `fileReplacements` in `angular.json` | Already supported by Angular CLI; no extra dependencies |
| Angular router testing setup | Manual provider array | `RouterTestingModule` or `provideRouter([])` | Handles `RouterOutlet` provider chain automatically |

**Key insight:** Every problem in this phase has a solution already in the project's existing toolchain. Zero new npm packages are required.

---

## Common Pitfalls

### Pitfall 1: angular.json fileReplacements Missing
**What goes wrong:** Developer adds `environment.prod.ts` with real values and expects the production build to use it, but production build still uses `environment.ts` because `fileReplacements` is not configured.
**Why it happens:** The `angular.json` in this project was created without `fileReplacements`. It is NOT present in the current config.
**How to avoid:** Add the `fileReplacements` block to the `production` configuration in `angular.json` before testing the production build.
**Warning signs:** `ng build` uses dev credentials in dist output.

### Pitfall 2: OSM Null Guard — Two Methods Need Fixing
**What goes wrong:** Only one of the two OSM methods gets the null guard.
**Why it happens:** `getPlacesNearby` (line 37) and `getDogFriendlyPlaces` (line 73) both call `response.elements.map()` without checking `response.elements` first. Both crash on malformed responses.
**How to avoid:** Guard both: `const elements = response?.elements ?? [];` before `.map()`.
**Warning signs:** Uncaught TypeError if Overpass API returns `{ "version": 0.6 }` with no `elements` key.

### Pitfall 3: PlacesListComponent Has Its Own Mock Data
**What goes wrong:** Mock data removal from `HomeComponent` is verified but `PlacesListComponent.mockPlaces` (5 hardcoded places in `places-list.component.ts`) remains, violating FOUND-03.
**Why it happens:** CONCERNS.md only calls out `home.component.ts` lines 138-166 for mock data. The `places-list.component.ts` mockPlaces is a separate problem that's easy to miss.
**How to avoid:** Search for `mockPlaces`, `loadMockData`, and `Math.random` across all files, not just HomeComponent.
**Warning signs:** `PlacesListComponent` renders its own hardcoded list even when receiving an empty `places` input.

### Pitfall 4: AppComponent Spec Needs RouterTestingModule
**What goes wrong:** The minimal spec stub creates `AppComponent` which renders `<router-outlet>`. Without router providers, Jasmine throws `NullInjectorError: No provider for Router`.
**Why it happens:** `RouterOutlet` is an Angular directive that requires the router's dependency injection chain.
**How to avoid:** Import `RouterTestingModule` (Angular 14 style) or use `provideRouter([])` in `TestBed.configureTestingModule({ providers: [provideRouter([])] })` (Angular 15+ style). For Angular 19, `provideRouter([])` in the providers array is the modern approach.
**Warning signs:** Test run fails with `NullInjectorError` or `NG0203`.

### Pitfall 5: Two `.gitignore` Files — Both Need `.env`
**What goes wrong:** `.env` is added to `frontend/.gitignore` but not the root `.gitignore`. If a `.env` is placed in the project root, it gets committed.
**Why it happens:** The Angular project has its own `.gitignore` inside `frontend/`, but git also reads the root `.gitignore`.
**How to avoid:** Add `.env` to both. Also consider adding `src/environments/environment.ts` to `frontend/.gitignore` if taking the approach of gitignoring the environment file instead of using fileReplacements.
**Warning signs:** `git status` shows `.env` as untracked (not ignored).

### Pitfall 6: HomeComponent Template Still References Removed Methods
**What goes wrong:** `home.component.html` calls `getCategoryColor()`, `getCategoryIcon()`, `getCategoryLabel()`, `toggleCategory()`, `selectPlace()`, `closePlaceDetail()`. These are called from the template. If they move to MapService or are removed, the template breaks and Angular strict templates will error at build time.
**Why it happens:** Decomposition moves TS logic but the template still references the old component methods.
**How to avoid:** Keep these as pass-through delegator methods in HomeComponent (calling MapService underneath), or move the place-detail panel into a sub-component. Do not leave template references without backing methods.
**Warning signs:** `ng build` fails with `TS-998001: Property 'X' does not exist on type 'HomeComponent'`.

### Pitfall 7: `bypassSecurityTrustHtml` Return Type Change
**What goes wrong:** Switching `getLogo()` from `SafeHtml` to `string | null` requires template updates. The template uses `[innerHTML]="getLogo()"` in two places. If return type is `string | null`, Angular strict templates will accept this — `[innerHTML]` accepts `string`. But `SafeHtml | undefined` is the current type, so the change must be consistent.
**Why it happens:** TypeScript strict templates validate binding types. A type mismatch causes build failure.
**How to avoid:** Update both the method signature AND template simultaneously. Verify with `ng build`.

---

## Code Examples

### OSM Null Guard (Verified from reading source)
```typescript
// Current (both methods, lines 37 and 73 in osm.service.ts):
const places: OsmPlace[] = response.elements.map((el: any) => ({...}))

// Fixed:
const places: OsmPlace[] = (response?.elements ?? []).map((el: any) => ({...}))
```

### fileReplacements Addition to angular.json
```json
// In angular.json under projects > nearly-frontend > architect > build > configurations > production
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
],
"budgets": [ ... ],
"outputHashing": "all"
```

### LoggerService Call Site (replacing console.error)
```typescript
// Before (home.component.ts line 189, 208; osm.service.ts lines 50, 86):
console.error('Error loading OSM places:', err);

// After:
this.logger.error('Error loading OSM places:', err);

// Before (home.component.ts line 356):
console.log('Toggle menu');

// After:
this.logger.log('Toggle menu');
```

### Angular 19 Modern Spec Stub with provideRouter
```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Karma 6.4 + Jasmine 5.6 |
| Config file | `frontend/karma.conf.js` (auto-generated by Angular CLI, not committed — generated at test time) |
| Quick run command | `cd frontend && npm test -- --watch=false` |
| Full suite command | `cd frontend && npm test -- --watch=false` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | Credentials not hardcoded in compiled output | Manual verification | `git grep supabase.co` after env move | N/A — grep check |
| FOUND-02 | HomeComponent compiles and renders | Smoke (build) | `cd frontend && npm run build` | N/A — build check |
| FOUND-03 | No mock data, no console.log in production files | Manual grep + unit | `cd frontend && npm test -- --watch=false` | ❌ Wave 0 — stub needed |

**Note:** FOUND-01 and FOUND-02 are best verified by build success + git grep rather than Karma unit tests. The existing spec (once stubbed correctly) serves as the CI gate confirming the app compiles and the root component renders.

### Sampling Rate
- **Per task commit:** `cd frontend && npm run build` (confirms no TypeScript errors from refactor)
- **Per wave merge:** `cd frontend && npm test -- --watch=false`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/app/app.component.spec.ts` — replace failing spec with passing stub (covers FOUND-03 CI gate)
- [ ] No new test infrastructure needed — Karma/Jasmine already configured

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `RouterTestingModule` | `provideRouter([])` in providers | Angular 15+ | Use `provideRouter` in new/updated specs — `RouterTestingModule` still works but is legacy |
| `@Output() EventEmitter` | `output<T>()` signal output | Angular 17.3+ | `PlacesListComponent` already uses signal output — keep consistent |
| `@Input()` decorator | `input<T>()` signal input | Angular 17.3+ | Use `input<Place[]>([])` when converting PlacesListComponent to accept external data |

**Deprecated/outdated in this codebase:**
- `AppComponent` using inline `template` and `styles` arrays: The project convention requires separate `.html` and `.scss` files. `AppComponent` currently uses inline template — this is acceptable since it is a single `<router-outlet>` line and CLAUDE.md only mandates separate files for components with real content. Do not change `AppComponent` file structure in this phase.
- `@Inject(PLATFORM_ID)` constructor injection in `HomeComponent`: Modern Angular uses `inject(PLATFORM_ID)` at field level. However, changing this is out of scope for Phase 1.

---

## Open Questions

1. **`.env` approach vs. `fileReplacements` approach for credentials**
   - What we know: D-02 says "`.env` file, sourced via Angular `fileReplacements`." These are actually two different mechanisms — Angular `fileReplacements` swaps TypeScript files, not environment variables. A `.env` file cannot directly feed Angular `fileReplacements` without a build script.
   - What's unclear: Does the user intend (a) gitignore `environment.ts` and provide an `environment.example.ts`, OR (b) use a pre-build script that writes `environment.ts` from `.env`?
   - Recommendation: The planner should implement option (a): gitignore `environment.ts`, commit `environment.example.ts`, use `fileReplacements` to swap dev → prod at build time. This is the standard Angular pattern and satisfies the spirit of D-02/D-03 without requiring a custom build script. **Both `.env` and `environment.ts` entries should go in `.gitignore`** to cover both interpretations.

2. **`DomSanitizer.sanitize()` vs. removing `bypassSecurityTrustHtml` entirely**
   - What we know: The SVG logos are in the hardcoded theme config — they are not user-supplied. There is no actual XSS risk today.
   - What's unclear: Will the `sanitize()` approach strip valid SVG attributes that the logo rendering depends on?
   - Recommendation: If the logo SVG uses inline `<style>` or event handlers, `sanitize()` will strip them. The planner should include a build + visual check step after the fix. If the SVG breaks, fall back to rendering the logo via `<img [src]="'data:image/svg+xml;...'">` or `[src]="safeLogoUrl"` with `sanitizer.bypassSecurityTrustUrl()`.

---

## Sources

### Primary (HIGH confidence)
- Read directly from source: `frontend/angular.json` — confirmed no `fileReplacements` block exists
- Read directly from source: `frontend/src/app/pages/home/home.component.ts` — confirmed `loadMockData()`, `Math.random()`, `console.log('Toggle menu')`, `bypassSecurityTrustHtml`, 395 lines
- Read directly from source: `frontend/src/app/services/osm.service.ts` — confirmed two methods both missing null guard on `response.elements`
- Read directly from source: `frontend/src/app/components/places-list/places-list.component.ts` — confirmed `mockPlaces` array present (second mock data location)
- Read directly from source: `frontend/src/app/app.component.spec.ts` — confirmed spec tests `app.title` property and `Hello, nearly-frontend` H1, neither of which exist in current `AppComponent`
- Read directly from source: `frontend/src/app/app.component.ts` — confirmed no `title` property, inline template with `<router-outlet>`
- Read directly from source: `frontend/.gitignore` — confirmed no `.env` entry
- Read directly from source: root `.gitignore` — confirmed only `/.idea/` is present
- Angular 19 documentation (training knowledge, HIGH confidence): `fileReplacements`, `provideRouter`, signal `input()`/`output()` APIs

### Secondary (MEDIUM confidence)
- Angular CLI default project structure: `fileReplacements` is a standard Angular CLI feature included in generated projects; this project was initialized without it

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code read from source; no external library research needed
- Architecture: HIGH — all patterns are from existing codebase or Angular core APIs
- Pitfalls: HIGH — all identified by reading actual source files, not assumptions
- Angular fileReplacements / provideRouter: HIGH — core Angular CLI features, stable since Angular 15

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (Angular 19 APIs are stable; no fast-moving dependencies)
