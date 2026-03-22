# Project Research Summary

**Project:** Dogly — Shared Dog Care Platform
**Domain:** Multi-user pet care tracking + co-guardian coordination + (v2) breeding directory
**Researched:** 2026-03-22
**Confidence:** MEDIUM

## Executive Summary

Dogly is a private, high-trust co-guardian app — not a social network. The entire v1 product reduces to one thing: multiple people caring for one dog staying synchronized on feeding, medications, and health events. Every competitor does single-owner tracking reasonably well; none execute the shared-attribution model well. That gap is the product's reason to exist, and the architecture must be designed around it from day one. The unified care feed, the `dog_guardians` join table as the access-control pivot, and per-user reminder delivery are the three load-bearing decisions that everything else depends on.

The stack is already chosen and largely sufficient. Angular 19 signals + Supabase Auth/PostgREST/Storage/Realtime covers every v1 requirement without adding a single npm package. The one meaningful new dependency is Resend (used server-side in a Supabase Edge Function) for email reminders and co-guardian invites. The critical choice to defer Web Push notifications to v2 is correct — email via pg_cron is reliable and adds no Angular complexity. All other technology choices are conservative and appropriate for the domain.

The primary risks are not technical — they are correctness risks on security boundaries and data integrity. Three things can sink v1: (1) RLS policies that miss child tables when co-guardian support is added, (2) the Supabase anon key already committed to git that must be rotated before any real user data exists, and (3) the session restore timing issue that redirects authenticated users to login on hard refresh. All three are preventable if addressed in the first phase before any feature work begins. There is also meaningful pre-existing technical debt in `HomeComponent` (395 lines, handles too much) that must be refactored before the new feature architecture is layered on top.

---

## Key Findings

### Recommended Stack

The existing stack (Angular 19, Angular Material, RxJS, supabase-js 2.99.1, TypeScript 5.7) covers everything. No additional npm packages are needed for v1 core features — Google OAuth, image storage, and real-time sync are all provided by the already-installed supabase-js client. The one new integration is Resend (used only inside a Deno Edge Function, not in the Angular bundle) for transactional email.

**Core technologies:**
- `@supabase/supabase-js` 2.99.1: Auth (Google OAuth), database queries, storage, and real-time — entire backend interface
- Angular Signals: state management throughout — already the codebase pattern, do not introduce NgRx or BehaviorSubjects
- Supabase Edge Functions + pg_cron: server-side reminder dispatch — the only backend logic that must run outside the browser
- Resend (Edge Function only): transactional email for invites and reminders — free tier covers v1 volume
- Supabase Storage: dog avatar uploads — image resize via URL transform params, no separate image service needed

**What NOT to add:** NgRx, Cloudinary, `@angular/service-worker` (Web Push), Firebase anything, date-fns (unless date arithmetic becomes complex), separate backend for v1.

See `.planning/research/STACK.md` for full rationale.

### Expected Features

The competitive landscape is clear: co-guardian attribution is the uncontested differentiator. Every competitor treats the account as singular. "Who fed the dog?" and "did someone already give the medication?" are the exact questions this product answers that others do not.

**Must have (table stakes — v1 blocking):**
- Dog profile with photo, multi-dog support from day one (30% of owners have 2+ dogs)
- Co-guardian invite by email with explicit accept flow
- Shared care feed with per-entry attribution ("logged by [name]")
- Feeding, weight, and diary/note logging — keep to 3 fields max per entry or users stop logging
- Medication tracking with shared "mark as given" acknowledgment — this IS the core anxiety the product solves
- Vaccination records with due-date reminders
- Email reminders (not browser push) — reliable delivery when user is away from app

**Should have (differentiators worth building in v1):**
- Real-time feed updates via Supabase Realtime — co-guardian sees new entries without refresh
- Weight trend chart — visually absent in most competitors; data is already being captured
- Feeding consistency indicator ("fed 3 of 3 times today") — high perceived value, derived from existing data
- Reminder acknowledgment state visible to all co-guardians — who handled the medication?

**Defer to v2:**
- Breed-specific health tips (needs curated knowledge base, high error risk)
- Health record PDF export / vet-share summary
- Co-guardian permission tiers (read-only vs. full access) — ship flat permissions first
- Dog breeding directory — separate subscription/payment infrastructure required

**Hard anti-features (do not build):**
- Public social profiles / follows — Instagram already owns this; splits product identity
- GPS tracker integrations — each is a separate API/maintenance burden
- Vet booking integrations — fragmented vet software, no standard API
- Community Q&A forum — moderation burden, liability, Reddit already owns it
- Unverified breeding directory — one bad actor destroys platform reputation permanently

See `.planning/research/FEATURES.md` for competitive landscape detail.

### Architecture Approach

The architecture is a direct-to-Supabase Angular SPA with no Spring Boot involvement for v1. All access control is mediated by a single PostgreSQL helper function `is_dog_guardian(dog_id)` applied as an RLS policy on every table that contains dog-specific data. This function is the security boundary — client-side guards are UI decoration only. The `dog_guardians` join table is the access control pivot for the entire platform: it gates what care events are visible, what health records can be queried, and who receives reminders.

**Major components:**
1. `dog_guardians` table + `is_dog_guardian()` RLS function — access control pivot; every data policy references this
2. `care_events` unified table (JSONB payload, append-only, `event_type` enum) — single table for all log types; enables one realtime channel, one feed query, one set of policies
3. `health_records` table (vaccinations + medications unified) — simplifies care feed joins and reminders FK
4. `reminders` table (per-user, not per-dog) — one reminder row per guardian per event; enables per-user delivery tracking and acknowledgment state
5. Supabase Edge Function `dispatch-reminders` + pg_cron — the only server-side logic; runs every 15 minutes, sends email via Resend, marks sent
6. Angular services as thin gateway layer (`SupabaseService` → `DogService`, `CareEventService`, `HealthService`) — isolates Supabase SDK calls for future migration safety

**Schema decisions that cannot be changed without painful migration:**
- `dog_guardians.role` column must be added now (even if unused) — retrofitting after data exists requires policy rewrite
- `care_events` must be unified from day one — separate tables per type require UNION queries and duplicate RLS policies
- Sort care feed by `occurred_at` (not `created_at`) — users log retroactively; changing this key after the UI is built breaks cached clients
- `invite_token` must be nulled after acceptance — leaving it live allows replay attacks
- `breeding_*` tables must be in a separate namespace from day one — mixing with core `dogs` table entangles free-tier privacy with public directory data

See `.planning/research/ARCHITECTURE.md` for full schema SQL and RLS policy patterns.

### Critical Pitfalls

1. **Supabase anon key in git** (BLOCKING, exists today) — Rotate the key in Supabase Dashboard before any auth work begins. Move credentials to gitignored `.env` files with Angular `fileReplacements`. This is day-one work, not a later cleanup.

2. **RLS policies missing child tables** (BLOCKING) — When co-guardian support is added, the `is_dog_guardian()` function must be applied to `care_events`, `health_records`, `reminders`, and storage buckets — not just `dogs`. Write all RLS policies in SQL migrations before writing application code. Test with a user who has no relationship to a dog.

3. **Google OAuth session not restored on hard refresh** (BLOCKING for auth) — Route guards must wait for `supabase.auth.onAuthStateChange()` to fire before evaluating auth state. Use `APP_INITIALIZER` to initialize auth before routing begins. The OAuth callback route must not redirect before Supabase parses the URL fragment.

4. **Guardian invite race condition** (BLOCKING for co-guardians) — Use token-based invite acceptance (lookup by UUID token, not by email string). Set token to NULL after acceptance. Add `expires_at` (7 days). This handles the case where the invitee signs up with a different Google account than the invited email.

5. **`HomeComponent` god object** (MODERATE, exists today) — `home.component.ts` is 395 lines handling map, data fetching, filtering, and themes. Adding auth routes and dog profile pages on top of this creates compounding fragility. Extract `MapComponent`, `PlaceListComponent`, and `MapService` before layering new features.

See `.planning/research/PITFALLS.md` for the complete list including minor pitfalls and pre-existing debt.

---

## Implications for Roadmap

### Phase 1: Foundation and Codebase Cleanup
**Rationale:** Three blocking issues exist in the current codebase before any feature work is safe: the leaked credentials, the `HomeComponent` god object, and scattered console logs. These are not optional cleanup — they create compounding risk if deferred. Address them as a discrete phase.
**Delivers:** Clean, secure starting point with proper credentials management, component decomposition, and a logging service
**Addresses:** Pitfalls 3 (anon key), 8 (HomeComponent), 11 (console logs), 10 (random ratings), 13 (OSM null guard)
**Must complete before:** Any auth work

### Phase 2: Authentication and Session Management
**Rationale:** Google OAuth via Supabase is the foundation for every subsequent feature. Nothing else can be built without knowing who the user is. This phase also establishes the Angular auth patterns (signals-based session, functional route guards, `APP_INITIALIZER`) that all later phases depend on.
**Delivers:** Working Google OAuth login, persistent session across refresh, protected routes, `/auth/callback` route
**Uses:** `supabase.auth.signInWithOAuth()`, `onAuthStateChange`, Angular functional guards
**Avoids:** Pitfall 4 (session restore on hard refresh) — use `APP_INITIALIZER` pattern explicitly
**Research flag:** Standard pattern — no additional phase research needed

### Phase 3: Dog Profiles
**Rationale:** Dog profile is the root entity for everything — care events, health records, co-guardians, and reminders all reference a `dog_id`. The data model (especially `dogs`, `dog_guardians`, and the `is_dog_guardian()` RLS function) must be established here, even if co-guardian invite flow ships in the next phase. Getting the schema right now avoids a migration later.
**Delivers:** Create/edit/delete dog, avatar upload to Supabase Storage, multi-dog switcher in nav, `dog_guardians` table with `role` column, `is_dog_guardian()` RLS helper
**Uses:** Supabase Storage (`dog-avatars` bucket, image resizing via URL params), Angular Reactive Forms
**Avoids:** Pitfall 6 (file size/MIME validation on avatars) — add client-side compress + bucket policy immediately
**Research flag:** Standard pattern — no additional phase research needed

### Phase 4: Co-Guardian Invite and Access Control
**Rationale:** This is the product's core differentiator. It is also the most security-critical feature — the RLS policies established here gate access to all future data. Build it with full test coverage (owner can read, guardian can read, uninvited user cannot) before adding care data on top. Invite flow uses Resend + Edge Function, which sets up the email infrastructure needed for reminders in Phase 6.
**Delivers:** Owner invites by email, Edge Function sends invite email via Resend, token-based acceptance flow, owner can remove co-guardian, Realtime subscription to detect guardian removal
**Implements:** `dog_guardians` invite flow, `dispatch-invite` Edge Function, RLS policies on all tables
**Avoids:** Pitfall 1 (RLS gaps), Pitfall 2 (invite race condition), Pitfall 7 (stale session on removal)
**Research flag:** Verify Supabase Edge Function + pg_net availability on project tier before building

### Phase 5: Daily Care Tracking
**Rationale:** With auth and co-guardian access control in place, the care feed is structurally safe to build. The unified `care_events` table (with JSONB payload) must be the starting point — do not create separate tables per type. Realtime subscription enables the live feed that is the co-guardian experience.
**Delivers:** Feeding log, weight log, diary/note log, unified chronological care feed with guardian attribution, Realtime live updates
**Implements:** `care_events` table (append-only, `occurred_at` sort key), `CareEventService`, Supabase Realtime channel per `dog_id`
**Avoids:** Architecture anti-pattern (separate tables per type), architecture anti-pattern (Broadcast vs. Postgres Changes)
**Research flag:** Standard pattern — no additional phase research needed

### Phase 6: Health Records and Reminders
**Rationale:** Health records and reminders are tightly coupled (a medication record generates reminder rows; a vaccination's `next_due_at` generates a reminder). Build them together. The pg_cron + Edge Function dispatch infrastructure set up for invites in Phase 4 is reused here.
**Delivers:** Vaccination records, medication records, reminder rows (per-user fan-out), pg_cron scheduled dispatch, email delivery via Resend, "mark as given" acknowledgment on medication entries
**Implements:** `health_records` table, `reminders` table (per-user), `dispatch-reminders` Edge Function, pg_cron 15-minute schedule
**Avoids:** Pitfall 5 (browser notification unreliability) — email only for v1; Architecture anti-pattern (one reminder per dog instead of per user)
**Research flag:** Verify pg_cron and pg_net extensions are enabled on Supabase project tier before planning this phase

### Phase 7: Polish and Place Discovery Integration
**Rationale:** The existing place discovery feature (dog-friendly places map) needs to coexist cleanly with the new dog care features. After the core feature set is working, this phase integrates the existing `HomeComponent` (already refactored in Phase 1) into the new navigation structure and adds lightweight UX polish (weight trend chart, feeding consistency indicator).
**Delivers:** Unified app navigation (dog care + place discovery), weight trend chart, feeding consistency badge, account deletion / data export (GDPR)
**Addresses:** Feature: weight trend chart (differentiator), feeding consistency indicator (differentiator)
**Research flag:** Chart rendering — if using Chart.js, verify Angular 19 compatibility or use a signals-compatible wrapper

### Phase 8 (v2): Dog Breeding Directory
**Entry criteria:** v1 co-guardian core is stable, Stripe integration scoped, breeder verification workflow designed
**Rationale:** Completely separate module. All data in `breeding_*` prefixed tables. Lazy-loaded Angular route at `/dogly/directory`. Subscription gate via `subscriptions` table with RLS on all breeding tables. Do not begin until v1 is validated with real users.
**Research flag:** Stripe webhook idempotency and subscription state machine need dedicated research before this phase. Breeder verification workflow is a product design question that needs a decision before technical planning.

### Phase Ordering Rationale

- Phases 1-2 are non-negotiable prerequisites: credentials leak and auth must precede all feature work
- Phase 3 (dog profiles) must precede Phase 4 (co-guardians) because the schema (`dog_guardians`, `is_dog_guardian()`) is established in Phase 3 — even though co-guardian invite ships in Phase 4
- Phase 4 (co-guardians) must precede Phase 5 (care feed) because all care event RLS policies depend on `is_dog_guardian()` being correct and tested
- Phase 5 before Phase 6 because care events (feeding logs) include `medication_dose` event type that references `health_records` — the unified event model must exist first
- Phase 7 is intentionally last — it is polish and integration, not foundational

### Research Flags

**Needs deeper research before planning:**
- Phase 4/6: Verify `pg_net` extension availability on Supabase project tier (required for pg_cron → Edge Function HTTP calls)
- Phase 6: Verify pg_cron extension is enabled and confirm exact scheduling syntax on current Supabase version
- Phase 7: Confirm Angular 19-compatible chart library choice (Chart.js wrapper vs. native signals integration)
- Phase 8 (v2): Stripe webhook handling patterns, subscription state machine design, breeder verification workflow

**Standard patterns (skip research-phase):**
- Phase 2: Google OAuth via supabase-js is well-documented and stable
- Phase 3: Supabase Storage upload pattern is stable
- Phase 5: Supabase Realtime Postgres Changes is established; Angular signals-based service pattern is straightforward

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core choices are the existing stack; no new npm packages for v1; only Resend is new and it is Edge Function only |
| Features | MEDIUM | Competitive landscape from training data (August 2025); no live App Store review analysis; co-guardian differentiator position is well-supported |
| Architecture | MEDIUM-HIGH | Schema design and RLS patterns are standard Postgres/Supabase; pg_net/pg_cron availability needs verification against project tier |
| Pitfalls | HIGH | Three of the five blocking pitfalls are confirmed from direct codebase analysis (not inference); two are well-documented Supabase patterns |

**Overall confidence:** MEDIUM-HIGH for v1 technical decisions. LOW for v2 breeding directory specifics (Stripe, verification workflow).

### Gaps to Address

- **pg_net availability on Supabase plan:** The reminder dispatch architecture (pg_cron calling Edge Function via HTTP) depends on `pg_net`. Verify this is enabled on the project before Phase 6 planning. If unavailable, the Edge Function must be triggered differently (e.g., called from the client after inserting a health record, or polled by a separate scheduler).

- **Supabase anon key rotation:** This must happen before any other work. The current key is in git history. Rotating it invalidates the old key but does not remove it from git history — the environment config pattern must be changed at the same time.

- **Supabase Realtime RLS enforcement:** ARCHITECTURE.md flags this as MEDIUM confidence — the realtime channel must be established after auth session is set, and RLS enforcement in realtime has historically had nuances. Test explicitly: subscribe as a non-guardian and confirm no events are received.

- **`supabase-js` v3 proximity:** The package is at version 2.99.1, suggesting a major version boundary is close. The `SupabaseService` abstraction layer mitigates this risk, but monitor the Supabase changelog at the start of each phase.

- **No validated requirements yet:** PROJECT.md notes "None yet — ship to validate." All feature prioritization is inference from competitive analysis, not user research. The roadmap should treat Phase 5 (care feed) as the validation milestone — if co-guardian attribution doesn't generate engagement, the v2 breeding directory premise should be reconsidered.

---

## Sources

### Primary (HIGH confidence — direct codebase analysis)
- `frontend/package.json` — confirmed stack versions
- `frontend/src/app/services/supabase.service.ts` — existing auth patterns
- `frontend/src/app/app.config.ts` — standalone/functional Angular setup confirmed
- `.planning/PROJECT.md` — requirements and constraints

### Secondary (MEDIUM confidence — training knowledge August 2025)
- Supabase Auth, Storage, Realtime, Edge Functions documentation patterns
- Angular 19 signals and standalone component patterns
- Pet care app competitive landscape: PetDesk, Woofz, PetNote, Good Dog, AKC Marketplace, Pawrade

### Tertiary (LOW confidence — needs live verification)
- pg_cron + pg_net extension availability on specific Supabase plan tiers
- Supabase Realtime RLS enforcement behavior in postgres_changes channels
- Resend free tier limits (verify current pricing before committing to email volume assumptions)

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
