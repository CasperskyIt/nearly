import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DogService } from '../../../core/services/dog.service';
import { I18nService } from '../../../config/i18n.service';
import { Dog } from '../../../core/models/dog.model';

@Component({
  selector: 'app-dog-list',
  templateUrl: './dog-list.component.html',
  styleUrl: './dog-list.component.scss',
  standalone: true,
  imports: [RouterOutlet],
})
export class DogListComponent implements OnInit {
  protected dogService = inject(DogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18nService = inject(I18nService);
  hasActiveChild = false;

  get t() { return this.i18nService.t; }

  ngOnInit(): void {
    this.dogService.getDogs();

    this.syncChildRoute();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.syncChildRoute();
    });
  }

  private syncChildRoute(): void {
    this.hasActiveChild = !!this.route.firstChild;
  }

  protected onSelectDog(dog: Dog): void {
    this.dogService.setCurrentDog(dog);
    this.router.navigate([dog.id], { relativeTo: this.route });
  }

  protected onAddDog(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
