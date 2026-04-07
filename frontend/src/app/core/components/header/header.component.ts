import { Component, inject, output, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../../config/theme.service';
import { DogService } from '../../services/dog.service';
import { I18nService } from '../../../config/i18n.service';
import { Language, languageNames } from '../../../config/i18n.config';
import { Dog } from '../../models/dog.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menuClick = output<void>();

  protected supabase = inject(SupabaseService);
  protected dogService = inject(DogService);
  protected themeService = inject(ThemeService);
  private i18nService = inject(I18nService);
  private router = inject(Router);

  showLangMenu = signal(false);
  showUserMenu = signal(false);
  showSignOutModal = signal(false);

  themeStrings = computed(() => this.themeService.themeStrings());

  get t() { return this.i18nService.t; }
  get currentLanguage(): Language { return this.i18nService.getCurrentLanguage(); }
  get languages() {
    return Object.entries(languageNames).map(([code, name]) => ({ code: code as Language, name }));
  }

  protected getInitials(): string {
    const user = this.supabase.currentUser();
    if (!user) return '';
    const name = user.user_metadata?.['full_name'] as string | undefined;
    if (name) return name.charAt(0).toUpperCase();
    return (user.email ?? '').charAt(0).toUpperCase();
  }

  protected onSignIn(): void {
    this.router.navigate(['/login']);
  }

  protected onSignOut(): void {
    this.showUserMenu.set(false);
    this.showSignOutModal.set(true);
  }

  protected async confirmSignOut(): Promise<void> {
    this.showSignOutModal.set(false);
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }

  protected cancelSignOut(): void {
    this.showSignOutModal.set(false);
  }

  protected onMyAccount(): void {
    this.showUserMenu.set(false);
    this.router.navigate(['/account']);
  }

  protected onSelectDog(dog: Dog): void {
    this.dogService.setCurrentDog(dog);
    this.router.navigate(['/dogs', dog.id]);
  }

  protected onMyDogs(): void {
    this.router.navigate(['/dogs']);
  }

  protected onHome(): void {
    this.router.navigate(['/']);
  }

  protected toggleLangMenu(): void { this.showLangMenu.update((v) => !v); }
  protected setLanguage(lang: Language): void { this.i18nService.setLanguage(lang); this.showLangMenu.set(false); }
  protected toggleMenu(): void { this.menuClick.emit(); }
  protected toggleUserMenu(): void { this.showUserMenu.update((v) => !v); }
}
