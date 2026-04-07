import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../config/i18n.service';

export interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-places-list',
  standalone: true,
  imports: [],
  templateUrl: './places-list.component.html',
  styleUrl: './places-list.component.scss',
})
export class PlacesListComponent {
  private i18nService = inject(I18nService);
  get t() { return this.i18nService.t; }

  places = input<Place[]>([]);
  selectedPlace = input<Place | null>(null);
  isLoading = input<boolean>(false);
  getCategoryColor = input<(category: string) => string>(() => '#757575');
  getCategoryIcon = input<(category: string) => string>(() => 'place');
  getCategoryLabel = input<(category: string) => string>(() => '');

  selectPlace = output<Place>();

  onSelectPlace(place: Place) {
    this.selectPlace.emit(place);
  }
}
