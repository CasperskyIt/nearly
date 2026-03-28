import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export class AuthCallbackComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Step 0: Check for OAuth error param (e.g. user cancelled Google consent — per D-11)
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      const app = this.route.snapshot.queryParamMap.get('app') ?? 'dogly';
      this.router.navigate(['/', app, 'login'], {
        queryParams: { errorMessage: 'Sign-in was cancelled. Try again.' },
      });
      return;
    }

    // Step 1: Subscribe to auth state change and wait for PKCE exchange
    const { data: { subscription } } = this.supabaseService.supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Step 2: Unsubscribe and navigate to returnUrl or home
          subscription.unsubscribe();
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          // Sanitise: reject null, empty, or login-looping returnUrls
          const destination =
            returnUrl && returnUrl.length > 0 && !returnUrl.includes('/login')
              ? returnUrl
              : '/dogly';
          this.router.navigateByUrl(destination);
        } else if (event === 'INITIAL_SESSION' && !session) {
          // Step 3: No OAuth params — silent redirect to login (per D-14)
          subscription.unsubscribe();
          this.router.navigateByUrl('/dogly/login');
        }
      }
    );
  }
}
