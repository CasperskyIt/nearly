# Dogly — Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value:** Multiple people caring for one dog always know what it ate, its health status, and what's coming up — no guessing, no missed medications.
**Current focus:** Phase 1 — Foundation & Cleanup

## Milestone

**v1** — Dog care platform with co-guardian sharing

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation & Cleanup | ○ Pending |
| 2 | Authentication | ○ Pending |
| 3 | Dog Profiles | ○ Pending |
| 4 | Co-Guardians | ○ Pending |
| 5 | Daily Care Tracking | ○ Pending |
| 6 | Health Records & Reminders | ○ Pending |
| 7 | Polish & Place Discovery | ○ Pending |

## Active Work

None — project initialized, ready for Phase 1 planning.

## Key Context

- Angular 19 frontend + Supabase (PostgreSQL) — no Spring Boot for v1
- Google OAuth only (no email/password auth)
- ⚠️ Supabase anon key is hardcoded in source — Phase 1 must rotate and move to env vars first
- RLS foundation (`dog_guardians` table + `is_dog_guardian()`) established in Phase 3
- Email reminders via Supabase Edge Function + pg_cron + Resend (not browser push)
- Verify `pg_net` extension availability before Phase 6 planning

---
*Initialized: 2026-03-22*
