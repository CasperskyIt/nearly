---
phase: 01-foundation-cleanup
plan: 02
subsystem: ui
tags: [angular, leaflet, signals, components, refactor]

requires: []
provides:
  - MapService with Leaflet map state ownership (initMap, destroyMap, addMarker, clearMarkers, invalidateSize, updateTileLayer)
  - MapComponent (app-map) with map lifecycle, geolocation, markers, welcome overlay, place detail panel
  - PlacesListComponent refactored to presentational — signal inputs, no mock data
  - HomeComponent slimmed to 70-line orchestrator wiring MapComponent and PlacesListComponent
affects: [phase-02-authentication, phase-07-polish]

tech-stack:
  added: []
  patterns:
    - "Service owns Leaflet map state; component only calls service methods"
    - "Presentational components receive data and callbacks via signal inputs"
    - "HomeComponent orchestrator pattern: delegates logic to children, wires via template refs"
    - "getCategoryColor/Icon/Label exposed as arrow functions on orchestrator, delegating to #mapRef"
    - "SecurityContext.HTML used for sanitize() instead of bypassSecurityTrustHtml"

key-files:
  created:
    - frontend/src/app/services/map.service.ts
    - frontend/src/app/components/map/map.component.ts
    - frontend/src/app/components/map/map.component.html
    - frontend/src/app/components/map/map.component.scss
  modified:
    - frontend/src/app/components/places-list/places-list.component.ts
    - frontend/src/app/components/places-list/places-list.component.html
    - frontend/src/app/components/places-list/places-list.component.scss
    - frontend/src/app/pages/home/home.component.ts
    - frontend/src/app/pages/home/home.component.html
    - frontend/src/app/pages/home/home.component.scss

key-decisions:
  - "MapService injected into MapComponent via inject(); map state never lives in HomeComponent"
  - "getCategoryColor/Icon/Label arrow functions on HomeComponent delegate to mapRef — avoids optional bind() in template"
  - "placesLoaded output not bound in HomeComponent template — visible places arrive exclusively via visiblePlacesChange"
  - "rating: 0 replaces Math.random() — real ratings come from data in future phases (D-08)"
  - "SecurityContext imported from @angular/core not @angular/platform-browser (Angular 19 module resolution)"

patterns-established:
  - "Pattern 1: Service-owned Leaflet state — MapService.getMap() accessor pattern for component-agnostic map operations"
  - "Pattern 2: Presentational child component receives (category: string) => string callbacks as signal inputs"
  - "Pattern 3: Orchestrator delegates via ViewChild template ref; keeps zero business logic"

requirements-completed: [FOUND-02]

duration: 25min
completed: 2026-03-28
---

# Phase 01 Plan 02: HomeComponent God Object Decomposition Summary

**HomeComponent decomposed from 395-line god object into 70-line orchestrator — MapService + MapComponent extract Leaflet lifecycle; PlacesListComponent becomes a signal-input presentational component**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-28T07:58:48Z
- **Completed:** 2026-03-28T08:23:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- MapService created with full Leaflet map state ownership: initMap, destroyMap, setTileLayer, updateTileLayer, clearMarkers, addMarker, invalidateSize
- MapComponent (app-map selector) extracts all map lifecycle, marker rendering, geolocation, dark mode toggle, zoom, welcome overlay, and place detail panel from HomeComponent
- PlacesListComponent converted to fully presentational: signal inputs for places/selectedPlace/isLoading and callback functions for category display; mock data removed
- HomeComponent reduced from 395 lines to 70 lines — pure orchestrator wiring children via template
- XSS fix: bypassSecurityTrustHtml replaced with sanitize(SecurityContext.HTML) per D-12
- Math.random() rating generation removed (D-08) — rating set to 0 pending real data source

## Task Commits

1. **Task 1: Create MapService and MapComponent** - `40a2753` (feat)
2. **Task 2: Refactor PlacesListComponent and slim HomeComponent** - `f80f99f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/src/app/services/map.service.ts` — Injectable service owning Leaflet map, markers, tile layer
- `frontend/src/app/components/map/map.component.ts` — Standalone MapComponent with lifecycle, markers, geolocation
- `frontend/src/app/components/map/map.component.html` — Map container, zoom controls, welcome overlay, place detail panel
- `frontend/src/app/components/map/map.component.scss` — Map panel styles moved from home.component.scss
- `frontend/src/app/components/places-list/places-list.component.ts` — Signal inputs, no more mock data
- `frontend/src/app/components/places-list/places-list.component.html` — Loading, empty state, card rendering
- `frontend/src/app/components/places-list/places-list.component.scss` — Card styles from home; empty/loading states
- `frontend/src/app/pages/home/home.component.ts` — 70-line orchestrator
- `frontend/src/app/pages/home/home.component.html` — Wires app-map and app-places-list
- `frontend/src/app/pages/home/home.component.scss` — Stripped to header, filters, sidebar chrome only

## Decisions Made

- `getCategoryColor/Icon/Label` exposed as arrow function properties on HomeComponent (not methods), delegating to `this.mapRef?.method()`. This avoids the Angular template type error caused by `?.bind()` returning `void` when optional chain short-circuits.
- `placesLoaded` output left unbound in HomeComponent — the visible places computed after marker filtering arrive via `visiblePlacesChange`, making the raw places load event redundant for the sidebar.
- `SecurityContext` must be imported from `@angular/core` in Angular 19, not from `@angular/platform-browser` (module resolution change).
- MapComponent exposes a public `invalidateSize()` method so HomeComponent can call it after sidebar toggle without accessing private `mapService`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SecurityContext import location corrected**
- **Found during:** Task 1 (build verification)
- **Issue:** Plan specified `import { DomSanitizer, SecurityContext } from '@angular/platform-browser'` but Angular 19 only exports SecurityContext from `@angular/core`
- **Fix:** Split import — DomSanitizer from platform-browser, SecurityContext from @angular/core
- **Files modified:** frontend/src/app/components/map/map.component.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 40a2753 (Task 1 commit)

**2. [Rule 1 - Bug] Template binding ?.bind() type error resolved**
- **Found during:** Task 2 (build verification)
- **Issue:** `mapRef?.getCategoryColor?.bind(mapRef)` returns `void` type when optional chain short-circuits — Angular strict template checking rejects assigning `void` to `(category: string) => string`
- **Fix:** Added arrow function properties to HomeComponent that delegate to mapRef with fallback defaults
- **Files modified:** frontend/src/app/pages/home/home.component.ts, home.component.html
- **Verification:** Build passes, no NG2 errors
- **Committed in:** f80f99f (Task 2 commit)

**3. [Rule 1 - Bug] MapComponent.mapService private access from HomeComponent**
- **Found during:** Task 2 (build verification)
- **Issue:** Plan's `toggleList()` called `this.mapRef?.mapService?.invalidateSize()` but mapService is private on MapComponent
- **Fix:** Added public `invalidateSize()` method on MapComponent delegating to mapService.invalidateSize()
- **Files modified:** frontend/src/app/components/map/map.component.ts, home.component.ts
- **Verification:** TS2341 error resolved, build passes
- **Committed in:** f80f99f (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All fixes were Angular 19 compatibility issues and strict template type errors caught at build time. No scope creep — same architecture, correct implementation details.

## Issues Encountered

None beyond the three auto-fixed build errors above.

## Known Stubs

- `place.rating` is always `0` — OSM data has no ratings. This stub is intentional per D-08. Ratings will come from the Supabase `reviews` table in a future phase. The rating display in PlacesListComponent and MapComponent's place detail panel renders `0.0` until then.

## Next Phase Readiness

- HomeComponent is now a clean orchestrator — Phase 2 routing/auth changes can wrap or replace it without touching map or list logic
- MapComponent is fully encapsulated — dark mode, geolocation, markers all self-contained
- PlacesListComponent accepts any Place[] via signal input — ready for Supabase data source

---
*Phase: 01-foundation-cleanup*
*Completed: 2026-03-28*
