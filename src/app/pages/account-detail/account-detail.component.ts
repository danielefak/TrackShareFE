import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';
import { AccountFormComponent } from '../accounts/account-form.component';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
})
export class AccountDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  accountId = 0;
  account = signal<Account | null>(null);
  loading = signal(true);
  page = signal(0);
  perPage = signal(50);
  totalCount = signal(0);
  refDate = signal(new Date());

  periodLabel = computed(() => {
    const r = this.refDate();
    const fmt: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    return `${r.toLocaleDateString('en-US', fmt)}`;
  });

  ngOnInit() {
    this.accountId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.accountId) this.load();
  }

  private _fmt(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private _monthEnd(d: Date) {
    const eom = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${eom.getFullYear()}-${String(eom.getMonth() + 1).padStart(2, '0')}-${String(eom.getDate()).padStart(2, '0')}`;
  }

  load() {
    this.loading.set(true);
    const r = this.refDate();
    const filters = {
      start_date: this._fmt(r),
      end_date: this._monthEnd(r),
      page: this.page(),
      per_page: this.perPage(),
    };
    this.accountService.get(this.accountId, filters).subscribe({
      next: (data) => {
        this.account.set(data);
        this.totalCount.set(data.total_count ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.open('Failed to load account details', 'Close', { verticalPosition: 'top' });
        this.loading.set(false);
      },
    });
  }

  navMonth(n: number) {
    this.refDate.update(d => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; });
    this.page.set(0);
    this.load();
  }

  onPageChange(e: PageEvent) {
    this.page.set(e.pageIndex);
    this.perPage.set(e.pageSize);
    this.load();
  }

  openEditDialog(account: Account) {
    const ref = this.dialog.open(AccountFormComponent, { width: '440px', data: account });
    ref.afterClosed().subscribe((result) => { if (result) this.load(); });
  }
}
