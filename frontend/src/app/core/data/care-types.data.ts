import {CareType} from '../models/care-type.model';

export const PREDEFINED_CARE_TYPES: CareType[] = [
  {id: 'feeding', name: 'Karmienie', icon: 'restaurant', isPredefined: true},
  {id: 'brushing', name: 'Czesanie', icon: 'self_care', isPredefined: true},
  {id: 'bathing', name: 'Kąpiel', icon: 'water_drop', isPredefined: true},
  {id: 'teeth', name: 'Mycie zębów', icon: 'dentistry', isPredefined: true},
  {id: 'haircut', name: 'Strzyżenie', icon: 'spa', isPredefined: true},
  {id: 'nails', name: 'Pazurki', icon: 'content_cut', isPredefined: true},
  {id: 'ears', name: 'Czyszczenie uszu', icon: 'hearing', isPredefined: true},
  {id: 'anti_tick', name: 'Tabletka na kleszcze', icon: 'medication', isPredefined: true},
  {id: 'deworming', name: 'Odrobaczanie', icon: 'medical_services', isPredefined: true},
];

export const AVAILABLE_ICONS = [
  'brush', 'water_drop', 'content_cut', 'medication', 'spa',
  'pets', 'favorite', 'schedule', 'bathtub', 'cleaning_services',
  'timer', 'event', 'local_hospital', 'star', 'health_and_safety',
  'healing', 'fitness_center', 'directions_walk', 'park', 'medical_services',
] as const;
