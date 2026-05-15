import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';

interface TransactionItem {
  id: number;
  title: string;
  value: number;
  date: string;
  category_name: string;
  subcategory_name: string;
}

interface AccountDetail extends Account {
  transactions: TransactionItem[];
}



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
  ],
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
})
export class AccountDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private snackbar = inject(MatSnackBar);

  account = signal<AccountDetail | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.accountService.get(id).subscribe({
        next: (data) => {
          this.account.set(data as AccountDetail);
          this.loading.set(false);
        },
        error: () => {
          this.snackbar.open('Failed to load account details', 'Close', { verticalPosition: 'top' });
          this.loading.set(false);
        },
      });
    }
  }
}
