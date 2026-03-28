import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DogService } from '../../services/dog.service';
import { Dog, UpdateDogRequest } from '../../models/dog.model';

@Component({
  selector: 'app-dog-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit {{ data.dog.name }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="edit-form">
        <!-- Avatar section -->
        <div class="avatar-upload-section">
          <div class="avatar-preview" (click)="fileInput.click()">
            @if (avatarPreview()) {
              <img [src]="avatarPreview()" alt="Avatar preview" class="preview-img" />
            } @else if (data.dog.avatar_url) {
              <img [src]="data.dog.avatar_url" alt="Current avatar" class="preview-img" />
            } @else {
              <mat-icon class="upload-placeholder">add_a_photo</mat-icon>
            }
          </div>
          <input
            #fileInput
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="onFileSelected($event)"
            hidden
          />
          <button mat-button type="button" (click)="fileInput.click()">
            {{ data.dog.avatar_url || avatarPreview() ? 'Change Photo' : 'Add Photo' }}
          </button>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Breed</mat-label>
          <input matInput formControlName="breed" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date of Birth</mat-label>
          <input matInput [matDatepicker]="editPicker" formControlName="dateOfBirth" />
          <mat-datepicker-toggle matIconSuffix [for]="editPicker"></mat-datepicker-toggle>
          <mat-datepicker #editPicker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="saving()">
        @if (saving()) { Saving... } @else { Save }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 300px;
    }

    .avatar-upload-section {
      text-align: center;
      margin-bottom: 16px;
    }

    .avatar-preview {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      margin: 0 auto 8px;
      cursor: pointer;
      overflow: hidden;
      background: #f5f0eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .upload-placeholder {
      font-size: 36px;
      color: #6D4C41;
    }

    .full-width {
      width: 100%;
    }
  `],
})
export class DogEditDialogComponent {
  data = inject<{ dog: Dog }>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<DogEditDialogComponent>);
  dogService = inject(DogService);
  snackBar = inject(MatSnackBar);

  saving = signal(false);
  avatarPreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  form = new FormGroup({
    name: new FormControl(this.data.dog.name, Validators.required),
    breed: new FormControl(this.data.dog.breed ?? ''),
    dateOfBirth: new FormControl<Date | null>(
      this.data.dog.date_of_birth ? new Date(this.data.dog.date_of_birth) : null
    ),
  });

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('File too large. Maximum 5MB.', 'Close', { duration: 3000 });
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.snackBar.open('Only JPEG, PNG, and WebP images are allowed.', 'Close', { duration: 3000 });
      return;
    }

    this.selectedFile.set(file);

    // Read file preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      // Upload avatar if selected
      if (this.selectedFile()) {
        const url = await this.dogService.uploadAvatar(this.data.dog.id, this.selectedFile()!);
        if (!url) {
          this.snackBar.open('Failed to upload avatar', 'Close', { duration: 3000 });
          return;
        }
      }

      // Build update request
      const request: UpdateDogRequest = {
        name: this.form.value.name || undefined,
        breed: this.form.value.breed || null,
        date_of_birth: this.form.value.dateOfBirth
          ? this.form.value.dateOfBirth.toISOString().split('T')[0]
          : null,
      };

      // Update dog
      const result = await this.dogService.updateDog(this.data.dog.id, request);

      if (result) {
        this.snackBar.open('Dog updated', 'Close', { duration: 3000 });
        this.dialogRef.close(result);
      } else {
        this.snackBar.open('Failed to update dog', 'Close', { duration: 3000 });
      }
    } finally {
      this.saving.set(false);
    }
  }
}
