import { Injectable } from '@angular/core';
import * as L from 'leaflet';

@Injectable({ providedIn: 'root' })
export class MapService {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private tileLayer: L.TileLayer | null = null;

  private lightTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  private darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  initMap(containerId: string, options?: { center: [number, number]; zoom: number }): void {
    const center: [number, number] = options?.center ?? [52.2297, 21.0122];
    const zoom = options?.zoom ?? 14;

    this.map = L.map(containerId, {
      center,
      zoom,
      zoomControl: false,
    });
  }

  destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
    this.tileLayer = null;
  }

  getMap(): L.Map | null {
    return this.map;
  }

  setTileLayer(isDark: boolean): void {
    if (!this.map) return;
    const url = isDark ? this.darkTiles : this.lightTiles;
    this.tileLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(this.map);
  }

  updateTileLayer(isDark: boolean): void {
    if (!this.tileLayer) return;
    const url = isDark ? this.darkTiles : this.lightTiles;
    this.tileLayer.setUrl(url);
  }

  clearMarkers(): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];
  }

  addMarker(lat: number, lng: number, icon: L.DivIcon, onClick: () => void): void {
    if (!this.map) return;
    const marker = L.marker([lat, lng], { icon }).addTo(this.map).on('click', onClick);
    this.markers.push(marker);
  }

  invalidateSize(): void {
    this.map?.invalidateSize();
  }
}
