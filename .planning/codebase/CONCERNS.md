# Codebase Concerns

**Analysis Date:** 2026-03-22

## Tech Debt

**Exposed API Credentials in Source Code:**
- Issue: Supabase public key and URL hardcoded in environment file
- Files: `frontend/src/environments/environment.ts`
- Impact: Security risk - credentials are visible in version control, build artifacts, and potentially exposed to clients
- Fix approach: Move to `.env` file, use environment variables at build time, ensure `.env` is in `.gitignore`. Consider rotating exposed credentials immediately.

**Mock Data Mixed with Production Code:**
- Issue: `loadMockData()` method in home component hardcodes test data with hardcoded ratings and locations
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 138-166)
- Impact: Production builds may accidentally use mock data instead of real API calls; theme-specific hardcoded data makes code fragile
- Fix approach: Remove mock data from component, implement proper loading state defaults, use environment flag to conditionally load test data only in dev

**Unsafe HTML Rendering with bypassSecurityTrustHtml:**
- Issue: Logo SVG is rendered using `bypassSecurityTrustHtml()` without validation
- Files: `frontend/src/app/pages/home/home.component.ts` (line 74)
- Impact: Potential XSS vulnerability if logo source comes from untrusted theme configuration
- Fix approach: Sanitize HTML content properly, validate SVG before rendering, or use safer template binding instead of `bypassSecurityTrustHtml()`

**Random Rating Generation in Production:**
- Issue: Ratings are generated with `Math.random()` instead of being fetched from actual data
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 181, 200)
- Impact: Data integrity - users see inconsistent ratings; violates user trust for reviews
- Fix approach: Fetch actual ratings from OSM service or Supabase, remove random generation

**Console Statements Left in Production Code:**
- Issue: Multiple `console.log()` and `console.error()` statements scattered throughout
- Files: `frontend/src/app/pages/home/home.component.ts` (line 356), `frontend/src/app/services/osm.service.ts` (lines 50, 86), `frontend/src/app/services/supabase.service.ts` (line 64)
- Impact: Log noise, potential information disclosure if error details are sensitive
- Fix approach: Replace with proper logging service, remove debug logs, use conditional logging for development only

## Known Bugs

**Unused Test File Not Updated:**
- Issue: Test spec file expects component properties that don't exist
- Files: `frontend/src/app/app.component.spec.ts` (lines 20, 27)
- Symptoms: Tests reference `app.title` property and expect DOM content that doesn't match actual component
- Trigger: Run `npm test`
- Workaround: Tests likely fail or are skipped; actual component works in production

**OSM API Error Not Properly Handled:**
- Issue: Empty response from OSM API is not properly validated before mapping
- Files: `frontend/src/app/services/osm.service.ts` (lines 37, 73)
- Symptoms: App may crash if `response.elements` is undefined
- Trigger: OSM API returns malformed response
- Workaround: Filter step removes items without names but doesn't check for missing array

**Unused Components Not Removed:**
- Issue: Components like `sidenav` are imported but not used in templates
- Files: `frontend/src/app/components/sidenav/sidenav.component.ts`
- Symptoms: Dead code in bundle, unused imports
- Trigger: Navigating app - component never renders
- Workaround: Component doesn't break anything when unused

## Security Considerations

**API Key Exposure in Browser:**
- Risk: Supabase anon key is readable in browser DevTools and network requests
- Files: `frontend/src/environments/environment.ts`, `frontend/src/app/services/supabase.service.ts`
- Current mitigation: Supabase has row-level security policies (assumed)
- Recommendations: Verify RLS policies are strict, implement backend proxy for sensitive operations, use middleware to intercept and validate requests, rotate key if exposed

**Missing Authentication:**
- Risk: No user authentication implemented despite auth methods in SupabaseService
- Files: `frontend/src/app/services/supabase.service.ts` (lines 168-183)
- Current mitigation: None - auth methods exist but are not used
- Recommendations: Implement authentication flow, protect sensitive endpoints, add user context to API calls

**HTML Injection from Theme Configuration:**
- Risk: Logo and theme strings come from theme config and may contain malicious content
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 73-75), `frontend/src/app/config/theme.config.ts`
- Current mitigation: Theme is hardcoded, not user-supplied
- Recommendations: If themes become user-configurable, validate and sanitize all HTML inputs

**CORS and External API Dependencies:**
- Risk: Reliance on external APIs (OpenStreetMap, CARTO tiles, Overpass API) with no fallback
- Files: `frontend/src/app/services/osm.service.ts`, `frontend/src/app/pages/home/home.component.ts`
- Current mitigation: Error handlers exist but don't fallback gracefully
- Recommendations: Implement circuit breaker pattern, cache responses, provide offline mode

## Performance Bottlenecks

**Large Component Handling Multiple Responsibilities:**
- Problem: `HomeComponent` is 395 lines and handles map rendering, data fetching, filtering, theme switching, localization
- Files: `frontend/src/app/pages/home/home.component.ts`
- Cause: Single responsibility principle violated; component does too much
- Improvement path: Split into smaller components (MapComponent, PlaceListComponent), extract services (MapService, FilterService), use presentational components for UI

**Inefficient Marker Rendering:**
- Problem: All markers are removed and recreated on every map event (`moveend`, category toggle)
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 217-265)
- Cause: Brute-force approach; no optimization for marker lifecycle
- Improvement path: Only update/add/remove markers that changed, batch DOM updates, use marker clustering for large datasets

**Synchronous Theme Application on DOM:**
- Problem: Theme color properties set synchronously on every toggle, causing reflow
- Files: `frontend/src/app/config/theme.service.ts` (lines 57-93)
- Cause: Direct `root.style.setProperty()` calls instead of CSS classes
- Improvement path: Use CSS class switching or CSS-in-JS, batch style updates

**Timeout-Based Size Invalidation:**
- Problem: `setTimeout()` calls hardcoded to 100ms and 350ms for map resizing
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 124-126, 361-364)
- Cause: Race condition workaround; proper event handling not used
- Improvement path: Use Leaflet's native `invalidateSize()` with proper timing, listen to actual layout events

**Unoptimized Observable Chains:**
- Problem: OSM service creates new Observable on every call without caching or memoization
- Files: `frontend/src/app/services/osm.service.ts` (lines 22-55, 57-91)
- Cause: Each location change triggers full HTTP request
- Improvement path: Add request debouncing, cache responses by location, use `shareReplay()` for concurrent requests

## Fragile Areas

**Marker HTML Generation with Inline Styles:**
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 235-257)
- Why fragile: HTML string concatenation is error-prone and hard to test; Material Icons may not load
- Safe modification: Move to template-based approach, use component projections
- Test coverage: No unit tests for marker rendering logic

**Category Color Hardcoding:**
- Files: `frontend/src/app/pages/home/home.component.ts` (lines 277-295)
- Why fragile: Colors duplicated across multiple places, inconsistent with theme system
- Safe modification: Consolidate into theme config, use theme service for all colors
- Test coverage: No tests for color mapping

**Type Casting with `any`:**
- Files: `frontend/src/app/services/osm.service.ts`, `frontend/src/app/services/supabase.service.ts`
- Why fragile: Unsafe type casts bypass TypeScript safety; API response structure assumptions not validated
- Safe modification: Define strict interfaces for OSM/Supabase responses, use type guards
- Test coverage: No type validation tests

**Deprecated `@supabase/supabase-js` v2 API:**
- Files: `frontend/src/app/services/supabase.service.ts`
- Why fragile: Using v2 API methods that may change in v3+; no version pinning guidance
- Safe modification: Pin major version, prepare migration path for v3
- Test coverage: No integration tests for Supabase calls

## Scaling Limits

**Leaflet Map Performance at Scale:**
- Current capacity: Renders ~8 mock places, no visible performance issues
- Limit: With >100 markers, map becomes slow; no clustering implemented
- Scaling path: Implement marker clustering (Leaflet.MarkerCluster), virtualize off-screen markers, implement infinite scroll for place list

**OSM API Rate Limiting Not Handled:**
- Current capacity: Single location query per user action
- Limit: Overpass API has 1 request/second limit; multiple simultaneous users hit rate limit
- Scaling path: Implement request queue, add exponential backoff, use local fallback data

**Supabase Anonymous Key Usage:**
- Current capacity: Works for public data with RLS
- Limit: Cannot scale to authenticated operations without backend
- Scaling path: Implement backend API layer, use JWT for authenticated users, separate anon and user operations

## Dependencies at Risk

**Angular 19.2.x Version:**
- Risk: Early major version with potential breaking changes; limited ecosystem stability
- Impact: Dependencies may not be compatible, community packages lag behind
- Migration plan: Establish version update schedule, maintain compatibility matrix with key packages

**Leaflet 1.9.4:**
- Risk: Leaflet development is slower; newer mapping libraries (Mapbox, Deck.gl) have more features
- Impact: Limited 3D support, animation capabilities; harder to implement advanced map features
- Migration plan: Monitor Leaflet releases, consider Mapbox if advanced features needed

**Supabase 2.99.x:**
- Risk: Minor version numbering suggests API not fully stable; v3 may have breaking changes
- Impact: Unknown future API; potential migration work
- Migration plan: Pin version, review v3 beta releases, plan upgrade timeline

**CARTO Tile Layer Dependency:**
- Risk: CARTO pricing changes, service discontinuation possible
- Impact: Map becomes blank if service unavailable
- Migration plan: Use multiple tile providers, implement fallback (OpenStreetMap), cache tiles locally

## Missing Critical Features

**No Offline Support:**
- Problem: App requires internet connection; no data caching or service worker
- Blocks: Cannot use app in offline areas; poor UX on slow connections
- Recommendation: Implement service worker, cache place data, offline maps with WorkBox

**No User Authentication Flow:**
- Problem: Auth methods exist in SupabaseService but not integrated into UI
- Blocks: Cannot save user reviews, favorites require user context
- Recommendation: Implement login/signup components, add auth guard to protected routes

**No Error Recovery:**
- Problem: API errors show console.error only; no user-facing error messages
- Blocks: Users don't know when data fails to load
- Recommendation: Add error boundary component, user-friendly error messages, retry mechanisms

**No Loading States:**
- Problem: `isLoading` signal exists but not fully integrated into template
- Blocks: Users can't tell if data is loading or missing
- Recommendation: Show skeleton loaders, spinners during data fetch

## Test Coverage Gaps

**Missing Integration Tests:**
- What's not tested: OSM API integration, Supabase RPC calls, theme switching with actual DOM
- Files: `frontend/src/app/services/osm.service.ts`, `frontend/src/app/services/supabase.service.ts`
- Risk: API contract changes break app undetected
- Priority: High

**Missing Component Tests:**
- What's not tested: HomeComponent with actual Leaflet map, marker interaction, filter toggle
- Files: `frontend/src/app/pages/home/home.component.ts`, `frontend/src/app/components/filters/filters.component.ts`
- Risk: Regressions in user interactions go unnoticed
- Priority: High

**Missing E2E Tests:**
- What's not tested: Full user flows (view map, select place, toggle theme, change language)
- Files: All components and services
- Risk: Production breaks without detection
- Priority: Medium

**Missing Service Tests:**
- What's not tested: Error handling in supabase.service and osm.service, retry logic
- Files: `frontend/src/app/services/supabase.service.ts`, `frontend/src/app/services/osm.service.ts`
- Risk: Error cases untested, silent failures possible
- Priority: High

**Spec File Out of Sync:**
- What's not tested: Tests reference non-existent component properties
- Files: `frontend/src/app/app.component.spec.ts`
- Risk: False confidence in test suite; actual bugs undetected
- Priority: Critical - fix before CI/CD setup

---

*Concerns audit: 2026-03-22*
