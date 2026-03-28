import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../config/theme.service';
import { AppTheme } from '../../config/theme.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private themeService = inject(ThemeService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  get theme(): AppTheme {
    return this.themeService.theme;
  }

  tagline = computed(() => {
    const name = this.themeService.theme.name;
    if (name === 'Dogly') return "Your dog's world, organised.";
    if (name === 'Nearly') return 'Discover what\'s close.';
    return 'Welcome back.';
  });

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
