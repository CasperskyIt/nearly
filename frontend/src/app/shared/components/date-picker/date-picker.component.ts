import {
  Component, Input, signal, computed, HostListener,
  forwardRef, ChangeDetectionStrategy, ElementRef, inject, NgZone,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Cell {
  date: Date;
  key: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePickerComponent),
    multi: true,
  }],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() includeTime = false;
  @Input() placeholder = 'Wybierz datę';

  private el = inject(ElementRef);
  private zone = inject(NgZone);

  isOpen = signal(false);
  disabled = signal(false);
  dropdownPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Selected date parts
  private _selected = signal<Date | null>(null);
  hour = signal(12);
  minute = signal(0);

  // Calendar view
  viewDate = signal(new Date());

  // ControlValueAccessor callbacks
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly weekLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 1).toLocaleDateString(undefined, { weekday: 'short' })
  );

  currentYear  = computed(() => this.viewDate().getFullYear());
  currentMonth = computed(() => this.viewDate().getMonth());

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  );

  cells = computed<Cell[]>(() => {
    const y = this.currentYear(), m = this.currentMonth();
    const todayKey = this.toKey(new Date());
    const firstDow = new Date(y, m, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevLast = new Date(y, m, 0).getDate();
    const arr: Cell[] = [];

    for (let i = offset - 1; i >= 0; i--)
      arr.push(this.mkCell(new Date(y, m - 1, prevLast - i), false, todayKey));
    for (let d = 1; d <= daysInMonth; d++)
      arr.push(this.mkCell(new Date(y, m, d), true, todayKey));
    let n = 1;
    while (arr.length < 42)
      arr.push(this.mkCell(new Date(y, m + 1, n++), false, todayKey));
    return arr;
  });

  displayValue = computed(() => {
    const d = this._selected();
    if (!d) return '';
    if (this.includeTime) {
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
        + ', ' + this.pad(this.hour()) + ':' + this.pad(this.minute());
    }
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  });

  selectedKey = computed(() => {
    const d = this._selected();
    return d ? this.toKey(d) : null;
  });

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(v: string): void {
    if (!v) { this._selected.set(null); return; }
    const d = new Date(v);
    if (isNaN(d.getTime())) { this._selected.set(null); return; }
    this._selected.set(d);
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth(), 1));
    this.hour.set(d.getHours());
    this.minute.set(d.getMinutes());
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  // ── Interaction ───────────────────────────────────────────────────────────

  toggle(): void {
    if (this.disabled()) return;
    if (!this.isOpen()) {
      this.updateDropdownPos();
    }
    this.isOpen.update(v => !v);
    this.onTouched();
  }

  close(): void { this.isOpen.set(false); }

  private updateDropdownPos(): void {
    const trigger = this.el.nativeElement.querySelector('.dp-trigger') as HTMLElement;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const dropW = 300;
    const dropH = this.includeTime ? 430 : 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top  = spaceBelow >= dropH ? rect.bottom + 4 : rect.top - dropH - 4;
    // Clamp left so dropdown doesn't overflow right edge of viewport
    const left = Math.min(rect.left, window.innerWidth - dropW - 8);
    this.dropdownPos.set({ top, left });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.el.nativeElement.contains(e.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize')
  onScrollResize(): void {
    if (this.isOpen()) this.updateDropdownPos();
  }

  prevMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectDay(cell: Cell): void {
    if (!cell.isCurrentMonth) return;
    const prev = this._selected();
    const next = new Date(cell.date);
    if (prev) { next.setHours(this.hour(), this.minute(), 0, 0); }
    else { next.setHours(this.hour(), this.minute(), 0, 0); }
    this._selected.set(next);
    if (!this.includeTime) { this.emit(); this.close(); }
  }

  adjustHour(delta: number): void {
    this.hour.set(Math.max(0, Math.min(23, this.hour() + delta)));
    this.updateTimeOnSelected();
  }

  adjustMinute(delta: number): void {
    const raw = this.minute() + delta;
    this.minute.set(raw < 0 ? 55 : raw > 59 ? 0 : raw);
    this.updateTimeOnSelected();
  }

  setHourDirect(e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(v)) { this.hour.set(Math.max(0, Math.min(23, v))); this.updateTimeOnSelected(); }
  }

  setMinuteDirect(e: Event): void {
    const v = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(v)) { this.minute.set(Math.max(0, Math.min(59, v))); this.updateTimeOnSelected(); }
  }

  confirm(): void { this.emit(); this.close(); }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private updateTimeOnSelected(): void {
    const d = this._selected();
    if (!d) return;
    const next = new Date(d);
    next.setHours(this.hour(), this.minute(), 0, 0);
    this._selected.set(next);
  }

  private emit(): void {
    const d = this._selected();
    if (!d) return;
    if (this.includeTime) {
      this.onChange(d.toISOString());
    } else {
      this.onChange(this.toKey(d));
    }
  }

  private mkCell(date: Date, isCurrentMonth: boolean, todayKey: string): Cell {
    const key = this.toKey(date);
    return { date, key, day: date.getDate(), isCurrentMonth, isToday: key === todayKey };
  }

  private toKey(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  private pad(n: number): string { return String(n).padStart(2, '0'); }
}
