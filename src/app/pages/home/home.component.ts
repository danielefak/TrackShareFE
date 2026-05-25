import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AccountService } from '../../services/account.service';
import { FilterStateService } from '../../services/filter-state.service';
import { RefreshService } from '../../services/refresh.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SummaryResponse, MonthlySummary, DailySummary, TransactionFilters, MultiTransactionDetail } from '../../models/transaction-summary.model';
import { Account } from '../../models/account.model';
import { CommonModule, KeyValue } from '@angular/common';
import { TransactionsComponent } from '../../components/transactions/transactions.component';
import { TransactionFilterComponent } from '../../components/transaction-filter/transaction-filter.component';
import { ChartsComponent } from '../../components/charts/charts.component';
import { TransactionService } from '../../services/transaction.service';
import { AddTransactionDialogComponent, AddTransactionData } from '../../components/add-transaction-dialog/add-transaction-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatPaginatorModule, MatDialogModule, TransactionsComponent, TransactionFilterComponent, ChartsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private accountService = inject(AccountService);
  private fs = inject(FilterStateService);
  private refresh = inject(RefreshService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private transactionService = inject(TransactionService);
  private route = inject(ActivatedRoute);

  activeTab = signal<'expense' | 'income' | 'transactions'>('transactions');

  accounts = signal<Account[]>([]);
  resetKey = signal(0);

  get selectedAccountIds() { return this.fs.selectedAccountIds; }
  get filterOpen() { return this.fs.filterOpen; }

  private _currentMonth(): { startDate: string; endDate: string } {
    const now = new Date();
    const s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const e = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { startDate: s, endDate: e };
  }

  filters = signal<TransactionFilters>({
    ...this._currentMonth(),
    categoryIds: [],
    subcategoryIds: [],
    search: '',
  });

  expenseSubIds = signal<number[]>([]);
  incomeSubIds = signal<number[]>([]);

  expenseFilters = computed<TransactionFilters>(() => {
    const ids = [...this.selectedAccountIds()];
    return {
      startDate: this.filters().startDate,
      endDate: this.filters().endDate,
      search: this.filters().search,
      isExpense: 0,
      categoryIds: [],
      subcategoryIds: this.expenseSubIds(),
      accountIds: ids.length ? ids : undefined,
    };
  });
  expenseSummary = signal<SummaryResponse | null>(null);
  expensePage = signal(0);
  expensePerPage = signal(50);
  expenseLoading = signal(true);

  incomeFilters = computed<TransactionFilters>(() => {
    const ids = [...this.selectedAccountIds()];
    return {
      startDate: this.filters().startDate,
      endDate: this.filters().endDate,
      search: this.filters().search,
      isExpense: 2,
      categoryIds: [],
      subcategoryIds: this.incomeSubIds(),
      accountIds: ids.length ? ids : undefined,
    };
  });
  incomeSummary = signal<SummaryResponse | null>(null);
  incomePage = signal(0);
  incomePerPage = signal(50);
  incomeLoading = signal(true);

  allSummary = signal<SummaryResponse | null>(null);
  allPage = signal(0);
  allPerPage = signal(50);
  allLoading = signal(true);

  allFilters = computed<TransactionFilters>(() => {
    const ids = [...this.selectedAccountIds()];
    return {
      startDate: this.filters().startDate,
      endDate: this.filters().endDate,
      search: this.filters().search,
      categoryIds: [],
      subcategoryIds: [],
      accountIds: ids.length ? ids : undefined,
    };
  });

  expandedMtId = signal<number | null>(null);
  expandedDetail = signal<MultiTransactionDetail | null>(null);
  expandedIds = signal<Set<number>>(new Set());
  expandedDetailMap = signal<Map<number, MultiTransactionDetail>>(new Map());

  ngOnInit() {
    this.loadAccounts();
    this.refresh.transactions$.subscribe(() => this.loadAll());
    this.route.queryParams.subscribe(p => {
      if (p['edit']) this.onEditTransaction(+p['edit']);
    });
    this.transactionService.activateDueOrders().subscribe({ next: () => this.loadAll() });
  }

  loadAccounts() {
    this.accountService.list().subscribe({
      next: (data) => this.accounts.set(data),
      error: () => this.snackbar.open('Failed to load accounts', 'Close'),
    });
  }

  loadAll() {
    this.loadExpense();
    this.loadIncome();
    this.loadAllTransactions();
  }

  loadExpense() {
    this.expenseLoading.set(true);
    this.api.getSummary(this.expenseFilters(), this.expensePage(), this.expensePerPage())
      .then(d => this.expenseSummary.set(d))
      .catch(e => this.snackbar.open(e.message, 'Close'))
      .finally(() => this.expenseLoading.set(false));
  }

  loadIncome() {
    this.incomeLoading.set(true);
    this.api.getSummary(this.incomeFilters(), this.incomePage(), this.incomePerPage())
      .then(d => this.incomeSummary.set(d))
      .catch(e => this.snackbar.open(e.message, 'Close'))
      .finally(() => this.incomeLoading.set(false));
  }

  loadAllTransactions() {
    this.allLoading.set(true);
    this.api.getSummary(this.allFilters(), this.allPage(), this.allPerPage())
      .then(d => {
        this.allSummary.set(d);
        this.prefetchDetails(d);
      })
      .catch(e => this.snackbar.open(e.message, 'Close'))
      .finally(() => this.allLoading.set(false));
  }

  private prefetchDetails(summary: SummaryResponse) {
    const ids: number[] = [];
    for (const month of Object.values(summary.data)) {
      for (const day of Object.values(month.days)) {
        for (const item of day.items) {
          if (!this.expandedDetailMap().has(item.id)) {
            ids.push(item.id);
          }
        }
      }
    }
    for (const id of ids) {
      this.api.getMultiTransactionDetail(id).then(d => {
        this.expandedDetailMap.update(m => { const r = new Map(m); r.set(id, d); return r; });
      });
    }
  }

  onFilterChange(f: TransactionFilters) {
    this.filters.set(f);
    this.expensePage.set(0);
    this.incomePage.set(0);
    this.allPage.set(0);
    this.loadAll();
  }

  onTabChange(tab: 'expense' | 'income' | 'transactions') {
    this.activeTab.set(tab);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  onExpSubIdsChange(ids: number[]) {
    this.expenseSubIds.set(ids);
    this.expensePage.set(0);
    this.loadExpense();
  }

  onIncSubIdsChange(ids: number[]) {
    this.incomeSubIds.set(ids);
    this.incomePage.set(0);
    this.loadIncome();
  }

  onExpPageChange(e: PageEvent) {
    this.expensePage.set(e.pageIndex);
    this.expensePerPage.set(e.pageSize);
    this.loadExpense();
  }

  onIncPageChange(e: PageEvent) {
    this.incomePage.set(e.pageIndex);
    this.incomePerPage.set(e.pageSize);
    this.loadIncome();
  }

  onAllPageChange(e: PageEvent) {
    this.allPage.set(e.pageIndex);
    this.allPerPage.set(e.pageSize);
    this.loadAllTransactions();
  }

  onItemClick(mtId: number) {
    if (this.expandedIds().has(mtId)) {
      this.expandedIds.update(s => { const n = new Set(s); n.delete(mtId); return n; });
    } else {
      this.expandedIds.update(s => { const n = new Set(s); n.add(mtId); return n; });
      if (!this.expandedDetailMap().has(mtId)) {
        this.api.getMultiTransactionDetail(mtId).then(d => {
          this.expandedDetailMap.update(m => { const r = new Map(m); r.set(mtId, d); return r; });
        });
      }
    }
  }

  onDayClick(ids: number[]) {
    const anyExpanded = ids.some(id => this.expandedIds().has(id));
    if (anyExpanded) {
      this.expandedIds.update(s => { const n = new Set(s); ids.forEach(id => n.delete(id)); return n; });
      this.expandedDetailMap.update(m => { const r = new Map(m); ids.forEach(id => r.delete(id)); return r; });
    } else {
      Promise.all(ids.map(id => this.api.getMultiTransactionDetail(id)))
        .then(details => {
          this.expandedIds.update(s => { const n = new Set(s); ids.forEach(id => n.add(id)); return n; });
          this.expandedDetailMap.update(m => {
            const r = new Map(m);
            ids.forEach((id, i) => r.set(id, details[i]));
            return r;
          });
        })
        .catch(() => this.snackbar.open('Failed to load details', 'Close'));
    }
  }

  onResetAll() {
    this.selectedAccountIds.set(new Set());
    this.expenseSubIds.set([]);
    this.incomeSubIds.set([]);
    this.expensePage.set(0);
    this.incomePage.set(0);
    this.allPage.set(0);
    this.resetKey.update(v => v + 1);
    this.loadAll();
  }

  toggleAccount(id: number) {
    this.selectedAccountIds.update(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    this.expensePage.set(0);
    this.incomePage.set(0);
    this.allPage.set(0);
    this.loadAll();
  }

  toggleAllAccounts() {
    if (this.selectedAccountIds().size === this.accounts().length) {
      this.selectedAccountIds.set(new Set());
    } else {
      this.selectedAccountIds.set(new Set(this.accounts().map(a => a.id)));
    }
    this.expensePage.set(0);
    this.incomePage.set(0);
    this.allPage.set(0);
    this.loadAll();
  }

  onEditTransaction(mtId: number) {
    this.dialog.open(AddTransactionDialogComponent, { width: '600px', data: { transactionId: mtId } as AddTransactionData });
  }

  onDuplicateTransaction(mtId: number) {
    this.dialog.open(AddTransactionDialogComponent, { width: '600px', data: { duplicateOf: mtId } as AddTransactionData });
  }

  onDeleteTransaction(mtId: number) {
    if (!window.confirm('Delete this transaction?')) return;
    this.transactionService.delete(mtId).subscribe({
      next: () => {
        this.snackbar.open('Transaction deleted', 'Close', { duration: 2000 });
        this.removeFromSummary(this.allSummary, mtId);
        this.removeFromSummary(this.expenseSummary, mtId);
        this.removeFromSummary(this.incomeSummary, mtId);
        this.expandedIds.update(s => { const n = new Set(s); n.delete(mtId); return n; });
        this.expandedDetailMap.update(m => { const r = new Map(m); r.delete(mtId); return r; });
        this.refresh.triggerTransactions();
      },
      error: (e: any) => this.snackbar.open(e.error?.detail || 'Delete failed', 'Close', { duration: 3000 }),
    });
  }

  private removeFromSummary(sig: ReturnType<typeof signal<SummaryResponse | null>>, mtId: number) {
    const current = sig();
    if (!current) return;

    const newData: Record<string, MonthlySummary> = {};
    for (const [month, ms] of Object.entries(current.data)) {
      const newDays: Record<string, DailySummary> = {};
      for (const [day, ds] of Object.entries(ms.days)) {
        const newItems = ds.items.filter(i => i.id !== mtId);
        if (newItems.length > 0) {
          newDays[day] = { ...ds, items: newItems, balance: newItems.reduce((s, i) => s + i.balance, 0) };
        }
      }
      if (Object.keys(newDays).length > 0) {
        const pos = Object.values(newDays).reduce((s, d) => s + Math.max(0, d.balance), 0);
        const neg = Object.values(newDays).reduce((s, d) => s + Math.min(0, d.balance), 0);
        newData[month] = { pos, neg, total: pos + neg, days: newDays as unknown as { [day: number]: DailySummary } };
      }
    }

    sig.set({
      ...current,
      data: newData as unknown as SummaryResponse['data'],
      positive: Object.values(newData).reduce((s, m) => s + m.pos, 0),
      negative: Object.values(newData).reduce((s, m) => s + m.neg, 0),
      total: Object.values(newData).reduce((s, m) => s + m.total, 0),
      total_count: current.total_count - 1,
    });
  }

  sortMonths = (a: KeyValue<string, any>, b: KeyValue<string, any>) => b.key.localeCompare(a.key);
  sortDays = (a: KeyValue<string, any>, b: KeyValue<string, any>) => Number(b.key) - Number(a.key);
}
