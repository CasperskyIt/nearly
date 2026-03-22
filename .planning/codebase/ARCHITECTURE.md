# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Multi-app SPA (Single Page Application) with theme-based routing

**Key Characteristics:**
- Angular 19 standalone components with signals-based reactivity
- Theme-agnostic frontend serving two applications (Nearly and Dogly) from single codebase
- RxJS observables for async operations (OSM API calls)
- Supabase backend for data persistence and authentication
- Leaflet integration for map rendering

## Layers

**Presentation Layer:**
- Purpose: UI components and user interaction
- Location: `src/app/components/` and `src/app/pages/`
- Contains: Standalone Angular components using Material Design
- Depends on: Services, Theme system, i18n system
- Used by: Router outlet in AppComponent

**Service Layer:**
- Purpose: Business logic and external data access
- Location: `src/app/services/`
- Contains: SupabaseService, OsmService with HTTP/RPC calls
- Depends on: HttpClient, Supabase SDK, environment config
- Used by: Components for data fetching and state management

**Configuration Layer:**
- Purpose: Theme switching, internationalization, environment setup
- Location: `src/app/config/`
- Contains: theme.service.ts, theme.config.ts, i18n.service.ts, i18n.config.ts
- Depends on: Angular Router for theme detection
- Used by: All components for styling and translations

**Infrastructure Layer (Backend):**
- Purpose: Spring Boot application skeleton
- Location: `backend/src/main/`
- Contains: NearlyBackendApplication.java (minimal setup)
- Status: Primarily stub; main logic in Supabase RPC functions

## Data Flow

**Place Discovery Flow:**

1. HomeComponent initializes map with mock data
2. User clicks "Find adventures near me" → geolocation.getCurrentPosition()
3. Location coordinates passed to loadPlacesFromSupabase()
4. Route determined by theme (Nearly vs Dogly)
5. OsmService makes HTTP POST to Overpass API
6. Response parsed and mapped to Place interface
7. Markers added to Leaflet map based on theme colors
8. PlacesList component displays filtered results

**Theme Selection Flow:**

1. User navigates to /:app route (e.g., /nearly or /dogly)
2. ThemeService detects NavigationEnd event
3. setTheme() extracts app name from URL
4. CSS custom properties applied to document root via applyTheme()
5. All components observe darkMode() signal for styling
6. Theme colors, icons, and strings injected into templates

**State Management:**

- Component-level signals: selectedPlace, selectedCategories, showList, isLoading
- Service-level signals: places, loading, error (SupabaseService)
- Router-driven state: app theme via URL parameter
- LocalStorage: Language preference persisted in I18nService

## Key Abstractions

**Place:**
- Purpose: Unified place data model
- Examples: `src/app/pages/home/home.component.ts` (line 12-19), `src/app/services/supabase.service.ts` (line 5-18)
- Pattern: TypeScript interface, used across components and services

**AppTheme:**
- Purpose: Theme configuration containing colors, icons, strings
- Examples: `src/app/config/theme.config.ts`
- Pattern: Record keyed by app name (nearly, dogly), applied dynamically

**OsmPlace:**
- Purpose: Data structure from Overpass API response
- Examples: `src/app/services/osm.service.ts` (line 5-12)
- Pattern: Maps OSM tags to category strings

**Marker Creation:**
- Purpose: Leaflet marker abstraction
- Examples: `src/app/pages/home/home.component.ts` (line 235-263)
- Pattern: divIcon with SVG styling, color-coded by category

## Entry Points

**Application Bootstrap:**
- Location: `src/main.ts`
- Triggers: Browser load
- Responsibilities: Bootstraps AppComponent, initializes I18nService

**Root Component:**
- Location: `src/app/app.component.ts`
- Triggers: Bootstrap
- Responsibilities: Provides router outlet, sets up routing context

**Router Configuration:**
- Location: `src/app/app.routes.ts`
- Pattern: Dynamic path parameter `:app` enables theme selection
- Default redirect: ** → nearly

**Home Page:**
- Location: `src/app/pages/home/home.component.ts`
- Triggers: Navigation to /:app
- Responsibilities: Map initialization, place loading, marker management, filter state

## Error Handling

**Strategy:** Try-catch blocks with signal error state, console logging fallback

**Patterns:**

- SupabaseService methods: Catch errors, set error signal, return empty/null (line 62-65)
- OsmService: Observer error callbacks with console.error (line 49-52)
- HomeComponent: Subscribe error handlers for observable failures (line 188-190)
- HTTP errors: OsmService catches and logs via observer.error()

## Cross-Cutting Concerns

**Logging:** console.error and console.log (no centralized logger)

**Validation:**
- Place names filtered out if "Bez nazwy" (unnamed)
- Coordinates validated in OsmService (lat/lon existence check)
- Category mapping provides fallback 'other' category

**Authentication:**
- Supabase auth methods exposed (signUp, signIn, signOut)
- No auth guard currently implemented
- User profile operations available (updateProfile)

**Geolocation:**
- Navigator geolocation API with fallback
- User position marked on map with primary color circle
- Radius 10km default for place queries

