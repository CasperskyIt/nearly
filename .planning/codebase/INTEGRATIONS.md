# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**Geospatial Data:**
- OpenStreetMap Overpass API - Returns place data (amenities, leisure, tourism, shops) filtered by tags
  - SDK/Client: `@supabase/supabase-js` for database, HTTP calls via Angular HttpClient
  - Service: `src/app/services/osm.service.ts`
  - Endpoint: `https://overpass-api.de/api/interpreter`
  - Authentication: Public (no auth required)
  - Methods:
    - `getPlacesNearby()` - Queries cafes, restaurants, museums, galleries, parks within radius
    - `getDogFriendlyPlaces()` - Queries dog parks, dog-friendly cafes/restaurants, pet shops

**Maps Tile Layer:**
- CartoDB Vector Tiles (light and dark variants)
  - SDK/Client: Leaflet 1.9.4
  - URLs:
    - Light: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
    - Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
  - Authentication: Public (no auth required)
  - Used in: `src/app/pages/home/home.component.ts`

## Data Storage

**Databases:**
- **Supabase (PostgreSQL + PostGIS)**
  - Connection: SDK client initialized with URL and anon key in `src/environments/environment.ts`
  - Client: `@supabase/supabase-js` 2.99.1
  - Service: `src/app/services/supabase.service.ts`
  - Features:
    - Row Level Security (RLS) enabled on all tables
    - PostGIS extension for geospatial queries
    - Auth integration (Supabase Auth built-in)

  **Tables:**
  - `profiles` - User profiles linked to Supabase auth.users
  - `places` - Location data (name, coordinates, category, rating, dog_friendly flag)
  - `reviews` - User reviews with ratings and comments
  - `favorites` - User's saved places

  **Key Functions:**
  - `get_places_nearby(lat, lng, radius_km)` - PostGIS-based radius query returning places within X km

**File Storage:**
- Local filesystem only (avatar_url field in profiles is stored as URL string, not file blobs)

**Caching:**
- None configured
- Frontend uses Angular signals for state management (`places`, `loading`, `error` in SupabaseService)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in to Supabase)
  - Implementation: Email/password authentication via Supabase JS SDK
  - Service location: `src/app/services/supabase.service.ts`
  - Methods:
    - `signUp(email, password)` - Creates new user
    - `signIn(email, password)` - Signs in existing user
    - `signOut()` - Clears session
    - `getUser()` - Gets current authenticated user
  - Session management: Handled by Supabase SDK automatically
  - Row Level Security: All database queries respect RLS policies that check `auth.uid()` and `auth.role()`

**Authorization Model:**
- Table-level RLS policies:
  - Profiles: Public read, authenticated users update own
  - Places: Public read, authenticated users can insert, users update own
  - Reviews: Public read, authenticated users can insert, users delete own
  - Favorites: Users view and manage own only

## Monitoring & Observability

**Error Tracking:**
- None configured
- Errors logged to browser console via `console.error()` in services

**Logs:**
- Frontend: Browser console via `console.error()` in error handlers
- Backend: Spring Boot logging (Logback default via spring-boot-starter-web)
- No external logging service configured

## CI/CD & Deployment

**Hosting:**
- Frontend: Static file hosting (dist/ output, ready for any CDN/static host)
- Backend: JVM application server (Spring Boot embedded Tomcat or deployable JAR)
- Database: Supabase cloud (managed PostgreSQL)

**CI Pipeline:**
- None detected
- No GitHub Actions, GitLab CI, or Jenkins configuration present

**Build Commands:**
- Frontend: `npm run build` → `dist/nearly-frontend/`
- Backend: `./mvnw clean package -DskipTests` → JAR in `target/`

## Environment Configuration

**Frontend (src/environments/):**
- `environment.ts` (development):
  - `supabaseUrl`: Production Supabase project URL
  - `supabaseAnonKey`: Supabase anon key
  - `production`: false

- `environment.prod.ts`:
  - Placeholder values (`YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY`)
  - Must be replaced at build time or runtime

**Backend:**
- Standard Spring Boot: `src/main/resources/application.properties` or `application.yml`
- Expects database configuration (JDBC URL, user, password) - none currently set
- Expects any external service credentials as properties

## Required Environment Variables

**Frontend:**
- `SUPABASE_URL` - Supabase project URL (configured in environment.ts)
- `SUPABASE_ANON_KEY` - Supabase anonymous access token (configured in environment.ts)

**Backend:**
- Database connection (if using Spring Data JPA):
  - `spring.datasource.url`
  - `spring.datasource.username`
  - `spring.datasource.password`
- Spring profile (if needed): `spring.profiles.active`

## Secrets Location

**Frontend:**
- Secrets stored in `src/environments/environment.ts` (development)
- Production secrets must be injected at build/deployment time
- Warning: Supabase anon key is currently embedded in source code (see CONCERNS.md)

**Backend:**
- Secrets typically in `application.properties` (git-ignored) or environment variables
- `.gitignore` contents: `/.idea/` only (no .env pattern exclusion detected)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected
- Supabase can be configured to send webhooks (not currently set up)

## API Rate Limiting

**OpenStreetMap Overpass API:**
- Default rate limiting applies (shared public API)
- Timeout: 25 seconds set in queries (`[timeout:25]`)
- Risk: Public API may have usage limits; consider caching for high-volume usage

**Supabase:**
- Rate limiting handled by Supabase tier
- RLS policies prevent unauthorized access

---

*Integration audit: 2026-03-22*
