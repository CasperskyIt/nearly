# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dogly is a dog care platform where co-guardians track daily care, health records, and dog-friendly places.

## Commands

### Frontend (`cd frontend` first)
```bash
npm start           # Dev server at localhost:4200
npm run build       # Production build
npm test            # Unit tests (Karma/Jasmine)
```

### Backend (`cd backend` first)
```bash
./mvnw spring-boot:run                              # Run app
./mvnw test                                         # All tests
./mvnw test -Dtest=ClassName                        # Single test class
./mvnw test -Dtest=ClassName#methodName             # Single test method
./mvnw clean package -DskipTests                    # Build jar
```

## Architecture

### Theming
`ThemeService` applies the Dogly theme on startup by setting CSS custom properties on `:root`. Theme is defined in `frontend/src/app/config/theme.config.ts` as an `AppTheme` object with `colors`, `icons`, and `strings`.

### Data Sources
The frontend has two independent data sources:
- **SupabaseService** (`services/supabase.service.ts`): Reads from a Supabase (PostgreSQL + PostGIS) database. Geo queries use the `get_places_nearby` RPC function defined in `supabase/schema.sql`. Uses Angular signals for reactive state.
- **OsmService** (`services/osm.service.ts`): Queries the OpenStreetMap Overpass API directly from the browser. Has separate query methods for general places and dog-friendly places.

### Database (Supabase)
Schema in `supabase/schema.sql`. Tables: `profiles`, `places`, `reviews`, `favorites`. Row Level Security is enabled on all tables. The `get_places_nearby` function uses PostGIS `ST_DWithin` for radius queries.

### Frontend Structure
- `src/app/config/` — Theme and i18n configuration + services
- `src/app/core/` — Shared: header component, auth guard, services (Supabase, dog, logger), models
- `src/app/features/home/` — Map page with Leaflet + places list
- `src/app/features/dogs/` — Dog CRUD pages (list, create, detail)
- `src/app/features/auth/` — Login, account, auth-callback pages
- `src/environments/` — Environment config with Supabase credentials

### Backend Structure (Intended)
Spring Boot 4.0 / Java 21. Base package: `com.casperskyIt.dogly_backend`. Intended layered structure: `controller/` → `service/` → `repository/` → `entity/` with `dto/` and `exception/`.

## Conventions

### Angular
- Always use **separate files** for template (`.html`) and styles (`.scss`) — never inline in the component decorator
- Use **standalone components** (no NgModules)
- Use **Angular signals** for reactive state

### Java/Spring Boot
- Use Lombok (`@Slf4j`, `@RequiredArgsConstructor`, `@Getter`/`@Setter`)
- Use Java records for DTOs; JPA entities have no suffix
- Global exception handling via `@RestControllerAdvice`
- REST URL pattern: `/api/v1/{resource}`
- Import order: static → `java.*` → `javax.*` → Spring → third-party → project

### Key Dependencies (do not add without discussion)
Spring: Web, Data JPA, Security (if needed), Lombok, MapStruct
Frontend: Angular Material, Leaflet, Supabase JS client
