import { Component, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface Category {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [MatChipsModule, MatIconModule, MatButtonModule],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss'
})
export class FiltersComponent {
  categories: Category[] = [
    { id: 'coffee', label: 'Coffee', icon: 'local_cafe' },
    { id: 'parks', label: 'Parks', icon: 'park' },
    { id: 'viewpoints', label: 'Viewpoints', icon: 'visibility' },
    { id: 'street_art', label: 'Street Art', icon: 'palette' },
    { id: 'restaurants', label: 'Restaurants', icon: 'restaurant' },
    { id: 'bars', label: 'Bars', icon: 'local_bar' },
  ];
  
  selectedCategories = new Set<string>();
  categoriesChange = output<string[]>();

  toggleCategory(id: string) {
    if (this.selectedCategories.has(id)) {
      this.selectedCategories.delete(id);
    } else {
      this.selectedCategories.add(id);
    }
    this.categoriesChange.emit(Array.from(this.selectedCategories));
  }
}
