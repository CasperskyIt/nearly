import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DogService } from '../../../core/services/dog.service';
import { I18nService } from '../../../config/i18n.service';
import { Dog, DogGuardian, UpdateDogRequest } from '../../../core/models/dog.model';
import { DogCareTabComponent } from '../dog-care-tab/dog-care-tab.component';
import { DogMonthCalendarComponent } from '../dog-month-calendar/dog-month-calendar.component';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

type Tab = 'calendar' | 'care' | 'health' | 'coguardians';

@Component({
  selector: 'app-dog-detail',
  templateUrl: './dog-detail.component.html',
  styleUrl: './dog-detail.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DogCareTabComponent,
    DogMonthCalendarComponent,
    DatePickerComponent,
  ],
})
export class DogDetailComponent implements OnInit {
  private dogService = inject(DogService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }

  dog = signal<Dog | null>(null);
  guardians = signal<DogGuardian[]>([]);
  loading = signal(true);
  activeTab = signal<Tab>('calendar');

  // Edit modal
  showEditModal = signal(false);
  saving = signal(false);
  avatarPreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  editError = signal<string | null>(null);

  editForm = new FormGroup({
    name: new FormControl('', Validators.required),
    breed: new FormControl(''),
    dateOfBirth: new FormControl(''),
  });

  // Delete modal
  showDeleteModal = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const dogId = this.activatedRoute.snapshot.paramMap.get('id');
    if (!dogId) { this.router.navigate(['/dogs']); return; }
    this.loadDog(dogId);
  }

  private async loadDog(dogId: string): Promise<void> {
    try {
      this.loading.set(true);
      if (this.dogService.dogs().length === 0) await this.dogService.getDogs();

      const found = this.dogService.dogs().find(d => d.id === dogId);
      if (!found) { this.router.navigate(['/dogs']); return; }

      this.dog.set(found);
      this.dogService.setCurrentDog(found);
      this.guardians.set(await this.dogService.getGuardians(dogId));
    } catch {
      this.router.navigate(['/dogs']);
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: Tab): void { this.activeTab.set(tab); }

  onBack(): void { this.router.navigate(['/dogs']); }

  // ── Edit ──────────────────────────────────────────────────────────────────

  onEdit(): void {
    const dog = this.dog();
    if (!dog) return;
    this.editForm.reset({ name: dog.name, breed: dog.breed ?? '', dateOfBirth: dog.date_of_birth ?? '' });
    this.avatarPreview.set(null);
    this.selectedFile.set(null);
    this.editError.set(null);
    this.showEditModal.set(true);
  }

  closeEditModal(): void { this.showEditModal.set(false); }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { this.editError.set('Plik za duży. Maksymalnie 5 MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.editError.set('Dozwolone formaty: JPEG, PNG, WebP.');
      return;
    }

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async onSave(): Promise<void> {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const dog = this.dog();
    if (!dog) return;

    this.saving.set(true);
    this.editError.set(null);
    try {
      if (this.selectedFile()) {
        const url = await this.dogService.uploadAvatar(dog.id, this.selectedFile()!);
        if (!url) { this.editError.set('Nie udało się przesłać zdjęcia.'); return; }
      }
      const req: UpdateDogRequest = {
        name: this.editForm.value.name || undefined,
        breed: this.editForm.value.breed || null,
        date_of_birth: this.editForm.value.dateOfBirth || null,
      };
      const result = await this.dogService.updateDog(dog.id, req);
      if (result) { this.dog.set(result); this.showEditModal.set(false); }
      else this.editError.set('Nie udało się zapisać zmian.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  onDelete(): void { if (this.dog()) this.showDeleteModal.set(true); }
  closeDeleteModal(): void { this.showDeleteModal.set(false); }

  async confirmDelete(): Promise<void> {
    if (!this.dog()) return;
    this.deleting.set(true);
    try {
      if (await this.dogService.deleteDog(this.dog()!.id)) {
        this.router.navigate(['/dogs']);
      } else {
        this.showDeleteModal.set(false);
      }
    } finally {
      this.deleting.set(false);
    }
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  }
}
