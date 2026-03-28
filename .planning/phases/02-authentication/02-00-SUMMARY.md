---
phase: 02-authentication
plan: 00
subsystem: testing
tags: [jasmine, karma, angular, spec-scaffold, xit]

requires:
  - phase: 01-foundation-cleanup
    provides: SupabaseService and HeaderComponent exist as import targets

provides:
  - Jasmine spec scaffolds (xit stubs) for all auth-related files in Phase 2
  - Wave 0 test infrastructure: suite runs green before any auth implementation begins

affects:
  - 02-01 (fills in auth.guard.spec.ts real tests after implementing auth.guard.ts)
  - 02-02 (fills in auth-callback.component.spec.ts real tests)
  - 02-03 (fills in header.component.spec.ts auth UI tests)

tech-stack:
  added: []
  patterns:
    - "xit() stubs for not-yet-created source files — no top-level imports for missing modules"
    - "describe/beforeEach scaffold for existing source files (SupabaseService, HeaderComponent)"

key-files:
  created:
    - frontend/src/app/services/supabase.service.spec.ts
    - frontend/src/app/guards/auth.guard.spec.ts
    - frontend/src/app/pages/login/login.component.spec.ts
    - frontend/src/app/pages/auth-callback/auth-callback.component.spec.ts
    - frontend/src/app/components/header/header.component.spec.ts
  modified: []

key-decisions:
  - "Spec files for not-yet-existing source files omit top-level imports to avoid compilation errors — imports added by later plan executors"
  - "All placeholder tests use xit() (not it()) so Karma reports them as skipped, not pending failures"

patterns-established:
  - "Wave 0 spec scaffold pattern: xit() stubs document expected behaviors before implementation begins"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

duration: 8min
completed: 2026-03-28
---

# Phase 02 Plan 00: Spec Scaffold Summary

**5 Jasmine spec files with xit() stubs covering all auth components, guards, and service — test suite runs green (26 skipped, 0 failures) before any auth implementation**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-28T10:44:00Z
- **Completed:** 2026-03-28T10:52:00Z
- **Tasks:** 1
- **Files modified:** 5 created

## Accomplishments

- Created spec scaffold for `SupabaseService` (6 stubs: currentUser signal, initSession, signInWithGoogle, signOut, onAuthStateChange)
- Created stub specs for `authGuard` and `loginRedirectGuard` (5 stubs) without importing missing source files
- Created stub specs for `LoginComponent` (5 stubs) and `AuthCallbackComponent` (5 stubs) without importing missing source files
- Created spec scaffold for `HeaderComponent` (5 stubs: sign-in link, avatar, menu, sign-out dialog) with real imports
- Test suite runs: 1 real test passing, 26 xit stubs skipped — zero failures

## Task Commits

1. **Task 1: Create skeleton spec files** - `b049a24` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified

- `frontend/src/app/services/supabase.service.spec.ts` — 6 xit stubs for auth state and OAuth methods (imports SupabaseService)
- `frontend/src/app/guards/auth.guard.spec.ts` — 5 xit stubs for authGuard and loginRedirectGuard (no imports — file not yet created)
- `frontend/src/app/pages/login/login.component.spec.ts` — 5 xit stubs for LoginComponent UI and behavior (no imports)
- `frontend/src/app/pages/auth-callback/auth-callback.component.spec.ts` — 5 xit stubs for OAuth callback flow (no imports)
- `frontend/src/app/components/header/header.component.spec.ts` — 5 xit stubs for auth UI in header (imports HeaderComponent)

## Decisions Made

- Spec files for not-yet-existing source files omit top-level imports to prevent `TS2307` compilation errors — later plan executors add real imports when implementing their components
- All placeholders use `xit()` rather than `it()` so Karma marks them skipped rather than pending failures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 spec files in place; Plan 01 can immediately add real tests for `authGuard` and `LoginComponent`
- `supabase.service.spec.ts` and `header.component.spec.ts` have TestBed setup ready for real test bodies
- Wave 0 VALIDATION.md requirement satisfied — CI will remain green throughout Phase 2

---
*Phase: 02-authentication*
*Completed: 2026-03-28*
