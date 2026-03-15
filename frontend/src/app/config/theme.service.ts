import { Injectable, signal, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppTheme, themes } from './theme.config';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme = signal<AppTheme>(themes['nearly']);
  private isDarkMode = signal<boolean>(false);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEvent = event as NavigationEnd;
        const path = navEvent.urlAfterRedirects.split('/')[1] || 'nearly';
        this.setTheme(path);
      });

    const initialPath = this.router.url.split('/')[1] || 'nearly';
    this.setTheme(initialPath);
  }

  get theme() {
    return this.currentTheme();
  }

  darkMode() {
    return this.isDarkMode.asReadonly();
  }

  themeColors() {
    return this.currentTheme().colors;
  }

  themeStrings() {
    return this.currentTheme().strings;
  }

  themeIcons() {
    return this.currentTheme().icons;
  }

  private setTheme(appName: string): void {
    const theme = themes[appName] || themes['nearly'];
    this.currentTheme.set(theme);
    this.applyTheme(theme);
  }

  toggleDarkMode(): void {
    this.isDarkMode.update((v) => !v);
    this.applyDarkMode(this.isDarkMode());
  }

  private applyTheme(theme: AppTheme): void {
    const root = document.documentElement;
    const colors = theme.colors;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-surface-variant', colors.surfaceVariant);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
  }

  private applyDarkMode(isDark: boolean): void {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--color-background', '#121212');
      root.style.setProperty('--color-surface', '#1E1E1E');
      root.style.setProperty('--color-surface-variant', '#2D2D2D');
      root.style.setProperty('--color-text', '#FFFFFF');
      root.style.setProperty('--color-text-secondary', '#B0B0B0');
      root.style.setProperty('--color-border', '#3D3D3D');
    } else {
      const colors = this.currentTheme().colors;
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-surface-variant', colors.surfaceVariant);
      root.style.setProperty('--color-text', colors.text);
      root.style.setProperty('--color-text-secondary', colors.textSecondary);
      root.style.setProperty('--color-border', colors.border);
    }
  }
}
