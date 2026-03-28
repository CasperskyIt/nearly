# Dogly — Project Roadmap

**Milestone:** v1 — Shared Dog Care Platform
**Defined:** 2026-03-22
**Stack:** Angular 19 + Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
**Coverage:** 34/34 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation & Cleanup** — Rotate leaked credentials, extract HomeComponent god object, remove mock data and console logs (completed 2026-03-28)
- [ ] **Phase 2: Authentication** — Google OAuth login, persistent session across refresh, protected routes
- [ ] **Phase 3: Dog Profiles** — Full dog CRUD, avatar upload, multi-dog switcher, RLS foundation
- [ ] **Phase 4: Co-Guardians** — Token-based invite flow, email via Resend Edge Function, guardian management
- [ ] **Phase 5: Daily Care Tracking** — Unified care_events feed, feeding/weight/note logging, Realtime sync
- [ ] **Phase 6: Health Records & Reminders** — Vaccination and medication records, pg_cron email dispatch
- [ ] **Phase 7: Polish & Place Discovery Integration** — Nav integration, weight chart, feeding indicator, account deletion

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Cleanup | 3/3 | Complete    | 2026-03-28 |
| 2. Authentication | 0/4 | Not started | — |
| 3. Dog Profiles | 0/5 | Not started | — |
| 4. Co-Guardians | 0/5 | Not started | — |
| 5. Daily Care Tracking | 0/4 | Not started | — |
| 6. Health Records & Reminders | 0/5 | Not started | — |
| 7. Polish & Place Discovery Integration | 0/4 | Not started | — |

---

## Phase Details

### Phase 1: Foundation & Cleanup

**Goal:** The codebase is secure, decomposed, and free of mock data — a clean surface on which every subsequent phase can build without inheriting its debt.

**Depends on:** Nothing (prerequisite for all other phases)

**Requirements:** FOUND-01, FOUND-02, FOUND-03

**Success Criteria** (what must be TRUE when this phase is done):
1. `git log --all -S "supabase.co"` shows the old key only in historical commits; the live anon key and URL are sourced from gitignored `.env` files at build time via Angular `fileReplacements`
2. `HomeComponent` is under 100 lines — map lifecycle lives in `MapComponent`, place list display in `PlaceListComponent`, map state in `MapService`
3. No `Math.random()` rating generation, no `loadMockData()` call, and no hardcoded place data exists in any production-compiled file
4. All `console.log` / `console.error` calls are replaced by an `environment.production`-gated `LoggerService`; the OSM service `response.elements` null guard is in place
5. `app.component.spec.ts` passes (or is deleted and replaced with a stub that passes) so CI is not broken from day one

**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [x] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [x] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Pitfalls addressed in this phase:**
- Pitfall 3 (anon key in git) — BLOCKING, must resolve before auth
- Pitfall 8 (HomeComponent god object) — must decompose before routing changes
- Pitfall 10 (random ratings) — remove before any real users
- Pitfall 11 (console logs) — remove before auth ships auth tokens into log output
- Pitfall 13 (OSM null guard) — one-line fix, do it here

**Key constraint:** Do NOT introduce any new Angular routes or features in this phase. This is cleanup only. New routing structure comes in Phase 2.

---

### Phase 2: Authentication

**Goal:** Users can sign in with Google, remain signed in across browser refreshes, and unauthenticated users are consistently redirected to a login page.

**Depends on:** Phase 1 (credentials must be in env vars before auth work begins; HomeComponent must be decomposed before routing changes are layered on)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Success Criteria** (what must be TRUE when this phase is done):
1. Clicking "Sign in with Google" opens the Google OAuth consent screen and, on approval, returns the user to the app as an authenticated session
2. Hard-refreshing any protected route (e.g. `/dogly/dogs`) keeps the user authenticated — no redirect loop, no flash of the login page
3. Navigating to any protected route while unauthenticated redirects to `/dogly/login` cleanly
4. Clicking "Sign out" terminates the session and redirects to `/dogly/login`; the back button after sign-out does not restore the authenticated state

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [x] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [ ] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Pitfalls addressed in this phase:**
- Pitfall 4 (session not restored on hard refresh) — use `APP_INITIALIZER` to resolve auth state before routing evaluates guards

**Key constraints:**
- Google OAuth only — no email/password form
- Session state must be a Signal (`currentUser = signal<User | null>(null)`) in `SupabaseService`, not a BehaviorSubject
- Route guards must be functional (Angular 19 idiomatic), not class-based
- `/auth/callback` route must not redirect before Supabase parses the URL fragment

---

### Phase 3: Dog Profiles

**Goal:** An authenticated user can create, view, edit, and delete their dogs, upload an avatar photo, and the database enforces co-guardian access control via RLS from this point forward.

**Depends on:** Phase 2 (dog operations require an authenticated `auth.uid()`)

**Requirements:** DOG-01, DOG-02, DOG-03, DOG-04, DOG-05, DOG-06

**Success Criteria** (what must be TRUE when this phase is done):
1. An authenticated user can fill in a dog's name, breed, and date of birth and see the dog appear in their dog list immediately
2. A user can upload a photo from their device as a dog avatar; the avatar displays in the dog list and detail views (not a broken image tag)
3. A user can edit any field on a dog they own and see the update reflected without a page reload
4. A user can delete a dog they own; the dog disappears from the list and its data is removed from Supabase
5. A user with no relationship to a dog receives zero rows when querying `dogs`, `care_events`, or `health_records` for that dog — confirmed by a direct supabase-js SDK query using a test user's JWT
6. The `dog_guardians` table exists with `role`, `status`, `invite_token`, `expires_at`, and `user_id` columns; `is_dog_guardian()` RLS helper function is deployed and applied to all tables that will hold dog-specific data

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [ ] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [ ] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Schema established in this phase:**
- `dogs` table with `owner_id`, `name`, `breed`, `date_of_birth`, `avatar_url`
- `dog_guardians` table with all columns including `role TEXT DEFAULT 'guardian'` (even though invite flow ships in Phase 4)
- `is_dog_guardian(p_dog_id UUID)` PostgreSQL function (`SECURITY DEFINER`, `STABLE`)
- RLS policies on `dogs`, `dog_guardians`, `care_events`, `health_records`, `reminders` (all tables — write policies now even if tables are empty)
- Supabase Storage bucket `dog-avatars` (public, images only, 5MB limit enforced by bucket policy)
- Required indexes: `idx_dog_guardians_dog_user ON dog_guardians(dog_id, user_id, status)`

**Pitfalls addressed in this phase:**
- Pitfall 1 (RLS gaps on child tables) — write all table RLS policies now, not incrementally
- Pitfall 6 (file size and MIME validation on avatars) — bucket policy + client-side size check before upload

**Key constraint:** The `is_dog_guardian()` function and all child-table RLS policies must be written as SQL migration files before any Angular service code is written for those tables.

---

### Phase 4: Co-Guardians

**Goal:** A dog owner can invite another person as a co-guardian via email, the invitee can accept via a single-use token link, and the owner can view and remove co-guardians.

**Depends on:** Phase 3 (`dog_guardians` table and `is_dog_guardian()` must exist; invite flow requires the Resend + Edge Function infrastructure that also powers Phase 6 reminders)

**Requirements:** GUARD-01, GUARD-02, GUARD-03, GUARD-04, GUARD-05, GUARD-06

**Success Criteria** (what must be TRUE when this phase is done):
1. An owner enters an email address on their dog's settings page; within 60 seconds the invitee receives an email with a unique accept link (not an email-matching link — a UUID token in the URL)
2. The invitee clicks the accept link, signs in with any Google account (not necessarily the invited email), and immediately gains read/write access to that dog's data — confirmed by seeing the dog appear in their dog list
3. After acceptance, the `invite_token` column in `dog_guardians` is NULL — the link no longer works if clicked a second time
4. The owner's guardian list shows all accepted co-guardians with their display name
5. The owner can remove a co-guardian; an active co-guardian with the app open sees a "you no longer have access" state within seconds via Realtime
6. The `role` column is populated (`'owner'` for the creating user, `'guardian'` for invitees) on every `dog_guardians` row

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [ ] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [ ] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Infrastructure established in this phase:**
- Supabase Edge Function `send-invite-email` (Deno, calls Resend API)
- Database webhook or direct client call to trigger Edge Function on invite INSERT
- `expires_at` enforcement (7-day invite expiry) — cron or app-level check
- Supabase Realtime subscription on `dog_guardians` table per current user (for removal detection)

**Pitfalls addressed in this phase:**
- Pitfall 2 (invite race condition) — token-based acceptance, not email-matching; token nulled after accept
- Pitfall 7 (removed guardian stale session) — Realtime subscription on guardian row triggers navigation

**Key constraints:**
- Acceptance flow looks up invite by UUID token only — the invitee's `auth.uid()` at acceptance time is what gets stored, regardless of which email was invited
- The Resend integration lives entirely in the Edge Function (Deno runtime) — no `resend` package in the Angular bundle
- Verify `pg_net` extension availability on the Supabase project tier before planning the pg_cron → Edge Function HTTP call pattern (may need direct client trigger instead)

---

### Phase 5: Daily Care Tracking

**Goal:** Any guardian of a dog can log feeding entries, weight measurements, and diary notes; all guardians share a single chronological care feed that shows who logged each entry.

**Depends on:** Phase 4 (care event RLS policies depend on `is_dog_guardian()` being correct and tested with real co-guardian data)

**Requirements:** CARE-01, CARE-02, CARE-03, CARE-04, CARE-05, CARE-06

**Success Criteria** (what must be TRUE when this phase is done):
1. A guardian can tap "Log feeding", fill in food type and amount (2–3 fields), submit, and see the entry appear in the care feed tagged with their name
2. A guardian can log a weight measurement; the weight appears in the feed with the recorded timestamp
3. A guardian can add a freeform diary note; it appears in the feed alongside feeding and weight entries
4. The care feed is sorted by `occurred_at` (not `created_at`) — an entry logged as "yesterday at 7pm" appears below yesterday's entries, not at the top
5. A co-guardian opens the same dog's feed on a separate device and sees a new entry from the owner appear without refreshing the page (Supabase Realtime Postgres Changes)
6. A user with no guardian relationship to a dog receives zero rows from `care_events` for that dog — RLS is enforced at the database level, not just in the Angular service

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [ ] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [ ] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Schema established in this phase:**
- `care_events` table: `id`, `dog_id`, `logged_by`, `event_type` (CHECK constraint: `'feeding' | 'weight' | 'note' | 'medication_dose'`), `occurred_at`, `payload JSONB`, `created_at`
- Append-only design — no hard deletes; soft delete via `deleted_at TIMESTAMPTZ` if needed
- RLS policies on `care_events` referencing `is_dog_guardian(dog_id)` (written in Phase 3 migration, activated here)
- Required index: `idx_care_events_dog_occurred ON care_events(dog_id, occurred_at DESC)`
- Supabase Realtime enabled on `care_events` table

**Anti-patterns avoided:**
- No separate `feedings`, `weight_logs`, `notes` tables — unified `care_events` only
- No Realtime Broadcast (client-to-client) — always write to DB first, Postgres Changes fires from committed row

**Key constraints:**
- `CareEventService` must unsubscribe from the Realtime channel when the feed component is destroyed (`takeUntilDestroyed`)
- Realtime channel subscribed only after auth session is confirmed (not on anonymous state)
- Test explicitly: subscribe to the care channel as a non-guardian user and confirm zero events are received

---

### Phase 6: Health Records & Reminders

**Goal:** Guardians can record vaccinations and medications for a dog, and all guardians receive email reminders for upcoming vaccinations and daily medications via a server-side scheduled job.

**Depends on:** Phase 5 (the `medication_dose` event type in `care_events` references `health_records.id`; the care event model must exist before medication dose logging is built)

**Requirements:** HEALTH-01, HEALTH-02, HEALTH-03, HEALTH-04, HEALTH-05, HEALTH-06, HEALTH-07

**Success Criteria** (what must be TRUE when this phase is done):
1. A guardian can add a vaccination record (vaccine name, date given, next due date) and see it in the dog's health records list
2. A guardian can add a medication record (name, dose, frequency, start date, end date) and see it listed
3. A guardian can edit or delete any health record they created
4. All co-guardians of a dog receive an email reminder for any vaccination due within the next 7 days — the email arrives even when the app is closed
5. All co-guardians receive an email reminder for each daily medication due — one email per guardian per medication per day, not one email per dog
6. If a reminder has already been sent to a user, it is not sent again (the `sent` flag on the `reminders` table prevents duplicate delivery)
7. The `reminders` table has one row per guardian per health event — not one row per dog; a dog with 2 guardians and 1 upcoming vaccination has exactly 2 reminder rows

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [ ] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [ ] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Schema established in this phase:**
- `health_records` table: `id`, `dog_id`, `record_type` (`'vaccination' | 'medication'`), `name`, `given_at`, `next_due_at`, `dose`, `frequency`, `start_date`, `end_date`, `notes`, `created_by`, `created_at`
- `reminders` table: `id`, `dog_id`, `health_record_id`, `user_id`, `reminder_type`, `due_at`, `message`, `sent`, `sent_at`, `created_at`
- RLS on both tables via `is_dog_guardian(dog_id)` (policies written in Phase 3, data starts flowing here)
- Required indexes: `idx_health_records_dog ON health_records(dog_id)`, `idx_reminders_due ON reminders(due_at) WHERE sent = false` (partial index)
- Supabase Edge Function `dispatch-reminders` (Deno, queries due reminders, calls Resend, marks `sent = true`)
- pg_cron job firing every 15 minutes: `SELECT cron.schedule('dispatch-reminders', '*/15 * * * *', ...)`
- 1-hour lookback window in the dispatch query to handle missed cron windows

**Anti-patterns avoided:**
- No browser push notifications — email only for v1
- No single reminder per dog — one per guardian per event (fan-out at reminder creation time)

**Pre-phase verification required:**
- Confirm `pg_cron` extension is enabled on the Supabase project (Dashboard > Database > Extensions)
- Confirm `pg_net` extension is available on the plan tier (required for pg_cron HTTP call to Edge Function)
- If `pg_net` is unavailable, the Edge Function must be triggered directly from the Angular client after inserting a health record with `next_due_at` set

---

### Phase 7: Polish & Place Discovery Integration

**Goal:** The existing dog-friendly place discovery feature is accessible from the unified app navigation, and the care experience has lightweight analytical views (weight chart, feeding consistency) that surface value from already-captured data.

**Depends on:** Phase 6 (all core features must be complete before polish is added; weight chart requires care_events data to exist)

**Requirements:** PLACE-01, PLACE-02

**Success Criteria** (what must be TRUE when this phase is done):
1. A user can navigate from the dog care section to the dog-friendly place discovery map via the main app navigation menu — no hard URL change required
2. The existing place search functionality (Overpass API, Leaflet map, category filters) works identically to its pre-Phase 1 behavior — no regressions introduced by the HomeComponent decomposition
3. A dog's profile page shows a weight trend line chart for all logged weight entries (requires at least 2 data points to render; shows a placeholder message with 0–1 points)
4. Each dog's summary card shows a feeding consistency indicator for today: "Fed X of Y times" derived from `care_events` where `event_type = 'feeding'` and `occurred_at` is today — X is actual entries, Y is the target set by the owner (or defaults to 2)
5. A signed-in user can trigger account deletion from their profile settings; all their `dogs`, `dog_guardians`, `care_events`, `health_records`, and `reminders` rows are removed from Supabase

**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Secure credentials and fix broken test suite
- [ ] 01-02-PLAN.md — Decompose HomeComponent into MapComponent, MapService, and presentational PlacesListComponent
- [ ] 01-03-PLAN.md — Create LoggerService, replace console calls, add OSM null guard, final mock data sweep

**Key constraints:**
- Place discovery integration must not re-introduce the `HomeComponent` god object — the `MapComponent` and `PlaceListComponent` extracted in Phase 1 are the building blocks here
- Weight chart must use a library with confirmed Angular 19 signals compatibility — verify before implementation (Chart.js wrapper vs. native binding)
- PLACE-01 and PLACE-02 are the only v1 requirements in this phase; weight chart and feeding indicator are UX enhancements derived from existing data, not new requirements
- Account deletion is a GDPR obligation — implement cascade deletes at the database level (`ON DELETE CASCADE`) so that deleting the `auth.users` row triggers cleanup, not the Angular client

---

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| DOG-01 | Phase 3 | Pending |
| DOG-02 | Phase 3 | Pending |
| DOG-03 | Phase 3 | Pending |
| DOG-04 | Phase 3 | Pending |
| DOG-05 | Phase 3 | Pending |
| DOG-06 | Phase 3 | Pending |
| GUARD-01 | Phase 4 | Pending |
| GUARD-02 | Phase 4 | Pending |
| GUARD-03 | Phase 4 | Pending |
| GUARD-04 | Phase 4 | Pending |
| GUARD-05 | Phase 4 | Pending |
| GUARD-06 | Phase 4 | Pending |
| CARE-01 | Phase 5 | Pending |
| CARE-02 | Phase 5 | Pending |
| CARE-03 | Phase 5 | Pending |
| CARE-04 | Phase 5 | Pending |
| CARE-05 | Phase 5 | Pending |
| CARE-06 | Phase 5 | Pending |
| HEALTH-01 | Phase 6 | Pending |
| HEALTH-02 | Phase 6 | Pending |
| HEALTH-03 | Phase 6 | Pending |
| HEALTH-04 | Phase 6 | Pending |
| HEALTH-05 | Phase 6 | Pending |
| HEALTH-06 | Phase 6 | Pending |
| HEALTH-07 | Phase 6 | Pending |
| PLACE-01 | Phase 7 | Pending |
| PLACE-02 | Phase 7 | Pending |

**Coverage:** 34/34 v1 requirements mapped. No orphans.

---

## Architecture Decisions Locked by This Roadmap

These decisions are established early and cannot be changed without painful migrations. They are recorded here so no phase reopens them.

| Decision | Locked In | Rationale |
|----------|-----------|-----------|
| `is_dog_guardian()` RLS function as access control pivot | Phase 3 | Applied to all tables at once; changing it later requires policy rewrites across every table |
| `care_events` unified table (not per-type tables) | Phase 5 | Separate tables require UNION queries and duplicate RLS policies; Realtime cannot cover multiple tables in one channel |
| Sort `care_events` by `occurred_at`, not `created_at` | Phase 5 | Changing the sort key after the UI is built breaks cached clients |
| `dog_guardians.role` column added at Phase 3 even though used in Phase 4+ | Phase 3 | Retrofitting after data exists requires a migration AND policy rewrite |
| `invite_token` nulled after acceptance | Phase 4 | Leaving it live allows replay attacks; fixing after launch requires auditing every accepted row |
| Reminders fan out per-user, not per-dog | Phase 6 | One reminder per dog makes per-user delivery tracking impossible without a second join table |
| Email reminders via Edge Function + pg_cron (not browser push) | Phase 6 | Web Push requires service worker, PWA manifest, VAPID keys; email is reliable for v1 scope |
| `breeding_*` tables isolated in separate namespace | v2 | Mixing with core `dogs` table entangles private care data with public directory data |

---

## Cross-Phase Dependencies

```
Phase 1 (Foundation)
  └── Phase 2 (Auth) — credentials must be in env vars; HomeComponent must be decomposed
        └── Phase 3 (Dog Profiles) — auth.uid() required for dog ownership; RLS foundation established here
              └── Phase 4 (Co-Guardians) — dog_guardians table exists; Resend Edge Function sets up email infrastructure
                    └── Phase 5 (Daily Care Tracking) — is_dog_guardian() tested with real co-guardian data
                          └── Phase 6 (Health Records) — care_events model exists for medication_dose event type
                                └── Phase 7 (Polish) — all feature data exists for chart/indicator derivation
```

---

## Research Flags (Pre-Planning Verification Required)

These items must be confirmed before planning the relevant phase. Do not begin implementation until verified.

| Flag | Required For | Verification Step |
|------|-------------|-------------------|
| `pg_net` extension availability on Supabase plan tier | Phase 4, Phase 6 | Dashboard > Database > Extensions; if unavailable, use direct client trigger instead of pg_cron HTTP call |
| `pg_cron` extension enabled on Supabase project | Phase 6 | Dashboard > Database > Extensions |
| Supabase Storage image transform API on plan tier | Phase 3 | Check if `?width=200&height=200&resize=cover` URL params work on avatar public URLs |
| Angular 19-compatible chart library | Phase 7 | Confirm Chart.js Angular wrapper supports signals, or identify alternative |
| Supabase Realtime RLS enforcement on `postgres_changes` channels | Phase 5 | Test explicitly: subscribe as non-guardian, confirm zero events received |
| `supabase-js` v3 proximity | All phases | Check Supabase changelog at start of each phase; `2.99.1` suggests major version boundary is near |

---

*Roadmap defined: 2026-03-22*
*Ready for phase planning: yes*
*Next step: `/gsd:plan-phase 1`*
