import { Component, Input, inject } from '@angular/core';
import { I18nService } from '../../../config/i18n.service';
import { DogMonthCalendarComponent } from '../dog-month-calendar/dog-month-calendar.component';

@Component({
  selector: 'app-dog-calendar-tab',
  templateUrl: './dog-calendar-tab.component.html',
  styleUrl: './dog-calendar-tab.component.scss',
  standalone: true,
  imports: [DogMonthCalendarComponent],
})
export class DogCalendarTabComponent {
  @Input({ required: true }) dogId!: string;

  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }
}
