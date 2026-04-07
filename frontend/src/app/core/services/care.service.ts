import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LoggerService } from './logger.service';
import { CareType, CareEventLog, CareSchedule, IntervalUnit, ScheduleStatus } from '../models/care-type.model';
import { PREDEFINED_CARE_TYPES } from '../data/care-types.data';

@Injectable({ providedIn: 'root' })
export class CareService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // ── Care events (Supabase) ───────────────────────────────────────────────

  async getCareEvents(dogId: string): Promise<CareEventLog[]> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('care_events')
        .select('*')
        .eq('dog_id', dogId)
        .eq('event_type', 'note')
        .contains('payload', { is_care_tracking: true })
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CareEventLog[];
    } catch (err: any) {
      this.logger.error('CareService: Error fetching care events', err);
      return [];
    }
  }

  async logCareEvent(
    dogId: string,
    careTypeId: string,
    careTypeName: string,
    occurredAt: string,
    notes?: string,
  ): Promise<CareEventLog | null> {
    try {
      const { data: { session } } = await this.supabaseService.supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      const payload: Record<string, unknown> = {
        is_care_tracking: true,
        care_type_id: careTypeId,
        care_type_name: careTypeName,
      };
      if (notes?.trim()) payload['notes'] = notes.trim();

      const { data, error } = await this.supabaseService.supabase
        .from('care_events')
        .insert({
          dog_id: dogId,
          logged_by: session.user.id,
          event_type: 'note',
          occurred_at: occurredAt,
          payload,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CareEventLog;
    } catch (err: any) {
      this.logger.error('CareService: Error logging care event', err);
      return null;
    }
  }

  async deleteCareEvent(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.supabase
        .from('care_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      this.logger.error('CareService: Error deleting care event', err);
      return false;
    }
  }

  // ── Custom care types (localStorage) ────────────────────────────────────

  getCustomCareTypes(dogId: string): CareType[] {
    try {
      const stored = localStorage.getItem(`care_types_${dogId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addCustomCareType(dogId: string, name: string, icon: string): CareType {
    const newType: CareType = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      icon,
      isPredefined: false,
    };
    const existing = this.getCustomCareTypes(dogId);
    localStorage.setItem(`care_types_${dogId}`, JSON.stringify([...existing, newType]));
    return newType;
  }

  removeCustomCareType(dogId: string, typeId: string): void {
    const existing = this.getCustomCareTypes(dogId);
    localStorage.setItem(
      `care_types_${dogId}`,
      JSON.stringify(existing.filter(t => t.id !== typeId)),
    );
  }

  getAllCareTypes(dogId: string): CareType[] {
    return [...PREDEFINED_CARE_TYPES, ...this.getCustomCareTypes(dogId)];
  }

  // ── Schedules (localStorage) ─────────────────────────────────────────────

  getSchedules(dogId: string): CareSchedule[] {
    try {
      const stored = localStorage.getItem(`care_schedules_${dogId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getScheduleForType(dogId: string, careTypeId: string): CareSchedule | null {
    return this.getSchedules(dogId).find(s => s.careTypeId === careTypeId) ?? null;
  }

  saveSchedule(
    dogId: string,
    type: CareType,
    intervalValue: number,
    intervalUnit: IntervalUnit,
    isActive: boolean,
  ): CareSchedule {
    const existing = this.getSchedules(dogId);
    const idx = existing.findIndex(s => s.careTypeId === type.id);

    const schedule: CareSchedule = {
      id: idx >= 0 ? existing[idx].id : `sched_${Date.now()}`,
      careTypeId: type.id,
      careTypeName: type.name,
      careTypeIcon: type.icon,
      intervalValue,
      intervalUnit,
      isActive,
      createdAt: idx >= 0 ? existing[idx].createdAt : new Date().toISOString(),
    };

    if (idx >= 0) {
      existing[idx] = schedule;
    } else {
      existing.push(schedule);
    }

    localStorage.setItem(`care_schedules_${dogId}`, JSON.stringify(existing));
    return schedule;
  }

  removeSchedule(dogId: string, careTypeId: string): void {
    const existing = this.getSchedules(dogId);
    localStorage.setItem(
      `care_schedules_${dogId}`,
      JSON.stringify(existing.filter(s => s.careTypeId !== careTypeId)),
    );
  }

  // ── Schedule computation ─────────────────────────────────────────────────

  /** Returns all scheduled due-dates for a schedule that fall within a given month. */
  getDueDatesInMonth(
    schedule: CareSchedule,
    lastEventDate: Date | null,
    year: number,
    month: number,
  ): Date[] {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    const dueDates: Date[] = [];

    let next = this.computeNextDue(lastEventDate, schedule);

    // Fast-forward past occurrences that are before the month
    let guard = 0;
    while (next < monthStart && guard++ < 500) {
      next = this.computeNextDue(next, schedule);
    }

    // Collect occurrences within the month
    guard = 0;
    while (next <= monthEnd && guard++ < 60) {
      dueDates.push(new Date(next));
      next = this.computeNextDue(next, schedule);
    }

    return dueDates;
  }

  computeNextDue(lastEventDate: Date | null, schedule: CareSchedule): Date {
    const base = lastEventDate ?? new Date(schedule.createdAt);
    const next = new Date(base);

    switch (schedule.intervalUnit) {
      case 'day':
        next.setDate(next.getDate() + schedule.intervalValue);
        break;
      case 'week':
        next.setDate(next.getDate() + schedule.intervalValue * 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + schedule.intervalValue);
        break;
    }

    return next;
  }

  buildScheduleStatuses(
    dogId: string,
    lastEventByTypeId: Map<string, CareEventLog>,
  ): ScheduleStatus[] {
    const schedules = this.getSchedules(dogId).filter(s => s.isActive);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedules.map(schedule => {
      const lastEvent = lastEventByTypeId.get(schedule.careTypeId) ?? null;
      const lastDate = lastEvent ? new Date(lastEvent.occurred_at) : null;
      const nextDue = this.computeNextDue(lastDate, schedule);
      nextDue.setHours(0, 0, 0, 0);

      const daysOffset = Math.floor((nextDue.getTime() - today.getTime()) / 86_400_000);
      return { schedule, nextDue, daysOffset };
    }).sort((a, b) => a.daysOffset - b.daysOffset);
  }
}
