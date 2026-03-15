import { Injectable, signal, computed } from '@angular/core';
import { Language, translations, languageNames, Translations } from './i18n.config';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLanguage = signal<Language>('pl');
  
  readonly languageNames = languageNames;
  
  get language() {
    return this.currentLanguage.asReadonly();
  }
  
  get t(): Translations {
    return translations[this.currentLanguage()];
  }
  
  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    localStorage.setItem('nearly-language', lang);
  }
  
  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }
  
  getLanguageName(lang: Language): string {
    return languageNames[lang];
  }
  
  init(): void {
    const saved = localStorage.getItem('nearly-language') as Language | null;
    if (saved && translations[saved]) {
      this.currentLanguage.set(saved);
    }
  }
}
