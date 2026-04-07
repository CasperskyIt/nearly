import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { CareService } from '../../../core/services/care.service';
import { I18nService } from '../../../config/i18n.service';
import { CareType, CareEventLog, CareSchedule, IntervalUnit, ScheduleStatus } from '../../../core/models/care-type.model';
import { AVAILABLE_ICONS } from '../../../core/data/care-types.data';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

type SubTab = 'types' | 'calendar';

@Component({
  selector: 'app-dog-care-tab',
  templateUrl: './dog-care-tab.component.html',
  styleUrl: './dog-care-tab.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent],
})
export class DogCareTabComponent implements OnInit {
  @Input({ required: true }) dogId!: string;

  private careService = inject(CareService);
  private i18nService = inject(I18nService);

  get t() { return this.i18nService.t; }

  readonly availableIcons = AVAILABLE_ICONS;
  readonly intervalUnits: IntervalUnit[] = ['day', 'week', 'month'];

  // ── Core state ────────────────────────────────────────────────────────────

  careTypes = signal<CareType[]>([]);
  careEvents = signal<CareEventLog[]>([]);
  schedules = signal<CareSchedule[]>([]);
  loading = signal(true);
  activeSubTab = signal<SubTab>('types');

  // ── Derived maps ──────────────────────────────────────────────────────────

  lastEventByTypeId = computed<Map<string, CareEventLog>>(() => {
    const map = new Map<string, CareEventLog>();
    for (const event of this.careEvents()) {
      const typeId = event.payload.care_type_id;
      const existing = map.get(typeId);
      if (!existing || new Date(event.occurred_at) > new Date(existing.occurred_at)) {
        map.set(typeId, event);
      }
    }
    return map;
  });

  scheduleByTypeId = computed<Map<string, CareSchedule>>(() => {
    const map = new Map<string, CareSchedule>();
    for (const s of this.schedules()) {
      map.set(s.careTypeId, s);
    }
    return map;
  });

  scheduleStatuses = computed<ScheduleStatus[]>(() =>
    this.careService.buildScheduleStatuses(this.dogId, this.lastEventByTypeId())
  );

  // ── Log event modal ───────────────────────────────────────────────────────

  showLogModal = signal(false);
  selectedCareType = signal<CareType | null>(null);
  saving = signal(false);
  logError = signal<string | null>(null);

  logForm = new FormGroup({
    date: new FormControl('', Validators.required),
    notes: new FormControl(''),
  });

  // ── Schedule modal ────────────────────────────────────────────────────────

  showScheduleModal = signal(false);
  scheduleForType = signal<CareType | null>(null);
  existingSchedule = signal<CareSchedule | null>(null);

  scheduleForm = new FormGroup({
    intervalValue: new FormControl<number>(1, [Validators.required, Validators.min(1)]),
    intervalUnit: new FormControl<IntervalUnit>('week', Validators.required),
    isActive: new FormControl(true),
  });

  // ── Add custom type modal ─────────────────────────────────────────────────

  showAddTypeModal = signal(false);

  addTypeForm = new FormGroup({
    name: new FormControl('', Validators.required),
    icon: new FormControl('pets', Validators.required),
  });

  // ── Delete event ──────────────────────────────────────────────────────────

  deletingEventId = signal<string | null>(null);

  async deleteEvent(event: CareEventLog): Promise<void> {
    if (this.deletingEventId()) return;
    this.deletingEventId.set(event.id);
    try {
      const ok = await this.careService.deleteCareEvent(event.id);
      if (ok) {
        this.careEvents.set(this.careEvents().filter(e => e.id !== event.id));
      }
    } finally {
      this.deletingEventId.set(null);
    }
  }

  // ── Delete custom type modal ──────────────────────────────────────────────

  showDeleteTypeModal = signal(false);
  typeToDelete = signal<CareType | null>(null);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const events = await this.careService.getCareEvents(this.dogId);
      this.careEvents.set(events);
      this.careTypes.set(this.careService.getAllCareTypes(this.dogId));
      this.schedules.set(this.careService.getSchedules(this.dogId));
    } finally {
      this.loading.set(false);
    }
  }

  // ── Sub-tab ───────────────────────────────────────────────────────────────

  setSubTab(tab: SubTab): void {
    this.activeSubTab.set(tab);
  }

  // ── Last-done helpers ─────────────────────────────────────────────────────

  getLastDoneLabel(careTypeId: string): string {
    const event = this.lastEventByTypeId().get(careTypeId);
    if (!event) return this.t.dogs.careNever;

    const eventDate = new Date(event.occurred_at);
    const today = this.dayStart(new Date());

    if (eventDate >= today) return this.t.dogs.careToday;
    if (eventDate >= new Date(today.getTime() - 86_400_000)) return this.t.dogs.careYesterday;

    return eventDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Returns status label for card badge if a schedule exists, otherwise null. */
  getScheduleBadge(careTypeId: string): { label: string; state: 'overdue' | 'today' | 'soon' | 'ok' } | null {
    const status = this.scheduleStatuses().find(s => s.schedule.careTypeId === careTypeId);
    if (!status) return null;

    const { daysOffset } = status;
    if (daysOffset < 0) {
      return { label: `${Math.abs(daysOffset)} ${this.t.dogs.careDaysOverdue}`, state: 'overdue' };
    }
    if (daysOffset === 0) {
      return { label: this.t.dogs.careDueToday, state: 'today' };
    }
    if (daysOffset <= 3) {
      return { label: `${this.t.dogs.careDaysLeft} ${daysOffset} dni`, state: 'soon' };
    }
    return { label: `${this.t.dogs.careDaysLeft} ${daysOffset} dni`, state: 'ok' };
  }

  getIntervalLabel(schedule: CareSchedule): string {
    const unitLabel = this.getUnitLabel(schedule.intervalUnit);
    return `${this.t.dogs.careEvery} ${schedule.intervalValue} ${unitLabel}`;
  }

  getUnitLabel(unit: IntervalUnit): string {
    switch (unit) {
      case 'day': return this.t.dogs.careDays;
      case 'week': return this.t.dogs.careWeeks;
      case 'month': return this.t.dogs.careMonths;
    }
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Log event ─────────────────────────────────────────────────────────────

  onLogCare(type: CareType): void {
    this.selectedCareType.set(type);
    this.logError.set(null);
    const now = new Date();
    now.setSeconds(0, 0);
    this.logForm.reset({
      date: now.toISOString().slice(0, 16),
      notes: '',
    });
    this.showLogModal.set(true);
  }

  /** Also reachable from the calendar view's "Log now" button. */
  onLogCareForTypeId(careTypeId: string): void {
    const type = this.careTypes().find(t => t.id === careTypeId);
    if (type) this.onLogCare(type);
  }

  closeLogModal(): void {
    this.showLogModal.set(false);
    this.selectedCareType.set(null);
  }

  async onSubmitLog(): Promise<void> {
    if (this.logForm.invalid) { this.logForm.markAllAsTouched(); return; }

    const type = this.selectedCareType();
    if (!type) return;

    this.saving.set(true);
    this.logError.set(null);

    try {
      const { date, notes } = this.logForm.value;
      const result = await this.careService.logCareEvent(
        this.dogId,
        type.id,
        type.name,
        date!, // already ISO string from DatePickerComponent
        notes || undefined,
      );

      if (result) {
        this.careEvents.set([result, ...this.careEvents()]);
        this.showLogModal.set(false);
        this.selectedCareType.set(null);
      } else {
        this.logError.set('Nie udało się zapisać wpisu. Spróbuj ponownie.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  // ── Schedule ──────────────────────────────────────────────────────────────

  onSetSchedule(type: CareType, event: MouseEvent): void {
    event.stopPropagation();
    this.scheduleForType.set(type);
    const existing = this.scheduleByTypeId().get(type.id) ?? null;
    this.existingSchedule.set(existing);
    this.scheduleForm.reset({
      intervalValue: existing?.intervalValue ?? 1,
      intervalUnit: existing?.intervalUnit ?? 'week',
      isActive: existing?.isActive ?? true,
    });
    this.showScheduleModal.set(true);
  }

  closeScheduleModal(): void {
    this.showScheduleModal.set(false);
    this.scheduleForType.set(null);
    this.existingSchedule.set(null);
  }

  onRemoveSchedule(): void {
    const type = this.scheduleForType();
    if (!type) return;
    this.careService.removeSchedule(this.dogId, type.id);
    this.schedules.set(this.careService.getSchedules(this.dogId));
    this.closeScheduleModal();
  }

  onSubmitSchedule(): void {
    if (this.scheduleForm.invalid) { this.scheduleForm.markAllAsTouched(); return; }

    const type = this.scheduleForType();
    if (!type) return;

    const { intervalValue, intervalUnit, isActive } = this.scheduleForm.value;

    this.careService.saveSchedule(
      this.dogId,
      type,
      intervalValue!,
      intervalUnit!,
      isActive!,
    );

    this.schedules.set(this.careService.getSchedules(this.dogId));
    this.closeScheduleModal();
  }

  // ── Add custom type ───────────────────────────────────────────────────────

  onAddType(): void {
    this.addTypeForm.reset({ name: '', icon: 'pets' });
    this.showAddTypeModal.set(true);
  }

  closeAddTypeModal(): void {
    this.showAddTypeModal.set(false);
  }

  selectIcon(icon: string): void {
    this.addTypeForm.patchValue({ icon });
  }

  onSubmitAddType(): void {
    if (this.addTypeForm.invalid) { this.addTypeForm.markAllAsTouched(); return; }

    const { name, icon } = this.addTypeForm.value;
    const newType = this.careService.addCustomCareType(this.dogId, name!, icon!);
    this.careTypes.set([...this.careTypes(), newType]);
    this.showAddTypeModal.set(false);
  }

  // ── Delete custom type ────────────────────────────────────────────────────

  onRemoveType(type: CareType, event: MouseEvent): void {
    event.stopPropagation();
    this.typeToDelete.set(type);
    this.showDeleteTypeModal.set(true);
  }

  closeDeleteTypeModal(): void {
    this.showDeleteTypeModal.set(false);
    this.typeToDelete.set(null);
  }

  confirmDeleteType(): void {
    const type = this.typeToDelete();
    if (!type) return;
    this.careService.removeCustomCareType(this.dogId, type.id);
    this.careService.removeSchedule(this.dogId, type.id);
    this.careTypes.set(this.careTypes().filter(t => t.id !== type.id));
    this.schedules.set(this.careService.getSchedules(this.dogId));
    this.showDeleteTypeModal.set(false);
    this.typeToDelete.set(null);
  }

  absVal(n: number): number {
    return Math.abs(n);
  }

  getCareTypeIcon(careTypeId: string): string {
    return this.careTypes().find(t => t.id === careTypeId)?.icon ?? 'pets';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private dayStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
