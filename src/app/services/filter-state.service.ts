import { Injectable, signal } from '@angular/core';

export type PeriodType = 'month' | 'trimester' | 'semester' | 'year' | 'century' | 'custom';

@Injectable({ providedIn: 'root' })
export class FilterStateService {
  pt = signal<PeriodType>('month');
  refDate = signal(new Date());
  searchVal = signal('');
  csVal = signal<Date | null>(null);
  ceVal = signal<Date | null>(null);
  filterOpen = signal(false);
  selectedAccountIds = signal<Set<number>>(new Set());
}
