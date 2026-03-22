# Domain Pitfalls

**Domain:** Multi-user pet care app with shared ownership model (Angular 19 + Supabase)
**Researched:** 2026-03-22
**Confidence:** MEDIUM — core Supabase/Angular patterns from documentation knowledge; no live web search available in this session. Flag for validation before implementation.

---

## Critical Pitfalls

Mistakes that cause rewrites, security holes, or data integrity failures.

---

### Pitfall 1: RLS Policies That Permit Cross-Guardian Data Leakage

**Severity:** BLOCKING

**What goes wrong:** When you add co-guardian support, the naive RLS pattern is `auth.uid() = owner_id`. This works for single-owner resources. The moment you add a `dog_guardians` join table, every table that references `dog_id` needs policies that check _both_ ownership and guardian membership. Developers typically add the guardian check to the `dogs` table but forget to replicate it on `care_entries`, `health_records`, `medications`, `reminders`, and storage buckets. A co-guardian can then view the dog profile but cannot see care entries — or worse, can see care entries for _other_ dogs if policies are misconfigured.

**Why it happens:** Supabase RLS policies are per-table and are not inherited. Adding a policy to `dogs` does not cascade to child tables. In a rush to ship, teams add policies incrementally and leave gaps.

**Consequences:** Either co-guardians see nothing (broken UX, support tickets) or they see data they should not (security breach). If discovered post-launch, every table needs auditing and potentially a data audit to assess what was exposed.

**Prevention:**
- Design RLS policies for _all_ tables before writing a single line of application code. Write them as SQL migrations, not via the dashboard UI (dashboard edits are easy to forget to version-control).
- Create a reusable Postgres helper function `is_dog_guardian(dog_id uuid)` that returns true if `auth.uid()` is the dog's owner OR is in `dog_guardians` for that dog. Use this function in every table's SELECT/INSERT/UPDATE/DELETE policies.
- Example helper:
  ```sql
  create or replace function is_dog_guardian(p_dog_id uuid)
  returns boolean language sql security definer stable as $$
    select exists (
      select 1 from dogs where id = p_dog_id and owner_id = auth.uid()
      union all
      select 1 from dog_guardians where dog_id = p_dog_id and guardian_id = auth.uid() and accepted_at is not null
    );
  $$;
  ```
- After implementing, test with at least three Supabase service-role bypass tests: (a) owner can read own dog's care entries; (b) accepted guardian can read; (c) uninvited user cannot read.

**Detection:** Create a test user with no relationship to a dog. Attempt direct Supabase SDK queries against care_entries with that user's JWT. Any successful response indicates a policy gap.

---

### Pitfall 2: Guardian Invite Race Condition and Dangling Invites

**Severity:** BLOCKING

**What goes wrong:** The invite-by-email flow creates a row in `dog_guardian_invites` before the invited user has a Supabase account. When the invite email is sent and the user clicks the link, one of three things happens: (a) they already have an account and the lookup works; (b) they sign up through Google OAuth and their `auth.uid()` is different from what was expected; (c) they never sign up and the invite row sits permanently, potentially allowing a later registrant with the same email to be auto-accepted.

**Why it happens:** Google OAuth provides an email address at sign-up. If invite matching is done by email string comparison, any user who signs up with that email later will match — but only if you query `auth.users` by email, which requires service-role access, not anon-key access.

**Consequences:** Invites that silently fail (user never gains access), or invites that grant access to the wrong person if email matching is naive.

**Prevention:**
- Store invites as `{ dog_id, invited_email, token, expires_at, accepted_at }`. Generate a cryptographically random token (not predictable).
- Send the invite link with the token as a query parameter: `/accept-invite?token=<token>`.
- On acceptance, look up the invite by token (not by email), then associate the _current_ authenticated user's `auth.uid()` with the dog. This handles the case where email differs.
- Set `expires_at` (e.g., 7 days). Add a cron job or Postgres scheduled function to delete expired, unaccepted invites.
- Enforce a unique constraint on `(dog_id, invited_email)` to prevent duplicate invites.

**Detection:** Attempt to accept an invite with a different Google account than the invited email. The token-based approach should still work; email-matching would fail or grant wrong access.

---

### Pitfall 3: Supabase Anon Key Exposed in Version Control

**Severity:** BLOCKING (already present in codebase)

**What goes wrong:** `frontend/src/environments/environment.ts` contains the live Supabase URL and anon key committed to git. Even if RLS policies are correct, the anon key being public in git history means anyone who finds the repo can query Supabase directly, bypassing your Angular application's guards entirely. The key cannot be "un-leaked" without rotation — git history is permanent.

**Why it happens:** The existing codebase (per CONCERNS.md) has already committed credentials. This is the starting state.

**Consequences:** Until the key is rotated and RLS policies are verified tight, any data in the Supabase project is accessible to anyone who finds the repository. For v1, with real user health data, this is a GDPR/privacy liability.

**Prevention:**
- Rotate the Supabase anon key immediately in the Supabase dashboard (Project Settings > API). The old key becomes invalid.
- Move credentials to environment injection at build time using Angular's `fileReplacements` in `angular.json`. The actual values go in `.env` files that are gitignored, not in committed `environment.ts`.
- Add a CI check that fails if the word `supabase.co` appears in committed TypeScript files outside of environment template/example files.
- Note: The Supabase anon key is designed to be somewhat public (it is used in browser), but it should NOT be in a public git repository. RLS is the security layer; the anon key just controls initial access scope.

**Detection:** `git log --all -S "supabase.co"` will show all commits containing the URL. The key needs rotation regardless.

---

### Pitfall 4: Google OAuth Session Not Restored on Hard Refresh (Angular)

**Severity:** BLOCKING for auth

**What goes wrong:** Supabase stores the session in `localStorage` by default. On Angular app load, `supabase.auth.getSession()` must be called to restore the session. If you rely on Angular guards that check `supabase.auth.user()` synchronously before the async session restore completes, every hard refresh sends the user to the login page even though they are authenticated. This is a particularly confusing bug because it appears to work fine during development (session is hot) but breaks after a real browser refresh.

**Why it happens:** The Supabase JS client is async. Angular's route guards often expect synchronous or immediately-resolving observables. The session restore happens on the first call to `getSession()` or via `onAuthStateChange`, but both are async and may not have resolved when the guard runs.

**Consequences:** Users are repeatedly redirected to login. Auth state is inconsistent. Worse, if an auth guard reads `user` as null and redirects _before_ the Supabase client fires `SIGNED_IN`, the redirect itself may cancel the token parsing from the OAuth callback URL (the `#access_token` fragment in the URL gets lost on redirect).

**Prevention:**
- Subscribe to `supabase.auth.onAuthStateChange()` once at app init (in `AppComponent` or an `APP_INITIALIZER` token) and store the resulting session in an Angular signal or BehaviorSubject.
- Make route guards return an Observable or Promise that waits for the first emission of the auth state (use `filter(state => state !== 'loading')` or a `firstValueFrom` with a loaded flag).
- On the OAuth callback route, do NOT redirect before parsing the URL fragment. Let Supabase handle the fragment-to-token exchange before any navigation.

**Detection:** Log in via Google. Hard-refresh the app. You should remain authenticated. If redirected to login, the session restore is broken.

---

## Moderate Pitfalls

---

### Pitfall 5: Reminder Delivery Unreliability — Browser Notifications

**Severity:** MODERATE

**What goes wrong:** Browser Push Notifications (Web Push API / service workers) require: (a) explicit user permission, (b) a service worker registered by the app, (c) a push server to fan out notifications to offline users. Without a proper push setup, you can only show notifications when the user has the app tab _open and foregrounded_. Medication reminders that only fire when the tab is active are useless — users close tabs.

**Why it happens:** It is tempting to use `Notification.requestPermission()` with a `setInterval` to check upcoming reminders. This only works in-tab.

**Consequences:** Reminders that silently fail. Users miss medication schedules. Core value proposition of the app ("no missed medications") breaks.

**Prevention:**
- For v1, use email reminders as the _primary_ delivery mechanism (not browser notifications). Email via Supabase Edge Functions calling a transactional email provider (Resend or Postmark) is reliable and does not require service worker setup.
- Browser notifications are a _nice-to-have_ enhancement, not the primary channel. Label them clearly as "in-app alerts" if implementing.
- If implementing email reminders: use a Postgres `pg_cron` job or Supabase scheduled Edge Function that runs every hour, queries for reminders due in the next 24 hours, and fires emails. Do not rely on the client app to trigger reminders.
- Never store reminder "should I send this?" logic in Angular. That logic must live server-side.

**Detection:** Close the browser entirely. A medication reminder due in the next hour should still arrive via email. If it does not, the delivery mechanism is client-only.

---

### Pitfall 6: Supabase Storage File Size Limits and MIME Type Validation

**Severity:** MODERATE

**What goes wrong:** Supabase Storage defaults to a 50MB file size limit per upload. Dog avatar photos from mobile cameras are typically 3-8MB as JPEGs but can be 15-20MB on newer iPhones. Without client-side validation and server-side policy enforcement, users can upload arbitrarily large files, exhausting storage quotas. Additionally, without MIME type validation, users can upload non-image files (e.g., `.exe` renamed to `.jpg`) that get served from your storage bucket URL.

**Why it happens:** Supabase Storage bucket policies must be explicitly configured. The default allows any file type up to the project-level limit.

**Consequences:** Storage quota overruns on the free tier. Potential for storing malicious files if bucket is public. Broken avatar `<img>` tags if a non-image is served.

**Prevention:**
- Configure bucket policies to allow only `image/jpeg`, `image/png`, `image/webp` MIME types.
- Set a 5MB client-side limit (warn user before upload). Check `file.size` and `file.type` in Angular before calling `supabase.storage.from('avatars').upload()`.
- Resize images client-side before upload using the browser Canvas API or a library like `browser-image-compression`. Target 800x800px max, ~500KB. This reduces storage costs and speeds up page loads.
- Use distinct buckets: `avatars` (public, images only) and `health-documents` (private, authenticated only). Do not mix public and private assets in the same bucket.
- Name files by user/dog UUID, not by original filename, to prevent path traversal: `avatars/dog-${dogId}/avatar.webp`.

**Detection:** Upload a 15MB JPEG. Upload a `.txt` file renamed to `.jpg`. The upload should fail (or be resized) without crashing the app.

---

### Pitfall 7: Co-Guardian Removal Leaves Orphaned Sessions

**Severity:** MODERATE

**What goes wrong:** When an owner removes a co-guardian, the Angular app removes the `dog_guardians` row. However, the removed guardian may have an active session and a cached in-memory view of the dog's data. Their next API call will be blocked by RLS, but they will not see a clean "you have been removed" message — they will see cryptic empty states or 403 errors.

**Why it happens:** There is no real-time push to invalidate the removed guardian's view.

**Consequences:** Poor UX for the removed guardian. Potential confusion about why data "disappeared."

**Prevention:**
- Use Supabase Realtime to subscribe to the `dog_guardians` table for the current user's rows. If a row is deleted (removal), trigger an Angular navigation to a "you no longer have access" page.
- Example: `supabase.channel('guardian-status').on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'dog_guardians', filter: `guardian_id=eq.${userId}` }, () => router.navigate(['/access-removed'])).subscribe()`
- Handle the case where the user is offline when removed — on next app load, the dog simply does not appear in their list, which is correct behavior.

**Detection:** Remove a co-guardian while they have the app open. Their view should update within a few seconds via Realtime.

---

### Pitfall 8: HomeComponent God Object Blocks Feature Addition

**Severity:** MODERATE (existing tech debt)

**What goes wrong:** Per CONCERNS.md, `HomeComponent` is 395 lines and handles map rendering, data fetching, filtering, theme switching, and localization. Adding new features (dog profile pages, care feed, health records) to this codebase will be slower and riskier because any change to the shared component risks breaking unrelated functionality.

**Why it happens:** This is pre-existing technical debt. The component was built for a focused use case and grew without refactoring.

**Consequences:** Adding auth, routing guards, and dog-specific pages on top of an already overloaded component creates compounding complexity. Integration between the place-discovery feature and new dog care features will be fragile.

**Prevention:** Before adding new features, split the HomeComponent:
- Extract `MapComponent` (Leaflet lifecycle only)
- Extract `PlaceListComponent` (display only)
- Extract `MapService` (map state, marker management)
- Move mock data to a development-only service
This refactor should be its own phase or the first task of the auth phase, not deferred.

**Detection:** If adding a new route requires touching `home.component.ts`, the component is not sufficiently decomposed.

---

### Pitfall 9: XSS via `bypassSecurityTrustHtml` in Theme Config

**Severity:** MODERATE (existing security concern)

**What goes wrong:** Per CONCERNS.md, logo SVG is rendered via `bypassSecurityTrustHtml()`. For v1, the theme is hardcoded so this is low risk. The risk escalates in v2 if theme config becomes user-configurable (breeder profiles with custom logos) or if theme config is ever sourced from a database value rather than a bundled config file.

**Why it happens:** SVG cannot easily be loaded via `<img src>` when it needs dynamic color injection. Developers reach for `bypassSecurityTrustHtml` as a quick solution.

**Consequences:** If a malicious value reaches the theme config (from a DB value, URL parameter, or compromised config file), it executes arbitrary JavaScript in the user's browser.

**Prevention:**
- Replace `bypassSecurityTrustHtml` with Angular's `[innerHTML]` binding combined with a proper sanitization pipe, OR use an inline `<svg>` element driven by Angular property bindings (set `fill`, `stroke`, `d` attributes individually rather than injecting raw HTML).
- If the SVG must stay as HTML, validate it against an allowlist of safe SVG tags/attributes before calling `bypassSecurityTrustHtml`.
- Add a comment in the code marking this as a known risk with a JIRA/issue link so it is not forgotten.

**Detection:** Set the logo value in theme config to `<img src=x onerror=alert(1)>`. If an alert fires, XSS is present.

---

## Minor Pitfalls

---

### Pitfall 10: Random Rating Generation Breaks User Trust

**Severity:** MINOR (existing bug)

**What goes wrong:** `Math.random()` is used to generate place ratings (CONCERNS.md, lines 181/200). Each page load shows different ratings for the same place.

**Prevention:** Remove random generation before auth goes live. Ratings must either come from OSM/Supabase or not be shown at all. A placeholder "no rating yet" is preferable to fake data.

---

### Pitfall 11: Console Logs Leaking Internal State

**Severity:** MINOR (existing, but escalates with auth)

**What goes wrong:** Multiple `console.log` and `console.error` statements in production code. Once auth is added, auth tokens, user IDs, and potentially email addresses may appear in logs.

**Prevention:** Replace all console statements with an environment-aware logging service (`if (!environment.production) { console.log(...) }`). This should be done before auth implementation, not after.

---

### Pitfall 12: `supabase-js` v2 → v3 Migration Risk

**Severity:** MINOR (watch closely)

**What goes wrong:** The codebase uses `@supabase/supabase-js` 2.99.1. The `2.99.x` minor version suggests the library is near a major version boundary. Supabase v3 of the JS client may introduce breaking changes to the auth API, storage API, or realtime subscription syntax.

**Prevention:** Pin the major version in `package.json` as `"@supabase/supabase-js": "^2.0.0"` (already implied by `^`), but monitor the Supabase changelog. Before starting each new phase, check for v3 beta announcements. Abstract Supabase calls behind a service layer (which the codebase already does with `SupabaseService`) so that migrations are isolated.

---

### Pitfall 13: OSM API Response Missing Array Guard

**Severity:** MINOR (existing bug)

**What goes wrong:** Per CONCERNS.md, `osm.service.ts` does not check if `response.elements` exists before mapping. If OSM returns an unexpected format, the app crashes silently.

**Prevention:** Add a guard before any array operation: `const elements = response?.elements ?? [];`. This is a one-line fix that should be addressed in the same PR as the HomeComponent refactor.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Auth setup | Session not restored on hard refresh (Pitfall 4) | Blocking | Use `onAuthStateChange` + APP_INITIALIZER, test hard refresh explicitly |
| Auth setup | Credentials still in git (Pitfall 3) | Blocking | Rotate key + move to env vars as first auth task |
| Auth setup | HomeComponent refactor needed first (Pitfall 8) | Moderate | Refactor HomeComponent before layering auth onto it |
| Co-guardian invites | Race condition on invite acceptance (Pitfall 2) | Blocking | Token-based invite flow, not email-matching |
| Co-guardian invites | RLS gaps on child tables (Pitfall 1) | Blocking | Write `is_dog_guardian()` helper, apply to all tables |
| Dog profiles / avatars | File size and MIME validation (Pitfall 6) | Moderate | Client-side compress + server bucket policy |
| Health records / reminders | Browser notification unreliability (Pitfall 5) | Moderate | Email-first via Edge Function + pg_cron |
| Co-guardian management | Removed guardian stale session (Pitfall 7) | Moderate | Supabase Realtime subscription on guardian row |
| Any new feature | XSS via theme config (Pitfall 9) | Moderate | Replace `bypassSecurityTrustHtml` before DB-driven themes |
| v2 breeding directory | Subscription payment complexity | Blocking (v2) | Scope Stripe webhook idempotency and subscription state machine carefully |
| Pre-launch | Random ratings visible to real users (Pitfall 10) | Minor | Remove before any real users touch the app |
| Pre-launch | Console logs exposing user data (Pitfall 11) | Minor | Logging service before auth ships |

---

## Existing Codebase Debt Flags

These issues from CONCERNS.md are not hypothetical — they exist today and must be addressed before or during feature development:

| Issue | File | Must Fix Before | Severity |
|-------|------|----------------|----------|
| Supabase anon key in git | `environment.ts` | Auth phase begins | BLOCKING |
| Mock data in production component | `home.component.ts:138-166` | HomeComponent refactor | Moderate |
| `bypassSecurityTrustHtml` for SVG | `home.component.ts:74` | v2 if themes become DB-driven; sooner is better | Moderate |
| Random ratings with `Math.random()` | `home.component.ts:181,200` | Before real users | Minor |
| Console logs throughout | multiple files | Before auth ships | Minor |
| `response.elements` missing null guard | `osm.service.ts:37,73` | Next PR touching osm.service | Minor |
| Broken spec file | `app.component.spec.ts` | Before CI/CD setup | Minor |
| Unused `sidenav` component | `sidenav.component.ts` | Next cleanup PR | Minor |

---

## v2 Awareness: Subscription/Payment Pitfalls

Captured now for roadmap planning. Not blocking v1.

**Stripe Webhook Idempotency:** Stripe may deliver the same webhook event more than once. If your Edge Function handles `customer.subscription.created` by creating a breeder record, duplicate deliveries create duplicate records. Always check `processed_webhook_events` table before acting, keyed on Stripe event ID.

**Subscription State Machine:** Breeder access should be driven by subscription status in your DB, not by querying Stripe on every request. Sync subscription state via webhooks into a `subscriptions` table. States to handle: `active`, `past_due`, `canceled`, `trialing`. A `past_due` breeder should retain read access but not be able to edit listings — design this explicitly.

**Trial-to-Paid Conversion:** If offering a free trial for breeders, the RLS policies for the breeding module need to account for `trialing` status from day one. Retrofitting trial logic into tight RLS policies after launch requires a migration.

**Public Buyer Access:** The breeding directory is searchable without login. This means the `litters` and `breeders` tables need public SELECT RLS policies scoped carefully — only `active`/`trialing` subscription holders' listings should be public. A single policy mistake can expose listings of canceled breeders or hide active ones.

---

## Sources

- Supabase RLS documentation (training data, MEDIUM confidence — verify at https://supabase.com/docs/guides/auth/row-level-security)
- Supabase Auth + Google OAuth patterns (training data, MEDIUM confidence — verify at https://supabase.com/docs/guides/auth/social-login/auth-google)
- Supabase Storage documentation (training data, MEDIUM confidence — verify at https://supabase.com/docs/guides/storage)
- Angular route guard patterns with async auth (training data, MEDIUM confidence)
- Existing codebase analysis via CONCERNS.md (HIGH confidence — direct code audit)
- Project requirements via PROJECT.md (HIGH confidence — source of truth)

*Note: Web search was unavailable during this research session. All findings are based on training data (knowledge cutoff August 2025) and direct codebase analysis. Verify Supabase-specific claims against current documentation before implementation.*
