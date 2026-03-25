# Phase 1: Foundation & Cleanup - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain> 
## Phase Boundary

Secure the codebase (rotate and move credentials to env vars), decompose the HomeComponent god object into smaller components, and remove all mock data and console logs. No new routes or features — cleanup only.

</domain>

<decisions>
## Implementation Decisions

### Credential handling
- **D-01:** Rotate the Supabase anon key (existing key is in git history — must be invalidated)
- **D-02:** Move `supabaseUrl` and `supabaseAnonKey` to `.env` file, sourced via Angular `fileReplacements` in `angular.json`
- **D-03:** Add `.env` to `.gitignore`; provide `.env.example` with placeholder values

### HomeComponent decomposition
- **D-04:** Extract map lifecycle into `MapComponent` (`frontend/src/app/components/map/`)
- **D-05:** Extract place list display into `PlaceListComponent` (already exists at `components/places-list/` — consolidate)
- **D-06:** Extract map state/logic into `MapService` (`frontend/src/app/services/`)
- **D-07:** `HomeComponent` becomes an orchestrator under 100 lines — it wires the above together

### Mock data & logging
- **D-08:** Remove `loadMockData()`, `Math.random()` ratings, and all hardcoded place data entirely (no env flag)
- **D-09:** Replace `console.log`/`console.error` with a `LoggerService` that is a no-op when `environment.production` is true
- **D-10:** Add null guard for `response.elements` in `osm.service.ts`

### Tests
- **D-11:** Delete `app.component.spec.ts` and replace with a minimal stub that passes (title check only)

### XSS fix
- **D-12:** Fix `bypassSecurityTrustHtml` for SVG logo — scope it to Phase 1 since it's in the component being refactored anyway

### Claude's Discretion
- Exact `LoggerService` API design
- Whether to use Angular's `environment.ts` injection or a dedicated log level config
- `MapService` internal structure

</decisions>

<specifics>
## Specific Ideas

No specific design references — this is cleanup work.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase state
- `.planning/codebase/CONCERNS.md` — full list of issues to address (credential exposure, mock data, console logs, XSS, broken tests)
- `.planning/codebase/STRUCTURE.md` — current directory layout and component locations
- `.planning/codebase/CONVENTIONS.md` — Angular patterns to follow when extracting components

### Requirements
- `.planning/REQUIREMENTS.md` — FOUND-01, FOUND-02, FOUND-03

### Key source files (read before touching)
- `frontend/src/app/pages/home/home.component.ts` — the god object being decomposed
- `frontend/src/environments/environment.ts` — credentials to move
- `frontend/src/app/services/osm.service.ts` — null guard fix
- `frontend/angular.json` — fileReplacements config for env vars

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `places-list` component already exists — HomeComponent's place list extraction should consolidate with it, not duplicate
- `header`, `filters`, `welcome` components already extracted — follow same standalone component pattern

### Established Patterns
- Standalone Angular components (no NgModules)
- Separate `.html` and `.scss` files — never inline
- Angular signals for reactive state (used in `SupabaseService`)

### Integration Points
- `HomeComponent` is the single route target — decomposition must keep it as the entry point
- `ThemeService` injects into HomeComponent for logo/colors — must remain accessible after split

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-cleanup*
*Context gathered: 2026-03-22*
