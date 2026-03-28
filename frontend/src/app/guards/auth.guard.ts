import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() !== null) {
    return true;
  }

  // D-05: preserve returnUrl for post-login redirect
  // D-04: read :app param for multi-tenant support
  const app = route.paramMap.get('app') ?? 'dogly';
  const returnUrl = encodeURIComponent(state.url);
  return router.parseUrl(`/${app}/login?returnUrl=${returnUrl}`);
};

export const loginRedirectGuard: CanActivateFn = (route) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // D-10: redirect authenticated users away from login
  if (supabase.currentUser() === null) {
    return true;
  }

  const app = route.paramMap.get('app') ?? 'dogly';
  return router.parseUrl(`/${app}`);
};
