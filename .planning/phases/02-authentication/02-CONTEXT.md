# Phase 2: Authentication - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Google OAuth sign-in, persistent sessions across browser refresh, and a protected account route. Unauthenticated users are redirected to `/dogly/login`. Dog-care data routes are NOT built in this phase — they are protected in Phase 3+ as each feature ships.

</domain>

<decisions>
## Implementation Decisions

### Route protection scope
- **D-01:** The map/discovery home page (`/:app`) stays **public** — no auth required to browse places
- **D-02:** Dog-care routes (e.g. `/dogly/dogs`, `/dogly/account`) require auth; the guard is applied per-route as features are added
- **D-03:** Phase 2 ships `/dogly/account` as the first protected route — exercises the full guard/redirect/callback cycle end-to-end before Phase 3
- **D-04:** Auth guard applies to **both tenants** equally (`/dogly/*` and `/nearly/*` protected routes use the same guard function)
- **D-05:** Post-login redirect: return to the original destination the user tried to access (`returnUrl` query param pattern); fall back to `/:app` home if no return URL

### Login page design
- **D-06:** Login page at `/dogly/login` and `/nearly/login` — **split screen**: branding panel left, sign-in card right
- **D-07:** Branding panel content: app name (Dogly/Nearly) + one-line tagline describing the app; uses tenant theme colors
- **D-08:** Sign-in card: existing SVG dog logo above a single **"Sign in with Google"** button (no email/password form)
- **D-09:** While OAuth redirect initialises: button becomes **disabled + spinner** (prevents double-click; Supabase redirect is fast)
- **D-10:** Login page is **not** accessible when already authenticated — redirect to home if a logged-in user navigates to `/dogly/login`

### Auth error handling
- **D-11:** OAuth denied (user cancels consent screen) → redirect to login with inline message: **"Sign-in was cancelled. Try again."** Button re-enables
- **D-12:** Session expiry → **silent Supabase token refresh** via `supabase.auth.onAuthStateChange`; only falls back to login if the refresh token itself has expired
- **D-13:** Supabase API error during sign-in → generic inline message: **"Something went wrong. Please try again."** No raw Supabase error details shown
- **D-14:** Direct navigation to `/auth/callback` with no OAuth params → **silent redirect to `/dogly/login`** (no error shown)

### Header auth UI
- **D-15:** Auth state displayed in **`HeaderComponent`** — no changes to sidenav
- **D-16:** Signed-out state: **"Sign in" text link** in the header (subtle; discovery works without auth)
- **D-17:** Signed-in state: **circular avatar** (initials fallback until Phase 3 adds avatar upload) — clicking opens a dropdown with "My Account" and "Sign out"
- **D-18:** "My Account" navigates to `/dogly/account` (the Phase 2 protected route)
- **D-19:** Sign out requires a **confirmation dialog**: "Sign out of Dogly?" with Cancel + Sign out buttons. On confirm: sign out and redirect to `/dogly/login`

### Angular / Supabase technical constraints (from ROADMAP — locked)
- **D-20:** Session state stored as `currentUser = signal<User | null>(null)` in `SupabaseService` (not a BehaviorSubject)
- **D-21:** Route guards are **functional** (`CanActivateFn`) — not class-based
- **D-22:** Session restored on app bootstrap via **`APP_INITIALIZER`** so guards can evaluate synchronously without a redirect loop
- **D-23:** `/auth/callback` route must **not redirect** before Supabase JS parses the URL fragment (`#access_token=...`)

### Claude's Discretion
- Exact confirmation dialog component (Angular Material Dialog vs. inline — use whatever is already in the project)
- Initials extraction logic (first letter of email or display name)
- Exact tagline copy for each tenant (researcher/planner can draft based on brand)
- `returnUrl` encoding/sanitisation implementation details

</decisions>

<specifics>
## Specific Ideas

- The ROADMAP success criterion explicitly names `/dogly/dogs` as an example protected route — the guard must support path patterns, not just exact paths
- ROADMAP pitfall: "Pitfall 4 — session not restored on hard refresh — use `APP_INITIALIZER`" — this is the single most common Angular + Supabase auth mistake; must be done correctly

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Routing & guards
- `.planning/ROADMAP.md` §Phase 2 — Success criteria 2 and 3 define exact redirect behaviour and route examples (`/dogly/dogs`, `/dogly/login`)
- `frontend/src/app/app.routes.ts` — Current route structure (single `/:app` wildcard); new routes added here

### Auth state & session
- `frontend/src/app/services/supabase.service.ts` — Existing service; `currentUser` signal and `onAuthStateChange` subscription added here
- `frontend/src/environments/environment.example.ts` — Template for `supabaseUrl` and `supabaseAnonKey`; `redirectTo` URL for OAuth callback also added here

### Existing UI components to extend
- `frontend/src/app/components/header/header.component.ts` — Auth UI (sign-in link, avatar, dropdown) added to this component
- `frontend/src/app/components/welcome/welcome.component.ts` — SVG dog logo source; reuse in login page branding panel

### Database
- `supabase/schema.sql` — `profiles` table (id FK to auth.users, username, avatar_url); RLS policies are already auth-aware

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WelcomeComponent` SVG logo: already in the codebase at `frontend/src/app/components/welcome/` — extract for login page branding panel
- `ThemeService`: reads `/:app` path segment and sets CSS custom properties — login page should call this so `/dogly/login` uses Dogly colours and `/nearly/login` uses Nearly colours
- `SupabaseService`: already has `createClient(url, anonKey)` and stub `signOut()` method — extend rather than replace

### Established Patterns
- Angular 19 signals: `SupabaseService` already uses `signal()` for `places`, `loading`, `error` — `currentUser` follows the same pattern
- Standalone components: all components are standalone (no NgModules) — `LoginComponent`, `AccountComponent`, `AuthCallbackComponent` must also be standalone
- Separate `.html` + `.scss` files per component (never inline templates/styles)

### Integration Points
- `app.routes.ts`: add `{ path: ':app/login', component: LoginComponent }`, `{ path: ':app/account', component: AccountComponent, canActivate: [authGuard] }`, `{ path: 'auth/callback', component: AuthCallbackComponent }`
- `AppComponent` / `APP_INITIALIZER`: bootstrap auth session resolve before routing — inject `SupabaseService` and call `supabase.auth.getSession()` to populate `currentUser` signal
- `HeaderComponent`: inject `SupabaseService`, read `currentUser` signal — conditionally show sign-in link or avatar

</code_context>

<deferred>
## Deferred Ideas

- Avatar photo upload — Phase 3 (Dog Profiles phase adds photo upload infrastructure; user avatar follows same pattern)
- Email/password auth — out of scope; existing `signIn(email, password)` and `signUp(email, password)` stubs in `SupabaseService` should be removed in this phase to avoid confusion
- "Remember me" / persistent login toggle — unnecessary since Supabase sessions already persist by default
- Social login beyond Google (GitHub, Apple) — backlog

</deferred>

---

*Phase: 02-authentication*
*Context gathered: 2026-03-28*
