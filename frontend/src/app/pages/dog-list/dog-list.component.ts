import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { DogService } from '../../services/dog.service';
import { ThemeService } from '../../config/theme.service';
import { Dog } from '../../models/dog.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dog-list',
  templateUrl: './dog-list.component.html',
  styleUrl: './dog-list.component.scss',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatSnackBarModule, RouterLink, CommonModule],
})
export class DogListComponent implements OnInit {
  protected dogService = inject(DogService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.dogService.getDogs().catch(() => {
      this.snackBar.open('Failed to load dogs', 'Dismiss', { duration: 3000 });
    });
  }

  protected onSelectDog(dog: Dog): void {
    this.dogService.setCurrentDog(dog);
    const appPrefix = this.getAppPrefix();
    this.router.navigate([`/${appPrefix}/dogs`, dog.id]);
  }

  protected onAddDog(): void {
    const appPrefix = this.getAppPrefix();
    this.router.navigate([`/${appPrefix}/dogs/new`]);
  }

  private getAppPrefix(): string {
    return this.themeService.theme?.name?.toLowerCase() ?? 'dogly';
  }
}
