import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { I18nService } from '../../../config/i18n.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export class AuthCallbackComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }

  async ngOnInit(): Promise<void> {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.router.navigate(['/login'], {
        queryParams: { errorMessage: 'Sign-in was cancelled. Try again.' },
      });
      return;
    }

    // detectSessionInUrl:true in SupabaseService exchanges the PKCE code automatically.
    // getSession() resolves after the exchange is complete.
    const { data: { session } } = await this.supabaseService.supabase.auth.getSession();

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination =
      returnUrl && returnUrl.length > 0 && !returnUrl.includes('/login')
        ? returnUrl
        : '/';

    if (session) {
      this.router.navigateByUrl(destination);
    } else {
      this.router.navigateByUrl('/login');
    }
  }
}
