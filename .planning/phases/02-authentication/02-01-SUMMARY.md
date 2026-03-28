---
phase: 02-authentication
plan: 01
subsystem: frontend-auth
tags: [auth, supabase, oauth, google, signals, route-guards]
dependency_graph:
  requires: [02-00]
  provides: [auth-service, auth-guards, session-bootstrap, route-structure]
  affects: [frontend/src/app/services/supabase.service.ts, frontend/src/app/guards/auth.guard.ts, frontend/src/app/app.config.ts, frontend/src/app/app.routes.ts]
tech_stack:
  added: []
  patterns: [PKCE OAuth flow, Angular signals for auth state, provideAppInitializer for session hydration, functional CanActivateFn guards, lazy-loaded routes]
key_files:
  created:
    - frontend/src/app/guards/auth.guard.ts
    - frontend/src/app/pages/auth-callback/auth-callback.component.ts
    - frontend/src/app/pages/login/login.component.ts
    - frontend/src/app/pages/account/account.component.ts
  modified:
    - frontend/src/app/services/supabase.service.ts
    - frontend/src/app/app.config.ts
    - frontend/src/app/app.routes.ts
    - frontend/src/environments/environment.example.ts
    - frontend/src/environments/environment.ts
decisions:
  - "Stub page components (login, auth-callback, account) created to unblock compilation — full implementation in Plan 02"
  - "provideAppInitializer calls initSession() to hydrate currentUser signal before any route guard runs"
  - "authGuard uses router.parseUrl() (UrlTree) not imperative navigate() for correct guard return pattern"
metrics:
  duration: "2 minutes"
  completed: "2026-03-28"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 5
---

# Phase 02 Plan 01: Auth Service Foundation Summary

**One-liner:** Supabase Google OAuth wired via PKCE flow with currentUser signal, functional route guards, provideAppInitializer session bootstrap, and lazy-loaded route structure.

## What Was Built

The authentication service layer and route infrastructure for Dogly:

- **SupabaseService** now owns reactive auth state via `currentUser = signal<User | null>(null)`, hydrated by `initSession()` before routing and kept live by `onAuthStateChange`. Email/password stubs removed. Google OAuth available via `signInWithGoogle()`.
- **auth.guard.ts** exports two functional `CanActivateFn` guards: `authGuard` (redirects unauthenticated to `/:app/login?returnUrl=...`) and `loginRedirectGuard` (redirects already-authenticated users away from login).
- **app.config.ts** uses `provideAppInitializer` to call `supabase.initSession()` before Angular routing activates — ensures guards see a populated signal on first load.
- **app.routes.ts** adds `auth/callback`, `:app/login`, and `:app/account` routes in correct order (before the `:app` catch-all). All new routes use lazy loading.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 216efa2 | SupabaseService: currentUser signal, PKCE, initSession, signInWithGoogle |
| Task 2 | bee3235 | Auth guards, provideAppInitializer, wired routes with lazy-loaded stubs |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub page components to unblock TypeScript compilation**
- **Found during:** Task 2
- **Issue:** `app.routes.ts` uses `loadComponent` with `import()` pointing to `./pages/auth-callback/auth-callback.component`, `./pages/login/login.component`, and `./pages/account/account.component`. TypeScript resolves these statically and fails with TS2307 when the files don't exist.
- **Fix:** Created minimal standalone stub components (`.ts`, `.html`, `.scss`) for all three pages. Spec files already existed in auth-callback and login directories (stub-only, all `xit`). Full implementations are plan-02 deliverables.
- **Files created:** 9 files across the three page directories
- **Commit:** bee3235

## Known Stubs

| File | Description |
|------|-------------|
| `frontend/src/app/pages/auth-callback/auth-callback.component.ts` | Stub — no OAuth callback handling yet. Full implementation in Plan 02-02. |
| `frontend/src/app/pages/login/login.component.ts` | Stub — no UI, no sign-in button. Full implementation in Plan 02-02. |
| `frontend/src/app/pages/account/account.component.ts` | Stub — no user profile display. Full implementation in future plan. |

These stubs are intentional infrastructure placeholders. They do not prevent this plan's goal (auth service + guard wiring) from being achieved — they enable compilation while Plan 02-02 delivers the actual UI.

## Verification

1. `npx tsc --noEmit` — passes with zero errors
2. `grep -c 'currentUser = signal' supabase.service.ts` — returns 1
3. `grep -c 'signUp' supabase.service.ts` — returns 0
4. `grep -c 'provideAppInitializer' app.config.ts` — returns 2 (import + usage)
5. `grep -c 'authGuard' auth.guard.ts` — returns 1

## Self-Check: PASSED
