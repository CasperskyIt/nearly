import { Component, signal, computed, inject, ViewChild } from '@angular/core';
import { ThemeService } from '../../config/theme.service';
import { I18nService } from '../../config/i18n.service';
import { MapComponent } from './map/map.component';
import { PlacesListComponent, Place } from './places-list/places-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MapComponent, PlacesListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private themeService = inject(ThemeService);
  private i18nService = inject(I18nService);

  @ViewChild('mapRef') mapRef!: MapComponent;

  selectedPlace = signal<Place | null>(null);
  selectedCategories = signal<Set<string>>(new Set());
  showList = signal(true);
  isLoading = signal(false);
  visiblePlaces = signal<Place[]>([]);

  darkMode = computed(() => this.themeService.darkMode()());
  themeIcons = computed(() => this.themeService.themeIcons());


  get t() { return this.i18nService.t; }
  get categories() {
    const icons = this.themeIcons();
    return Object.keys(icons.categories).map((key) => ({
      id: key, label: this.t.categories[key] || key, icon: icons.categories[key],
    }));
  }

  toggleCategory(id: string): void {
    this.selectedCategories.update((set) => {
      const newSet = new Set(set);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }

  onPlaceSelected(place: Place): void { this.selectedPlace.set(place); }
  onVisiblePlacesChanged(places: Place[]): void { this.visiblePlaces.set(places); }

  toggleList(): void {
    this.showList.update((v) => !v);
    setTimeout(() => this.mapRef?.invalidateSize(), 350);
  }

  getCategoryColor = (category: string): string =>
    this.mapRef?.getCategoryColor(category) ?? '#757575';
  getCategoryIcon = (category: string): string =>
    this.mapRef?.getCategoryIcon(category) ?? 'place';
  getCategoryLabel = (category: string): string =>
    this.mapRef?.getCategoryLabel(category) ?? '';
}
