import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() !== null) {
    return true;
  }

  const returnUrl = encodeURIComponent(state.url);
  return router.parseUrl(`/login?returnUrl=${returnUrl}`);
};

export const loginRedirectGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (supabase.currentUser() === null) {
    return true;
  }

  return router.parseUrl('/');
};
