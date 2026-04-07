import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { I18nService } from '../../../config/i18n.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent {
  supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }

  getDisplayName(): string {
    const user = this.supabaseService.currentUser();
    if (!user) return 'User';
    return (user.user_metadata?.['full_name'] as string | undefined) ?? user.email ?? 'User';
  }

  getInitials(): string {
    const user = this.supabaseService.currentUser();
    if (!user) return '?';
    const name = user.user_metadata?.['full_name'] as string | undefined;
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    if (user.email && user.email.length > 0) return user.email.charAt(0).toUpperCase();
    return '?';
  }
}
