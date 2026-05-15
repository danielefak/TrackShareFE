import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgxApexchartsModule } from 'ngx-apexcharts';
import { AccountService } from '../../services/account.service';
import { ApiService } from '../../services/api.service';
import { RefreshService } from '../../services/refresh.service';
import { Account } from '../../models/account.model';
import { ChartResponse } from '../../models/transaction-summary.model';
import { AccountFormComponent } from './account-form.component';
import { AddFriendDialogComponent } from '../friends/add-friend-dialog.component';
import {
  ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexLegend,
  ApexDataLabels, ApexTooltip, ApexFill, ApexStroke,
} from 'ngx-apexcharts';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule, MatProgressSpinnerModule,
    RouterModule, DragDropModule, NgxApexchartsModule,
  ],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export class AccountsComponent implements OnInit {
  private accountService = inject(AccountService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private refresh = inject(RefreshService);
  private snackbar = inject(MatSnackBar);

  accounts = signal<Account[]>([]);
  loading = signal(true);
  chartLoading = signal(false);
  selectedIds = signal<Set<number>>(new Set());
  chartData = signal<ChartResponse | null>(null);
  private chartReq = 0;

  refDate = signal(new Date());

  lineSeries: ApexAxisChartSeries = [];
  lineChartOptions: ApexChart = {
    type: 'area', height: 280, toolbar: { show: false }, zoom: { enabled: false },
  };
  lineXaxis: ApexXAxis = { type: 'category', labels: { style: { fontSize: '11px' } } };
  lineYaxis: ApexYAxis = { labels: { formatter: (v) => v.toFixed(0) + '€' } };
  lineFill: ApexFill = { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1 } };
  lineStroke: ApexStroke = { curve: 'smooth', width: 2 };
  lineColors: string[] = ['#5470c6'];
  lineLegend: ApexLegend = { show: false };
  lineDataLabels: ApexDataLabels = { enabled: false };
  lineTooltip: ApexTooltip = { y: { formatter: (v) => v.toFixed(2) + ' €' } };

  hasSelection = computed(() => this.selectedIds().size > 0);
  regularAccounts = computed(() => this.accounts().filter(a => a.friend_account_id === -1));
  friendAccounts = computed(() => this.accounts().filter(a => a.friend_account_id !== -1));
  allSelected = computed(() => this.accounts().length > 0 && this.selectedIds().size === this.accounts().length);
  selectedTotal = computed(() => {
    const ids = this.selectedIds();
    return this.accounts().filter(a => ids.has(a.id)).reduce((s, a) => s + a.balance, 0);
  });

  periodLabel = computed(() => {
    const r = this.refDate();
    const fmt: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    const eom = new Date(r.getFullYear(), r.getMonth() + 1, 0);
    const s = new Date(eom.getFullYear() - 1, eom.getMonth() + 1, 1);
    return `${s.toLocaleDateString('en-US', fmt)} – ${eom.toLocaleDateString('en-US', fmt)}`;
  });

  ngOnInit() {
    this.loadAccounts();
    this.refresh.transactions$.subscribe(() => this.loadAccounts());
  }

  loadAccounts() {
    this.loading.set(true);
    this.accountService.list().subscribe({
      next: (data) => {
        this.accounts.set(data);
        if (data.length > 0) {
          this.selectedIds.set(new Set(data.map(a => a.id)));
          this.loadChart();
        }
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.open('Failed to load accounts', 'Close', { verticalPosition: 'top' });
        this.loading.set(false);
      },
    });
  }

  navMonth(n: number) {
    this.refDate.update(d => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; });
    this.loadChart();
  }

  toggleAccount(id: number) {
    this.selectedIds.update(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    this.loadChart();
  }

  toggleAll() {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.accounts().map(a => a.id)));
    }
    this.loadChart();
  }

  private async loadChart() {
    const selected = [...this.selectedIds()];
    if (selected.length === 0) { this.chartData.set(null); return; }

    const req = ++this.chartReq;
    this.chartLoading.set(true);
    const r = this.refDate();
    const eom = new Date(r.getFullYear(), r.getMonth() + 1, 0);
    const start = new Date(eom.getFullYear() - 1, eom.getMonth() + 1, 1);
    const end = eom;
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    try {
      const data = await this.api.getChartData({
        startDate: fmt(start),
        endDate: fmt(end),
        categoryIds: [],
        subcategoryIds: [],
        accountIds: selected,
        search: '',
      });
      if (req !== this.chartReq) return;
      this.chartData.set(data);
      this.lineSeries = [{ name: 'Balance', data: data.balance_evolution }];
      this.lineXaxis = { ...this.lineXaxis, categories: data.months.map(m => m.month) };
    } catch { this.snackbar.open('Failed to load chart data', 'Close', { verticalPosition: 'top' }); }
    this.chartLoading.set(false);
  }

  openCreateDialog() {
    const ref = this.dialog.open(AccountFormComponent, { width: '400px' });
    ref.afterClosed().subscribe((result) => { if (result) this.loadAccounts(); });
  }

  openEditDialog(account: Account) {
    const ref = this.dialog.open(AccountFormComponent, { width: '400px', data: account });
    ref.afterClosed().subscribe((result) => { if (result) this.loadAccounts(); });
  }

  openAddFriendDialog() {
    const ref = this.dialog.open(AddFriendDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((result) => { if (result) this.loadAccounts(); });
  }

  drop(event: CdkDragDrop<Account[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const items = [...this.accounts()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.accounts.set(items);
    const prev = items[Math.min(event.currentIndex, event.previousIndex)];
    const curr = items[Math.max(event.currentIndex, event.previousIndex)];
    this.accountService.reorder(curr.id, prev.id).subscribe({
      error: () => this.snackbar.open('Failed to reorder'),
    });
  }

  deleteAccount(account: Account) {
    if (confirm(`Delete account "${account.name}"?`)) {
      this.accountService.delete(account.id).subscribe({
        next: () => {
          this.snackbar.open('Account deleted', 'Close', { verticalPosition: 'top' });
          this.selectedIds.update(s => { const n = new Set(s); n.delete(account.id); return n; });
          this.loadAccounts();
        },
        error: () => this.snackbar.open('Failed to delete account', 'Close', { verticalPosition: 'top' }),
      });
    }
  }
}
