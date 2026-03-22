# Requirements: Dogly

**Defined:** 2026-03-22
**Core Value:** Multiple people caring for one dog always know what it ate, its health status, and what's coming up — no guessing, no missed medications.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Supabase anon key and URL moved to environment variables (not hardcoded in source)
- [ ] **FOUND-02**: `HomeComponent` refactored — business logic extracted, template under 100 lines
- [ ] **FOUND-03**: Mock/placeholder data and console.log statements removed from production code

### Authentication

- [ ] **AUTH-01**: User can sign in with Google account
- [ ] **AUTH-02**: User session persists across browser refresh (no redirect loop on hard refresh)
- [ ] **AUTH-03**: Unauthenticated users are redirected to a login page when accessing protected routes
- [ ] **AUTH-04**: User can sign out

### Dog Profiles

- [ ] **DOG-01**: Authenticated user can add a dog (name, breed, date of birth)
- [ ] **DOG-02**: User can upload an avatar photo for a dog
- [ ] **DOG-03**: User can edit a dog's details
- [ ] **DOG-04**: User can delete a dog they own
- [ ] **DOG-05**: User can view a list of their dogs (owned + co-guarded)
- [ ] **DOG-06**: Database enforces co-guardian access control via RLS (`dog_guardians` table + `is_dog_guardian()` function)

### Co-Guardians

- [ ] **GUARD-01**: Dog owner can invite another person as co-guardian by email
- [ ] **GUARD-02**: Invite is sent via email with a single-use token link (not email-matching)
- [ ] **GUARD-03**: Recipient can accept the invite via the token link and gain access to the dog
- [ ] **GUARD-04**: Owner can view list of co-guardians for a dog
- [ ] **GUARD-05**: Owner can remove a co-guardian
- [ ] **GUARD-06**: Co-guardian role is recorded (owner vs guardian) for future permission differentiation

### Daily Care Tracking

- [ ] **CARE-01**: User can log a feeding entry (time, food type, amount notes) for a dog
- [ ] **CARE-02**: User can log a weight measurement for a dog
- [ ] **CARE-03**: User can add a freeform diary note for a dog
- [ ] **CARE-04**: Care feed shows all entries (feeding, weight, notes) in chronological order with author attribution
- [ ] **CARE-05**: Care feed is shared — all co-guardians see the same feed
- [ ] **CARE-06**: Feed uses `occurred_at` (user-entered time) as sort key, not creation timestamp

### Health Records & Reminders

- [ ] **HEALTH-01**: User can add a vaccination record (vaccine name, date given, next due date)
- [ ] **HEALTH-02**: User can add a medication record (name, dose, frequency, start date, end date)
- [ ] **HEALTH-03**: User can view all health records for a dog
- [ ] **HEALTH-04**: User can edit and delete their health records
- [ ] **HEALTH-05**: All co-guardians of a dog receive email reminders for upcoming vaccinations (within 7 days)
- [ ] **HEALTH-06**: All co-guardians receive email reminders for daily medications due
- [ ] **HEALTH-07**: Reminder delivery is tracked per-user (not per-dog) to avoid duplicate sends

### Place Discovery (existing, secondary)

- [ ] **PLACE-01**: Dog-friendly place discovery is accessible from the app navigation menu
- [ ] **PLACE-02**: Existing Dogly place-search functionality is preserved

## v2 Requirements

### Dog Breeding Directory

- **BREED-01**: Breeder can register an account and subscribe (monthly/annual) to list their kennel
- **BREED-02**: Breeder can create a kennel profile (name, location, breeds, description, photos)
- **BREED-03**: Breeder can add a litter (mother, father, date of birth, number of puppies)
- **BREED-04**: Breeder can add individual puppy profiles (name, sex, photo, behavior description)
- **BREED-05**: Public search by breed — no login required
- **BREED-06**: Map view of kennels with breed filter
- **BREED-07**: Buyer can place a temporary reservation on a specific puppy
- **BREED-08**: Buyer can contact a breeder via in-app contact form
- **BREED-09**: Breeding directory is a separate lazy-loaded Angular module (`/dogly/directory`)
- **BREED-10**: Breeder subscription gated by Stripe; unpaid accounts cannot list new litters

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email/password registration | Google OAuth only for v1 — no password management complexity |
| Web push notifications | Architecture-heavy for web; email reminders cover the v1 use case adequately |
| Social dog profiles (public) | Identity bifurcation risk; Dogly is a private care tool, not a social network |
| Vet booking / external integrations | Not scoped; would require third-party partnerships |
| Native mobile app | Web-first for v1 |
| In-app payments / Stripe | Deferred to v2 with breeding module |
| Real-time feed sync (Supabase Realtime) | Nice to have — polling on load is sufficient for v1; Realtime is a v1.5 enhancement |

## Traceability

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

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
