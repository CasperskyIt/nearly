import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { authGuard, loginRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginRedirectGuard],
  },
  {
    path: 'account',
    loadComponent: () => import('./features/auth/account/account.component').then(m => m.AccountComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dogs',
    loadComponent: () => import('./features/dogs/dog-list/dog-list.component').then(m => m.DogListComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'new',
        loadComponent: () => import('./features/dogs/dog-create/dog-create.component').then(m => m.DogCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/dogs/dog-detail/dog-detail.component').then(m => m.DogDetailComponent),
      },
    ],
  },
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
