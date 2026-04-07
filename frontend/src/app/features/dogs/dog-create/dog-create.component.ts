import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DogService } from '../../../core/services/dog.service';
import { I18nService } from '../../../config/i18n.service';
import { CreateDogRequest } from '../../../core/models/dog.model';
import { BREED_NAMES } from '../../../core/data/dog-breeds.data';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-dog-create',
  templateUrl: './dog-create.component.html',
  styleUrl: './dog-create.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, DatePickerComponent],
})
export class DogCreateComponent {
  protected dogService = inject(DogService);
  private router = inject(Router);
  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }

  submitting = signal(false);

  protected form = new FormGroup({
    name: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
    breed: new FormControl<string>('', { nonNullable: true }),
    dateOfBirth: new FormControl<string>('', { nonNullable: true }),
  });

  private breedInput = toSignal(this.form.controls.breed.valueChanges, { initialValue: '' });

  filteredBreeds = computed(() => {
    const query = this.breedInput().toLowerCase().trim();
    if (!query) return BREED_NAMES.slice(0, 50);
    return BREED_NAMES.filter(b => b.toLowerCase().includes(query)).slice(0, 50);
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
        date_of_birth: this.form.value.dateOfBirth || undefined,
      };

      const result = await this.dogService.createDog(request);

      if (result) {
        this.router.navigate(['/dogs', result.id]);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/dogs']);
  }
}
