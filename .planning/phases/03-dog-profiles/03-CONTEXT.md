# Phase 3: Dog Profiles - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

An authenticated user can create, view, edit, and delete their dogs, upload avatar photos, and the database enforces co-guardian access control via RLS. This phase establishes the `dogs` and `dog_guardians` tables, the `is_dog_guardian()` RLS function, and all foundational database policies that all subsequent phases depend on. The Phase 3 UI is a dog hub with tabs for Profile, Care, Health, and Co-Guardians — Care/Health tabs show empty states until their features ship in later phases.

</domain>

<decisions>
## Implementation Decisions

### Dog List UI & Navigation

- **D-01:** Dog list displays as a **vertical list with avatar thumbnails** — avatar (or fallback icon) on left, dog name and breed on right. Compact, scrollable.
- **D-02:** **Add dog entry point**: Plus icon (`+`) next to the page title "My Dogs" in the page header. Clicking navigates to the create page. Space-efficient, discoverable.
- **D-03:** **Current dog persistence**: A single "current dog" state (stored in session) with a **dropdown selector in the header**. Header shows "Dog: Fluffy" with avatar + dropdown arrow. Care logs, health records, and co-guardian features all operate on the current dog.
- **D-04:** Default landing page (`/dogly/dogs`) displays the **dog list only**. User must click a dog to see its detail/hub page. No side-by-side layout for Phase 3.

### Dog Creation & Editing

- **D-05:** Dog creation form is on a **dedicated page** (`/dogly/dogs/new`), not a modal. Provides space for form and explanations.
- **D-06:** **Required fields in create form**: name only. **Optional fields**: breed, date_of_birth. Minimizes friction for initial entry; user can fill in details later via the edit modal.
- **D-07:** **Dog edit form**: Modal dialog overlay on the detail page. Contains fields for name, breed, date_of_birth, and avatar. User returns to detail page on close/save.
- **D-08:** **Form interactions**: Text inputs for name and breed. Date picker (Material MatDatepickerInput or similar) for date_of_birth. Submit button labels: "Add Dog" on create page, "Save" in edit modal. Cancel returns to list or detail page respectively.

### Avatar Upload & Preview

- **D-09:** **Avatar upload is optional** during dog creation (field in the create form). User can add avatar during creation or later via the edit modal.
- **D-10:** **Upload interaction**: Click on avatar placeholder (or dedicated upload button) → file picker → show **preview with crop overlay** → user confirms crop → upload to Supabase Storage `dog-avatars` bucket.
- **D-11:** **Fallback image** when no avatar uploaded: **Generic SVG dog icon** (or paw icon). Not a colored placeholder with initials — keep it simple and universal.
- **D-12:** Avatar uploads are stored at `dog-avatars/{dog_id}.jpg` (or `.png`). Public read access (Supabase Storage public URL); size limit enforced by bucket policy (5MB).

### Dog Detail Hub & Tabs

- **D-13:** Dog detail page (`/dogly/dogs/:id`) is a **tabbed hub** with four tabs: **Profile**, **Care**, **Health**, **Co-Guardians**. All tabs are built in Phase 3.
- **D-14:** **Profile tab**: Shows dog name, breed, date_of_birth, avatar, edit button, delete button. Also shows which guardian (owner) created the dog.
- **D-15:** **Care tab**: Empty state in Phase 3 with message "No care entries yet. Care logging ships in Phase 5." (Placeholder; actual content added in Phase 5 when care event creation is built.)
- **D-16:** **Health tab**: Empty state in Phase 3 with message "No health records yet. Health records ship in Phase 6." (Placeholder; actual content added in Phase 6.)
- **D-17:** **Co-Guardians tab**: Shows list of co-guardians (if any). Empty state if none. Full co-guardian management (invite, accept, remove) ships in Phase 4; Phase 3 only displays the list and RLS enforcement foundation. Owner can see co-guardian role and status.

### Dog Editing & Deletion

- **D-18:** **Edit dog**: Button on the Profile tab opens a **modal form** (same fields as create: name, breed, date_of_birth, avatar). User saves and modal closes, returning to detail page. Edits are restricted to the dog's owner via RLS.
- **D-19:** **Delete dog**: Separate **delete icon/button** on the Profile section (e.g., trash icon or in a button group). Clicking shows a **confirmation dialog**: "Delete [dog name]? This cannot be undone." User confirms or cancels. Deletes the dog and all associated data (cascades to care_events, health_records, etc. via DB constraints).
- **D-20:** After deletion, user is redirected to `/dogly/dogs` (dog list page).

### Database & RLS Foundation

- **D-21:** `dogs` table created in this phase with columns: `id` (UUID), `owner_id` (FK to auth.users), `name`, `breed`, `date_of_birth`, `avatar_url`, `created_at`, `updated_at`.
- **D-22:** `dog_guardians` table created with columns: `id`, `dog_id`, `user_id`, `role` ('owner' | 'guardian'), `status` ('invited' | 'accepted'), `invite_token` (UUID, nulled on acceptance), `expires_at`, `created_at`. Unique constraint on `(dog_id, user_id, status)`.
- **D-23:** **RLS Helper Function**: `is_dog_guardian(p_dog_id UUID)` — SECURITY DEFINER, STABLE. Returns true if `auth.uid()` is the dog's owner or an accepted co-guardian. This function is the single access control pivot for all dog-related tables.
- **D-24:** **RLS policies** written in this phase on `dogs`, `dog_guardians`, `care_events`, `health_records`, `reminders` tables — even though care_events/health_records/reminders are empty:
  - `dogs` — SELECT: `is_dog_guardian(id)`, INSERT: `auth.uid()` (creates owner), UPDATE: `is_dog_guardian(id)`, DELETE: `is_dog_guardian(id)`.
  - `dog_guardians` — All operations gated by `is_dog_guardian(dog_id)`.
  - Child tables (`care_events`, `health_records`, `reminders`) — SELECT/INSERT/UPDATE/DELETE all use `is_dog_guardian(dog_id)` so they're ready for Phase 5+ data.
- **D-25:** Supabase Storage bucket `dog-avatars` created: public read, authenticated write, 5MB file size limit via bucket policy, `.jpg`/`.png`/`.webp` MIME types only.
- **D-26:** Required indexes: `idx_dogs_owner ON dogs(owner_id)`, `idx_dog_guardians_dog_user ON dog_guardians(dog_id, user_id, status)`.

### Angular Service & State Management

- **D-27:** **DogService** created (injectable, providedIn: 'root'). Methods:
  - `currentDog = signal<Dog | null>(null)` — tracks selected dog; persists in session.
  - `dogs = signal<Dog[]>([])` — cached list of user's owned + co-guarded dogs.
  - `createDog(name, breed?, dob?): Promise<Dog>` — create dog, set as current.
  - `updateDog(id, fields): Promise<Dog>` — update dog.
  - `deleteDog(id): Promise<void>` — delete dog, clear current if was selected.
  - `getDogs(): Promise<Dog[]>` — fetch user's accessible dogs via RLS query.
  - `setCurrentDog(dog): void` — update current dog in signal.
  - `uploadAvatar(dogId, file): Promise<string>` — upload to Storage, return public URL.
- **D-28:** All state uses Angular **signals** (currentDog, dogs, loading, error) — not BehaviorSubject. Follows Phase 2 pattern.
- **D-29:** **Avatar storage & retrieval**: DogService.uploadAvatar() uses `supabase.storage.from('dog-avatars').upload()`. Retrieved via `supabase.storage.from('dog-avatars').getPublicUrl()`. Crop/resize on client before upload to save bandwidth.

### Load & Error Handling

- **D-30:** **Loading states**: List page shows skeleton loaders while fetching dogs. Detail page shows skeleton for dog data while loading.
- **D-31:** **Error states**: Toast notifications (Angular Material MatSnackBar) for transient errors (upload failed, deletion failed). Generic messages: "Failed to upload avatar" rather than raw Supabase errors.
- **D-32:** **Successful operations**: Brief toast confirmation ("Dog added", "Dog updated", "Dog deleted").

### Claude's Discretion

- Exact Material component choices (MatIcon for trash/plus, MatMenu for options menu if used)
- Crop tool library (ngx-image-cropper or similar; researcher to identify Angular 19-compatible option)
- Skeleton loader styling (standard Ngx-skeleton-loader or custom CSS)
- Exact error message wording (above are templates; researcher can refine)
- Toast duration and positioning

</decisions>

<specifics>
## Specific Ideas

- The ROADMAP emphasizes: "Pitfall 1 — RLS gaps on child tables — write all table RLS policies now, not incrementally." This means even though `care_events`, `health_records`, and `reminders` are empty in Phase 3, their RLS policies must be fully written and tested. Don't punt this to later phases.
- The `is_dog_guardian()` function is the single point of access control — all subsequent phases depend on this being correct. Test it explicitly with ownership and co-guardian scenarios before Phase 4.
- Avatar upload is optional but encouraged — it makes the dog feel real and makes visual switching between dogs easier.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 3 — Success criteria (6 items), schema details, key constraints
- `.planning/REQUIREMENTS.md` — DOG-01 through DOG-06 requirements; traceability

### Database Schema & RLS
- `supabase/schema.sql` — Existing `profiles`, `places`, `reviews`, `favorites` tables; pattern for RLS policies. Dogs/dog_guardians/is_dog_guardian() will be added as migrations in planning phase.
- `.planning/phases/03-dog-profiles/03-schema-migration.sql` (will be created during planning) — Full `dogs`, `dog_guardians` table definitions, `is_dog_guardian()` function, all RLS policies, indexes

### Frontend Components & Services
- `frontend/src/app/services/supabase.service.ts` — Existing `SupabaseService` with `currentUser` signal, auth methods, `places` query. DogService will follow the same pattern (signals, error handling, logging).
- `frontend/src/app/app.routes.ts` — Current routes; new routes for dog creation, detail, edit will be added
- `frontend/src/app/components/header/header.component.ts` — Current auth UI. Dog selector dropdown will be added to header in this phase or deferred to Phase 4 if needed.
- `frontend/src/app/config/theme.config.ts` — Multi-tenant theme colors; dog hub pages use theme colors via ThemeService

### Existing Patterns to Follow
- `.planning/phases/02-authentication/02-CONTEXT.md` — Route guard patterns, signal state management, error handling patterns established in Phase 2
- `frontend/src/app/components/places-list/places-list.component.ts` — Presentational component with `input<T>` signals and `output<T>` events; dog list will follow this pattern

### Storage & File Upload
- Supabase Storage documentation (researcher to verify): public bucket for avatars, size limits, MIME type validation
- Angular Material file input patterns (researcher to identify best practice for file picker + Material integration in Angular 19)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **ThemeService**: Already switches theme colors based on URL path. Dog detail pages will use theme colors (background, primary, text). No new theming logic needed.
- **SupabaseService**: Auth methods, signal pattern, error handling already in place. DogService will mirror this design.
- **Material components**: MatCard (places list), MatIcon, MatButton, MatSnackBar already in use. Dog list will use similar Material patterns.
- **PlacesListComponent**: Presentational component with input signals — dog list can follow same architecture (receives dogs array as input, emits selection).

### Established Patterns
- **Signals for state**: `places`, `currentUser`, `loading`, `error` all use signals. DogService will use signals for `currentDog`, `dogs`, `loading`, `error`.
- **Standalone components**: All components are standalone. Dog-related components (DogListComponent, DogDetailComponent, etc.) must be standalone.
- **Separate template/style files**: No inline templates. Each component has `.ts`, `.html`, `.scss`.
- **RLS-first design**: Phase 2 established auth guards; Phase 3 adds data-level RLS. Tests should verify RLS works as intended.

### Integration Points
- **app.routes.ts**: Add routes:
  - `{ path: ':app/dogs', component: DogListComponent, canActivate: [authGuard] }`
  - `{ path: ':app/dogs/new', component: DogCreateComponent, canActivate: [authGuard] }`
  - `{ path: ':app/dogs/:id', component: DogDetailComponent, canActivate: [authGuard] }`
  - `{ path: ':app/dogs/:id/edit', component: DogEditComponent, canActivate: [authGuard] }` (if edit is separate page; if modal in detail, not needed)
- **HeaderComponent**: Add dog selector dropdown with `DogService.currentDog` signal
- **APP_INITIALIZER**: May need to fetch current dog list on app init (defer to planning phase to decide)
- **Environment**: May need to add Supabase Storage URL to environment.ts

</code_context>

<deferred>
## Deferred Ideas

- **Avatar crop optimization** — Current approach is client-side crop before upload. Phase 3.5+ enhancement: server-side image transform API (Supabase Storage Images, Cloudinary, etc.) to serve resized avatars and save bandwidth.
- **Bulk dog operations** — Multi-select dogs for deletion or batch actions. Backlog; out of scope for v1.
- **Dog sharing link** — Non-authenticated users can view a dog's profile. Out of scope; sharing is social, not in v1.
- **Dog health timeline** — Visual timeline of vaccinations/medications. Backlog; Phase 6 health records is prerequisite.
- **Dog birthday reminders** — Special handling for dog's birthday. Backlog; Phase 6 reminder system can extend this.

</deferred>

---

*Phase: 03-dog-profiles*
*Context gathered: 2026-03-28*
