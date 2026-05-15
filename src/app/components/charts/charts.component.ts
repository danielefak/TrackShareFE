import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxApexchartsModule } from 'ngx-apexcharts';
import { ApiService } from '../../services/api.service';
import { CategoryService } from '../../services/category.service';
import { TransactionFilters, ChartResponse } from '../../models/transaction-summary.model';
import {
  ApexNonAxisChartSeries, ApexAxisChartSeries, ApexChart, ApexXAxis,
  ApexYAxis, ApexLegend, ApexDataLabels, ApexTooltip,
} from 'ngx-apexcharts';

interface SubItem {
  name: string;
  subId: number;
  totalValue: number;
  checkedValue: number;
}

interface BreakdownGroup {
  category: string;
  catId: number;
  totalValue: number;
  checkedValue: number;
  subcategories: SubItem[];
  checkedSubCount: number;
  totalSubCount: number;
}

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, NgxApexchartsModule],
  template: `
    @if (loading()) {
      <div class="chart-loading"><mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner></div>
    } @else {
      <div class="chart-section pie-section">
        <h3 class="section-heading clickable" (click)="deselectAll()">Distribution</h3>
        <apx-chart
          [series]="pieSeries"
          [chart]="pieChartOptions"
          [labels]="pieLabels"
          [legend]="pieLegend"
          [colors]="pieColors"
          [dataLabels]="pieDataLabels"
          [tooltip]="pieTooltip"
        ></apx-chart>
      </div>

      <div class="breakdown-section">
        <div class="breakdown-header clickable" (click)="deselectAll()">
          Category Breakdown
          <span class="breakdown-actions">
          </span>
        </div>
        <table class="breakdown-table">
          <thead>
            <tr>
              <th class="chk-col"><button class="unfilter-btn" (click)="toggleActive()" title="{{ activeAllSelected() ? 'Deselect active' : 'Select active' }}"><mat-icon>{{ activeAllSelected() ? 'deselect' : 'select_all' }}</mat-icon></button></th>
              <th>Category</th>
              <th class="amt-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (g of activeGroups(); track g.catId) {
              <tr class="cat-row">
                <td class="chk-col">
                  <input type="checkbox" [checked]="isCatChecked(g.catId)" (change)="toggleCategory(g.catId)">
                </td>
                <td (click)="toggleExpanded(g.category)" class="cat-name-cell">
                  @if (g.subcategories.length) {
                    <mat-icon class="expand-icon">{{ expandedCat() === g.category ? 'expand_less' : 'expand_more' }}</mat-icon>
                  }
                  <span class="cat-name">{{ g.category }}</span> <span class="sub-count">({{ g.checkedSubCount }}/{{ g.totalSubCount }})</span>
                </td>
                <td class="amt-col">{{ g.checkedValue | number:'1.2-2' }} / <span class="total-sm">{{ g.totalValue | number:'1.2-2' }}</span> €</td>
              </tr>
              @if (expandedCat() === g.category) {
                @for (s of g.subcategories; track s.subId) {
                  <tr class="sub-row">
                    <td class="chk-col">
                      <input type="checkbox" [checked]="isSubChecked(s.subId)" (change)="toggleSubcategory(s.subId, $event)">
                    </td>
                    <td><span class="sub-indent">└─ {{ s.name }}</span></td>
                    <td class="amt-col">{{ s.totalValue | number:'1.2-2' }} €</td>
                  </tr>
                }
              }
            }
          </tbody>
          <tfoot>
            <tr><td></td><th>Total</th><th class="amt-col">{{ total() | number:'1.2-2' }} €</th></tr>
          </tfoot>
        </table>
      </div>

      @if (hasOther()) {
        <div class="breakdown-section">
          <div class="other-header-row" (click)="otherExpanded.set(!otherExpanded())">
            <div class="chk-col other-chk"><button class="unfilter-btn" (click)="$event.stopPropagation(); toggleOther()" title="{{ otherAllSelected() ? 'Deselect other' : 'Select other' }}"><mat-icon>{{ otherAllSelected() ? 'deselect' : 'select_all' }}</mat-icon></button></div>
            <div class="other-name-cell">
              <span class="other-label">Other ({{ otherCheckedCount() }}/{{ otherGroups().length }})</span>
              <mat-icon class="expand-icon">{{ otherExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </div>
            <div class="amt-col"></div>
          </div>
          @if (otherExpanded()) {
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th class="chk-col"></th>
                  <th>Category</th>
                  <th class="amt-col">Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (g of otherGroups(); track g.catId) {
                  <tr class="cat-row">
                    <td class="chk-col">
                      <input type="checkbox" [checked]="isCatChecked(g.catId)" (change)="toggleCategory(g.catId)">
                    </td>
                    <td (click)="toggleExpanded(g.category)" class="cat-name-cell">
                      @if (g.subcategories.length) {
                        <mat-icon class="expand-icon">{{ expandedCat() === g.category ? 'expand_less' : 'expand_more' }}</mat-icon>
                      }
                      <span class="cat-name">{{ g.category }}</span> <span class="sub-count">({{ g.checkedSubCount }}/{{ g.totalSubCount }})</span>
                    </td>
                    <td class="amt-col">{{ g.checkedValue | number:'1.2-2' }} / <span class="total-sm">{{ g.totalValue | number:'1.2-2' }}</span> €</td>
                  </tr>
                  @if (expandedCat() === g.category) {
                    @for (s of g.subcategories; track s.subId) {
                      <tr class="sub-row">
                        <td class="chk-col">
                          <input type="checkbox" [checked]="isSubChecked(s.subId)" (change)="toggleSubcategory(s.subId, $event)">
                        </td>
                        <td><span class="sub-indent">└─ {{ s.name }}</span></td>
                        <td class="amt-col">{{ s.totalValue | number:'1.2-2' }} €</td>
                      </tr>
                    }
                  }
                }
              </tbody>
            </table>
          }
        </div>
      }

      <div class="chart-section">
        <h3>{{ type === 'expense' ? 'Expenses' : 'Income' }} — 12 Month Trend</h3>
        <apx-chart
          [series]="barSeries"
          [chart]="barChartOptions"
          [xaxis]="barXaxis"
          [yaxis]="barYaxis"
          [colors]="barColors"
          [legend]="barLegend"
          [dataLabels]="barDataLabels"
          [tooltip]="barTooltip"
        ></apx-chart>
      </div>
    }
  `,
  styles: [`
    .chart-loading { display: flex; justify-content: center; padding: 32px 0; }
    .chart-section { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .chart-section h3 { margin: 0 0 8px; font-size: 0.95rem; font-weight: 600; color: var(--mat-sys-on-surface); }
    .clickable { cursor: pointer; user-select: none; }
    .clickable:hover { opacity: 0.8; }
    .pie-section { margin-bottom: 16px; }
    .breakdown-section { background: var(--mat-sys-surface-container-low); border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; margin-top: 16px; margin-bottom: 12px; overflow: hidden; }
    .breakdown-header { padding: 7px 12px; font-weight: 600; font-size: 0.85rem; color: var(--mat-sys-on-surface); user-select: none; background: var(--mat-sys-surface-container-high); border-bottom: 1px solid var(--mat-sys-outline-variant); display: flex; align-items: center; justify-content: space-between; }
    .breakdown-actions { display: flex; gap: 4px; }
    .unfilter-btn { background: none; border: none; cursor: pointer; color: var(--mat-sys-primary); display: flex; align-items: center; padding: 2px; border-radius: 4px; outline: none; }
    .unfilter-btn:hover { background: var(--mat-sys-primary-container); }
    .breakdown-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .breakdown-table thead th { text-align: left; padding: 5px 10px; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--mat-sys-on-surface-variant); background: var(--mat-sys-surface-container-high); border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .section-actions { display: inline-flex; gap: 2px; margin-left: 8px; vertical-align: middle; }
    .section-actions .unfilter-btn { padding: 0 2px; }
    .breakdown-table tbody td { padding: 4px 10px; border-bottom: 1px solid var(--mat-sys-outline-variant); color: var(--mat-sys-on-surface); vertical-align: middle; }
    .breakdown-table tfoot td, .breakdown-table tfoot th { padding: 6px 10px; font-weight: 700; font-size: 0.8125rem; color: var(--mat-sys-on-surface); border-top: 2px solid var(--mat-sys-outline-variant); background: var(--mat-sys-surface-container-high); }
    .chk-col { width: 28px; text-align: center; }
    .chk-col input[type="checkbox"] { accent-color: var(--mat-sys-primary); margin: 0; width: 15px; height: 15px; cursor: pointer; }
    .chk-col .unfilter-btn { background: none; border: none; cursor: pointer; color: var(--mat-sys-primary); display: inline-flex; align-items: center; padding: 2px; border-radius: 4px; outline: none; }
    .chk-col .unfilter-btn:hover { background: var(--mat-sys-primary-container); }
    .amt-col { text-align: right; font-weight: 600; white-space: nowrap; width: 110px; }
    .cat-row { transition: background 0.15s; }
    .cat-row:hover { background: var(--mat-sys-surface-container-highest); }
    .cat-name-cell { cursor: pointer; }
    .expand-icon { font-size: 16px; width: 16px; height: 16px; color: var(--mat-sys-on-surface-variant); vertical-align: middle; }
    .cat-name { font-weight: 600; }
    .sub-count { font-size: 0.7rem; color: var(--mat-sys-on-surface-variant); font-weight: 400; }
    .total-sm { font-size: 0.7rem; color: var(--mat-sys-on-surface-variant); }
    .sub-row td { padding-left: 36px; font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); }
    .sub-row:last-child td { border-bottom: none; }
    .sub-indent { display: inline-block; }
    .other-header-row { display: flex; align-items: center; cursor: pointer; user-select: none; padding: 5px 10px; background: var(--mat-sys-surface-container-high); font-weight: 600; font-size: 0.75rem; color: var(--mat-sys-on-surface); }
    .other-header-row:hover { background: var(--mat-sys-surface-container-highest); }
    .other-chk { width: 28px; text-align: center; flex-shrink: 0; }
    .other-chk .unfilter-btn { background: none; border: none; cursor: pointer; color: var(--mat-sys-primary); display: inline-flex; align-items: center; padding: 2px; border-radius: 4px; }
    .other-chk .unfilter-btn:hover { background: var(--mat-sys-primary-container); }
    .other-name-cell { flex: 1; display: flex; align-items: center; gap: 4px; }
    .other-label { flex: 1; }
    .other-header-row .expand-icon { font-size: 16px; width: 16px; height: 16px; color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }
    .other-header-row .amt-col { width: 110px; text-align: right; white-space: nowrap; flex-shrink: 0; }
    @media (max-width: 600px) {
      .other-header-row { padding: 4px 6px; }
      .other-header-row .amt-col { width: 80px; }
      .breakdown-table tbody td, .breakdown-table thead th, .breakdown-table tfoot th { padding: 4px 6px; }
      .sub-row td { padding-left: 28px; }
      .amt-col { width: 80px; }
    }
  `],
})
export class ChartsComponent implements OnInit, OnChanges {
  @Input() type: 'expense' | 'income' = 'expense';
  @Input() filters?: TransactionFilters;
  @Input() resetKey = 0;
  @Output() subcategoryIdsChange = new EventEmitter<number[]>();

  private api = inject(ApiService);
  private catService = inject(CategoryService);
  private snackbar = inject(MatSnackBar);

  loading = signal(true);
  unfilteredPeriodData = signal<ChartResponse | null>(null);
  chartData = signal<ChartResponse | null>(null);
  checkedCatIds = signal<Set<number>>(new Set());
  checkedSubIds = signal<Set<number>>(new Set());
  expandedCat = signal<string | null>(null);
  otherExpanded = signal(false);
  catNameToId = signal<Record<string, number>>({});
  catSubNameToId = signal<Record<number, Record<string, number>>>({});
  allCatData = signal<{ name: string; is_expense: number; subcategories: { name: string; id: number }[] }[]>([]);

  barSeries: ApexAxisChartSeries = [];
  barChartOptions: ApexChart = {
    type: 'bar', height: 280, toolbar: { show: false }, zoom: { enabled: false },
    events: {
      dataPointSelection: (_e: any, _ctx: any, cfg: any) => {
        const v = this.barSeries[cfg.seriesIndex]?.data[cfg.dataPointIndex];
        if (v != null) { this.snackbar.open(`${Number(v).toFixed(2)} €`, 'Close', { duration: 3000 }); }
      },
    },
  };
  barXaxis: ApexXAxis = { type: 'category', labels: { style: { fontSize: '11px' } } };
  barYaxis: ApexYAxis = { labels: { formatter: (v) => v.toFixed(0) + '€' } };
  barColors: string[] = [];
  barLegend: ApexLegend = { show: false };
  barDataLabels: ApexDataLabels = { enabled: false };
  barTooltip: ApexTooltip = { y: { formatter: (v) => v.toFixed(2) + ' €' } };

  pieSeries: ApexNonAxisChartSeries = [];
  pieChartOptions: ApexChart = {
    type: 'pie', height: 260, toolbar: { show: false },
    events: {
      dataPointSelection: (_e: any, _ctx: any, cfg: any) => {
        const l = this.pieLabels[cfg.dataPointIndex];
        const v = this.pieSeries[cfg.dataPointIndex];
        if (v != null) { this.snackbar.open(`${l}: ${Number(v).toFixed(2)} €`, 'Close', { duration: 3000 }); }
      },
    },
  };
  pieLabels: string[] = [];
  pieColors: string[] = [];
  pieLegend: ApexLegend = { show: false };
  pieDataLabels: ApexDataLabels = { enabled: true, style: { fontSize: '10px', fontWeight: '600' }, formatter: (_v: number, o: any) => Number(o.w.config.series[o.seriesIndex]).toFixed(0) + '€' };
  pieTooltip: ApexTooltip = { y: { formatter: (v) => v.toFixed(2) + ' €' } };

  private palette = ['#e57373', '#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#4dd0e1', '#aed581', '#f06292', '#7986cb', '#4db6ac', '#ff8a65', '#90a4ae', '#fff176', '#ce93d8'];

  groups = computed(() => {
    const catData = this.allCatData();
    const unf = this.unfilteredPeriodData();
    const flt = this.chartData();
    const catMap = this.catNameToId();
    const catSubMap = this.catSubNameToId();
    if (!catData.length || !unf || !flt) return [];
    const isExp = this.type === 'expense' ? 0 : 2;
    const unfBreakdown = this.type === 'expense' ? unf.category_breakdown : unf.income_breakdown;
    const unfSub = this.type === 'expense' ? unf.subcategory_breakdown : unf.income_subcategory_breakdown;
    const fltBreakdown = this.type === 'expense' ? flt.category_breakdown : flt.income_breakdown;
    const fltSub = this.type === 'expense' ? flt.subcategory_breakdown : flt.income_subcategory_breakdown;
    const valMap: Record<string, number> = {};
    for (const c of unfBreakdown) valMap[c.name] = c.value;
    const checkedValMap: Record<string, number> = {};
    for (const c of fltBreakdown) checkedValMap[c.name] = c.value;
    const subValMap: Record<string, number> = {};
    for (const s of unfSub) subValMap[s.category_name + '::' + s.name] = s.value;
    const checkedSubValMap: Record<string, number> = {};
    for (const s of fltSub) checkedSubValMap[s.category_name + '::' + s.name] = s.value;
    const checkedSubSet = this.checkedSubIds();
    const result = catData
      .filter(c => c.is_expense === isExp)
      .map(cat => ({
        category: cat.name,
        catId: catMap[cat.name],
        totalValue: valMap[cat.name] ?? 0,
        checkedValue: checkedValMap[cat.name] ?? 0,
        subcategories: cat.subcategories.map(s => ({
          name: s.name,
          subId: catSubMap[catMap[cat.name]]?.[s.name] ?? s.id,
          totalValue: subValMap[cat.name + '::' + s.name] ?? 0,
          checkedValue: checkedSubValMap[cat.name + '::' + s.name] ?? 0,
        })),
        totalSubCount: cat.subcategories.length,
        checkedSubCount: cat.subcategories.filter(s => checkedSubSet.has(catSubMap[catMap[cat.name]]?.[s.name] ?? s.id)).length,
      }));
    return result.sort((a, b) => b.totalValue - a.totalValue);
  });

  activeGroups = computed(() => this.groups().filter(g => g.totalValue > 0));
  otherGroups = computed(() => this.groups().filter(g => g.totalValue === 0));
  hasOther = computed(() => this.otherGroups().length > 0);

  activeAllSelected = computed(() => {
    const gs = this.activeGroups();
    const checked = this.checkedCatIds();
    return gs.length > 0 && gs.every(g => checked.has(g.catId));
  });
  otherAllSelected = computed(() => {
    const gs = this.otherGroups();
    const checked = this.checkedCatIds();
    return gs.length > 0 && gs.every(g => checked.has(g.catId));
  });
  otherCheckedCount = computed(() => this.otherGroups().filter(g => this.checkedCatIds().has(g.catId)).length);

  total = computed(() => {
    const flt = this.chartData();
    if (!flt) return 0;
    const breakdown = this.type === 'expense' ? flt.category_breakdown : flt.income_breakdown;
    return breakdown.reduce((a, c) => a + c.value, 0);
  });

  isCatChecked(id: number) { return this.checkedCatIds().has(id); }
  isSubChecked(id: number) { return this.checkedSubIds().has(id); }

  private totalSubCount = computed(() => this.groups().reduce((a, g) => a + g.subcategories.length, 0));

  private emitSubIds() {
    const ids = [...this.checkedSubIds()];
    const result = ids.length === 0 ? [-1] : ids.length === this.totalSubCount() ? [] : ids;
    this.subcategoryIdsChange.emit(result);
  }

  private async loadFilteredCharts() {
    const base = this.periodFilters();
    const subIds = [...this.checkedSubIds()];
    const total = this.totalSubCount();
    const ids = subIds.length === 0 ? [-1] : subIds.length === total ? [] : subIds;
    const [periodData, yearData] = await Promise.all([
      this.api.getChartData({ ...base, categoryIds: [], subcategoryIds: ids }),
      this.api.getChartData({ ...this.yearFilters(), categoryIds: [], subcategoryIds: ids }),
    ]);
    this.chartData.set(periodData);
    this.buildPieChart(periodData);
    this.buildBarChart(yearData);
  }

  toggleCategory(id: number) {
    this.checkedCatIds.update(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    this.checkedSubIds.update(s => {
      const n = new Set(s);
      const cat = this.groups().find(g => g.catId === id);

      if (cat) {
        const isNowChecked = this.checkedCatIds().has(id);
        for (const sub of cat.subcategories) {
          if (isNowChecked) n.add(sub.subId); else n.delete(sub.subId);
        }
      }
      return n;
    });
    this.loadFilteredCharts();
    this.emitSubIds();
  }

  toggleSubcategory(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.checkedSubIds.update(s => {
      const n = new Set(s);
      if (checked) n.add(id); else n.delete(id);
      return n;
    });
    const cat = this.groups().find(g => g.subcategories.some(s => s.subId === id));
    if (cat) {
      if (checked) {
        this.checkedCatIds.update(s => { const n = new Set(s); n.add(cat.catId); return n; });
      } else {
        const allUnchecked = cat.subcategories.every(s => !this.checkedSubIds().has(s.subId));
        if (allUnchecked) this.checkedCatIds.update(s => { const n = new Set(s); n.delete(cat.catId); return n; });
      }
    }
    this.loadFilteredCharts();
    this.emitSubIds();
  }

  toggleExpanded(name: string) {
    this.expandedCat.update(v => v === name ? null : name);
  }

  selectActive() { this.setGroups(this.activeGroups(), true); }
  deselectActive() { this.setGroups(this.activeGroups(), false); }
  selectOther() { this.setGroups(this.otherGroups(), true); }
  deselectOther() { this.setGroups(this.otherGroups(), false); }

  toggleActive() { if (this.activeAllSelected()) this.deselectActive(); else this.selectActive(); }
  toggleOther() { if (this.otherAllSelected()) this.deselectOther(); else this.selectOther(); }

  deselectAll() {
    this.checkedCatIds.set(new Set());
    this.checkedSubIds.set(new Set());
    this.loadFilteredCharts();
    this.emitSubIds();
  }

  private setGroups(groups: BreakdownGroup[], checked: boolean) {
    this.checkedCatIds.update(s => {
      const n = new Set(s);
      for (const g of groups) {
        if (checked) n.add(g.catId); else n.delete(g.catId);
      }
      return n;
    });
    this.checkedSubIds.update(s => {
      const n = new Set(s);
      for (const g of groups) {
        for (const sub of g.subcategories) {
          if (checked) n.add(sub.subId); else n.delete(sub.subId);
        }
      }
      return n;
    });
    this.loadFilteredCharts();
    this.emitSubIds();
  }



  ngOnInit() {
    this.catService.list('all').subscribe(data => {
      const catMap: Record<string, number> = {};
      const catSubMap: Record<number, Record<string, number>> = {};
      for (const c of data) {
        catMap[c.name] = c.id;
        const subMap: Record<string, number> = {};
        for (const s of c.subcategories) subMap[s.name] = s.id;
        catSubMap[c.id] = subMap;
      }
      this.catNameToId.set(catMap);
      this.catSubNameToId.set(catSubMap);
      this.allCatData.set(data);
      this.loadCharts();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resetKey']) {
      this.checkedCatIds.set(new Set());
      this.checkedSubIds.set(new Set());
      this.loadCharts();
    } else if (changes['type'] && !changes['type'].firstChange) {
      this.loadCharts();
    } else if (changes['filters'] && !changes['filters'].firstChange) {
      const prev = changes['filters'].previousValue;
      const curr = changes['filters'].currentValue;
      if (prev?.startDate !== curr?.startDate || prev?.endDate !== curr?.endDate) {
        this.loadCharts();
      }
    }
  }

  private async loadCharts() {
    this.loading.set(true);
    try {
      const periodBase = this.periodFilters();
      const yearBase = this.yearFilters();

      const [periodData, yearData] = await Promise.all([
        this.api.getChartData({ ...periodBase, categoryIds: [], subcategoryIds: [] }),
        this.api.getChartData({ ...yearBase, categoryIds: [], subcategoryIds: [] }),
      ]);
      this.unfilteredPeriodData.set(periodData);
      this.chartData.set(periodData);


      if (this.checkedCatIds().size === 0) {
        const gs = this.groups();
        this.checkedCatIds.set(new Set(gs.map(g => g.catId).filter(id => id != null)));
        this.checkedSubIds.set(new Set(gs.flatMap(g => g.subcategories.map(s => s.subId).filter(id => id != null))));
      }

      this.buildPieChart(periodData);
      this.buildBarChart(yearData);
    } catch (e) { console.error('loadCharts error', e); }
    this.loading.set(false);
  }

  private periodFilters(): TransactionFilters {
    return {
      startDate: this.filters?.startDate || '',
      endDate: this.filters?.endDate || '',
      categoryIds: [],
      subcategoryIds: [],
      search: this.filters?.search || '',
      isExpense: this.type === 'expense' ? 0 : 2,
    };
  }

  private yearFilters(): TransactionFilters {
    let end: Date;
    if (this.filters?.endDate) {
      end = new Date(this.filters.endDate);
    } else {
      end = new Date();
    }
    const eom = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    const start = new Date(eom.getFullYear() - 1, eom.getMonth() + 1, 1);
    return {
      startDate: this.fmt(start),
      endDate: this.fmt(eom),
      categoryIds: [],
      subcategoryIds: [],
      search: this.filters?.search || '',
      isExpense: this.type === 'expense' ? 0 : 2,
    };
  }

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private buildPieChart(data: ChartResponse) {
    const breakdown = this.type === 'expense' ? data.category_breakdown : data.income_breakdown;
    const catMap = this.catNameToId();
    const selected = this.checkedCatIds();
    const cats = breakdown
      .filter(c => c.value > 0 && selected.has(catMap[c.name]))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    this.pieLabels = cats.map(c => c.name);
    this.pieSeries = cats.map(c => Math.abs(c.value));
    this.pieColors = cats.map((_, i) => this.palette[i % this.palette.length]);
  }

  private buildBarChart(data: ChartResponse) {
    const months = data.months.map(m => m.month);
    const color = this.type === 'expense' ? '#f44336' : '#22bb33';
    const key = this.type === 'expense' ? 'expense' : 'income';
    this.barSeries = [
      { name: this.type === 'expense' ? 'Expenses' : 'Income', data: data.months.map(m => Math.abs(m[key as keyof typeof m] as number)) },
    ];
    this.barXaxis = { ...this.barXaxis, categories: months };
    this.barColors = [color];
  }
}
