import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { DogService } from '../../services/dog.service';
import { ThemeService } from '../../config/theme.service';
import { Dog, DogGuardian } from '../../models/dog.model';
import { DogEditDialogComponent } from './dog-edit-dialog.component';
import { DogDeleteDialogComponent } from './dog-delete-dialog.component';

@Component({
  selector: 'app-dog-detail',
  templateUrl: './dog-detail.component.html',
  styleUrl: './dog-detail.component.scss',
  standalone: true,
  imports: [
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    DatePipe,
    RouterLink,
  ],
})
export class DogDetailComponent implements OnInit {
  private dogService = inject(DogService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private themeService = inject(ThemeService);

  dog = signal<Dog | null>(null);
  guardians = signal<DogGuardian[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const dogId = this.activatedRoute.snapshot.paramMap.get('id');
    if (!dogId) {
      this.snackBar.open('Dog not found', 'Close', { duration: 3000 });
      this.router.navigate([`/${this.getAppPrefix()}/dogs`]);
      return;
    }

    this.loadDog(dogId);
  }

  private async loadDog(dogId: string): Promise<void> {
    try {
      this.loading.set(true);

      // Fetch dogs if not already cached
      if (this.dogService.dogs().length === 0) {
        await this.dogService.getDogs();
      }

      // Find dog in cache
      const foundDog = this.dogService.dogs().find(d => d.id === dogId);
      if (!foundDog) {
        this.snackBar.open('Dog not found', 'Close', { duration: 3000 });
        this.router.navigate([`/${this.getAppPrefix()}/dogs`]);
        return;
      }

      this.dog.set(foundDog);
      this.dogService.setCurrentDog(foundDog);

      // Load guardians
      const guardiansList = await this.dogService.getGuardians(dogId);
      this.guardians.set(guardiansList);
    } catch (error: any) {
      this.snackBar.open('Failed to load dog', 'Close', { duration: 3000 });
      this.router.navigate([`/${this.getAppPrefix()}/dogs`]);
    } finally {
      this.loading.set(false);
    }
  }

  onEdit(): void {
    if (!this.dog()) return;

    const dialogRef = this.dialog.open(DogEditDialogComponent, {
      data: { dog: this.dog() },
      width: '500px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result: Dog | undefined) => {
      if (result) {
        this.dog.set(result);
      }
    });
  }

  async onDelete(): Promise<void> {
    if (!this.dog()) return;

    const dialogRef = this.dialog.open(DogDeleteDialogComponent, {
      data: { dogName: this.dog()!.name },
      width: '340px',
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed) {
        const success = await this.dogService.deleteDog(this.dog()!.id);
        if (success) {
          this.snackBar.open('Dog deleted', 'Close', { duration: 3000 });
          this.router.navigate([`/${this.getAppPrefix()}/dogs`]);
        } else {
          this.snackBar.open('Failed to delete dog', 'Close', { duration: 3000 });
        }
      }
    });
  }

  onBack(): void {
    this.router.navigate([`/${this.getAppPrefix()}/dogs`]);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  private getAppPrefix(): string {
    return this.themeService.theme?.name?.toLowerCase() ?? 'dogly';
  }
}
