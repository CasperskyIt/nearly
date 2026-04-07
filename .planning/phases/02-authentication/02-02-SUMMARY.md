---
phase: 02-authentication
plan: "02"
subsystem: auth
tags: [angular, supabase, google-oauth, pkce, signals, material]

requires:
  - phase: 02-01
    provides: SupabaseService with signInWithGoogle(), onAuthStateChange, currentUser signal, authGuard, loginRedirectGuard

provides:
  - LoginComponent: split-screen Google OAuth page with tenant branding, loading state, and inline error display
  - AuthCallbackComponent: PKCE exchange handler with OAuth cancellation detection and returnUrl navigation
  - AccountComponent: first protected route showing user info via currentUser() signal

affects:
  - Phase 03 (Dog Profiles) — AccountComponent proves protected route pattern works
  - Any future page using authGuard — guard/redirect/callback cycle is fully wired

tech-stack:
  added: []
  patterns:
    - "split-screen login layout: branding panel (primary color, hidden on mobile) + sign-in panel"
    - "errorMessage query param for cross-component error passing (OAuth cancellation per D-11)"
    - "onAuthStateChange subscription with explicit unsubscribe after first relevant event"
    - "returnUrl sanitisation: reject null, empty, or login-containing paths"

key-files:
  created:
    - frontend/src/app/pages/login/login.component.ts
    - frontend/src/app/pages/login/login.component.html
    - frontend/src/app/pages/login/login.component.scss
    - frontend/src/app/pages/auth-callback/auth-callback.component.ts
    - frontend/src/app/pages/auth-callback/auth-callback.component.html
    - frontend/src/app/pages/auth-callback/auth-callback.component.scss
    - frontend/src/app/pages/account/account.component.ts
    - frontend/src/app/pages/account/account.component.html
    - frontend/src/app/pages/account/account.component.scss
  modified: []

key-decisions:
  - "errorMessage passed via query param from AuthCallbackComponent to LoginComponent — avoids shared state, works across navigation boundary"
  - "AuthCallbackComponent checks error query param FIRST before subscribing to onAuthStateChange — prevents phantom subscription on cancellation path"
  - "returnUrl sanitisation rejects paths containing '/login' to prevent redirect loops"
  - "INITIAL_SESSION without session treated as silent redirect (no error shown) per D-14 — user navigated directly to /auth/callback"

patterns-established:
  - "Protected route pattern: authGuard redirects to /:app/login with returnUrl, callback navigates back after SIGNED_IN"
  - "Tenant branding via ThemeService.theme — components read theme synchronously from service getter"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

duration: 3min
completed: 2026-03-28
---

# Phase 02 Plan 02: Authentication UI Summary

**Three standalone Angular page components delivering the full Google OAuth flow: split-screen login with tenant branding, PKCE callback handler with cancellation detection, and a protected account page proving authGuard works end-to-end.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-28T09:50:54Z
- **Completed:** 2026-03-28T09:53:19Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- LoginComponent renders split-screen layout with tenant-specific branding panel and Google sign-in button; disables button with spinner during OAuth redirect; displays inline error for both sync failures and OAuth cancellation messages passed via query param
- AuthCallbackComponent checks for OAuth error query param before subscribing to auth state change — immediately redirects to login with "Sign-in was cancelled. Try again." on user cancellation; waits for SIGNED_IN event on success path, handles no-params case (INITIAL_SESSION) per D-14
- AccountComponent shows user's display name (from user_metadata.full_name), email, and initials as the first protected route, proving the full guard/redirect/callback/navigation cycle works

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LoginComponent** - `145ca1e` (feat)
2. **Task 2: Create AuthCallbackComponent and AccountComponent** - `442080a` (feat)

## Files Created/Modified

- `frontend/src/app/pages/login/login.component.ts` - Standalone component: SupabaseService OAuth trigger, loading/errorMessage signals, errorMessage query param reader
- `frontend/src/app/pages/login/login.component.html` - Split-screen layout with tenant branding panel, Google sign-in button, error display
- `frontend/src/app/pages/login/login.component.scss` - Flex layout, branding panel hidden on mobile, Google button styling
- `frontend/src/app/pages/auth-callback/auth-callback.component.ts` - PKCE exchange handler: OAuth error check, onAuthStateChange subscription, returnUrl navigation
- `frontend/src/app/pages/auth-callback/auth-callback.component.html` - Loading spinner with "Signing you in..." message
- `frontend/src/app/pages/auth-callback/auth-callback.component.scss` - Centered full-height loading container
- `frontend/src/app/pages/account/account.component.ts` - Protected page: getDisplayName() and getInitials() from currentUser() signal
- `frontend/src/app/pages/account/account.component.html` - Avatar circle with initials, display name, email
- `frontend/src/app/pages/account/account.component.scss` - Centered card layout with avatar circle

## Decisions Made

- Error messages are passed from AuthCallbackComponent to LoginComponent via `errorMessage` query param — avoids shared state and works cleanly across the navigation boundary
- AuthCallbackComponent checks the OAuth `error` query param before subscribing to `onAuthStateChange` and returns early — prevents a phantom subscription being created when the user cancelled the Google consent screen
- `returnUrl` is sanitised to reject paths containing `/login` to prevent redirect loops

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Supabase OAuth configuration (callback URL, Google provider) was handled in Plan 01.

## Next Phase Readiness

- Full auth UI cycle is wired: login → Google OAuth → callback → protected route
- Phase 03 (Dog Profiles) can rely on `authGuard` and `currentUser()` signal as established patterns
- AccountComponent is a placeholder — full account management planned for a later phase

## Self-Check: PASSED

- All 9 component files exist
- Task commits 145ca1e and 442080a both present in git log
- TypeScript compiles cleanly (npx tsc --noEmit: no output)

---
*Phase: 02-authentication*
*Completed: 2026-03-28*
