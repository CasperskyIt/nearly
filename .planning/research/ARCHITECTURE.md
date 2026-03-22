# Architecture Patterns

**Domain:** Shared pet care platform with co-guardian access, health event logging, reminders, and a paid breeding directory module
**Researched:** 2026-03-22
**Confidence:** MEDIUM — based on established Supabase RLS patterns and PostgreSQL design principles. Web verification was unavailable; flag any Supabase Edge Function scheduling details for validation before implementation.

---

## Recommended Architecture

The app is a direct-to-Supabase Angular SPA for v1. No Spring Boot involvement. The architecture has four distinct concern zones:

```
Angular 19 SPA (client)
   │
   ├── Auth: Supabase Auth (Google OAuth)
   ├── Data: Supabase PostgREST (via supabase-js)
   ├── Realtime: Supabase Realtime (Postgres Changes channel)
   └── Reminders: Supabase Edge Function + pg_cron + Resend/email

Supabase (backend-as-a-service)
   ├── PostgreSQL database
   │    ├── dogs
   │    ├── dog_guardians          ← co-guardian join table (access control pivot)
   │    ├── care_events            ← unified event log
   │    ├── health_records         ← vaccinations, medications
   │    ├── reminders              ← scheduled reminder rows
   │    └── breeding_*             ← v2 tables (isolated schema)
   ├── Row Level Security          ← all access mediated here
   ├── Realtime                    ← care_events channel per dog_id
   ├── Edge Functions              ← reminder dispatch worker
   └── pg_cron                     ← invokes reminder Edge Function on schedule
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `SupabaseService` | Single gateway for all DB queries, auth, and realtime | Supabase JS SDK |
| `DogService` | Dog CRUD, co-guardian invite/remove | SupabaseService |
| `CareEventService` | Log and query care events (feeding, weight, notes) | SupabaseService, RealtimeChannel |
| `HealthService` | Vaccination + medication records, reminder creation | SupabaseService |
| `ReminderService` | Client-side reminder state; read-only for display | SupabaseService |
| `AuthService` | Session management, Google OAuth flow | SupabaseService |
| `BreedingService` (v2) | Breeder profiles, litter listings, reservation flow | SupabaseService, Stripe |
| Supabase Edge Function: `dispatch-reminders` | Queries due reminders, sends email via Resend | Supabase DB, Resend API |
| pg_cron job | Invokes `dispatch-reminders` on a schedule (e.g. every 15 min) | Edge Function HTTP |

---

## Data Flow

### Co-Guardian Care Feed (Realtime)

```
User A logs a feeding
  → CareEventService.insert(care_events row)
  → Supabase PostgREST writes row (RLS checked: must be guardian of dog)
  → Supabase Realtime broadcasts Postgres Change to channel `care:dog_id=<uuid>`
  → User B's Angular client (subscribed to same channel) receives INSERT event
  → CareEventService signal updated
  → Feed component re-renders with new entry
```

### Co-Guardian Invite Flow

```
Owner enters email
  → DogService.inviteGuardian(dogId, email)
  → Insert row into dog_guardians with status='pending', invited_email=email
  → Supabase Edge Function "send-invite-email" triggered via DB webhook or called directly
  → Invitee receives email with deep link (e.g. /dogly/invite?token=<uuid>)
  → Invitee clicks link → AuthService.signIn() if not signed in
  → DogService.acceptInvite(token) → updates dog_guardians row to status='accepted', user_id=auth.uid()
  → RLS policies now grant invitee read/write access to that dog's data
```

### Reminder Dispatch Flow

```
pg_cron fires every 15 minutes
  → HTTP POST to Edge Function: dispatch-reminders
  → Edge Function queries: SELECT * FROM reminders WHERE due_at <= now() AND sent = false
  → For each reminder row: fetch user email, send via Resend API
  → Mark reminder rows as sent=true
  → (No browser notification for v1 — email only)
```

---

## Schema Design

These are the decisions that are hardest to change after data exists. Treat them as load-bearing.

### dogs

```sql
CREATE TABLE dogs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  breed       TEXT,
  date_of_birth DATE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**Hard-to-change decision:** `owner_id` is denormalized here for fast "is this the owner?" checks in RLS. Do not remove it in favor of always querying `dog_guardians` — that would require changing many policies.

### dog_guardians (access control pivot — critical table)

```sql
CREATE TABLE dog_guardians (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id       UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),        -- null until accepted
  invited_by   UUID NOT NULL REFERENCES auth.users(id),
  invited_email TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'guardian',       -- 'owner' | 'guardian'
  status       TEXT NOT NULL DEFAULT 'pending',        -- 'pending' | 'accepted' | 'removed'
  invite_token UUID DEFAULT gen_random_uuid(),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

**Hard-to-change decisions:**
- The `role` column should be added now even if only 'guardian' is used in v1. Adding roles later requires a migration AND policy rewrite.
- `invited_email` is stored because the user may not exist yet. The `user_id` is populated on accept.
- `ON DELETE CASCADE` on dog_id ensures guardians are cleaned up if a dog is deleted.
- The `invite_token` must be unique and single-use. Add `UNIQUE(invite_token)` and set token to null after accept.

### care_events (unified event log — append-only)

```sql
CREATE TABLE care_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id     UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  logged_by  UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL,   -- 'feeding' | 'weight' | 'note' | 'medication_dose'
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Hard-to-change decisions:**
- `payload` as JSONB is flexible but means no column-level constraints per event type. Use a CHECK constraint or application-layer validation to enforce payload shape per `event_type`.
- `event_type` as free text is a trap — use a PostgreSQL ENUM or a CHECK constraint: `CHECK (event_type IN ('feeding', 'weight', 'note', 'medication_dose'))`. Adding new types later is a migration but it is safe.
- `occurred_at` is separate from `created_at`. Users may log retroactively. This distinction matters for chronological feed ordering — always sort by `occurred_at`, not `created_at`.
- This table should be **append-only**. Soft deletes only (`deleted_at TIMESTAMPTZ`). The audit value of the log is destroyed if rows are hard-deleted.

**Payload shapes by event_type:**

| event_type | payload fields |
|------------|----------------|
| feeding | `{ food_type: string, amount_grams: number, unit: string }` |
| weight | `{ weight_kg: number }` |
| note | `{ body: string }` |
| medication_dose | `{ medication_record_id: uuid, dose_given: string }` |

### health_records

```sql
CREATE TABLE health_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id          UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  record_type     TEXT NOT NULL,   -- 'vaccination' | 'medication'
  name            TEXT NOT NULL,
  given_at        DATE,
  next_due_at     DATE,            -- for vaccinations
  dose            TEXT,            -- for medications
  frequency       TEXT,            -- e.g. 'daily', 'twice daily'
  start_date      DATE,
  end_date        DATE,
  notes           TEXT,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Hard-to-change decision:** Vaccinations and medications share this table to simplify the care feed join. If they split into separate tables later, it requires migrating foreign keys in the `reminders` table.

### reminders

```sql
CREATE TABLE reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id          UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  health_record_id UUID REFERENCES health_records(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  reminder_type   TEXT NOT NULL,   -- 'vaccination' | 'medication'
  due_at          TIMESTAMPTZ NOT NULL,
  message         TEXT,
  sent            BOOLEAN NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Hard-to-change decision:** `user_id` on each reminder means reminders are per-user, not per-dog. This is intentional — each guardian gets their own copy of a due reminder. If you store one reminder per dog, you cannot track per-user delivery state without another join table.

---

## RLS Policy Design (Co-Guardian Access Control)

This is the most critical architecture decision for v1. All data access for dogs, care events, and health records flows through one predicate: "is the requesting user a guardian of this dog?"

### The Guardian Check Function

Define a helper function to avoid repeating the subquery in every policy:

```sql
CREATE OR REPLACE FUNCTION is_dog_guardian(p_dog_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM dog_guardians
    WHERE dog_id = p_dog_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
$$;
```

This function is `SECURITY DEFINER` (runs as the function owner, bypassing RLS on `dog_guardians` itself) and `STABLE` (safe to call multiple times in a query, Postgres can cache the result per query).

**Why this matters:** Without this helper, every RLS policy on `care_events`, `health_records`, etc. contains an EXISTS subquery on `dog_guardians`. That subquery runs for every row evaluated. With the helper marked STABLE, the planner can optimize repeated calls within a single statement.

### dogs Table Policies

```sql
-- Enable RLS
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Owner or accepted guardian can select
CREATE POLICY "guardians can view dog"
  ON dogs FOR SELECT
  USING (owner_id = auth.uid() OR is_dog_guardian(id));

-- Only owner can update or delete
CREATE POLICY "owner can update dog"
  ON dogs FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "owner can delete dog"
  ON dogs FOR DELETE
  USING (owner_id = auth.uid());

-- Any authenticated user can insert (creates their dog)
CREATE POLICY "authenticated users can create dogs"
  ON dogs FOR INSERT
  WITH CHECK (owner_id = auth.uid());
```

### care_events Table Policies

```sql
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

-- Any guardian of the dog can view all care events for it
CREATE POLICY "guardians can view care events"
  ON care_events FOR SELECT
  USING (is_dog_guardian(dog_id));

-- Any guardian can insert care events
CREATE POLICY "guardians can log care events"
  ON care_events FOR INSERT
  WITH CHECK (is_dog_guardian(dog_id) AND logged_by = auth.uid());

-- Only the logger can update their own entry (soft delete only)
CREATE POLICY "logger can update own event"
  ON care_events FOR UPDATE
  USING (logged_by = auth.uid());
```

### dog_guardians Table Policies

```sql
ALTER TABLE dog_guardians ENABLE ROW LEVEL SECURITY;

-- A user can see their own guardian rows, and an owner can see all rows for their dogs
CREATE POLICY "users can view own guardian rows"
  ON dog_guardians FOR SELECT
  USING (
    user_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_id AND dogs.owner_id = auth.uid())
  );

-- Only the owner of the dog can insert new guardian invitations
CREATE POLICY "owner can invite guardians"
  ON dog_guardians FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_id AND dogs.owner_id = auth.uid())
  );

-- Invitee can update to accept; owner can update to remove
CREATE POLICY "invitee can accept or owner can remove"
  ON dog_guardians FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM dogs WHERE dogs.id = dog_id AND dogs.owner_id = auth.uid())
  );
```

### Realtime + RLS Interaction

**Critical constraint (MEDIUM confidence — verify before shipping):** Supabase Realtime Postgres Changes respects RLS only when the subscription includes `auth.uid()` in the JWT. In practice this means:

1. The Angular client must set the Supabase auth session before subscribing to realtime channels.
2. Subscribe using a filter: `filter: 'dog_id=eq.<uuid>'` so the channel is scoped to a single dog's events.
3. RLS will still evaluate per-row on the database side, so a user who is not a guardian will not receive events even if they somehow subscribe to the channel.

**Pattern for Angular realtime subscription:**

```typescript
// In CareEventService
subscribeToFeed(dogId: string): RealtimeChannel {
  return this.supabase
    .channel(`care:${dogId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'care_events',
        filter: `dog_id=eq.${dogId}`
      },
      (payload) => this.appendEvent(payload.new as CareEvent)
    )
    .subscribe();
}
```

Unsubscribe when the dog feed component is destroyed (`ngOnDestroy` or `takeUntilDestroyed`).

---

## Patterns to Follow

### Pattern 1: Guardian Check as Database Function (not client-side)

**What:** All access control lives in `is_dog_guardian()` in Postgres, not in Angular service guards.
**When:** Every time you need to restrict data to a dog's guardians.
**Why:** Client-side guards are UI decoration. RLS is the actual security boundary. If the function is in the DB, a compromised client or direct API call cannot bypass it.

### Pattern 2: Event Sourcing for Care Feed

**What:** `care_events` is append-only. Never update the event_type or payload of a past event. If a user corrects an entry, insert a new event with a `corrects_event_id` FK.
**When:** Any time a user wants to edit or delete a logged event.
**Why:** Co-guardians need a reliable shared truth. Editing past entries creates race conditions and audit confusion. The append-only log is simple to replicate via realtime and trivial to page.
**Example schema addition:**

```sql
ALTER TABLE care_events ADD COLUMN corrects_event_id UUID REFERENCES care_events(id);
```

### Pattern 3: Invitation Token as Single-Use UUID

**What:** Generate a UUID invite token stored in `dog_guardians.invite_token`. After acceptance, set it to NULL.
**When:** Building the invite acceptance endpoint.
**Why:** Email links cannot be authenticated (the user may not be logged in yet). The token must work unauthenticated. Nulling it after use prevents replay.

### Pattern 4: Feature Flag Table for Breeding Module

**What:** Add a `subscriptions` table in v2 with `user_id`, `plan`, `active_until`. Gate all breeding queries behind a check: `SELECT EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND plan = 'breeder' AND active_until > now())`.
**When:** Designing v2 from the start.
**Why:** If you don't add the gate as an RLS condition on `breeding_*` tables from day one, you will have public data accidentally visible. Design the subscription check into the first breeding table migration.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Checking Guardian Status in Angular Services

**What:** Querying `dog_guardians` from the Angular service to decide whether to make a second query for care events.
**Why bad:** Adds a round-trip. More importantly, it creates the illusion of security — if the service check is bypassed, the data query still goes through. RLS must be the enforcement layer.
**Instead:** Let RLS enforce it. If a user is not a guardian, the `care_events` query returns 0 rows. Handle empty results gracefully in the UI.

### Anti-Pattern 2: One Reminder Row per Dog (not per User)

**What:** Storing a single reminder row per health event instead of one per guardian.
**Why bad:** You cannot track per-user delivery state. You cannot let a guardian dismiss a reminder without affecting others. Push notification targets are per-user.
**Instead:** Fan out reminder rows at creation time — one per accepted guardian of the dog. Use a database trigger or Edge Function called when a health record with `next_due_at` is inserted.

### Anti-Pattern 3: Separate Tables for Each Care Event Type

**What:** `feedings` table, `weight_logs` table, `notes` table as separate entities.
**Why bad:** The unified care feed requires a UNION query across all tables. The realtime subscription cannot cover multiple tables in one channel. RLS policies must be duplicated across all tables. Adding a new event type requires a schema migration AND policy migration.
**Instead:** The `care_events` table with `event_type` + `payload JSONB` handles all variants. The feed query is a single table scan with an ORDER BY. Realtime covers all event types in one channel.

### Anti-Pattern 4: Using Supabase Realtime Broadcast (not Postgres Changes) for Care Events

**What:** Using the Broadcast channel type to push events from one client to others, bypassing the database.
**Why bad:** Broadcast does not persist. If User B is offline, they miss the event. The feed would be inconsistent between guardians.
**Instead:** Always write to the database first. Realtime Postgres Changes then fires from the committed row. This means the feed is always reconstructable from the database, even after offline periods.

### Anti-Pattern 5: Mixing Breeding Directory Data into Core Dog Tables

**What:** Adding `is_listed`, `litter_id`, `price` columns to the `dogs` table.
**Why bad:** Entangles the pet care data model with the commercial directory model. RLS policies become complex. A free user's personal dog data ends up adjacent to public listing data.
**Instead:** All breeding directory data lives in a separate schema or clearly prefixed tables (`breeding_kennels`, `breeding_litters`, `breeding_puppies`). Core `dogs` table remains private to its guardians. A breeder may link a dog from their care profile to a litter, but via a FK, not inline columns.

---

## Notification Architecture

Three options exist for v1. A recommendation follows.

| Approach | Delivery | Reliability | Complexity | Cost |
|----------|----------|-------------|------------|------|
| Browser Push Notifications (Web Push API) | Real-time if app open or PWA installed | Unreliable — requires browser permission + PWA setup | High | Free |
| In-app badge / indicator only | Only visible when user opens app | Low | Very Low | Free |
| Email via Edge Function + pg_cron | Async, ~15 min latency | High — email always delivered | Medium | Low (Resend free tier: 3000/month) |

**Recommendation: Email only for v1.** Browser push requires service workers, a PWA manifest, and VAPID keys. The Web Push permission prompt has a ~40–50% rejection rate if shown too early. Email is reliable, deliverable to users who haven't opened the app in days (exactly the "missed medication" scenario), and requires no mobile app. Resend's free tier (3,000 emails/month) is sufficient for early users.

**Implementation: pg_cron + Supabase Edge Function**

```sql
-- Enable pg_cron (Supabase dashboard: Database > Extensions)
-- Create a cron job to fire every 15 minutes
SELECT cron.schedule(
  'dispatch-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://<project>.functions.supabase.co/dispatch-reminders',
      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

The Edge Function (`supabase/functions/dispatch-reminders/index.ts`):
1. Queries `reminders WHERE due_at <= now() AND sent = false AND due_at >= now() - interval '1 hour'` (the 1-hour lookback prevents re-sending if the cron missed a window).
2. For each reminder, fetches the user's email from `auth.users` (using the service role — Edge Functions have service role access).
3. Calls Resend API to send the email.
4. Updates `sent = true, sent_at = now()`.

**Confidence note:** The `net.http_post` call from pg_cron is available in Supabase via the `pg_net` extension. Verify this extension is available on the project's Supabase plan tier before implementation.

---

## Breeding Module Isolation (v2)

The breeding directory is a separately monetized tier. Its architecture must be isolated from day one to avoid entanglement.

### Isolation Strategy

```
Core module (v1):
  dogs, dog_guardians, care_events, health_records, reminders
  — all private, RLS-enforced per guardian

Breeding module (v2):
  breeding_kennels    ← breeder profile (public read, owner write)
  breeding_litters    ← litter listings (public read, breeder write)
  breeding_puppies    ← individual puppy profiles (public read, breeder write)
  breeding_reservations ← buyer holds (private per buyer + breeder)
  subscriptions       ← payment state (private per user)
```

### RLS for Public Breeding Directory

```sql
-- Public read, no auth required
CREATE POLICY "public can view listed kennels"
  ON breeding_kennels FOR SELECT
  USING (is_active = true);

-- Only the breeder (subscription holder) can edit their kennel
CREATE POLICY "breeder can manage kennel"
  ON breeding_kennels FOR ALL
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = auth.uid()
        AND plan = 'breeder'
        AND active_until > now()
    )
  );
```

### Angular Routing Isolation

The breeding module should be a lazy-loaded Angular feature module at `/dogly/directory`:

```typescript
// app.routes.ts
{
  path: 'dogly/directory',
  loadChildren: () => import('./features/breeding/breeding.routes')
}
```

This keeps the breeding bundle separate from the core care bundle. Users who never use the directory never load the code.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| RLS performance | Negligible — `is_dog_guardian` is fast with index | Add index on `dog_guardians(dog_id, user_id, status)` | Consider materialized view for guardian lookups |
| Realtime connections | No issue (Supabase free tier: 500 concurrent) | May hit plan limits — upgrade tier | Introduce connection pooling or event bus |
| care_events table size | Small — 100 users × 10 events/day = 1000 rows/day | Manageable — add index on `(dog_id, occurred_at)` | Partition by dog_id or time range |
| Reminder dispatch | 15-min cron with 100 reminders is instant | At 100K reminders/day, batch the Edge Function | Queue-based dispatch (e.g. Supabase Queues, when available) |
| Breeding directory | Static data, very cacheable | Add Supabase cache headers or CDN for public listings | CDN + read replica |

**Required indexes (add at migration time, not later):**

```sql
CREATE INDEX idx_dog_guardians_dog_user ON dog_guardians(dog_id, user_id, status);
CREATE INDEX idx_care_events_dog_occurred ON care_events(dog_id, occurred_at DESC);
CREATE INDEX idx_health_records_dog ON health_records(dog_id);
CREATE INDEX idx_reminders_due ON reminders(due_at) WHERE sent = false;
```

The `idx_reminders_due` is a partial index — it only indexes unsent reminders. It stays small regardless of historical reminder volume.

---

## Schema Decisions That Are Hard to Change Later

These deserve a special call-out because they require data migrations + policy rewrites if changed after data exists:

1. **`dog_guardians.role` column** — Add now with values `'owner' | 'guardian'`. If you want read-only guardians in v2, the column must already exist. Migration is a multi-step affair (add column, backfill, update policies).

2. **`care_events` table unification** — If you start with separate tables per event type, migrating to a unified table after data exists is painful. Start unified.

3. **`occurred_at` vs `created_at` on care_events** — The sort order of the feed depends on which timestamp you use. If you build the UI around `created_at` first and switch to `occurred_at` later, every client that cached old data needs to re-sort. Define the sort key once and stick to it. Use `occurred_at`.

4. **`invite_token` nulling after acceptance** — If you build the invite acceptance flow without nulling the token, deep links stay valid forever. Fixing it later means auditing every accepted row.

5. **`breeding_*` tables in a separate namespace** — If you add a `litters` column to `dogs` instead of a separate table, removing it cleanly once it has FK references is complex. Keep the boundary.

---

## Sources

**Confidence assessment by area:**

| Area | Confidence | Notes |
|------|------------|-------|
| RLS pattern (guardian function) | HIGH | Well-established Supabase/Postgres pattern; SECURITY DEFINER + STABLE is documented behavior |
| Realtime Postgres Changes | MEDIUM | Core behavior is stable; RLS enforcement in realtime channel requires verification against current Supabase docs |
| pg_cron + pg_net for reminder dispatch | MEDIUM | pg_net extension availability depends on Supabase plan; verify before building |
| Email via Resend in Edge Function | MEDIUM | Resend is widely used with Supabase; free tier limits may have changed |
| Breeding module isolation strategy | HIGH | Standard lazy-load module pattern; no Supabase-specific risk |
| Schema design decisions | HIGH | Standard PostgreSQL; no Supabase-specific uncertainty |

*Note: Web search and official doc fetch were unavailable during this research session. All Supabase-specific claims (especially pg_net availability, realtime RLS behavior, Edge Function scheduling) should be validated against https://supabase.com/docs before implementation.*
