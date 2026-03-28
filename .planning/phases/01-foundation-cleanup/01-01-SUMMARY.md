---
phase: 01-foundation-cleanup
plan: 01
subsystem: infra
tags: [supabase, angular, environment, credentials, gitignore, testing, karma]

requires: []
provides:
  - Gitignored environment.ts with real dev credentials (not committed)
  - Committed environment.example.ts with placeholder credentials for new devs
  - fileReplacements in angular.json enabling production credential swap
  - Passing test suite (app.component.spec.ts with provideRouter stub)
affects:
  - All future plans (npm test is now a reliable verification gate)
  - Phase 02 (authentication will use environment credentials pattern)

tech-stack:
  added: []
  patterns:
    - "Credentials pattern: real credentials in gitignored environment.ts, placeholders in committed environment.example.ts"
    - "Angular production fileReplacements: environment.ts -> environment.prod.ts at build time"
    - "Minimal spec stub: provideRouter([]) required for components using router-outlet"

key-files:
  created:
    - frontend/src/environments/environment.example.ts
  modified:
    - frontend/angular.json
    - frontend/.gitignore
    - .gitignore
    - frontend/src/app/app.component.spec.ts

key-decisions:
  - "environment.prod.ts is also gitignored — prod credentials must be injected at CI time, not committed"
  - "Minimal spec uses provideRouter([]) not RouterTestingModule (Angular 19 standalone pattern)"
  - "app.component.spec.ts tests only component creation — AppComponent has no title property, template is only router-outlet"

patterns-established:
  - "Env credentials pattern: gitignored environment.ts + committed environment.example.ts"
  - "Angular standalone test pattern: provideRouter([]) for components with router-outlet"

requirements-completed: [FOUND-01]

duration: 2min
completed: 2026-03-28
---

# Phase 01 Plan 01: Credentials Security & Test Fix Summary

**Supabase anon key removed from git tracking via gitignored environment.ts, example template committed, Angular fileReplacements wired, test suite green with provideRouter stub**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-28T08:25:22Z
- **Completed:** 2026-03-28T08:27:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Supabase credentials no longer tracked in git — environment.ts and environment.prod.ts removed from index via `git rm --cached`
- environment.example.ts created as onboarding template showing required credential keys
- angular.json production config now has fileReplacements (environment.ts -> environment.prod.ts) enabling CI-time injection
- app.component.spec.ts replaced with a minimal passing stub — `npm test` exits 0, green baseline for all future plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Secure credentials** - `dacd1ff` (chore)
2. **Task 2: Fix broken spec** - `5f26393` (fix)

## Files Created/Modified
- `frontend/src/environments/environment.example.ts` - Placeholder credential template for new developer onboarding
- `frontend/angular.json` - Added fileReplacements under production configuration
- `frontend/.gitignore` - Added environment.ts, environment.prod.ts, .env entries
- `.gitignore` - Added .env entry
- `frontend/src/app/app.component.spec.ts` - Replaced broken spec with minimal passing stub using provideRouter

## Decisions Made
- `environment.prod.ts` is gitignored as well as `environment.ts` — production credentials must be injected at CI/CD time
- Used `provideRouter([])` (Angular 19 standalone pattern) rather than `RouterTestingModule` (deprecated NgModule pattern)
- Test covers only component creation — AppComponent has no `title` property and its template is just `<router-outlet>`, so a title check would immediately fail

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Supabase anon key rotation is required.** The key that was committed to git history (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) must be rotated in the Supabase dashboard:

1. Go to: Supabase Dashboard > Project Settings > API
2. Click "Reset" next to the anon public key
3. Copy the new key into your local `frontend/src/environments/environment.ts`
4. Verify the app still connects to Supabase after rotation

Until key rotation, the exposed key remains active and the project is at security risk.

## Next Phase Readiness
- Test suite is green — `npm test` is a reliable verification gate for all future plans
- Credential pattern established — future devs clone the repo, copy environment.example.ts to environment.ts, fill in credentials
- Production build succeeds — fileReplacements confirmed working (aside from pre-existing Leaflet CommonJS warning, unrelated to this plan)
- Ready for Phase 02: Authentication

---
*Phase: 01-foundation-cleanup*
*Completed: 2026-03-28*
