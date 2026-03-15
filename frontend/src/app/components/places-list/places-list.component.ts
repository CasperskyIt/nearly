import { Component, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

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
  imports: [MatCardModule],
  templateUrl: './places-list.component.html',
  styleUrl: './places-list.component.scss'
})
export class PlacesListComponent {
  selectPlace = output<Place>();

  mockPlaces: Place[] = [
    { id: '1', name: 'Kawiarnia TF', category: 'Coffee', rating: 4.5, lat: 52.2297, lng: 21.0122 },
    { id: '2', name: 'Park Łazienkowski', category: 'Parks', rating: 4.8, lat: 52.2315, lng: 21.0210 },
    { id: '3', name: 'Mural na Wybrzeżu', category: 'Street Art', rating: 4.2, lat: 52.2280, lng: 21.0150 },
    { id: '4', name: 'Bar Bez Kowalarni', category: 'Bars', rating: 4.6, lat: 52.2320, lng: 21.0180 },
    { id: '5', name: 'Restauracja Sztuka', category: 'Restaurants', rating: 4.3, lat: 52.2300, lng: 21.0100 },
  ];

  onSelectPlace(place: Place) {
    this.selectPlace.emit(place);
  }
}
