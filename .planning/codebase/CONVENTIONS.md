# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- Components: PascalCase with `.component.ts` suffix (e.g., `places-list.component.ts`, `header.component.ts`)
- Services: PascalCase with `.service.ts` suffix (e.g., `supabase.service.ts`, `osm.service.ts`, `theme.service.ts`)
- Configuration files: camelCase with `.config.ts` or `.service.ts` suffix (e.g., `i18n.config.ts`, `theme.config.ts`, `i18n.service.ts`)
- Test files: Same name as source with `.spec.ts` suffix (e.g., `app.component.spec.ts`)
- Directories: kebab-case with descriptive names (e.g., `places-list`, `dog-parks`, `config`, `services`)

**Functions:**
- camelCase for regular functions and methods
- Private methods prefixed with `private` keyword (e.g., `private initMap()`, `private addMarkers()`, `private loadMockData()`)
- Public methods unprefixed (e.g., `selectPlace()`, `toggleCategory()`, `toggleDarkMode()`)
- Getter methods as simple property accessors (e.g., `get theme()`, `get t()`, `get categories()`)

**Variables:**
- camelCase for local variables and properties (e.g., `selectedPlace`, `isDarkMode`, `currentLanguage`)
- `const` for constants and signals (e.g., `const appName`, `const currentTheme = signal()`)
- Signal state prefixed with intent (e.g., `places`, `loading`, `error`, `showWelcome`)
- Private signals prefixed with underscore (e.g., `private currentTheme`, `private isDarkMode`)
- Array names plural (e.g., `places`, `markers`, `mockPlaces`)

**Types:**
- PascalCase for interfaces (e.g., `Place`, `Review`, `AppTheme`, `OsmPlace`)
- PascalCase for exported types and enums (e.g., `Language`, `Translations`)
- Inline interfaces for component-specific types (e.g., `interface Place { id: string; name: string; ... }` in `home.component.ts`)
- Union types and type aliases use PascalCase (e.g., `type Language = 'pl' | 'en' | 'uk' | 'de'`)

## Code Style

**Formatting:**
- No Prettier configuration detected - appears to use Angular defaults
- 2-space indentation inferred from code
- Semicolons used consistently at end of statements

**Linting:**
- No ESLint configuration detected
- TypeScript strict mode enabled in `tsconfig.json`:
  - `"strict": true`
  - `"noImplicitOverride": true`
  - `"noPropertyAccessFromIndexSignature": true`
  - `"noImplicitReturns": true`
  - `"noFallthroughCasesInSwitch": true`
- Angular strict templates enabled:
  - `"strictInjectionParameters": true`
  - `"strictInputAccessModifiers": true`
  - `"strictTemplates": true`

## Import Organization

**Order:**
1. Angular core imports (`@angular/core`, `@angular/common`, `@angular/router`, etc.)
2. Third-party library imports (`@angular/material/*`, `leaflet`, `rxjs`, etc.)
3. Local service/config imports from relative paths (`../../config/`, `../../services/`)
4. Barrel imports from config files

**Path Aliases:**
- No path aliases configured - uses relative imports throughout
- Relative imports follow pattern: `'../../config/theme.config'`, `'../../services/supabase.service'`

**Examples from codebase:**
```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// home.component.ts
import { Component, AfterViewInit, OnDestroy, signal, computed, effect, Inject, PLATFORM_ID, inject, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ThemeService } from '../../config/theme.service';
import { I18nService } from '../../config/i18n.service';
import { SupabaseService, Place as SupabasePlace } from '../../services/supabase.service';
import * as L from 'leaflet';

// header.component.ts
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
```

## Error Handling

**Patterns:**
- Try-catch blocks in async service methods for error handling (see `supabase.service.ts`)
- Setting error state via signal: `this.error.set(err.message)`
- Logging errors to console: `console.error('Error fetching places:', err)`
- Returning safe defaults on error: `return []` or `return null`
- RxJS error handling via subscription `error` callback (see `osm.service.ts`)

**Examples:**
```typescript
// From supabase.service.ts
async getPlacesNearby(lat: number, lng: number, radiusKm: number = 10): Promise<Place[]> {
  this.loading.set(true);
  this.error.set(null);

  try {
    const { data, error } = await this.supabase.rpc('get_places_nearby', {
      lat,
      lng,
      radius_km: radiusKm
    });

    if (error) throw error;

    this.places.set(data || []);
    return data || [];
  } catch (err: any) {
    this.error.set(err.message);
    console.error('Error fetching places:', err);
    return [];
  } finally {
    this.loading.set(false);
  }
}

// From osm.service.ts
return new Observable(observer => {
  this.http.post<any>(this.overpassUrl, query).subscribe({
    next: (response) => {
      // process response
      observer.next(places);
      observer.complete();
    },
    error: (err) => {
      console.error('OSM Error:', err);
      observer.error(err);
    }
  });
});
```

## Logging

**Framework:** `console` (console.log, console.error)

**Patterns:**
- Errors logged with `console.error()` when exceptions occur
- Debug logs with `console.log()` for user actions (e.g., `console.log('Toggle menu')`)
- Error messages include context (e.g., `'Error loading OSM places:'`, `'Error fetching places:'`)

**Examples from codebase:**
```typescript
console.error('Error fetching places:', err);
console.error('Error loading OSM places:', err);
console.error('OSM Error:', err);
console.log('Toggle menu');
```

## Comments

**When to Comment:**
- Complex logic requiring explanation
- Non-obvious implementation details
- JSDoc comments not used throughout codebase
- Minimal inline comments observed

**JSDoc/TSDoc:**
- Not used in current codebase
- No type documentation comments found on functions or interfaces

## Function Design

**Size:**
- Most functions 5-50 lines
- Larger functions in `home.component.ts` due to map initialization and marker management
- Preference for smaller, focused methods for individual operations

**Parameters:**
- Functions accept typed parameters (e.g., `getPlacesNearby(lat: number, lng: number, radiusKm: number = 10)`)
- Default parameters used (e.g., `radiusKm: number = 10`)
- Destructuring not heavily used in parameters

**Return Values:**
- Explicit return types for async functions: `Promise<Place[]>`, `Promise<Place | null>`
- Methods that set state and return data (e.g., `async getPlacesByCategory(category: string): Promise<Place[]>`)
- Observable return types for HTTP operations (e.g., `Observable<OsmPlace[]>`)

## Module Design

**Exports:**
- Services exported as injectable classes with decorator: `@Injectable({ providedIn: 'root' })`
- Components exported as standalone with `standalone: true`
- Configuration objects exported as const: `export const themes: Record<string, AppTheme> = {...}`
- Interfaces exported for public use (e.g., `export interface Place {...}`)

**Barrel Files:**
- Not used in this codebase
- Each component/service imported directly from its own file

**Examples:**
```typescript
// Service export pattern
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  // ...
}

// Component export pattern
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  // ...
}

// Config export pattern
export const themes: Record<string, AppTheme> = {
  nearly: { ... },
  dogly: { ... }
}
```

## Angular-Specific Conventions

**Component Structure:**
- Standalone components using `standalone: true`
- Template and styles in separate files with `templateUrl` and `styleUrl`
- `imports` array declares all dependencies explicitly
- `selector` uses `app-` prefix

**Signals and Reactivity:**
- Angular signals used for state management: `signal<T>()`, `computed()`, `effect()`
- Signal updates via `.set()` and `.update()`
- Getters for derived state: `get t()`, `get theme()`
- Readonly signal exposure via `.asReadonly()`

**Dependency Injection:**
- Constructor injection for services
- `inject()` function for modern standalone component patterns (e.g., `private sanitizer = inject(DomSanitizer)`)
- `providedIn: 'root'` for application-wide services

**Angular Material Integration:**
- Material modules imported explicitly in components
- Component declarations specify Material dependencies (e.g., `imports: [MatCardModule, MatToolbarModule]`)

---

*Convention analysis: 2026-03-22*
