import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CareService } from '../../../core/services/care.service';
import { I18nService } from '../../../config/i18n.service';
import { CareEventLog, CareType, CareSchedule } from '../../../core/models/care-type.model';

interface CalendarCell {
  date: Date;
  dateKey: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  loggedCount: number;
  scheduledCount: number;
}

interface ScheduledItem {
  careTypeId: string;
  careTypeName: string;
  icon: string;
}

@Component({
  selector: 'app-dog-month-calendar',
  templateUrl: './dog-month-calendar.component.html',
  styleUrl: './dog-month-calendar.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class DogMonthCalendarComponent implements OnInit {
  @Input({ required: true }) dogId!: string;

  private careService = inject(CareService);
  private i18nService = inject(I18nService);
  get t() { return this.i18nService.t; }

  careEvents = signal<CareEventLog[]>([]);
  careTypes = signal<CareType[]>([]);
  schedules = signal<CareSchedule[]>([]);
  loading = signal(true);
  /** careTypeId currently being marked as done — drives per-button spinner */
  markingDoneId = signal<string | null>(null);
  /** eventId currently being undone */
  undoingEventId = signal<string | null>(null);

  viewDate = signal(new Date());
  selectedDateKey = signal<string | null>((() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })());

  readonly weekDayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 1).toLocaleDateString(undefined, { weekday: 'short' })
  );

  // ── Derived ───────────────────────────────────────────────────────────────

  currentYear = computed(() => this.viewDate().getFullYear());
  currentMonth = computed(() => this.viewDate().getMonth());

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  );

  lastEventByTypeId = computed<Map<string, CareEventLog>>(() => {
    const map = new Map<string, CareEventLog>();
    for (const e of this.careEvents()) {
      const existing = map.get(e.payload.care_type_id);
      if (!existing || new Date(e.occurred_at) > new Date(existing.occurred_at)) {
        map.set(e.payload.care_type_id, e);
      }
    }
    return map;
  });

  loggedByDate = computed<Map<string, CareEventLog[]>>(() => {
    const map = new Map<string, CareEventLog[]>();
    for (const e of this.careEvents()) {
      const key = e.occurred_at.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  });

  scheduledByDate = computed<Map<string, ScheduledItem[]>>(() => {
    const map = new Map<string, ScheduledItem[]>();
    const year = this.currentYear();
    const month = this.currentMonth();

    for (const schedule of this.schedules()) {
      if (!schedule.isActive) continue;
      const lastEvent = this.lastEventByTypeId().get(schedule.careTypeId) ?? null;
      const lastDate = lastEvent ? new Date(lastEvent.occurred_at) : null;

      for (const dueDate of this.careService.getDueDatesInMonth(schedule, lastDate, year, month)) {
        const key = this.toKey(dueDate);
        const arr = map.get(key) ?? [];
        arr.push({
          careTypeId: schedule.careTypeId,
          careTypeName: schedule.careTypeName,
          icon: schedule.careTypeIcon,
        });
        map.set(key, arr);
      }
    }
    return map;
  });

  calendarCells = computed<CalendarCell[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const todayKey = this.toKey(new Date());

    const firstDow = new Date(year, month, 1).getDay();
    const startOffset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push(this.makeCell(new Date(year, month - 1, prevMonthDays - i), false, todayKey));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(this.makeCell(new Date(year, month, d), true, todayKey));
    }
    let next = 1;
    while (cells.length < 42) {
      cells.push(this.makeCell(new Date(year, month + 1, next++), false, todayKey));
    }

    return cells;
  });

  selectedDayData = computed<{ logged: CareEventLog[]; scheduled: ScheduledItem[]; date: Date } | null>(() => {
    const key = this.selectedDateKey();
    if (!key) return null;
    const [y, m, d] = key.split('-').map(Number);
    return {
      date: new Date(y, m - 1, d),
      logged: [...(this.loggedByDate().get(key) ?? [])].sort(
        (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
      ),
      scheduled: this.scheduledByDate().get(key) ?? [],
    };
  });

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

  // ── Navigation ────────────────────────────────────────────────────────────

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.selectedDateKey.set(null);
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.selectedDateKey.set(null);
  }

  goToToday(): void {
    this.viewDate.set(new Date());
    this.selectedDateKey.set(null);
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  selectDay(cell: CalendarCell): void {
    if (!cell.isCurrentMonth) return;
    this.selectedDateKey.set(
      this.selectedDateKey() === cell.dateKey ? null : cell.dateKey
    );
  }

  async markAsDone(item: ScheduledItem, date: Date): Promise<void> {
    if (this.markingDoneId()) return;
    this.markingDoneId.set(item.careTypeId);
    try {
      // Log at noon on the selected day
      const occurredAt = new Date(
        date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0
      ).toISOString();

      const result = await this.careService.logCareEvent(
        this.dogId,
        item.careTypeId,
        item.careTypeName,
        occurredAt,
      );

      if (result) {
        this.careEvents.set([result, ...this.careEvents()]);
      }
    } finally {
      this.markingDoneId.set(null);
    }
  }

  async undoEvent(event: CareEventLog): Promise<void> {
    if (this.undoingEventId()) return;
    this.undoingEventId.set(event.id);
    try {
      const ok = await this.careService.deleteCareEvent(event.id);
      if (ok) {
        this.careEvents.set(this.careEvents().filter(e => e.id !== event.id));
      }
    } finally {
      this.undoingEventId.set(null);
    }
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  getCareTypeIcon(careTypeId: string): string {
    return this.careTypes().find(t => t.id === careTypeId)?.icon ?? 'pets';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  formatDayLabel(): string {
    const data = this.selectedDayData();
    if (!data) return '';
    return data.date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  isCurrentMonthView(): boolean {
    const now = new Date();
    return this.currentYear() === now.getFullYear() && this.currentMonth() === now.getMonth();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private makeCell(date: Date, isCurrentMonth: boolean, todayKey: string): CalendarCell {
    const dateKey = this.toKey(date);
    return {
      date,
      dateKey,
      dayNum: date.getDate(),
      isCurrentMonth,
      isToday: dateKey === todayKey,
      loggedCount: this.loggedByDate().get(dateKey)?.length ?? 0,
      scheduledCount: this.scheduledByDate().get(dateKey)?.length ?? 0,
    };
  }

  private toKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
