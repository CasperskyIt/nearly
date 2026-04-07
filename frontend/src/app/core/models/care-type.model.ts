export interface CareType {
  id: string;
  name: string;
  icon: string;
  isPredefined: boolean;
}

export interface CareEventLog {
  id: string;
  dog_id: string;
  logged_by: string;
  event_type: string;
  occurred_at: string;
  payload: {
    is_care_tracking: boolean;
    care_type_id: string;
    care_type_name: string;
    notes?: string;
  };
  created_at: string;
}

export type IntervalUnit = 'day' | 'week' | 'month';

export interface CareSchedule {
  id: string;
  careTypeId: string;
  careTypeName: string;
  careTypeIcon: string;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  isActive: boolean;
  createdAt: string;
}

export interface ScheduleStatus {
  schedule: CareSchedule;
  nextDue: Date;
  /** Positive = days remaining, 0 = today, negative = days overdue */
  daysOffset: number;
}