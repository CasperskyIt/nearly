import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoggerService } from './logger.service';

export interface OsmPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  category: string;
  tags?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class OsmService {
  private overpassUrl = 'https://overpass-api.de/api/interpreter';
  private logger = inject(LoggerService);

  constructor(private http: HttpClient) {}

  getPlacesNearby(lat: number, lng: number, radius: number = 5000): Observable<OsmPlace[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"cafe|restaurant|bar|pub"](around:${radius},${lat},${lng});
        node["tourism"~"museum|gallery"](around:${radius},${lat},${lng});
        node["leisure"~"park|dog_park"](around:${radius},${lat},${lng});
        node["shop"~"bakery|supermarket"](around:${radius},${lat},${lng});
      );
      out body;
    `;

    return new Observable(observer => {
      this.http.post<any>(this.overpassUrl, query).subscribe({
        next: (response) => {
          const elements = response?.elements ?? [];
          const places: OsmPlace[] = elements.map((el: any) => ({
            id: el.id,
            name: el.tags.name || 'Bez nazwy',
            lat: el.lat,
            lon: el.lon,
            category: this.getCategoryFromTags(el.tags),
            tags: el.tags
          })).filter((p: OsmPlace) => p.name !== 'Bez nazwy');
          
          observer.next(places);
          observer.complete();
        },
        error: (err) => {
          this.logger.error('OSM Error:', err);
          observer.error(err);
        }
      });
    });
  }

  getDogFriendlyPlaces(lat: number, lng: number, radius: number = 5000): Observable<OsmPlace[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"cafe|restaurant"](around:${radius},${lat},${lng})["dog"~"yes"];
        node["leisure"~"dog_park"](around:${radius},${lat},${lng});
        node["shop"~"pet"](around:${radius},${lat},${lng});
        way["amenity"~"cafe|restaurant"](around:${radius},${lat},${lng})["dog"~"yes"];
        way["leisure"~"dog_park"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    return new Observable(observer => {
      this.http.post<any>(this.overpassUrl, query).subscribe({
        next: (response) => {
          const elements = response?.elements ?? [];
          const places: OsmPlace[] = elements.map((el: any) => ({
            id: el.id,
            name: el.tags.name || 'Bez nazwy',
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            category: this.getDogCategoryFromTags(el.tags),
            tags: el.tags
          })).filter((p: OsmPlace) => p.name !== 'Bez nazwy' && p.lat && p.lon);
          
          observer.next(places);
          observer.complete();
        },
        error: (err) => {
          this.logger.error('OSM Error:', err);
          observer.error(err);
        }
      });
    });
  }

  private getCategoryFromTags(tags: Record<string, string>): string {
    if (tags['amenity'] === 'cafe') return 'cafes';
    if (tags['amenity'] === 'restaurant') return 'restaurants';
    if (tags['amenity'] === 'bar' || tags['amenity'] === 'pub') return 'pubs';
    if (tags['tourism'] === 'museum') return 'museums';
    if (tags['tourism'] === 'gallery') return 'art_galleries';
    if (tags['leisure'] === 'park') return 'parks';
    return 'other';
  }

  private getDogCategoryFromTags(tags: Record<string, string>): string {
    if (tags['leisure'] === 'dog_park') return 'dog_parks';
    if (tags['amenity'] === 'cafe' && tags['dog'] === 'yes') return 'dog_cafe';
    if (tags['amenity'] === 'restaurant' && tags['dog'] === 'yes') return 'dog_restaurant';
    if (tags['shop'] === 'pet') return 'dog_shop';
    return 'dog_parks';
  }
}
