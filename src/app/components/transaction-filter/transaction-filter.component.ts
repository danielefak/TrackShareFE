import { Component, OnInit, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TransactionFilters } from '../../models/transaction-summary.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FilterStateService, PeriodType } from '../../services/filter-state.service';

@Component({
  selector: 'app-transaction-filter',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDatepickerModule, MatInputModule,
    MatFormFieldModule, MatIconModule, MatButtonModule,
  ],
  template: `
    <div class="filter-surface">
      <div class="period-line">
        @if (fs.pt() === 'custom') {
          <div class="custom-range-line">
            <mat-form-field subscriptSizing="dynamic" class="date-field compact-field">
              <mat-label>From</mat-label>
              <input matInput [matDatepicker]="sp" [formControl]="csCtrl" placeholder="Start date">
              <mat-datepicker-toggle matIconSuffix [for]="sp"></mat-datepicker-toggle>
              <mat-datepicker #sp></mat-datepicker>
            </mat-form-field>
            <span class="range-sep">→</span>
            <mat-form-field subscriptSizing="dynamic" class="date-field compact-field">
              <mat-label>To</mat-label>
              <input matInput [matDatepicker]="ep" [formControl]="ceCtrl" placeholder="End date">
              <mat-datepicker-toggle matIconSuffix [for]="ep"></mat-datepicker-toggle>
              <mat-datepicker #ep></mat-datepicker>
            </mat-form-field>
          </div>
        } @else {
          <button mat-icon-button (click)="navMonth(-12)" matTooltip="Previous year"><mat-icon>keyboard_double_arrow_left</mat-icon></button>
          <button mat-icon-button (click)="navMonth(-1)" matTooltip="Previous month"><mat-icon>chevron_left</mat-icon></button>
          <span class="period-label">{{ periodLabel() }}</span>
          <button mat-icon-button (click)="navMonth(1)" matTooltip="Next month"><mat-icon>chevron_right</mat-icon></button>
          <button mat-icon-button (click)="navMonth(12)" matTooltip="Next year"><mat-icon>keyboard_double_arrow_right</mat-icon></button>
        }
      </div>

      <div class="action-line">
        <button mat-stroked-button [class.active]="fs.pt() === 'month'" (click)="setPeriod('month')">This Month</button>
        <button mat-icon-button (click)="toggleFilters()" matTooltip="More filters" class="toggle-btn filter-btn-wrap" [class.active-filters]="hasActiveFilters()">
          <mat-icon>filter_list</mat-icon>
          @if (hasActiveFilters()) {
            <span class="filter-dot"></span>
          }
        </button>
        <button mat-icon-button (click)="resetAll(); resetAllEvent.emit()" matTooltip="Reset all" class="toggle-btn">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      @if (fs.filterOpen()) {
      <div class="advanced-content">
        <div class="preset-line">

          <button mat-stroked-button [class.active]="fs.pt() === 'semester'" (click)="setPeriod('semester')">Semester</button>
          <button mat-stroked-button [class.active]="fs.pt() === 'year'" (click)="setPeriod('year')">This Year</button>
          <button mat-stroked-button [class.active]="fs.pt() === 'century'" (click)="setPeriod('century')">This Century</button>
          <button mat-stroked-button [class.active]="fs.pt() === 'custom'" (click)="setPeriod('custom')">Custom</button>
        </div>

        <div class="search-line">
          <mat-form-field subscriptSizing="dynamic" class="search-fld compact-field">
            <mat-label>Search</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="Contains...">
            @if (searchCtrl.value) {
              <button matSuffix mat-icon-button (click)="clearSearch()" matTooltip="Clear"><mat-icon>close</mat-icon></button>
            }
          </mat-form-field>
        </div>
      </div>
      }
    </div>
  `,
  styles: [`
    .filter-surface { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; }
    .period-line { display: flex; align-items: center; justify-content: center; gap: 2px; }
    .period-label { font-weight: 600; font-size: 1rem; min-width: 160px; text-align: center; color: var(--mat-sys-on-surface); }
    .custom-range-line { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .date-field { flex: 0 1 200px; }
    .range-sep { color: var(--mat-sys-on-surface-variant); font-size: 1.1rem; font-weight: 600; }
    .advanced-content { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
    .preset-line { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
    .preset-line button.active { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .search-line { display: flex; align-items: center; justify-content: center; }
    .search-fld { min-width: 250px; }
    .action-line { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; }
    .action-line button.active { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .filter-btn-wrap { position: relative; }
    .filter-btn-wrap.active-filters mat-icon { color: var(--mat-sys-primary); }
    .filter-dot { position: absolute; top: 2px; right: 2px; width: 8px; height: 8px; border-radius: 50%; background: var(--mat-sys-primary); border: 2px solid var(--mat-sys-surface-container-low); }
    .toggle-btn { transition: background 0.12s; }
    .toggle-btn:hover { background: var(--mat-sys-primary-container); }
    .compact-field ::ng-deep .mat-mdc-text-field-wrapper { height: 40px; }
    .compact-field ::ng-deep .mat-mdc-form-field-infix { padding-top: 6px !important; padding-bottom: 6px !important; min-height: unset; }
    .compact-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .compact-field ::ng-deep .mdc-notched-outline__notch { border-right: none; }
    @media (max-width: 600px) {
      .filter-surface { padding: 10px; }
      .period-label { min-width: 120px; font-size: 0.9rem; }
      .preset-line button { font-size: 0.78rem; padding: 0 10px; }
      .custom-range-line { flex-wrap: wrap; }
      .date-field { flex: 1 1 140px; }
      .search-fld { min-width: 100%; }
    }
  `],
})
export class TransactionFilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<TransactionFilters>();
  @Output() resetAllEvent = new EventEmitter<void>();

  fs = inject(FilterStateService);

  searchCtrl = new FormControl('', { nonNullable: true });
  csCtrl = new FormControl<Date | null>(null);
  ceCtrl = new FormControl<Date | null>(null);

  hasActiveFilters = computed(() =>
    this.fs.pt() !== 'month' ||
    !!this.fs.searchVal() ||
    this.fs.selectedAccountIds().size > 0
  );

  periodLabel = computed(() => {
    const r = this.fs.refDate();
    const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    switch (this.fs.pt()) {
      case 'month': {
        const s = new Date(r.getFullYear(), r.getMonth(), 1);
        const e = new Date(r.getFullYear(), r.getMonth() + 1, 0);
        if (s.getFullYear() === e.getFullYear())
          return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${e.toLocaleDateString('en-US', fmt)}`;
        return `${s.toLocaleDateString('en-US', fmt)} — ${e.toLocaleDateString('en-US', fmt)}`;
      }
      case 'trimester': {
        const q = Math.floor(r.getMonth() / 3) * 3;
        const s = new Date(r.getFullYear(), q, 1);
        const e = new Date(r.getFullYear(), q + 3, 0);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${e.toLocaleDateString('en-US', fmt)}`;
      }
      case 'semester': {
        const h = Math.floor(r.getMonth() / 6) * 6;
        const s = new Date(r.getFullYear(), h, 1);
        const e = new Date(r.getFullYear(), h + 6, 0);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${e.toLocaleDateString('en-US', fmt)}`;
      }
      case 'year': {
        const s = new Date(r.getFullYear(), 0, 1);
        const e = new Date(r.getFullYear(), 11, 31);
        return `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${e.toLocaleDateString('en-US', fmt)}`;
      }
      case 'century': {
        const s = new Date(r); s.setFullYear(s.getFullYear() - 100);
        const e = r;
        return `${s.toLocaleDateString('en-US', fmt)} — ${e.toLocaleDateString('en-US', fmt)}`;
      }
      default: return '';
    }
  });

  ngOnInit() {
    this.searchCtrl.setValue(this.fs.searchVal(), { emitEvent: false });
    this.csCtrl.setValue(this.fs.csVal(), { emitEvent: false });
    this.ceCtrl.setValue(this.fs.ceVal(), { emitEvent: false });

    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(v => { this.fs.searchVal.set(v); this.emit(); });
    this.csCtrl.valueChanges.subscribe(v => { this.fs.csVal.set(v); this.emit(); });
    this.ceCtrl.valueChanges.subscribe(v => { this.fs.ceVal.set(v); this.emit(); });

    this.emit();
  }

  navMonth(n: number) {
    const d = new Date(this.fs.refDate());
    d.setMonth(d.getMonth() + n);
    this.fs.refDate.set(d);
    this.emit();
  }

  setPeriod(t: PeriodType) {
    this.fs.pt.set(t);
    this.fs.refDate.set(new Date());
    if (t === 'custom') {
      this.csCtrl.setValue(null, { emitEvent: false });
      this.ceCtrl.setValue(null, { emitEvent: false });
    }
    this.emit();
  }

  toggleFilters() {
    this.fs.filterOpen.update(v => !v);
  }

  clearSearch() {
    this.searchCtrl.setValue('');
  }

  resetAll() {
    this.fs.pt.set('month');
    this.fs.refDate.set(new Date());
    this.searchCtrl.setValue('', { emitEvent: false });
    this.csCtrl.setValue(null, { emitEvent: false });
    this.ceCtrl.setValue(null, { emitEvent: false });
    this.fs.searchVal.set('');
    this.fs.csVal.set(null);
    this.fs.ceVal.set(null);
    this.fs.selectedAccountIds.set(new Set());
    this.emit();
  }

  private emit() {
    const r = this.fs.refDate();
    let s = '', e = '';
    switch (this.fs.pt()) {
      case 'month':
        s = this.d(new Date(r.getFullYear(), r.getMonth(), 1));
        e = this.d(new Date(r.getFullYear(), r.getMonth() + 1, 0));
        break;
      case 'trimester': {
        const q = Math.floor(r.getMonth() / 3) * 3;
        s = this.d(new Date(r.getFullYear(), q, 1));
        e = this.d(new Date(r.getFullYear(), q + 3, 0));
        break;
      }
      case 'semester': {
        const h = Math.floor(r.getMonth() / 6) * 6;
        s = this.d(new Date(r.getFullYear(), h, 1));
        e = this.d(new Date(r.getFullYear(), h + 6, 0));
        break;
      }
      case 'year':
        s = this.d(new Date(r.getFullYear(), 0, 1));
        e = this.d(new Date(r.getFullYear(), 11, 31));
        break;
      case 'century': {
        const ss = new Date(r); ss.setFullYear(ss.getFullYear() - 100);
        s = this.d(ss); e = this.d(r);
        break;
      }
      case 'custom':
        s = this.csCtrl.value ? this.d(this.csCtrl.value) : '';
        e = this.ceCtrl.value ? this.d(this.ceCtrl.value) : '';
        break;
    }
    this.filterChange.emit({
      startDate: s, endDate: e,
      categoryIds: [], subcategoryIds: [],
      search: this.searchCtrl.value || '',
    });
  }

  private d(v: Date): string { return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`; }
}
