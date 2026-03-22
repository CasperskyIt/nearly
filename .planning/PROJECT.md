# Dogly

## What This Is

Dogly is a shared dog care platform that lets dog owners and co-guardians track their dog's daily life together — feeding, weight, health records, and medication reminders — so everyone caring for the dog is always on the same page. A secondary module (v2) adds a paid dog breeding directory where breeders list litters and potential buyers can browse, filter by breed, and reserve puppies.

## Core Value

Multiple people caring for one dog always know what it ate, its health status, and what's coming up — no guessing, no missed medications.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Authentication
- [ ] User can register and log in with Google account
- [ ] User session persists across browser refresh

#### Dog Profiles
- [ ] User can add a dog (name, breed, date of birth, avatar photo)
- [ ] User can edit and delete their dog
- [ ] User can view a list of their dogs

#### Co-Guardians
- [ ] Dog owner can invite another user by email as co-guardian
- [ ] Invited user receives email invite and can accept to gain access
- [ ] Co-guardian can view and add care entries for the shared dog
- [ ] Owner can remove a co-guardian

#### Daily Care Tracking
- [ ] User can log a feeding entry (time, food type, amount)
- [ ] User can log weight
- [ ] User can add a note/diary entry
- [ ] Care feed shows all entries from all co-guardians in chronological order

#### Health Records & Reminders
- [ ] User can add a vaccination record (vaccine name, date given, next due date)
- [ ] User can add a medication record (name, dose, frequency, start/end date)
- [ ] User receives reminders for upcoming vaccinations and medications

#### Place Discovery (existing, secondary)
- [ ] Dog-friendly place discovery accessible from the app menu (existing feature)

### Out of Scope (v1)

- Dog breeding directory — planned for v2, requires separate subscription/payment infrastructure
- In-app payments or subscriptions — v2
- Vet booking or external integrations — not yet scoped
- Social feed / sharing dog profiles publicly — not yet scoped

## Context

- **Existing codebase**: Angular 19 frontend with Supabase backend. A "Dogly" theme and place-discovery feature already exist. The breeding directory shell (Dogly theme with dog-friendly place search) is the starting point.
- **Multi-tenant theming**: The app already has a `ThemeService` that switches between "Nearly" and "Dogly" themes based on URL path. Dogly is the focus; Nearly place discovery is a separate route.
- **Backend**: Spring Boot 4 (Java 21) backend exists but is currently empty — no endpoints yet. Supabase (PostgreSQL + PostGIS) is the active data layer via the Angular client directly.
- **Auth**: Currently no auth implemented. Google OAuth via Supabase Auth is the target.
- **Co-guardian model**: One dog can have one owner + multiple co-guardians. All guardians share the same care feed for that dog.

## Constraints

- **Tech Stack**: Angular 19 + Supabase — do not introduce a separate backend for v1. Spring Boot backend is available for v2 if needed.
- **Auth provider**: Google OAuth only for v1 (no email/password)
- **Mobile**: Web-first. No native app for v1.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase as primary backend for v1 | Existing integration, avoids Spring Boot setup overhead | — Pending |
| Google-only auth | Simplest OAuth flow, no password management needed | — Pending |
| Co-guardian invite via email | Explicit consent model — both parties opt in | — Pending |
| Breeding module as v2 | Requires subscription payments; scoping separately avoids bloat | — Pending |

## v2 Preview — Dog Breeding Directory

Captured for roadmap planning when v1 ships:

- Breeders pay monthly/annual subscription to list their kennel
- Breeder profiles: kennel info, breeds, location, map pin
- Litter listings: mother, father, date of birth, puppy count, individual puppy profiles (name, photo, behavior description)
- Public search by breed — no login required for buyers
- Map view with breed filter
- Puppy reservation: buyer can place a temporary hold on a specific puppy
- Contact breeder functionality

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after initialization*
