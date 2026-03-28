import {
  Component,
  AfterViewInit,
  OnDestroy,
  signal,
  input,
  output,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';
import { ThemeService } from '../../config/theme.service';
import { I18nService } from '../../config/i18n.service';
import { OsmService } from '../../services/osm.service';
import { MapService } from '../../services/map.service';
import { Place } from '../places-list/places-list.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private mapService = inject(MapService);
  private themeService = inject(ThemeService);
  private i18nService = inject(I18nService);
  private osmService = inject(OsmService);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  // Signal inputs
  selectedCategories = input<Set<string>>(new Set());
  showList = input<boolean>(true);
  isLoading = input<boolean>(false);

  // Signal outputs
  placesLoaded = output<Place[]>();
  placeSelected = output<Place>();
  loadingChange = output<boolean>();
  visiblePlacesChange = output<Place[]>();

  // Internal state
  visiblePlaces = signal<Place[]>([]);
  showWelcome = signal(true);
  selectedPlace = signal<Place | null>(null);

  private allPlaces: Place[] = [];

  get t() {
    return this.i18nService.t;
  }

  get themeIcons() {
    return this.themeService.themeIcons();
  }

  getLogo(): string | null {
    const logo = this.themeService.theme.logo;
    return logo ? this.sanitizer.sanitize(SecurityContext.HTML, logo) : null;
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const isDark = this.themeService.darkMode()();
      this.mapService.initMap('map');
      this.mapService.setTileLayer(isDark);
      this.addMarkers();

      const map = this.mapService.getMap();
      if (map) {
        map.on('moveend', () => this.addMarkers());
      }

      setTimeout(() => {
        this.mapService.invalidateSize();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.mapService.destroyMap();
  }

  private addMarkers(): void {
    const map = this.mapService.getMap();
    if (!map) return;

    this.mapService.clearMarkers();

    const bounds = map.getBounds();
    const selected = this.selectedCategories();

    const allFiltered =
      selected.size === 0
        ? this.allPlaces
        : this.allPlaces.filter((p) => selected.has(p.category));

    const visible = allFiltered.filter((place) =>
      bounds.contains([place.lat, place.lng])
    );

    this.visiblePlaces.set(visible);
    this.visiblePlacesChange.emit(visible);

    visible.forEach((place) => {
      const color = this.getCategoryColor(place.category);
      const iconName = this.getCategoryIcon(place.category);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${color};
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-family: 'Material Icons';
          ">${iconName}</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      this.mapService.addMarker(place.lat, place.lng, icon, () =>
        this.selectPlace(place)
      );
    });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      dog_parks: '#66BB6A',
      dog_run: '#42A5F5',
      dog_cafe: '#8D6E63',
      dog_restaurant: '#FFA726',
      dog_school: '#AB47BC',
      dog_shop: '#26A69A',
      vet: '#EF5350',
      restaurants: '#FF7043',
      pubs: '#7E57C2',
      cafes: '#795548',
      museums: '#5C6BC0',
      art_galleries: '#EC407A',
      parks: '#4CAF50',
      street_food: '#FF9800',
      fast_food: '#F44336',
    };
    return colors[category] || '#757575';
  }

  getCategoryIcon(category: string): string {
    const icons = this.themeService.themeIcons();
    return icons.categories[category] || 'place';
  }

  getCategoryLabel(category: string): string {
    return this.t.categories[category] || category;
  }

  selectPlace(place: Place): void {
    this.selectedPlace.set(place);
    this.placeSelected.emit(place);
    this.mapService.getMap()?.setView([place.lat, place.lng], 16);
    this.addMarkers();
  }

  async loadPlacesFromSupabase(lat: number, lng: number, radiusKm: number = 10): Promise<void> {
    this.loadingChange.emit(true);
    const isDogly = this.themeService.theme.name === 'Dogly';
    const radiusMeters = radiusKm * 1000;

    const obs = isDogly
      ? this.osmService.getDogFriendlyPlaces(lat, lng, radiusMeters)
      : this.osmService.getPlacesNearby(lat, lng, radiusMeters);

    obs.subscribe({
      next: (osmPlaces) => {
        const places: Place[] = osmPlaces.map((p) => ({
          id: String(p.id),
          name: p.name,
          category: p.category,
          rating: 0,
          lat: p.lat,
          lng: p.lon,
        }));
        this.allPlaces = places;
        this.placesLoaded.emit(places);
        this.addMarkers();
        this.loadingChange.emit(false);
      },
      error: (err) => {
        console.error('Error loading OSM places:', err);
        this.loadingChange.emit(false);
      },
    });
  }

  onLocate(): void {
    if (!navigator.geolocation) {
      this.showWelcome.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const map = this.mapService.getMap();
        if (map) {
          map.setView([latitude, longitude], 15);
          const colors = this.themeService.themeColors();
          L.circle([latitude, longitude], {
            radius: 100,
            color: colors.primary,
            fillColor: colors.primary,
            fillOpacity: 0.3,
          }).addTo(map);
        }
        await this.loadPlacesFromSupabase(latitude, longitude);
        this.showWelcome.set(false);
      },
      () => {
        this.showWelcome.set(false);
      }
    );
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
    setTimeout(() => {
      this.mapService.updateTileLayer(this.themeService.darkMode()());
    }, 50);
  }

  zoomIn(): void {
    this.mapService.getMap()?.zoomIn();
  }

  zoomOut(): void {
    this.mapService.getMap()?.zoomOut();
  }
}
