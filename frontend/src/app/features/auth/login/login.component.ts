import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ThemeService } from '../../../config/theme.service';
import { I18nService } from '../../../config/i18n.service';
import { AppTheme } from '../../../config/theme.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private themeService = inject(ThemeService);
  private i18nService = inject(I18nService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  get theme(): AppTheme {
    return this.themeService.theme;
  }

  get t() { return this.i18nService.t; }

  tagline = computed(() => this.i18nService.t.app.welcomeSubtitle);

  ngOnInit(): void {
    const errorParam = this.route.snapshot.queryParamMap.get('errorMessage');
    if (errorParam) {
      this.errorMessage.set(decodeURIComponent(errorParam));
    }
  }

  async signIn(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      await this.supabaseService.signInWithGoogle();
      // On success, browser navigates away to Google — no success handling needed
    } catch {
      this.errorMessage.set('Something went wrong. Please try again.');
      this.loading.set(false);
    }
  }
}
