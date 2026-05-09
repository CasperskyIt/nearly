import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../config/i18n.service';

@Component({
  selector: 'app-dog-health-tab',
  templateUrl: './dog-health-tab.component.html',
  styleUrl: './dog-health-tab.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class DogHealthTabComponent {
  @Input({ required: true }) dogId!: string;

  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }
}
