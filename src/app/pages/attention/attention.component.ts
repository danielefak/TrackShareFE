import { Component, inject, signal } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { TransactionService } from '../../services/transaction.service';
import { RefreshService } from '../../services/refresh.service';
import { AttentionItem, SummaryResponse, MultiTransactionDetail, TransactionItem } from '../../models/transaction-summary.model';
import { TransactionsComponent } from '../../components/transactions/transactions.component';
import { AddTransactionDialogComponent, AddTransactionData } from '../../components/add-transaction-dialog/add-transaction-dialog.component';

@Component({
  selector: 'app-attention',
  standalone: true,
  imports: [
    CommonModule, MatProgressSpinnerModule, MatIconModule, MatDialogModule, MatSnackBarModule,
    TransactionsComponent,
  ],
  template: `
    <div class="attention-page">
      <div class="page-header">
        <h1>Attention</h1>
        <p class="page-subtitle">Transactions with unusual amounts for their type</p>
      </div>

      @if (loading()) {
        <div class="loading-spinner"><mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle</mat-icon>
          <p>No suspicious transactions found</p>
        </div>
      } @else {
        <app-transactions
          [summary]="transformedSummary()"
          [loading]="loading()"
          [sortMonths]="sortMonths"
          [sortDays]="sortDays"
          [expandedIds]="expandedIds()"
          [expandedDetailMap]="expandedDetailMap()"
          (itemClick)="onItemClick($event)"
          (dayClick)="onDayClick($event)"
          (editItem)="onEditTransaction($event)"
          (duplicateItem)="onDuplicateTransaction($event)"
          (deleteItem)="onDeleteTransaction($event)"
        ></app-transactions>
      }
    </div>
  `,
  styles: [`
    .attention-page { max-width: 700px; margin: 0 auto; padding: 16px; }
    .page-header { margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .page-subtitle { margin: 4px 0 0; font-size: 0.85rem; color: var(--mat-sys-on-surface-variant); }
    .loading-spinner { display: flex; justify-content: center; padding: 48px 0; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 0; color: var(--mat-sys-on-surface-variant); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    @media (max-width: 600px) {
      .attention-page { padding: 12px; }
    }
  `],
})
export class AttentionComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private transactionService = inject(TransactionService);
  private refresh = inject(RefreshService);

  loading = signal(true);
  items = signal<AttentionItem[]>([]);
  expandedIds = signal<Set<number>>(new Set());
  expandedDetailMap = signal<Map<number, MultiTransactionDetail>>(new Map());

  transformedSummary = signal<SummaryResponse | null>(null);

  constructor() {
    this.load();
  }

  sortMonths = (a: KeyValue<string, any>, b: KeyValue<string, any>) => b.key.localeCompare(a.key);
  sortDays = (a: KeyValue<string, any>, b: KeyValue<string, any>) => Number(b.key) - Number(a.key);

  private async load() {
    try {
      const data = await this.api.getAttention();
      this.items.set(data);
      this.transformedSummary.set(this.buildSummary(data));
    } catch { }
    this.loading.set(false);
  }

  private buildSummary(items: AttentionItem[]): SummaryResponse {
    const months: Record<string, { pos: number; neg: number; total: number; days: Record<number, { balance: number; items: TransactionItem[] }> }> = {};
    let totalPositive = 0;
    let totalNegative = 0;

    for (const item of items) {
      const d = new Date(item.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dayKey = d.getDate();

      if (!months[monthKey]) {
        months[monthKey] = { pos: 0, neg: 0, total: 0, days: {} };
      }
      if (!months[monthKey].days[dayKey]) {
        months[monthKey].days[dayKey] = { balance: 0, items: [] };
      }

      const bal = item.balance;
      if (bal > 0) {
        months[monthKey].pos += bal;
        totalPositive += bal;
      } else {
        months[monthKey].neg += bal;
        totalNegative += bal;
      }
      months[monthKey].total = months[monthKey].pos + months[monthKey].neg;
      months[monthKey].days[dayKey].balance += bal;
      months[monthKey].days[dayKey].items.push({
        title: item.title,
        balance: bal,
        category_name: item.category_name,
        subcategory_name: item.subcategory_name,
        id: item.mt_id,
        mt_date: item.date,
        period1: '',
        period2: '',
      });
    }

    const data: Record<string, { pos: number; neg: number; total: number; days: Record<string, { balance: number; items: TransactionItem[] }> }> = {};
    for (const [mk, mv] of Object.entries(months)) {
      const days: Record<string, { balance: number; items: TransactionItem[] }> = {};
      for (const [dk, dv] of Object.entries(mv.days)) {
        days[dk] = dv;
      }
      data[mk] = { pos: mv.pos, neg: mv.neg, total: mv.total, days };
    }

    return {
      positive: totalPositive,
      negative: totalNegative,
      total: totalPositive + totalNegative,
      total_count: items.length,
      data,
    };
  }

  onItemClick(mtId: number) {
    if (this.expandedIds().has(mtId)) {
      this.expandedIds.update(s => { const n = new Set(s); n.delete(mtId); return n; });
      this.expandedDetailMap.update(m => { const r = new Map(m); r.delete(mtId); return r; });
    } else {
      this.api.getMultiTransactionDetail(mtId)
        .then(d => {
          this.expandedIds.update(s => { const n = new Set(s); n.add(mtId); return n; });
          this.expandedDetailMap.update(m => { const r = new Map(m); r.set(mtId, d); return r; });
        })
        .catch(() => this.snackbar.open('Failed to load details', 'Close'));
    }
  }

  onDayClick(ids: number[]) {
    for (const id of ids) {
      if (this.expandedIds().has(id)) {
        this.expandedIds.update(s => { const n = new Set(s); n.delete(id); return n; });
        this.expandedDetailMap.update(m => { const r = new Map(m); r.delete(id); return r; });
      } else {
        this.api.getMultiTransactionDetail(id)
          .then(d => {
            this.expandedIds.update(s => { const n = new Set(s); n.add(id); return n; });
            this.expandedDetailMap.update(m => { const r = new Map(m); r.set(id, d); return r; });
          })
          .catch(() => this.snackbar.open('Failed to load details', 'Close'));
      }
    }
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
        this.refresh.triggerTransactions();
        this.load();
      },
      error: (e: any) => this.snackbar.open(e.error?.detail || 'Delete failed', 'Close', { duration: 3000 }),
    });
  }
}
