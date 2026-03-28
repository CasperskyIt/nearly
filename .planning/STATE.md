---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-28T09:52:40.040Z"
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 7
  completed_plans: 6
---

# Dogly — Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value:** Multiple people caring for one dog always know what it ate, its health status, and what's coming up — no guessing, no missed medications.
**Current focus:** Phase 02 — Authentication

## Milestone

**v1** — Dog care platform with co-guardian sharing

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Cleanup | ✓ Complete |
| 2 | Authentication | ○ Pending |
| 3 | Dog Profiles | ○ Pending |
| 4 | Co-Guardians | ○ Pending |
| 5 | Daily Care Tracking | ○ Pending |
| 6 | Health Records & Reminders | ○ Pending |
| 7 | Polish & Place Discovery | ○ Pending |

## Active Work

Phase 02 — Authentication in progress (1/3 plans complete).

**Last stopped at:** Completed 02-01-PLAN.md (auth service foundation — currentUser signal, PKCE OAuth, route guards, provideAppInitializer)

## Key Context

- Angular 19 frontend + Supabase (PostgreSQL) — no Spring Boot for v1
- Google OAuth only (no email/password auth)
- ⚠️ Supabase anon key must still be ROTATED in Supabase dashboard (key was in git history)
- Credentials now gitignored — environment.ts not tracked, environment.example.ts is the onboarding template
- RLS foundation (`dog_guardians` table + `is_dog_guardian()`) established in Phase 3
- Email reminders via Supabase Edge Function + pg_cron + Resend (not browser push)
- Verify `pg_net` extension availability before Phase 6 planning

## Decisions

| Phase | Decision |
|-------|----------|
| 01-01 | Gitignored environment.ts with real credentials + committed environment.example.ts for dev onboarding |
| 01-01 | environment.prod.ts also gitignored — prod credentials injected at CI time, never committed |
| 01-01 | provideRouter([]) used in minimal spec stub (Angular 19 standalone pattern) for router-outlet support |

---
*Initialized: 2026-03-22*

- [Phase 01-foundation-cleanup]: MapService owns Leaflet state; MapComponent delegates all map operations to it via service methods
- [Phase 01-foundation-cleanup]: getCategoryColor/Icon/Label as arrow function properties on HomeComponent to avoid Angular template type errors with optional chaining bind()
- [Phase 01-foundation-cleanup]: LoggerService uses environment.production flag — no-op in prod, delegates to console in dev
- [Phase 01-foundation-cleanup]: OSM null guard: response?.elements ?? [] before .map() prevents crash on empty Overpass responses
- [Phase 02-authentication]: Spec files for not-yet-existing source files omit top-level imports to prevent TS2307 compilation errors — later plan executors add real imports when implementing
- [Phase 02-authentication]: All placeholder tests use xit() (not it()) so Karma reports them as skipped, not pending failures
- [Phase 02-01]: Stub page components (login, auth-callback, account) created to unblock compilation — full implementation in Plan 02-02
- [Phase 02-01]: provideAppInitializer calls initSession() to hydrate currentUser signal before any route guard runs
- [Phase 02-01]: authGuard uses router.parseUrl() (UrlTree) not imperative navigate() for correct guard return pattern
- [Phase 02-authentication]: themeService.theme (public getter) used instead of themeService.currentTheme (private signal) for template access in HeaderComponent
- [Phase 02-authentication]: SignOutConfirmDialog defined in same file as HeaderComponent — acceptable for small inline-dialog components
