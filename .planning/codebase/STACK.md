# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript 5.7.2 - Frontend Angular application
- Java 21 - Backend Spring Boot application

**Secondary:**
- SQL - Supabase PostgreSQL schema with PostGIS extensions
- SCSS - Frontend component styling
- HTML - Angular component templates

## Runtime

**Frontend Environment:**
- Node.js (npm lockfile present)
- Browser runtime (Angular 19.2.x standalone applications)

**Backend Environment:**
- Java 21 JVM
- Spring Boot 4.0.3

**Package Manager:**
- **Frontend:** npm
  - Lockfile: package-lock.json (present)
  - Node version: .nvmrc not detected, using npm default

- **Backend:** Maven 3.x
  - Lockfile: pom.xml
  - Maven wrapper: `./mvnw` and `mvnw.cmd` present

## Frameworks

**Frontend:**
- Angular 19.2.0 - Full framework (core, animations, forms, router, platform-browser, CDK)
- Angular Material 19.2.19 - UI component library
- RxJS 7.8.0 - Reactive programming library
- Leaflet 1.9.4 - Interactive maps

**Backend:**
- Spring Boot 4.0.3 - Web framework
- Spring Boot Web Starter - REST API support
- Spring Boot DevTools - Hot reload for development

**Testing:**
- Karma 6.4.0 - Test runner (frontend)
- Jasmine 5.6.0 - Test framework (frontend)
- Playwright 1.58.2 - E2E testing (frontend, dev only)
- Spring Boot Test Starter - Unit testing (backend)

**Build/Dev:**
- Angular CLI 19.2.22 - Build and development tool
- Angular DevKit 19.2.22 - Build infrastructure
- TypeScript 5.7.2 - Language transpilation
- Maven - Build tool with Spring Boot Maven Plugin

## Key Dependencies

**Critical (Frontend):**
- `@supabase/supabase-js` 2.99.1 - Supabase database and authentication client
  - Why: Handles all database queries, user authentication, and real-time subscriptions
- `@angular/cdk` 19.2.19 - Component Dev Kit
  - Why: Required by Material for overlay, keyed-values, and utilities
- `zone.js` 0.15.0 - Zone monkey-patching for Angular change detection
- `leaflet` 1.9.4 - Maps and geospatial visualization

**Critical (Backend):**
- `org.springframework.boot:spring-boot-starter-web` - REST endpoints
- `org.projectlombok:lombok` - Code generation (getter/setter, constructors, logging)

**Infrastructure:**
- `tslib` 2.3.0 - TypeScript helper library (frontend)
- `@angular-devkit/build-angular` 19.2.22 - Angular-specific build tooling

## Configuration

**Frontend Environment Variables:**
- Location: `src/environments/environment.ts` and `src/environments/environment.prod.ts`
- Required variables:
  - `supabaseUrl` - Supabase project URL (https://pbvbfedssedmpilwhqpd.supabase.co)
  - `supabaseAnonKey` - Supabase anonymous access token
  - `production` - Boolean flag for production detection

**Backend Configuration:**
- `application.properties` or `application.yml` (standard Spring Boot location in `src/main/resources/`)
- Java version: 21 (configured in pom.xml `<java.version>`)
- Spring Boot parent version: 4.0.3

**Build Configuration:**
- Frontend: `angular.json` - Build targets, dev server config, test runner config
- Frontend: `tsconfig.json` - Strict TypeScript settings (strict: true, noImplicitReturns, skipLibCheck, isolatedModules)
- Frontend: `tsconfig.app.json` and `tsconfig.spec.json` - App-specific and test-specific overrides
- Backend: `pom.xml` - Maven build configuration with Spring Boot parent

## Platform Requirements

**Development:**
- Node.js (npm package manager)
- Java 21 JDK
- Maven 3.6+
- Modern browser with ES2022 support (Angular 19 targets ES2022)

**Production:**
- Frontend: Static file hosting (Angular dist output)
- Backend: JVM runtime with Java 21
- Database: PostgreSQL with PostGIS extension (Supabase-hosted)

## Build Outputs

**Frontend:**
- Output path: `dist/nearly-frontend/` (configured in angular.json)
- Bundle analysis: Budget limits set to 500kB (initial), 1MB (max error)
- Output hashing: All assets hashed in production

**Backend:**
- Output: JAR file via Spring Boot Maven Plugin (`mvn clean package`)
- Fat JAR includes all dependencies

---

*Stack analysis: 2026-03-22*
