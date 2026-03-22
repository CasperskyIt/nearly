# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
nearly/
├── frontend/                          # Angular 19 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/           # Reusable UI components
│   │   │   │   ├── filters/
│   │   │   │   ├── header/
│   │   │   │   ├── places-list/
│   │   │   │   ├── sidenav/
│   │   │   │   └── welcome/
│   │   │   ├── pages/                # Route-level components
│   │   │   │   └── home/
│   │   │   ├── services/             # Business logic and API
│   │   │   │   ├── osm.service.ts
│   │   │   │   └── supabase.service.ts
│   │   │   ├── config/               # Theme and i18n
│   │   │   │   ├── theme.config.ts
│   │   │   │   ├── theme.service.ts
│   │   │   │   ├── i18n.config.ts
│   │   │   │   └── i18n.service.ts
│   │   │   ├── app.component.ts      # Root component
│   │   │   ├── app.routes.ts         # Router configuration
│   │   │   └── app.config.ts         # Angular providers
│   │   ├── environments/             # Environment configs
│   │   │   ├── environment.ts        # Development
│   │   │   └── environment.prod.ts   # Production
│   │   ├── main.ts                   # Application entry point
│   │   ├── index.html                # HTML template
│   │   └── styles.scss               # Global styles
│   ├── angular.json                  # Angular CLI config
│   ├── tsconfig.json                 # TypeScript config
│   ├── package.json                  # Dependencies
│   ├── public/                       # Static assets
│   └── dist/                         # Build output (generated)
├── backend/                           # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/casperskyIt/nearly_backend/
│   │   │   │   └── NearlyBackendApplication.java
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml                       # Maven configuration
│   └── .mvn/                         # Maven wrapper
├── supabase/                          # Supabase configuration
├── .planning/                         # GSD planning documents
└── README.md                          # Project overview
```

## Directory Purposes

**frontend/src/app/components/:**
- Purpose: Reusable presentational components
- Contains: Standalone Angular components with templates and styles
- Key files: filters/, header/, places-list/, sidenav/, welcome/
- Usage: Imported into pages or other components

**frontend/src/app/pages/:**
- Purpose: Route-level container components
- Contains: HomeComponent (primary page)
- Key files: `home/home.component.ts` with map logic
- Usage: Mounted by router at /:app

**frontend/src/app/services/:**
- Purpose: Business logic and external API integration
- Contains: Data fetching, state management
- Key files: `supabase.service.ts` (Place/Review/Auth), `osm.service.ts` (Place search)
- Usage: Injected into components via Angular DI

**frontend/src/app/config/:**
- Purpose: Application configuration and cross-cutting concerns
- Contains: Theme system, internationalization
- Key files: `theme.service.ts`, `i18n.service.ts` (signal-based), config files
- Usage: Injected into components, accessed via getters

**frontend/src/environments/:**
- Purpose: Environment-specific configuration
- Contains: Supabase credentials, API endpoints
- Key files: `environment.ts` (dev), `environment.prod.ts`
- Usage: Imported into services for initialization

**backend/src/main/:**
- Purpose: Spring Boot application (stub)
- Contains: Minimal application setup
- Key files: `NearlyBackendApplication.java`
- Status: Not actively used; Supabase handles data layer

## Key File Locations

**Entry Points:**
- `frontend/src/main.ts`: Application bootstrap, I18nService initialization
- `frontend/src/app/app.component.ts`: Root component with router outlet
- `backend/src/main/java/com/casperskyIt/nearly_backend/NearlyBackendApplication.java`: Spring Boot entry

**Configuration:**
- `frontend/angular.json`: Angular CLI build and serve config
- `frontend/tsconfig.json`: TypeScript compiler options
- `frontend/package.json`: npm dependencies and scripts
- `backend/pom.xml`: Maven project configuration
- `frontend/src/environments/environment.ts`: Supabase credentials

**Core Logic:**
- `frontend/src/app/pages/home/home.component.ts`: Map initialization, place loading, marker management
- `frontend/src/app/services/supabase.service.ts`: Place queries, reviews, favorites, authentication
- `frontend/src/app/services/osm.service.ts`: Overpass API integration for place discovery
- `frontend/src/app/config/theme.service.ts`: Theme switching and dark mode
- `frontend/src/app/config/i18n.service.ts`: Language selection and translations

**Styling:**
- `frontend/src/styles.scss`: Global styles and CSS custom properties
- `frontend/src/app/pages/home/home.component.scss`: Map container and layout
- Component-level SCSS files in each component directory

**Testing:**
- `frontend/src/app/app.component.spec.ts`: Root component tests
- `backend/src/test/java/`: Test directory (empty)

## Naming Conventions

**Files:**
- `*.component.ts`: Standalone Angular components (PascalCase)
- `*.service.ts`: Injectable services (PascalCase)
- `*.config.ts`: Configuration objects and types
- `environment*.ts`: Environment-specific configs
- `*.html`: Component templates
- `*.scss`: Component styles

**Directories:**
- Feature directories: kebab-case (e.g., places-list, dog-parks)
- Match component selector names (e.g., app-home)

**Classes and Interfaces:**
- PascalCase for all classes and interfaces
- AppComponent, SupabaseService, AppTheme, Place, OsmPlace

**Variables and Functions:**
- camelCase for properties and methods
- selectedPlace, loadPlacesFromSupabase(), toggleDarkMode()

**Signals and Observables:**
- Named with reactive suffix when appropriate: places (signal), loading (signal)

## Where to Add New Code

**New Feature:**
- Primary code: `frontend/src/app/pages/` (new page component)
- Components: `frontend/src/app/components/` (reusable UI)
- Logic: `frontend/src/app/services/` (new service)
- Tests: `.spec.ts` file in same directory as implementation

**New Component/Module:**
- Create directory in `frontend/src/app/components/` with kebab-case name
- File structure: `component-name/component-name.component.ts`, `.html`, `.scss`
- Import Material modules as needed in component imports array
- Export interface types at top of component file

**Utilities and Helpers:**
- Shared utilities: `frontend/src/app/services/` (as utilities service if needed)
- Type definitions: `frontend/src/app/config/` (for domain types like AppTheme)
- Constants: Define in config directory or within service/component

**New Theme:**
- Add entry to `themes` object in `frontend/src/app/config/theme.config.ts`
- Include colors, icons, strings objects
- Update category icons and labels for new theme
- Add route param handling in `app.routes.ts`

**New Language:**
- Add Language type union in `frontend/src/app/config/i18n.config.ts`
- Add translation object to `translations` Record
- Update `languageNames` for language selector

## Special Directories

**frontend/.angular/:**
- Purpose: Angular CLI cache
- Generated: Yes
- Committed: No
- Usage: Build optimization cache

**frontend/dist/:**
- Purpose: Build output directory
- Generated: Yes (by `ng build`)
- Committed: No
- Contains: Compiled assets, index.html, bundles

**frontend/node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No
- Size: Large; use .gitignore

**backend/target/:**
- Purpose: Maven build output
- Generated: Yes (by `mvn compile`)
- Committed: No
- Contains: Compiled .class files, JARs

**supabase/:**
- Purpose: Supabase migration and configuration files
- Committed: Yes
- Usage: Database schema, edge functions, policies

**frontend/public/:**
- Purpose: Static assets served as-is
- Contains: Favicon, manifest, static resources
- Committed: Yes

