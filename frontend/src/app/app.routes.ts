import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { authGuard, loginRedirectGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: ':app/login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginRedirectGuard],
  },
  {
    path: ':app/account',
    loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent),
    canActivate: [authGuard],
  },
  {
    path: ':app',
    component: HomeComponent,
  },
  {
    path: '**',
    redirectTo: 'nearly',
  },
];
