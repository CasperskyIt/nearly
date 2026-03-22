# Technology Stack

**Project:** Dogly — Shared Dog Care Platform
**Researched:** 2026-03-22
**Confidence:** MEDIUM (WebSearch/WebFetch disabled; based on training knowledge through August 2025 + direct codebase inspection)

---

## Existing Stack (Confirmed from Codebase)

These are already installed and in use. Do not replace them.

| Technology | Version (package.json) | Status |
|------------|------------------------|--------|
| Angular | 19.2.x | Active — standalone, signals-based |
| Angular Material | 19.2.19 | Active — UI components |
| RxJS | 7.8.0 | Active — reactive streams |
| @supabase/supabase-js | 2.99.1 | Active — DB + Auth client |
| zone.js | 0.15.0 | Active — Angular change detection |
| TypeScript | 5.7.2 | Active — strict mode enabled |
| Leaflet | 1.9.4 | Active — maps (Nearly module) |

---

## Recommended Stack (New Libraries to Add)

### Authentication — Google OAuth via Supabase

**Recommendation:** Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })` from the existing `@supabase/supabase-js` 2.99.1 client. No additional library needed.

**Why:** `supabase-js` 2.x has first-class OAuth support. The existing `SupabaseService` already wraps the client. The current `signIn`/`signUp` methods (email/password) simply get replaced or supplemented with `signInWithOAuth`. Supabase handles the PKCE flow, token exchange, and session persistence automatically via `localStorage`.

**What to configure (outside of code):**
- Enable Google provider in Supabase Dashboard > Authentication > Providers
- Add Google OAuth credentials (Client ID + Secret from Google Cloud Console)
- Add `<your-supabase-project>.supabase.co/auth/v1/callback` as an Authorized Redirect URI in Google Cloud Console
- Add a `/auth/callback` route in Angular that calls `supabase.auth.getSession()` to finalize the session

**Confidence:** HIGH — This is the standard Supabase OAuth flow documented since v2.0 and has not changed through my knowledge cutoff.

**What NOT to use:**
- `@angular/fire` + Firebase Auth — unnecessary, doubles auth infrastructure
- Custom JWT handling — Supabase handles this
- `angular-oauth2-oidc` — adds complexity when Supabase's built-in OAuth redirect flow handles everything

---

### Session Management / Auth State in Angular

**Recommendation:** Use `supabase.auth.onAuthStateChange()` wrapped in an Angular Signal inside `SupabaseService`. Expose a `currentUser = signal<User | null>(null)`.

**Why:** Angular 19 signals are the idiomatic reactivity primitive (replacing BehaviorSubjects). `onAuthStateChange` fires on login, logout, and token refresh. Wrapping it in a signal gives the entire app reactive read access without subscribing everywhere.

**Pattern:**
```typescript
// In SupabaseService constructor
this.supabase.auth.onAuthStateChange((event, session) => {
  this.currentUser.set(session?.user ?? null);
});
```

**Confidence:** HIGH — Angular 19 signals + supabase-js v2 onAuthStateChange is the established pattern.

---

### Route Guards (Auth Protection)

**Recommendation:** Angular functional route guards (introduced in Angular 15, standard in 19) using `inject(SupabaseService)`.

**Why:** The app uses standalone components with functional config (`appConfig`). Functional guards (`canActivate: [() => inject(AuthGuard).canActivate()]` or inline arrow functions) are the Angular 19-idiomatic approach. No class-based guards needed.

**Confidence:** HIGH — Confirmed from `app.config.ts` which uses standalone/functional patterns throughout.

---

### Image Upload — Dog Avatars

**Recommendation:** **Supabase Storage** via the existing `@supabase/supabase-js` client. No additional library needed.

**Why:** Supabase Storage is purpose-built for this — it sits alongside the database, shares RLS policies, and is accessible via the same client already initialized. For dog avatar images, create a `dog-avatars` bucket with per-user folder paths (`{user_id}/{dog_id}/avatar.jpg`). The Storage API returns a public URL that stores directly in the `dogs` table's `avatar_url` column.

**Key APIs (already in supabase-js 2.x):**
- `supabase.storage.from('dog-avatars').upload(path, file)`
- `supabase.storage.from('dog-avatars').getPublicUrl(path)`
- `supabase.storage.from('dog-avatars').remove([path])`

**Image resizing:** Supabase Storage supports transform parameters (`?width=200&height=200&resize=cover`) on public URLs for free-tier projects. No additional image processing library required for thumbnails.

**What NOT to use:**
- Cloudinary — costs money, extra SDK, unnecessary for avatar-scale images
- AWS S3 — breaks the "no additional backend" constraint; Supabase Storage IS S3-backed
- Firebase Storage — wrong ecosystem

**Confidence:** MEDIUM — Supabase Storage has been available and stable since 2022. Transform API (image resizing via URL params) was GA in 2023. Verify transform API availability on your Supabase plan tier.

---

### Reminders / Notifications

This is the most architecturally significant decision. There are two distinct sub-problems:

#### A. In-App Reminder Display (Browser, User is Active)

**Recommendation:** Angular Material `MatSnackBar` + `MatDialog` for in-session alerts. No additional library.

**Why:** When the user has the app open, surfacing upcoming vaccinations/medications as a banner or dialog at login is sufficient for v1. Angular Material already installed. Zero extra dependencies.

**Confidence:** HIGH — Angular Material is already in the stack.

#### B. Out-of-App Reminders (User is NOT in the Browser)

**Recommendation:** Use **Supabase Database Webhooks + Edge Functions** to send email reminders via **Resend** (email API).

**Why Web Push is premature for v1:**
- Web Push requires a Service Worker, VAPID key generation, push subscription management per user/device, and a server-side push sender
- The Angular app uses `zone.js` (not zoneless) and Service Workers add complexity to Angular's change detection lifecycle
- Web Push permission prompt has ~20% opt-in rates on desktop; users routinely ignore it
- Angular's `@angular/service-worker` (`SwPush`) can handle the Angular side, but requires proper PWA manifest, HTTPS in dev (ngrok/mkcert), and a server-side push sender — substantial v1 scope

**Why email is right for v1:**
- Supabase Edge Functions (Deno) can query `SELECT * FROM medications WHERE next_due = today()` via a pg_cron scheduled job and send emails via Resend
- Zero Angular changes — reminders are backend-only
- Resend free tier: 3,000 emails/month — sufficient for v1 validation
- Users reliably receive email reminders regardless of browser state
- Upgrade path: add Web Push in v2 once core features are validated

**Supabase pg_cron:** Available in Supabase projects. Schedule a daily job: `SELECT cron.schedule('daily-reminders', '0 8 * * *', $$ ... $$)`.

**What NOT to use for v1:**
- `@angular/service-worker` SwPush — valid for v2, but adds too much complexity before core features exist
- Firebase Cloud Messaging (FCM) — wrong ecosystem, adds Firebase dependency
- OneSignal — SaaS vendor lock-in, overkill for v1

**Confidence:** MEDIUM — Supabase Edge Functions and pg_cron are production features as of 2024. Resend is the dominant transactional email API as of 2025. Verify pg_cron extension is enabled on your Supabase project (Supabase > Database > Extensions).

---

### Real-Time Shared Data (Co-Guardians)

**Recommendation:** Supabase Realtime via `supabase.channel()` API from the existing `@supabase/supabase-js` client.

**Why:** When multiple co-guardians are viewing the same dog's care feed simultaneously, new entries logged by one guardian should appear for the other without a page refresh. Supabase Realtime provides Postgres Change Data Capture (CDC) via WebSocket. The client is already initialized — enabling realtime is a single `channel()` call.

**Key API pattern:**
```typescript
supabase
  .channel('dog-care-feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'care_entries',
    filter: `dog_id=eq.${dogId}`
  }, (payload) => {
    // append to signal array
  })
  .subscribe();
```

**Important:** Supabase Realtime requires RLS to be configured correctly — the subscription will only deliver rows the user's RLS policy permits. Enable Realtime on the `care_entries` table in Supabase Dashboard > Database > Replication.

**What NOT to use:**
- WebSockets from Spring Boot — violates v1 constraint of no backend
- Socket.io — separate server required
- Polling — works but wastes resources and adds latency

**Confidence:** MEDIUM-HIGH — Supabase Realtime CDC (postgres_changes) has been stable since 2023. The `channel()` API is v2 supabase-js standard. Verify Realtime is enabled on tables in your Supabase project settings.

---

### State Management

**Recommendation:** Angular Signals only. No NgRx, no Akita, no BehaviorSubjects.

**Why:** The existing codebase already uses signals (`places = signal<Place[]>([])`). The project scope (one active dog at a time, shared care feed, user profile) does not justify a full state management library. Signal-based services (`computed`, `effect`) handle cross-component state cleanly.

**Pattern:** One service per domain (`DogService`, `CareService`, `AuthService`) exposing signals. Components read signals directly. No observables piped through templates unless RxJS interop is strictly needed.

**Confidence:** HIGH — Angular 19 signals are mature and stable.

---

### Forms

**Recommendation:** Angular Reactive Forms (`@angular/forms`) — already in the stack.

**Why:** Already installed. Dog profile creation, care entry logging, invitation forms all benefit from reactive forms' validation and `FormGroup`/`FormControl` model. Template-driven forms are fine for simple cases (login button is just an OAuth redirect — no form fields at all).

**Confidence:** HIGH.

---

### HTTP Client

**Recommendation:** Angular `HttpClient` (`provideHttpClient()`) — already configured in `app.config.ts`.

**Why:** Used for OSM/Overpass API calls. Will also be needed if any Supabase Edge Function needs to be called via REST rather than the supabase-js client. Already registered.

**Confidence:** HIGH.

---

### Email — Co-Guardian Invites

**Recommendation:** **Supabase Edge Function** calling **Resend** API.

**Why:** Co-guardian invite flow: owner enters email → app inserts a pending invite row → Edge Function trigger (database webhook on INSERT to `dog_invitations`) sends invite email via Resend with an accept link. The accept link includes a token; clicking it completes the invitation and creates the co-guardian relationship.

**Alternative considered:** Supabase built-in email (SMTP). Supabase Auth emails work for auth events but are not suitable for custom invitation emails with custom templates and dynamic content. Use Resend.

**Resend:** `resend` npm package is used server-side (in Deno Edge Function), not in Angular. The Angular app only calls `supabase.from('dog_invitations').insert(...)`.

**Confidence:** MEDIUM — Resend + Supabase Edge Function is a well-documented pattern as of 2024-2025.

---

### Date / Time Handling

**Recommendation:** **Native JS `Intl` API** + Angular's built-in `DatePipe` for display. For date arithmetic (calculating days until next vaccination), use the native `Date` object or a minimal helper.

**Why NOT to add date-fns or Luxon for v1:** The use cases are simple — "next due date", "days until reminder". Native `Date` handles these. Adding a date library for this scope increases bundle size for minimal gain.

**If date arithmetic becomes complex (recurring medication schedules, timezone-aware reminders):** Add `date-fns` 3.x — it's tree-shakeable, has no external dependencies, and is the community standard as of 2025 over Moment.js (deprecated) and Luxon (less ecosystem momentum).

**Confidence:** HIGH for the recommendation; MEDIUM for the "add date-fns if needed" threshold.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth | Supabase OAuth (built-in) | angular-oauth2-oidc | Supabase already handles PKCE; extra library = extra surface area |
| Auth | Supabase OAuth (built-in) | @angular/fire Auth | Wrong ecosystem; Firebase ≠ Supabase |
| Image storage | Supabase Storage | Cloudinary | Paid at scale; Supabase Storage is sufficient for avatars |
| Notifications (v1) | Email via Resend | Web Push (SwPush) | Service worker complexity is out of proportion to v1 scope |
| Notifications (v1) | Email via Resend | OneSignal | Vendor lock-in; free tier requires their branding |
| State management | Angular Signals | NgRx | Over-engineered for this domain size; signals are idiomatic in Angular 19 |
| State management | Angular Signals | Akita/Elf | Same reasons as NgRx |
| Real-time | Supabase Realtime | Spring Boot WebSocket | Violates v1 no-backend constraint |
| Date handling | Native + DatePipe | Moment.js | Deprecated; no longer maintained |
| Date handling | Native + DatePipe (or date-fns if needed) | Luxon | Smaller ecosystem than date-fns; not worth adding for v1 scope |

---

## New Dependencies to Install

```bash
# No new npm packages required for core v1 features.
# All features (Google OAuth, Storage, Realtime) are covered by @supabase/supabase-js already installed.

# IF push notifications are added in v2:
npm install @angular/service-worker

# IF date arithmetic becomes complex:
npm install date-fns
```

**Backend (Supabase Edge Functions — Deno runtime, not npm):**
```typescript
// deno.json or inline in Edge Function
import { Resend } from 'npm:resend@3';
```

---

## Infrastructure Notes

| Concern | Recommendation |
|---------|---------------|
| Supabase Storage bucket | Create `dog-avatars` bucket; set to public; RLS: users can upload to `{user_id}/*` only |
| Supabase Realtime | Enable on `care_entries` table in Dashboard > Database > Replication |
| pg_cron | Enable extension in Dashboard > Database > Extensions for scheduled reminders |
| Google OAuth redirect | Configure `<project>.supabase.co/auth/v1/callback` in Google Cloud Console |
| Auth callback route | Add `/auth/callback` route in Angular that calls `supabase.auth.exchangeCodeForSession()` |
| PKCE flow | supabase-js 2.x uses PKCE by default for web — no configuration needed |

---

## Confidence Summary

| Area | Confidence | Reason |
|------|------------|--------|
| Google OAuth via supabase-js | HIGH | Core supabase-js v2 feature, stable API, unchanged since 2022 |
| Angular Signals for auth state | HIGH | Angular 19 standard; confirmed from existing codebase patterns |
| Supabase Storage for images | MEDIUM | Feature is stable; image transform availability depends on plan tier — verify |
| Email reminders via Resend + Edge Functions | MEDIUM | Pattern is well-established as of 2024; verify pg_cron extension is enabled |
| Supabase Realtime for co-guardian feed | MEDIUM-HIGH | Postgres CDC has been stable since 2023; requires table-level Realtime toggle |
| Web Push deferred to v2 | HIGH | Deliberate scope decision; rationale is architecture-based |
| No new npm packages for v1 | HIGH | Confirmed by reviewing what supabase-js 2.99.1 already provides |

---

## Sources

- Codebase inspection: `frontend/package.json`, `frontend/src/app/services/supabase.service.ts`, `frontend/src/app/app.config.ts`
- Training knowledge (through August 2025): Supabase docs, Angular 19 release notes, Resend documentation patterns
- Note: WebSearch and WebFetch were unavailable during this research session. Verify version-specific claims against current Supabase docs before implementation.
