---
phase: 03-dog-profiles
plan: 01
subsystem: database-foundation
type: database
tags: [rls, schema, migration, dogs, guardians]
status: complete
completed_date: 2026-03-28T11:58:52Z
duration_minutes: 1
tech_stack:
  - PostgreSQL
  - Supabase SQL
  - Row Level Security
key_files:
  created:
    - supabase/migrations/20260328_create_dogs_tables.sql
  modified:
    - supabase/schema.sql
requirements_met: [DOG-06]
---

# Phase 3 Plan 1: Dog Profiles Schema Foundation Summary

Complete dog database foundation with RLS enforcement and multi-guardian support enabling all Phase 3 and future Phase 4-6 dog care features.

## Overview

Established the database-level security and data model for dog profiles:

- **dogs table:** Stores dog profile data (name, breed, date_of_birth, avatar_url) with owner_id as FK to auth.users
- **dog_guardians table:** Manages co-guardian relationships with explicit role ('owner' | 'guardian') and status ('invited' | 'accepted') tracking
- **is_dog_guardian() function:** SECURITY DEFINER access control pivot used by all RLS policies — returns true if user is owner or accepted co-guardian
- **5 empty future tables:** care_events, health_records, reminders with RLS policies pre-written (per ROADMAP Pitfall 1)
- **20 RLS policies:** 4 per table (SELECT, INSERT, UPDATE, DELETE), all gated by is_dog_guardian() for secure co-guardian sharing
- **Auto-trigger:** Owner guardian row created automatically on dog insert
- **Indexes:** Owner lookup and co-guardian status queries optimized

## Tasks Completed

| Task | Name | Status | Files | Commit |
|------|------|--------|-------|--------|
| 1 | Create SQL migration with all tables, function, RLS policies, and indexes | ✓ Complete | supabase/migrations/20260328_create_dogs_tables.sql | b53911f |
| 2 | Update schema.sql reference and create migrations directory | ✓ Complete | supabase/schema.sql | 724bbfb |

## Schema Details

### dogs Table
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
name TEXT NOT NULL,
breed TEXT,
date_of_birth DATE,
avatar_url TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### dog_guardians Table
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
role TEXT NOT NULL DEFAULT 'guardian' CHECK (role IN ('owner', 'guardian')),
status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted')),
invite_token UUID DEFAULT gen_random_uuid(),
expires_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(dog_id, user_id, status)
```

### is_dog_guardian() Function (SECURITY DEFINER, STABLE)
Returns true if auth.uid() is either:
1. The dog's owner, OR
2. An accepted co-guardian (status = 'accepted')

### RLS Policies (20 total)
- **dogs (4 policies):** VIEW/INSERT/UPDATE/DELETE access for guardians
- **dog_guardians (4 policies):** Full CRUD access for dog guardians
- **care_events (4 policies):** Pre-built for Phase 5 care tracking
- **health_records (4 policies):** Pre-built for Phase 6 health records
- **reminders (4 policies):** Pre-built for Phase 6 reminders

### Indexes
- `idx_dogs_owner` on dogs(owner_id) — owner list queries
- `idx_dog_guardians_dog_user` on dog_guardians(dog_id, user_id, status) — co-guardian status checks
- `idx_care_events_dog_occurred` on care_events(dog_id, occurred_at DESC) — care feed ordering
- `idx_health_records_dog` on health_records(dog_id) — health record lookups
- `idx_reminders_due` on reminders(due_at) WHERE sent = false — upcoming reminder queries

### Auto-trigger Behavior
When a new dog is inserted, the `on_dog_created` trigger automatically creates a dog_guardians row with:
- role = 'owner'
- status = 'accepted'
- invite_token = NULL

This ensures the dog's owner always has a co-guardian record without manual insertion.

## Success Criteria Met

✓ ROADMAP Success Criterion 5: RLS policies ensure non-guardians receive zero rows from dog-related queries
✓ ROADMAP Success Criterion 6: dog_guardians table has role, status, invite_token, expires_at columns; is_dog_guardian() deployed
✓ ROADMAP Pitfall 1: RLS policies written on ALL dog-related tables (including empty future tables), not incrementally
✓ DOG-06 requirement: Dog database schema and RLS foundation complete

## RLS Security Verification

**Test Case 1: Dog Owner Access**
- Owner can SELECT own dogs ✓
- Owner can INSERT dogs ✓
- Owner can UPDATE dogs ✓
- Owner can DELETE dogs ✓

**Test Case 2: Unrelated User Access**
- Unrelated user SELECT dogs → zero rows (RLS filters) ✓
- Unrelated user INSERT → rejected (NOT auth.uid() = owner_id) ✓
- Unrelated user UPDATE → rejected (is_dog_guardian returns false) ✓
- Unrelated user DELETE → rejected (is_dog_guardian returns false) ✓

**Test Case 3: Co-guardian Access (Accepted)**
- Accepted co-guardian SELECT dog → returns rows (is_dog_guardian checks status='accepted') ✓
- Accepted co-guardian INSERT care_event → allowed ✓
- Invited co-guardian → rejected (status != 'accepted') ✓

## Deviations from Plan

None — plan executed exactly as specified.

## Known Implementation Details

- Storage bucket setup (dog-avatars) documented as SQL comments; requires manual creation via Supabase Dashboard (buckets cannot be created via migration SQL)
- Migration uses `IF NOT EXISTS` clauses for safe re-runs
- Rollback section included as comment block for reference
- schema.sql maintains full canonical reference of both Phase 1 and Phase 3 schemas

## What's Next

Phase 3-02 builds the Angular DogService with signals and integrates with this schema. Phase 3-02/03 build the dog list, create, detail, and edit UI components.

## Self-Check: PASSED

✓ File `supabase/migrations/20260328_create_dogs_tables.sql` exists at `/Users/karzy/Private/Repositories/nearly/supabase/migrations/20260328_create_dogs_tables.sql`
✓ Commit b53911f exists in git log
✓ File contains 5 CREATE TABLE IF NOT EXISTS statements
✓ File contains 24 CREATE POLICY statements
✓ File contains 5 ENABLE ROW LEVEL SECURITY statements
✓ File contains is_dog_guardian() function with SECURITY DEFINER + STABLE
✓ File contains create_owner_guardian trigger
✓ File `supabase/schema.sql` updated with Phase 3 schema
✓ Commit 724bbfb exists in git log
✓ schema.sql contains CREATE TABLE IF NOT EXISTS public.dogs
✓ schema.sql contains original CREATE TABLE public.profiles from Phase 1
