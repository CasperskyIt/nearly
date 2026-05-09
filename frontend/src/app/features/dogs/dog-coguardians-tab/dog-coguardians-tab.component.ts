import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { DogService } from '../../../core/services/dog.service';
import { I18nService } from '../../../config/i18n.service';
import { DogGuardianWithProfile } from '../../../core/models/dog.model';

@Component({
  selector: 'app-dog-coguardians-tab',
  templateUrl: './dog-coguardians-tab.component.html',
  styleUrl: './dog-coguardians-tab.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class DogCoguardiansTabComponent implements OnInit {
  @Input({ required: true }) dogId!: string;

  private dogService = inject(DogService);
  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }

  guardians = signal<DogGuardianWithProfile[]>([]);
  loading = signal(true);

  // ── Invite modal ─────────────────────────────────────────────────────────────

  showInviteModal = signal(false);
  inviting = signal(false);
  inviteError = signal<string | null>(null);
  emailControl = new FormControl('', [Validators.required, Validators.email]);

  // ── Remove ───────────────────────────────────────────────────────────────────

  removingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGuardians();
  }

  private async loadGuardians(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.dogService.getGuardians(this.dogId);
      this.guardians.set(result);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Invite ────────────────────────────────────────────────────────────────────

  openInviteModal(): void {
    this.emailControl.reset('');
    this.inviteError.set(null);
    this.showInviteModal.set(true);
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
  }

  async onSubmitInvite(): Promise<void> {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    const email = this.emailControl.value!.trim();
    this.inviting.set(true);
    this.inviteError.set(null);

    try {
      const result = await this.dogService.inviteGuardian(this.dogId, email);
      if (!result) {
        this.inviteError.set(`Nie znaleziono konta powiązanego z adresem „${email}".`);
        return;
      }
      this.guardians.set([...this.guardians(), result]);
      this.showInviteModal.set(false);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        this.inviteError.set('Ten użytkownik jest już opiekunem lub ma oczekujące zaproszenie.');
      } else {
        this.inviteError.set('Wystąpił błąd. Spróbuj ponownie.');
      }
    } finally {
      this.inviting.set(false);
    }
  }

  // ── Remove ────────────────────────────────────────────────────────────────────

  async onRemove(guardian: DogGuardianWithProfile): Promise<void> {
    if (this.removingId()) return;
    this.removingId.set(guardian.id);
    try {
      const ok = await this.dogService.removeGuardian(guardian.id);
      if (ok) {
        this.guardians.set(this.guardians().filter(g => g.id !== guardian.id));
      }
    } finally {
      this.removingId.set(null);
    }
  }

  // ── Display helpers ───────────────────────────────────────────────────────────

  getRoleLabel(role: DogGuardianWithProfile['role']): string {
    return role === 'owner' ? 'Właściciel' : 'Opiekun';
  }

  getStatusLabel(status: DogGuardianWithProfile['status']): string {
    return status === 'accepted' ? 'Aktywny' : 'Oczekuje';
  }

  getDisplayName(guardian: DogGuardianWithProfile): string {
    if (guardian.username) return guardian.username;
    if (guardian.invited_email) return guardian.invited_email;
    if (guardian.user_id) return guardian.user_id.slice(0, 8) + '…';
    return '—';
  }
}
