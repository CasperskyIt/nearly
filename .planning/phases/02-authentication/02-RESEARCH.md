# Phase 2: Authentication - Research

**Researched:** 2026-03-28
**Domain:** Angular 19 + Supabase JS v2 — Google OAuth, session persistence, functional route guards
**Confidence:** HIGH (core patterns), MEDIUM (callback route nuance)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Map/discovery home page (`/:app`) stays public — no auth required to browse places
- **D-02:** Dog-care routes (e.g. `/dogly/dogs`, `/dogly/account`) require auth; guard applied per-route as features are added
- **D-03:** Phase 2 ships `/dogly/account` as the first protected route — exercises full guard/redirect/callback cycle
- **D-04:** Auth guard applies to both tenants equally (`/dogly/*` and `/nearly/*` protected routes use the same guard function)
- **D-05:** Post-login redirect: return to original destination via `returnUrl` query param; fall back to `/:app` home
- **D-06:** Login page at `/dogly/login` and `/nearly/login` — split screen: branding panel left, sign-in card right
- **D-07:** Branding panel content: app name + one-line tagline; uses tenant theme colors
- **D-08:** Sign-in card: existing SVG dog logo above a single "Sign in with Google" button (no email/password form)
- **D-09:** While OAuth redirect initialises: button becomes disabled + spinner
- **D-10:** Login page is not accessible when already authenticated — redirect to home if logged-in user navigates to `/dogly/login`
- **D-11:** OAuth denied → redirect to login with inline message "Sign-in was cancelled. Try again." Button re-enables
- **D-12:** Session expiry → silent Supabase token refresh via `onAuthStateChange`; only falls back to login if refresh token expired
- **D-13:** Supabase API error during sign-in → generic inline message "Something went wrong. Please try again."
- **D-14:** Direct navigation to `/auth/callback` with no OAuth params → silent redirect to `/dogly/login`
- **D-15:** Auth state displayed in `HeaderComponent` — no changes to sidenav
- **D-16:** Signed-out state: "Sign in" text link in the header
- **D-17:** Signed-in state: circular avatar (initials fallback) — clicking opens a dropdown with "My Account" and "Sign out"
- **D-18:** "My Account" navigates to `/dogly/account`
- **D-19:** Sign out requires a confirmation dialog: "Sign out of Dogly?" with Cancel + Sign out buttons; on confirm: sign out and redirect to `/dogly/login`
- **D-20:** Session state: `currentUser = signal<User | null>(null)` in `SupabaseService` (not a BehaviorSubject)
- **D-21:** Route guards are functional (`CanActivateFn`) — not class-based
- **D-22:** Session restored on app bootstrap via `APP_INITIALIZER` so guards can evaluate synchronously
- **D-23:** `/auth/callback` route must not redirect before Supabase JS parses the URL fragment

### Claude's Discretion

- Exact confirmation dialog component (Angular Material Dialog vs. inline — use whatever is already in the project)
- Initials extraction logic (first letter of email or display name)
- Exact tagline copy for each tenant
- `returnUrl` encoding/sanitisation implementation details

### Deferred Ideas (OUT OF SCOPE)

- Avatar photo upload — Phase 3
- Email/password auth — out of scope; existing `signIn(email, password)` and `signUp(email, password)` stubs in `SupabaseService` should be removed
- "Remember me" / persistent login toggle — unnecessary since Supabase sessions already persist by default
- Social login beyond Google (GitHub, Apple) — backlog
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign in with Google account | `supabase.auth.signInWithOAuth({ provider: 'google' })` with PKCE flow; OAuth consent screen configured in Google Cloud Console + Supabase dashboard |
| AUTH-02 | User session persists across browser refresh (no redirect loop on hard refresh) | `provideAppInitializer` calls `supabase.auth.getUser()` before routing evaluates guards; `currentUser` signal pre-populated |
| AUTH-03 | Unauthenticated users are redirected to a login page when accessing protected routes | `authGuard: CanActivateFn` reads `currentUser()` signal, returns `router.parseUrl('/:app/login?returnUrl=...')` if null |
| AUTH-04 | User can sign out | `supabase.auth.signOut()` via MatDialog confirmation; `onAuthStateChange` fires `SIGNED_OUT` and sets `currentUser.set(null)` |
</phase_requirements>

---

## Summary

This phase wires Google OAuth into the existing Angular 19 + Supabase JS v2 codebase. The `SupabaseService` already has a `createClient` call and a stub `signOut()` — the work is to add auth state management (a `currentUser` signal), remove the email/password stubs, set up `onAuthStateChange` to keep the signal in sync, and bootstrap session restoration with `provideAppInitializer`.

Three new route components are needed: `LoginComponent` (split-screen, Google button), `AccountComponent` (placeholder protected page), and `AuthCallbackComponent` (minimal — Supabase JS handles token exchange automatically when `detectSessionInUrl: true`). The existing `HeaderComponent` gains conditional sign-in link or avatar+dropdown.

The critical correctness concern is AUTH-02: guards must not run before `getUser()` resolves. Using `provideAppInitializer` (Angular 19 idiomatic replacement for `APP_INITIALIZER`) with an async factory that awaits `supabase.auth.getUser()` satisfies this. The callback route (`/auth/callback`) must exist as a rendered Angular component that does nothing except render momentarily — Supabase JS reads the `?code=` query param from the URL automatically if `detectSessionInUrl: true` and exchanges it before routing continues.

**Primary recommendation:** Use PKCE flow (not implicit). Configure `createClient` with `auth: { flowType: 'pkce', detectSessionInUrl: true }`. Use `provideAppInitializer` to resolve session before routing. Use `CanActivateFn` returning a `UrlTree` for redirects. Store user in `signal<User | null>(null)` on `SupabaseService`, updated by `onAuthStateChange`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.99.1 (installed) | Auth client — OAuth, session, token refresh | Already in project; v2 is current major |
| `@angular/router` | 19.2.x (installed) | `CanActivateFn`, `Router`, `UrlTree`, route config | Already in project |
| `@angular/core` | 19.2.x (installed) | `signal`, `inject`, `provideAppInitializer` | Already in project |
| `@angular/material` | 19.2.x (installed) | `MatDialog`, `MatButton`, `MatMenu`, `MatSpinner` | Already in project; used in HeaderComponent |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@angular/cdk` | 19.2.x (installed) | `Overlay`, `PortalOutlet` used internally by MatDialog | Already present via MatDialog |

No new npm packages are required for this phase. All dependencies are already installed.

**Version verification:** Confirmed via `node_modules/@supabase/supabase-js/package.json` — v2.99.1 is current as of 2026-03-28.

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
frontend/src/app/
├── guards/
│   └── auth.guard.ts               # CanActivateFn — authGuard and loginRedirectGuard
├── pages/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   └── login.component.scss
│   ├── account/
│   │   ├── account.component.ts
│   │   ├── account.component.html
│   │   └── account.component.scss
│   └── auth-callback/
│       ├── auth-callback.component.ts
│       ├── auth-callback.component.html
│       └── auth-callback.component.scss
```

Existing files modified:
- `services/supabase.service.ts` — add `currentUser` signal + `onAuthStateChange` + `signInWithGoogle()` method; remove email/password stubs
- `app.config.ts` — add `provideAppInitializer`
- `app.routes.ts` — add login, account, auth-callback routes
- `components/header/header.component.ts` — inject `SupabaseService`, read signal, show sign-in link or avatar
- `environments/environment.example.ts` — add `redirectTo` URL field

### Pattern 1: Supabase Client with PKCE

Configure `createClient` to use PKCE and auto-detect session in URL.

```typescript
// Source: supabase.com/docs/guides/auth/sessions/pkce-flow
this.supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
    }
  }
);
```

With `flowType: 'pkce'`, Google's callback delivers a `?code=` query param. Supabase JS automatically calls `exchangeCodeForSession(code)` when `detectSessionInUrl: true`. The `AuthCallbackComponent` does not need to call anything manually — it just needs to exist as a routed component long enough for the SDK to process the URL.

### Pattern 2: `currentUser` Signal + `onAuthStateChange`

```typescript
// Source: supabase.com/docs/reference/javascript/auth-onauthstatechange
currentUser = signal<User | null>(null);

constructor() {
  this.supabase = createClient(/* ... with PKCE */);

  this.supabase.auth.onAuthStateChange((event, session) => {
    this.currentUser.set(session?.user ?? null);
  });
}
```

`onAuthStateChange` fires for: `INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`. Setting the signal in the callback keeps it current for silent refresh (D-12). Do not subscribe inside `ngOnInit` — subscribe in constructor so it is live from the moment the service is created.

### Pattern 3: `provideAppInitializer` for Session Bootstrap (AUTH-02)

This is the solution to the hard-refresh pitfall. Guards run synchronously against the signal; the signal must be populated before the first route evaluation.

```typescript
// Source: angular.dev/api/core/provideAppInitializer
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideAppInitializer(() => {
      const supabase = inject(SupabaseService);
      return supabase.initSession();
    }),
  ]
};
```

```typescript
// In SupabaseService
async initSession(): Promise<void> {
  const { data: { user } } = await this.supabase.auth.getUser();
  this.currentUser.set(user);
}
```

`provideAppInitializer` accepts a function that returns a `Promise` or `Observable`. Bootstrap blocks until the promise resolves. Guards then see a pre-populated signal and evaluate correctly on hard refresh.

**Note:** `provideAppInitializer` is the Angular 19 idiomatic API, replacing the older `{ provide: APP_INITIALIZER, useFactory: ..., multi: true }` token pattern. Both work; `provideAppInitializer` is cleaner.

### Pattern 4: Functional Route Guards with `UrlTree` Redirect

```typescript
// Source: angular.dev/guide/routing/route-guards
// In guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() !== null) {
    return true;
  }

  // Preserve return URL for post-login redirect (D-05)
  return router.parseUrl(
    `/${route.paramMap.get('app') ?? 'dogly'}/login?returnUrl=${encodeURIComponent(state.url)}`
  );
};

// Guard to prevent authenticated users from accessing /login (D-10)
export const loginRedirectGuard: CanActivateFn = (route) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() === null) {
    return true;
  }

  return router.parseUrl(`/${route.paramMap.get('app') ?? 'dogly'}`);
};
```

Returning a `UrlTree` (via `router.parseUrl(...)`) is the canonical Angular approach — the router applies the redirect in a single navigation, preventing duplicate history entries.

### Pattern 5: Route Configuration

```typescript
// In app.routes.ts
export const routes: Routes = [
  { path: ':app', component: HomeComponent },
  {
    path: ':app/login',
    component: LoginComponent,
    canActivate: [loginRedirectGuard],
  },
  {
    path: ':app/account',
    component: AccountComponent,
    canActivate: [authGuard],
  },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: 'nearly' },
];
```

The `auth/callback` route has no guard. Supabase's OAuth redirectTo URL must be set to `<origin>/auth/callback`. The Angular router renders `AuthCallbackComponent`, and the SDK detects the `?code=` in the URL, exchanges it, fires `onAuthStateChange` with `SIGNED_IN`, which updates `currentUser`. The component then reads the `returnUrl` from query params (if present) and navigates.

### Pattern 6: `signInWithOAuth` Call

```typescript
// Source: supabase.com/docs/reference/javascript/auth-signinwithoauth
async signInWithGoogle(redirectUrl?: string): Promise<void> {
  const { error } = await this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: environment.authCallbackUrl, // e.g. 'https://yourapp.com/auth/callback'
    },
  });
  if (error) throw error;
}
```

The `LoginComponent` catches this error to show the D-13 generic message. The button sets a local `loading = signal(false)` to `true` before the call (D-09), then re-enables on error (D-11).

### Pattern 7: `HeaderComponent` Auth UI

```typescript
// Inject the service; read the signal in the template
export class HeaderComponent {
  protected supabase = inject(SupabaseService);
  protected isSigningOut = signal(false);

  protected getInitials(): string {
    const user = this.supabase.currentUser();
    if (!user) return '';
    const name = user.user_metadata?.['full_name'] as string | undefined;
    if (name) return name.charAt(0).toUpperCase();
    return (user.email ?? '').charAt(0).toUpperCase();
  }
}
```

Template uses `@if (supabase.currentUser() !== null)` to switch between sign-in link and avatar. Avatar dropdown uses `MatMenu` (already imported via `MatButtonModule` project). Sign-out opens `MatDialog` with a confirmation component (D-19).

### Anti-Patterns to Avoid

- **Reading session inside route guard via `getSession()`:** `getSession()` reads from localStorage without hitting the auth server — the data may be stale or tampered. Always use `getUser()` in `initSession()` for the bootstrap call. Inside guards, read the pre-populated signal (already validated by `getUser()`).
- **Class-based guards (`implements CanActivate`):** Deprecated since Angular 15. The project explicitly requires functional `CanActivateFn` (D-21).
- **Navigating imperatively inside the guard:** Return a `UrlTree` from `router.parseUrl(...)` instead of calling `router.navigate(...)` and returning `false`. Imperative navigation inside guards can cause double navigation and broken back-button behaviour.
- **Using implicit flow (hash fragments):** Implicit flow puts `#access_token=...` in the URL fragment. Angular's HTML5 router uses the path — the fragment is preserved, but Angular history pushes can strip it on navigation events. PKCE delivers a `?code=` query param instead, which survives Angular routing cleanly.
- **Hash-based Angular router:** The project uses the default `provideRouter` (PathLocationStrategy, not hash routing). Do not switch to `HashLocationStrategy` — it is incompatible with Supabase OAuth redirects per official Supabase docs.
- **Subscribing to `onAuthStateChange` in a component:** Subscribe in the `SupabaseService` constructor so there is exactly one subscription for the lifetime of the app. Components read the signal reactively.
- **Calling `supabase.auth.signOut()` without MatDialog confirmation:** D-19 requires confirmation before sign-out.
- **Removing email/password stubs without a plan:** The `signIn(email, password)` and `signUp(email, password)` methods in `SupabaseService` should be removed in this phase (CONTEXT.md deferred section) — but their removal must not break existing tests.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token refresh | Custom JWT expiry polling | `onAuthStateChange` + `TOKEN_REFRESHED` event | Supabase SDK handles refresh window automatically |
| Secure token storage | localStorage wrapper | Supabase SDK internal storage (handles localStorage + secure cookie fallback) | SDK manages storage, expiry, and PKCE verifier cleanup |
| PKCE code verifier | Manual crypto.subtle SHA-256 | `createClient` with `flowType: 'pkce'` | SDK generates and stores verifier; `exchangeCodeForSession` consumes it |
| OAuth callback parsing | Manually parse `window.location` | `detectSessionInUrl: true` on `createClient` | SDK parses `?code=` and calls exchange automatically |
| Session hydration on refresh | Cookie reading / manual localStorage parse | `provideAppInitializer` + `supabase.auth.getUser()` | `getUser()` makes a verified server-side network call; SDK handles token from storage |
| Confirmation dialog | Custom `confirm()` or `window.confirm()` | `MatDialog` (already in project) | Native browser `confirm()` is unblockable, ugly, and untestable |

**Key insight:** Supabase JS v2 handles the full OAuth lifecycle — code exchange, token refresh, storage — as long as `createClient` is configured with PKCE and the callback route exists. The Angular layer's only job is (1) call `signInWithOAuth`, (2) provide a routed `/auth/callback` component, and (3) keep the `currentUser` signal in sync via `onAuthStateChange`.

---

## Common Pitfalls

### Pitfall 1: Hard Refresh Redirect Loop (AUTH-02 — the critical one)

**What goes wrong:** Guard runs before `getUser()` resolves. `currentUser()` is `null`. Guard redirects to login. After login, same thing happens. User is locked out of their own session on every hard refresh.

**Why it happens:** Angular evaluates route guards synchronously on the first navigation event. If the auth service has not yet called `getUser()`, the signal is `null` regardless of a valid stored session.

**How to avoid:** Use `provideAppInitializer` with an async function that awaits `supabase.auth.getUser()` and sets `currentUser`. Angular blocks routing until the initializer resolves.

**Warning signs:** Login works, but navigating directly to a URL or pressing F5 redirects to login even with a valid session.

### Pitfall 2: `AuthCallbackComponent` Redirecting Too Early (D-23)

**What goes wrong:** `AuthCallbackComponent`'s `ngOnInit` immediately calls `router.navigate(['/dogly'])`. Supabase JS has not had a chance to call `exchangeCodeForSession` from the `?code=` in the URL. The code is consumed but the session is not written. The user ends up unauthenticated.

**Why it happens:** `detectSessionInUrl: true` causes Supabase to detect and exchange the code during client initialization (inside the `createClient` call or when the page loads), but this is asynchronous. If the Angular component navigates away synchronously in `ngOnInit`, the URL containing `?code=` is gone before the exchange completes.

**How to avoid:** `AuthCallbackComponent` should wait for `onAuthStateChange` to emit `SIGNED_IN` before navigating, OR listen for `currentUser()` to become non-null. A simple implementation: subscribe to `onAuthStateChange` in the component, and navigate on `SIGNED_IN` event. Do not navigate in `ngOnInit` based on current state alone.

**Warning signs:** Auth callback URL is visited, page loads briefly, then user is on the home page but signed out. Console may show "invalid code" or "code already used" errors from Supabase.

### Pitfall 3: `returnUrl` Contains the Login Page URL

**What goes wrong:** User is on `/dogly/login`. `returnUrl` is set to `/dogly/login`. After sign-in, the app redirects back to `/dogly/login` (which then redirects to home via `loginRedirectGuard`). Double redirect, flash of login page.

**Why it happens:** The guard incorrectly stores the current URL including the login path when the user directly navigated to login.

**How to avoid:** In `AuthCallbackComponent`, strip any `returnUrl` that is a login path. Sanitise: `if (returnUrl.includes('/login')) returnUrl = '/:app'`.

**Warning signs:** After sign-in, the browser briefly shows the login page before redirecting to home.

### Pitfall 4: `getUser()` vs `getSession()` in `initSession()`

**What goes wrong:** Using `getSession()` in `initSession()` (inside `provideAppInitializer`) returns unverified local storage data. A tampered token could allow an invalid session to populate `currentUser`.

**Why it happens:** `getSession()` does not hit the network — it reads from localStorage directly. For the bootstrap case, we need a verified network call.

**How to avoid:** Use `supabase.auth.getUser()` in `initSession()`. It makes a network call to verify the token. Note: `getUser()` can be slow on poor connections — this is a trade-off against security. In practice, the app will show a loading state during `provideAppInitializer` resolution.

**Warning signs:** Supabase console warnings in browser developer tools: "Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure."

### Pitfall 5: Multi-Tenant Route Param in Guard

**What goes wrong:** The `authGuard` redirects to a hardcoded `/dogly/login` instead of `/:app/login`. A Nearly user is redirected to `/dogly/login` with Dogly branding.

**Why it happens:** Guard doesn't read the `:app` route parameter.

**How to avoid:** In the `CanActivateFn`, read `route.paramMap.get('app')` for the tenant prefix. Fall back to `'dogly'` if null. Always build redirect URLs dynamically: `/${app}/login?returnUrl=...`.

**Warning signs:** Nearly-branded users see Dogly login page after being redirected by auth guard.

### Pitfall 6: `onAuthStateChange` Subscribed Multiple Times

**What goes wrong:** If `onAuthStateChange` is called in multiple places (e.g., once in `SupabaseService` constructor and once in a component), each subscription is independent. The component subscription is not unsubscribed when the component is destroyed. Multiple signal-setting calls fire for each auth event.

**Why it happens:** Supabase JS `onAuthStateChange` returns a subscription object with an `unsubscribe` function. If you don't call it, the listener stays alive.

**How to avoid:** Subscribe exactly once in the `SupabaseService` constructor. Components read `currentUser()` signal — they don't subscribe to auth events directly.

---

## Code Examples

Verified patterns from official sources and confirmed against installed library version (2.99.1):

### `SupabaseService` — Auth Methods (full diff)

```typescript
// Source: supabase.com/docs/guides/auth/sessions/pkce-flow
//         supabase.com/docs/reference/javascript/auth-onauthstatechange
import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  supabase: SupabaseClient;
  private logger = inject(LoggerService);

  places = signal<Place[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentUser = signal<User | null>(null);  // ADD

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          flowType: 'pkce',       // ADD
          detectSessionInUrl: true, // ADD
        }
      }
    );

    // ADD: keep currentUser signal in sync for the lifetime of the app
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  // ADD: called by provideAppInitializer before routing starts
  async initSession(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser.set(user);
  }

  // ADD: replaces the stub signIn(email, password)
  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: environment.authCallbackUrl,
      },
    });
    if (error) throw error;
  }

  // KEEP: signOut() stub is already correct
  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // REMOVE: signUp(email, password) and signIn(email, password)
}
```

### `app.config.ts` — `provideAppInitializer`

```typescript
// Source: angular.dev/api/core/provideAppInitializer
import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideAppInitializer } from '@angular/core';
import { routes } from './app.routes';
import { SupabaseService } from './services/supabase.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideAppInitializer(() => {
      const supabase = inject(SupabaseService);
      return supabase.initSession();
    }),
  ]
};
```

### Auth Guard

```typescript
// Source: angular.dev/guide/routing/route-guards (CanActivateFn pattern)
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() !== null) {
    return true;
  }

  const app = route.paramMap.get('app') ?? 'dogly';
  const returnUrl = encodeURIComponent(state.url);
  return router.parseUrl(`/${app}/login?returnUrl=${returnUrl}`);
};

export const loginRedirectGuard: CanActivateFn = (route) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() === null) {
    return true;
  }

  const app = route.paramMap.get('app') ?? 'dogly';
  return router.parseUrl(`/${app}`);
};
```

### `AuthCallbackComponent` — Waiting for SIGNED_IN

```typescript
// Source: pattern derived from supabase.com/docs/guides/auth/sessions/pkce-flow
@Component({ standalone: true, template: '<p>Signing you in...</p>' })
export class AuthCallbackComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Wait for PKCE exchange to complete (onAuthStateChange fires SIGNED_IN)
    const { data: { subscription } } = this.supabase.supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const sanitised = returnUrl && !returnUrl.includes('/login')
            ? returnUrl
            : null;
          this.router.navigateByUrl(sanitised ?? '/dogly');
        } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
          subscription.unsubscribe();
          this.router.navigateByUrl('/dogly/login');
        }
      }
    );
  }
}
```

### Tagline Copy (Claude's Discretion)

| Tenant | Tagline |
|--------|---------|
| Dogly | "Your dog's world, organised." |
| Nearly | "Discover what's close." |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `{ provide: APP_INITIALIZER, useFactory, multi: true }` | `provideAppInitializer(() => fn())` | Angular 14.1+ (stable in 17+) | Cleaner; no factory boilerplate; same semantics |
| Class-based guards (`implements CanActivate`) | `CanActivateFn` functional guard | Angular 15 (deprecated class guards in 16) | Less DI wiring; testable as plain functions |
| `supabase.auth.signIn()` (v1) | `supabase.auth.signInWithOAuth()` (v2) | Supabase JS v2.0 (2022) | Different method name; v1 no longer relevant |
| Implicit flow (`#access_token` fragment) | PKCE flow (`?code=` query param) | Supabase JS v2 default | Safer; survives Angular router navigation; no hash stripping risk |
| `BehaviorSubject<User>` for auth state | `signal<User \| null>(null)` | Angular 16+ (signals GA) | Zoneless-compatible; no `async` pipe needed in templates |

**Deprecated / to remove:**
- `signUp(email: string, password: string)` — remove from `SupabaseService` (out of scope per CONTEXT.md deferred section)
- `signIn(email: string, password: string)` — remove from `SupabaseService`
- `getUser()` method on `SupabaseService` — rename to `fetchCurrentUser()` or remove; `currentUser` signal is the canonical source going forward

---

## Open Questions

1. **Supabase Google OAuth "Authorized Redirect URIs" setup**
   - What we know: The Supabase dashboard Google provider page requires `<project>.supabase.co/auth/v1/callback` as the redirect in Google Cloud Console; the Angular app sets `redirectTo: environment.authCallbackUrl` pointing to `<origin>/auth/callback`
   - What's unclear: Whether the local dev URL (`http://localhost:4200/auth/callback`) must be explicitly added to the Supabase dashboard's "Redirect URLs" allow list — this is a dashboard configuration step, not a code step
   - Recommendation: Plan should include a wave-0 task noting the developer must: (a) create Google Cloud OAuth credentials, (b) set the Supabase redirect URL, (c) add `localhost:4200/auth/callback` to the Supabase allowed redirect list

2. **`provideAppInitializer` availability in Angular 19.2**
   - What we know: `provideAppInitializer` was added in Angular 14.1 and is documented on `angular.dev`; the project is on Angular 19.2.x
   - What's unclear: The exact module path to import from (`@angular/core` vs a sub-path)
   - Recommendation: Import from `@angular/core` — it is a top-level export. Verify with `import { provideAppInitializer } from '@angular/core'` in TypeScript — compiler will error immediately if it doesn't exist

3. **MatDialog in standalone context for sign-out confirmation**
   - What we know: CONTEXT.md gives discretion on "Angular Material Dialog vs. inline". `MatDialog` is already used in the project (Angular Material is installed)
   - What's unclear: Whether a separate standalone `ConfirmDialogComponent` is worth creating for just this one dialog in this phase, vs. an inline confirmation approach
   - Recommendation: Use `MatDialog` with a small inline `ConfirmDialogComponent` defined in the same file as `HeaderComponent` (exported separately for testability). This avoids a new file for a 10-line component while remaining testable.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine 5.6 |
| Config file | `frontend/angular.json` (architect.test.builder) |
| Quick run command | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` |
| Full suite command | `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `signInWithGoogle()` calls `supabase.auth.signInWithOAuth` with `provider: 'google'` | unit | `npm test -- --include=**/supabase.service.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-01 | `LoginComponent` disables button and shows spinner on click | unit | `npm test -- --include=**/login.component.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-02 | `initSession()` calls `getUser()` and sets `currentUser` signal | unit | `npm test -- --include=**/supabase.service.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-02 | `authGuard` returns `true` when `currentUser()` is non-null | unit | `npm test -- --include=**/auth.guard.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-03 | `authGuard` returns `UrlTree` to `/:app/login?returnUrl=...` when `currentUser()` is null | unit | `npm test -- --include=**/auth.guard.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-03 | `loginRedirectGuard` redirects authenticated user to `/:app` | unit | `npm test -- --include=**/auth.guard.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-04 | `signOut()` calls `supabase.auth.signOut()` | unit | `npm test -- --include=**/supabase.service.spec.ts --watch=false` | ❌ Wave 0 |
| AUTH-04 | `onAuthStateChange` SIGNED_OUT sets `currentUser` to null | unit | `npm test -- --include=**/supabase.service.spec.ts --watch=false` | ❌ Wave 0 |

**Manual-only:** Full OAuth round-trip (Google consent screen → callback → protected route) — requires real Google credentials and browser interaction; cannot be automated in Karma.

### Sampling Rate

- **Per task commit:** `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
- **Per wave merge:** Same (single suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/app/services/supabase.service.spec.ts` — covers AUTH-01, AUTH-02, AUTH-04 (mock `@supabase/supabase-js` `createClient`)
- [ ] `frontend/src/app/guards/auth.guard.spec.ts` — covers AUTH-02, AUTH-03
- [ ] `frontend/src/app/pages/login/login.component.spec.ts` — covers AUTH-01 button state

**Existing test:** `app.component.spec.ts` passes — do not regress it.

---

## Sources

### Primary (HIGH confidence)

- `supabase.com/docs/guides/auth/sessions/pkce-flow` — PKCE flow mechanics, `detectSessionInUrl`, `exchangeCodeForSession`
- `supabase.com/docs/guides/auth/social-login/auth-google` — Google OAuth setup steps, redirect URI configuration
- `angular.dev/api/core/provideAppInitializer` — `provideAppInitializer` signature, async Promise support
- `angular.dev/guide/routing/route-guards` — `CanActivateFn`, `inject()` inside guards, `UrlTree` redirect pattern
- `supabase.com/docs/reference/javascript/auth-onauthstatechange` — event types, session parameter, security note on `getUser()` vs `getSession()`
- Installed library versions confirmed via `node_modules/` inspection

### Secondary (MEDIUM confidence)

- `supabase.com/docs/guides/auth/sessions/implicit-flow` — documents that hash-based routers are incompatible with implicit flow; supports PKCE recommendation
- Angular 19 `provideAppInitializer` replacing `APP_INITIALIZER` token — confirmed via angular.dev docs (multi-source)

### Tertiary (LOW confidence — flag for validation)

- `AuthCallbackComponent` `onAuthStateChange` pattern for detecting `SIGNED_IN` — derived from PKCE flow docs; exact Angular pattern not in an official Angular+Supabase guide. Verify by testing the callback flow manually.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; versions verified from `node_modules`
- Architecture: HIGH — `CanActivateFn`, `provideAppInitializer`, Supabase PKCE all from official docs
- Pitfalls: HIGH for pitfalls 1/2/4/5/6 (official sources); MEDIUM for pitfall 3 (derived from known OAuth pattern)
- Auth callback timing: MEDIUM — `detectSessionInUrl` auto-exchange is documented; the exact Angular lifecycle timing of the callback component is inferred, not from an official Angular+Supabase example

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (Supabase JS v2 is stable; Angular 19 is current major — low churn expected in 30 days)
