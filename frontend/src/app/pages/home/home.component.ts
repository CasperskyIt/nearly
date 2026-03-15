import { Component, AfterViewInit, OnDestroy, signal, computed, effect, Inject, PLATFORM_ID, inject, ViewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ThemeService } from '../../config/theme.service';
import { I18nService } from '../../config/i18n.service';
import { SupabaseService, Place as SupabasePlace } from '../../services/supabase.service';
import { OsmService, OsmPlace } from '../../services/osm.service';
import { Language, languageNames } from '../../config/i18n.config';
import * as L from 'leaflet';

interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private tileLayer!: L.TileLayer;
  private sanitizer = inject(DomSanitizer);
  
  @ViewChild('placesList') placesList!: ElementRef;
  
  private lightTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  private darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  
  showWelcome = signal(true);
  selectedPlace = signal<Place | null>(null);
  selectedCategories = signal<Set<string>>(new Set());
  showLangMenu = signal(false);
  showList = signal(true);
  isLoading = signal(false);
  
  darkMode = computed(() => this.themeService.darkMode()());
  themeStrings = computed(() => this.themeService.themeStrings());
  themeIcons = computed(() => this.themeService.themeIcons());
  
  get t() {
    return this.i18nService.t;
  }
  
  get currentLanguage(): Language {
    return this.i18nService.getCurrentLanguage();
  }
  
  get languages() {
    return Object.entries(languageNames).map(([code, name]) => ({
      code: code as Language,
      name
    }));
  }
  
  get themeColors() {
    return this.themeService.themeColors();
  }

  get theme() {
    return this.themeService.theme;
  }

  getLogo(): SafeHtml | undefined {
    const logo = this.theme.logo;
    return logo ? this.sanitizer.bypassSecurityTrustHtml(logo) : undefined;
  }

  get categories() {
    const theme = this.themeService.theme;
    const icons = this.themeIcons();
    return Object.keys(icons.categories).map(key => ({
      id: key,
      label: this.t.categories[key] || key,
      icon: icons.categories[key]
    }));
  }
  
  places: Place[] = [];

  constructor(
    private router: Router,
    public themeService: ThemeService,
    public i18nService: I18nService,
    private supabaseService: SupabaseService,
    private osmService: OsmService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
    }
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [52.2297, 21.0122],
      zoom: 14,
      zoomControl: false
    });

    const isDark = this.darkMode();
    this.tileLayer = L.tileLayer(isDark ? this.darkTiles : this.lightTiles, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    }).addTo(this.map);

    this.loadMockData();
    this.addMarkers();

    this.map.on('moveend', () => {
      this.addMarkers();
    });

    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  private updateTileLayer(): void {
    if (!this.map || !this.tileLayer) return;
    
    const isDark = this.darkMode();
    const newUrl = isDark ? this.darkTiles : this.lightTiles;
    
    this.tileLayer.setUrl(newUrl);
  }

  private loadMockData(): void {
    const appName = this.theme.name;
    const defaultLat = 52.2297;
    const defaultLng = 21.0122;
    
    if (appName === 'Nearly') {
      this.places = [
        { id: '1', name: 'Restauracja U Wesołego Romana', category: 'restaurants', rating: 4.5, lat: 52.2297, lng: 21.0122 },
        { id: '2', name: 'Pub Na Rogu', category: 'pubs', rating: 4.3, lat: 52.2315, lng: 21.0210 },
        { id: '3', name: 'Kawiarnia Kropka', category: 'cafes', rating: 4.7, lat: 52.2280, lng: 21.0150 },
        { id: '4', name: 'Muzeum Powstania', category: 'museums', rating: 4.8, lat: 52.2320, lng: 21.0180 },
        { id: '5', name: 'Galeria Sztuki Współczesnej', category: 'art_galleries', rating: 4.4, lat: 52.2300, lng: 21.0100 },
        { id: '6', name: 'Park Skaryszewski', category: 'parks', rating: 4.6, lat: 52.2340, lng: 21.0250 },
        { id: '7', name: 'Food Truck Rally', category: 'street_food', rating: 4.2, lat: 52.2270, lng: 21.0080 },
        { id: '8', name: 'McDonald\'s Central', category: 'fast_food', rating: 3.9, lat: 52.2350, lng: 21.0300 },
      ];
    } else {
      this.places = [
        { id: '1', name: 'Central Bark Cafe', category: 'dog_cafe', rating: 4.8, lat: 52.2297, lng: 21.0122 },
        { id: '2', name: 'Paws Park', category: 'dog_parks', rating: 4.6, lat: 52.2315, lng: 21.0210 },
        { id: '3', name: 'Barking Bistro', category: 'dog_restaurant', rating: 4.5, lat: 52.2280, lng: 21.0150 },
        { id: '4', name: 'Puppy Academy', category: 'dog_school', rating: 4.9, lat: 52.2320, lng: 21.0180 },
        { id: '5', name: 'Vet Care Plus', category: 'vet', rating: 4.7, lat: 52.2300, lng: 21.0100 },
        { id: '6', name: 'Happy Tails Run', category: 'dog_run', rating: 4.4, lat: 52.2340, lng: 21.0250 },
        { id: '7', name: 'Woof & Brew', category: 'dog_cafe', rating: 4.3, lat: 52.2270, lng: 21.0080 },
        { id: '8', name: 'Green Paws Park', category: 'dog_parks', rating: 4.7, lat: 52.2350, lng: 21.0300 },
      ];
    }
  }

  async loadPlacesFromSupabase(lat: number, lng: number, radiusKm: number = 10): Promise<void> {
    this.isLoading.set(true);
    const appName = this.theme.name;
    const isDogly = appName === 'Dogly';
    const radiusMeters = radiusKm * 1000;
    
    if (isDogly) {
      this.osmService.getDogFriendlyPlaces(lat, lng, radiusMeters).subscribe({
        next: (places) => {
          this.places = places.map((p, index) => ({
            id: String(p.id),
            name: p.name,
            category: p.category,
            rating: 4.0 + Math.random() * 1,
            lat: p.lat,
            lng: p.lon
          }));
          this.addMarkers();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading OSM places:', err);
          this.isLoading.set(false);
        }
      });
    } else {
      this.osmService.getPlacesNearby(lat, lng, radiusMeters).subscribe({
        next: (places) => {
          this.places = places.map((p, index) => ({
            id: String(p.id),
            name: p.name,
            category: p.category,
            rating: 3.5 + Math.random() * 1.5,
            lat: p.lat,
            lng: p.lon
          }));
          this.addMarkers();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading OSM places:', err);
          this.isLoading.set(false);
        }
      });
    }
  }

  visiblePlaces: Place[] = [];

  private addMarkers(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const bounds = this.map.getBounds();
    const selected = this.selectedCategories();
    
    const allFiltered = selected.size === 0 
      ? this.places 
      : this.places.filter(p => selected.has(p.category));
    
    this.visiblePlaces = allFiltered.filter(place => 
      bounds.contains([place.lat, place.lng])
    );

    this.visiblePlaces.forEach(place => {
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
        iconAnchor: [18, 36]
      });

      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(this.map)
        .on('click', () => this.selectPlace(place));
      
      this.markers.push(marker);
    });
  }

  getCategoryIcon(category: string): string {
    const icons = this.themeIcons();
    return icons.categories[category] || 'place';
  }

  getCategoryLabel(category: string): string {
    return this.categories.find(c => c.id === category)?.label || category;
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

  toggleCategory(id: string): void {
    this.selectedCategories.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    this.addMarkers();
  }

  selectPlace(place: Place): void {
    this.selectedPlace.set(place);
    this.map.setView([place.lat, place.lng], 16);
    this.addMarkers();
    
    setTimeout(() => {
      const element = this.placesList?.nativeElement?.querySelector(`[data-id="${place.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  closePlaceDetail(): void {
    this.selectedPlace.set(null);
  }

  onLocate(): void {
    if (!navigator.geolocation) {
      this.showWelcome.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], 15);
        
        const colors = this.themeColors;
        L.circle([latitude, longitude], {
          radius: 100,
          color: colors.primary,
          fillColor: colors.primary,
          fillOpacity: 0.3
        }).addTo(this.map);
        
        await this.loadPlacesFromSupabase(latitude, longitude);
        this.showWelcome.set(false);
      },
      () => {
        this.showWelcome.set(false);
      }
    );
  }

  toggleMenu(): void {
    console.log('Toggle menu');
  }

  toggleList(): void {
    this.showList.update(v => !v);
    setTimeout(() => {
      this.map.invalidateSize();
    }, 350);
  }

  toggleLangMenu(): void {
    this.showLangMenu.update(v => !v);
  }

  setLanguage(lang: Language): void {
    this.i18nService.setLanguage(lang);
    this.showLangMenu.set(false);
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
    setTimeout(() => {
      this.updateTileLayer();
    }, 50);
  }

  zoomIn(): void {
    this.map.zoomIn();
  }

  zoomOut(): void {
    this.map.zoomOut();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
