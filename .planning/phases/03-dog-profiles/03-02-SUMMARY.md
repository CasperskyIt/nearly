---
phase: 03-dog-profiles
plan: 02
subsystem: dog-service-foundation
type: service-layer
tags: [service, models, routing, signals, crud]
status: complete
completed_date: 2026-03-28T12:15:00Z
duration_minutes: 15
tech_stack:
  - Angular 19 signals
  - TypeScript interfaces
  - Supabase client
  - Angular routing
key_files:
  created:
    - frontend/src/app/models/dog.model.ts
    - frontend/src/app/services/dog.service.ts
    - frontend/src/app/pages/dog-list/dog-list.component.ts
    - frontend/src/app/pages/dog-list/dog-list.component.html
    - frontend/src/app/pages/dog-list/dog-list.component.scss
    - frontend/src/app/pages/dog-create/dog-create.component.ts
    - frontend/src/app/pages/dog-create/dog-create.component.html
    - frontend/src/app/pages/dog-create/dog-create.component.scss
    - frontend/src/app/pages/dog-detail/dog-detail.component.ts
    - frontend/src/app/pages/dog-detail/dog-detail.component.html
    - frontend/src/app/pages/dog-detail/dog-detail.component.scss
  modified:
    - frontend/src/app/app.routes.ts
requirements_met: [DOG-01, DOG-02, DOG-03, DOG-04, DOG-05]
key_decisions:
  - Use Angular signals (not BehaviorSubject) for state management across all dog service signals
  - Avatar upload includes cache-busting query param to prevent stale browser cache
  - Session persistence uses sessionStorage to maintain currentDog across browser tabs
  - Route order places :app/dogs/new before :app/dogs/:id to prevent "new" from being captured as an ID
  - Stub components created with separate template/style files (CLAUDE.md convention) to prevent build errors before full implementation
---

# Phase 3 Plan 2: Dog Service & Routing Foundation Summary

DogService, Dog/DogGuardian interfaces, and dog routes established. Foundation layer complete for all UI components in Plans 03-05.

## Overview

Created the Angular service layer and routing foundation for dog profile management:

- **Dog Model Interfaces:** Full TypeScript type definitions for Dog, DogGuardian, CreateDogRequest, UpdateDogRequest mapping all database columns
- **DogService:** Injectable service with signals for state (currentDog, dogs, loading, error) and 8 methods for CRUD, avatar upload, and co-guardian queries
- **Route Registration:** Three dog routes (/dogs, /dogs/new, /dogs/:id) with authGuard and lazy loading
- **Stub Components:** Minimal standalone components with separate template/style files for dog-list, dog-create, dog-detail to prevent compilation errors

All implemented following the SupabaseService signal pattern and CLAUDE.md Angular conventions. Service layer fully ready for UI component implementation in Plans 03-05.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create Dog and DogGuardian TypeScript interfaces | ✓ Complete | ce3497c |
| 2 | Create DogService with CRUD, avatar upload, and signals | ✓ Complete | 5710237 |
| 3 | Register dog routes with lazy loading and authGuard | ✓ Complete | 84c0aef |

## Detailed Implementation

### Task 1: Dog Model Interfaces

**File:** `frontend/src/app/models/dog.model.ts`

```typescript
export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  date_of_birth: string | null; // ISO date from Supabase DATE
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DogGuardian {
  id: string;
  dog_id: string;
  user_id: string;
  role: 'owner' | 'guardian';
  status: 'invited' | 'accepted';
  invite_token: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateDogRequest {
  name: string;
  breed?: string;
  date_of_birth?: string;
}

export interface UpdateDogRequest {
  name?: string;
  breed?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
}
```

All fields map to database columns from Phase 01 migration. Nullable fields use `| null`.

### Task 2: DogService Implementation

**File:** `frontend/src/app/services/dog.service.ts`

**State Signals:**
- `currentDog = signal<Dog | null>(null)` — currently selected dog (persisted in sessionStorage)
- `dogs = signal<Dog[]>([])` — cached list of user's accessible dogs (RLS-filtered)
- `loading = signal(false)` — fetch/mutation in progress
- `error = signal<string | null>(null)` — last error message

**Methods (8 total):**

1. **getDogs()** — Query dogs table (RLS filters to user's dogs). Updates dogs signal. Returns array.
2. **createDog(request: CreateDogRequest)** — Insert new dog with owner_id. Adds to dogs array, sets as currentDog.
3. **updateDog(id: string, request: UpdateDogRequest)** — Update dog, adds updated_at timestamp. Updates dogs array and currentDog if matched.
4. **deleteDog(id: string)** — Delete dog (CASCADE in DB). Removes from dogs array, clears currentDog if matched.
5. **uploadAvatar(dogId: string, file: File)** — Upload to dog-avatars bucket with upsert. Calls updateDog with avatar_url. Returns public URL with cache-busting query param.
6. **setCurrentDog(dog: Dog | null)** — Updates currentDog signal and persists dog.id in sessionStorage.
7. **restoreCurrentDog()** — Reads sessionStorage, fetches dogs if needed, finds and sets matching dog.
8. **getGuardians(dogId: string)** — Query dog_guardians where status='accepted'. Returns array.

**Error Handling Pattern:**
```typescript
try {
  this.loading.set(true);
  this.error.set(null);
  // ... operation
} catch (err: any) {
  this.error.set(err.message);
  this.logger.error('DogService error:', err);
} finally {
  this.loading.set(false);
}
```

All queries access Supabase client via `this.supabaseService.supabase` (same pattern as SupabaseService).

### Task 3: Dog Routes & Stub Components

**File:** `frontend/src/app/app.routes.ts`

Added three routes with authGuard and lazy loading (inserted before `:app` catch-all):

```typescript
{
  path: ':app/dogs',
  loadComponent: () => import('./pages/dog-list/dog-list.component').then(m => m.DogListComponent),
  canActivate: [authGuard],
},
{
  path: ':app/dogs/new',
  loadComponent: () => import('./pages/dog-create/dog-create.component').then(m => m.DogCreateComponent),
  canActivate: [authGuard],
},
{
  path: ':app/dogs/:id',
  loadComponent: () => import('./pages/dog-detail/dog-detail.component').then(m => m.DogDetailComponent),
  canActivate: [authGuard],
},
```

**Route Order:** `:app/dogs/new` placed before `:app/dogs/:id` to ensure "new" is not captured as a dogId parameter.

**Stub Components Created:**
- `DogListComponent` (dog-list/)
- `DogCreateComponent` (dog-create/)
- `DogDetailComponent` (dog-detail/)

Each stub:
- Standalone component with `@Component` decorator
- Separate `.html` and `.scss` files (per CLAUDE.md convention)
- Simple placeholder template
- Ready for full implementation in Plans 03-05

## Success Criteria Met

✓ Dog and DogGuardian interfaces with all database columns mapped
✓ DogService has all 8 required methods (D-27)
✓ DogService uses signals for state (D-28), not BehaviorSubject
✓ Avatar upload targets 'dog-avatars' bucket with cache-busting (D-29)
✓ Routes protected by authGuard (D-04, D-05)
✓ Route order ensures /dogs/new takes priority over /dogs/:id
✓ Stub components prevent build errors before full implementation
✓ All requirements DOG-01 through DOG-05 have service-layer support

## Deviations from Plan

None — plan executed exactly as specified. All three tasks completed, acceptance criteria met, routes verified in correct order.

## Self-Check: PASSED

✓ File `frontend/src/app/models/dog.model.ts` exists with Dog, DogGuardian, CreateDogRequest, UpdateDogRequest interfaces
✓ File `frontend/src/app/services/dog.service.ts` exists with all 8 methods and 4 state signals
✓ DogService imports SupabaseService and uses signal pattern correctly
✓ Avatar upload method contains storage.from('dog-avatars') and sessionStorage calls
✓ app.routes.ts contains :app/dogs, :app/dogs/new, :app/dogs/:id routes with authGuard
✓ :app/dogs/new route precedes :app/dogs/:id in file order (line 26 before line 31)
✓ Stub components exist: dog-list, dog-create, dog-detail with .ts, .html, .scss files
✓ Commit ce3497c exists in git log
✓ Commit 5710237 exists in git log
✓ Commit 84c0aef exists in git log

## What's Next

Plan 03-03 (Dog List & Detail UI Components) builds the dog list presentation component and detail hub page with tabs. Consumes DogService directly.

Plans 03-04 and 03-05 build create, edit, and co-guardian UI components using this service foundation.
