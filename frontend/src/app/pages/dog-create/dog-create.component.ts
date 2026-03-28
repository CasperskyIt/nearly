import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DogService } from '../../services/dog.service';
import { ThemeService } from '../../config/theme.service';
import { CreateDogRequest } from '../../models/dog.model';

@Component({
  selector: 'app-dog-create',
  templateUrl: './dog-create.component.html',
  styleUrl: './dog-create.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    RouterLink,
    CommonModule,
  ],
})
export class DogCreateComponent {
  protected dogService = inject(DogService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private snackBar = inject(MatSnackBar);

  submitting = signal(false);

  protected form = new FormGroup({
    name: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
    breed: new FormControl<string>('', { nonNullable: true }),
    dateOfBirth: new FormControl<Date | null>(null),
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    try {
      this.submitting.set(true);

      // Build CreateDogRequest
      const request: CreateDogRequest = {
        name: this.form.value.name!,
        breed: this.form.value.breed || undefined,
        date_of_birth: this.form.value.dateOfBirth
          ? this.form.value.dateOfBirth.toISOString().split('T')[0]
          : undefined,
      };

      // Call DogService.createDog
      const result = await this.dogService.createDog(request);

      if (result) {
        // Success: show toast and navigate to detail page
        this.snackBar.open('Dog added', 'Dismiss', { duration: 3000 });
        const appPrefix = this.getAppPrefix();
        this.router.navigate([`/${appPrefix}/dogs`, result.id]);
      } else {
        // Error: show error toast
        this.snackBar.open('Failed to add dog', 'Dismiss', { duration: 3000 });
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected onCancel(): void {
    const appPrefix = this.getAppPrefix();
    this.router.navigate([`/${appPrefix}/dogs`]);
  }

  private getAppPrefix(): string {
    return this.themeService.theme?.name?.toLowerCase() ?? 'dogly';
  }
}
