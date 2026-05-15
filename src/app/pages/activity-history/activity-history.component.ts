import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { RefreshService } from '../../services/refresh.service';
import { NotificationItem, LogItem } from '../../models/transaction-summary.model';
import { AddTransactionDialogComponent, AddTransactionData } from '../../components/add-transaction-dialog/add-transaction-dialog.component';

@Component({
  selector: 'app-activity-history',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatDialogModule],
  template: `
    <div class="page">
      <h1>Activity History</h1>

      <mat-tab-group>
        <mat-tab label="Notifications ({{ notif.unreadCount() }})">
          <div class="tab-content">
            <div class="actions-line" *ngIf="notifications.length">
              <button mat-stroked-button (click)="markAllRead()">Mark all as read</button>
            </div>
            <div class="alist" *ngIf="notifications.length; else emptyNotif">
              <div class="acard" *ngFor="let n of notifications" [class.unread]="n.is_active" (click)="clickNotification(n)">
                <div class="adate">{{ n.date | date:'dd MMM yyyy   at  HH:mm' }}</div>
                <div class="awho"><span class="awho-name">{{ n.user_name || 'You' }}</span></div>
                <ng-container [ngSwitch]="n.object_type">
                  <ng-container *ngSwitchCase="'Multitransaction'">
                    <div class="adesc"><span class="abold">{{ n.title }}</span></div>
                    <div class="aop">{{ n.name }}</div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Transaction'">
                    <div class="adesc"><span class="abold">{{ n.title }}</span></div>
                    <div class="aop">{{ n.name }}</div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Account'">
                    <div class="adesc">{{ n.name }}: <span class="abold">{{ n.object_name }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Category'">
                    <div class="adesc">{{ n.name }}: <span class="abold">{{ n.object_name }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Subcategory'">
                    <div class="adesc">{{ n.name }}: <span class="abold">{{ n.object_name }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchDefault>
                    <div class="adesc">{{ n.name }}</div>
                  </ng-container>
                </ng-container>
                <button mat-icon-button class="mark-btn" *ngIf="n.is_active" (click)="$event.stopPropagation(); markRead(n)"><mat-icon>check_circle</mat-icon></button>
              </div>
            </div>
            <ng-template #emptyNotif><p class="empty">No notifications</p></ng-template>
          </div>
        </mat-tab>

        <mat-tab label="All Activity">
          <div class="tab-content">
            <div class="alist" *ngIf="logs.length; else emptyLogs">
              <div class="acard" *ngFor="let l of logs" (click)="clickLog(l)">
                <div class="adate">{{ l.date | date:'dd MMM yyyy   at  HH:mm' }}</div>
                <div class="awho"><span class="awho-name">{{ l.user_name || 'You' }}</span></div>
                <ng-container [ngSwitch]="l.object_type">
                  <ng-container *ngSwitchCase="'Multitransaction'">
                    <div class="adesc"><span class="abold">{{ l.title }}</span></div>
                    <div class="aop">{{ l.name }}</div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Transaction'">
                    <div class="adesc"><span class="abold">{{ l.title }}</span></div>
                    <div class="aop">{{ l.name }}</div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Account'">
                    <div class="adesc">{{ l.name }}: <span class="abold">{{ l.object_name }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Category'">
                    <div class="adesc">{{ l.name }}: <span class="abold">{{ l.object_name }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchCase="'Subcategory'">
                    <div class="adesc">{{ l.name }}: <span class="abold">{{ l.object_name }}</span></div>
                  </ng-container>
                  <ng-container *ngSwitchDefault>
                    <div class="adesc">{{ l.name }}</div>
                  </ng-container>
                </ng-container>
              </div>
            </div>
            <ng-template #emptyLogs><p class="empty">No activity yet</p></ng-template>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page { padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { margin-bottom: 16px; font-weight: 600; }
    .tab-content { padding: 12px 0; }
    .actions-line { margin-bottom: 12px; }
    .empty { color: var(--mat-sys-on-surface-variant); text-align: center; padding: 40px; }
    .alist { display: flex; flex-direction: column; gap: 6px; }
    .acard {
      position: relative;
      background: var(--mat-sys-surface-container-high);
      border-radius: 10px;
      padding: 12px 40px 12px 16px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .acard:hover { box-shadow: var(--mat-sys-level2); }
    .acard.unread { border-left: 4px solid var(--mat-sys-primary); padding-left: 12px; }
    .adate { font-size: 0.8em; color: var(--mat-sys-on-surface-variant); }
    .awho-name { font-weight: 600; color: var(--mat-sys-primary); }
    .adesc { font-weight: normal; margin-top: 2px; }
    .abold { font-weight: 600; }
    .aop { font-size: 0.85em; color: var(--mat-sys-on-surface-variant); margin-top: -2px; }
    .mark-btn {
      position: absolute; right: 8px; top: 8px;
      --mdc-icon-button-icon-size: 18px;
      width: 28px; height: 28px;
    }
    @media (max-width: 600px) {
      .page { padding: 12px; }
      .acard { padding: 10px 36px 10px 12px; }
    }
  `]
})
export class ActivityHistoryComponent implements OnInit, OnDestroy {
  notif = inject(NotificationService);
  private refresh = inject(RefreshService);
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private subs: Subscription[] = [];

  notifications: NotificationItem[] = [];
  logs: LogItem[] = [];

  ngOnInit() {
    this.load();
    this.subs.push(this.refresh.notifications$.subscribe(() => this.load()));
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private async load() {
    try {
      this.notifications = await this.notif.list();
      this.logs = await this.notif.getLogs();
      await this.notif.refreshCount();
    } catch {
      this.snackbar.open('Failed to load activity', 'Close', { duration: 3000, verticalPosition: 'top' });
    }
  }

  async markRead(n: NotificationItem) {
    await this.notif.markRead(n.id);
    n.is_active = false;
  }

  async markAllRead() {
    await this.notif.markAllRead();
    this.notifications.forEach(n => n.is_active = false);
    this.snackbar.open('All marked as read', 'Close', { duration: 2000, verticalPosition: 'top' });
  }

  clickNotification(n: NotificationItem) {
    if (n.is_active) this.markRead(n);
    this.openDetail(n);
  }

  clickLog(l: LogItem) {
    this.openDetail(l);
  }

  private openDetail(item: NotificationItem | LogItem) {
    const isTx = item.object_type === 'Transaction' || item.object_type === 'Multitransaction';
    if (isTx) {
      this.dialog.open(AddTransactionDialogComponent, {
        width: '600px',
        data: { transactionId: item.mt_id ?? item.object_id } as AddTransactionData,
      }).afterClosed().subscribe(() => this.load());
    } else if (item.object_type === 'Account') {
      this.router.navigate(['/accounts', item.object_id]);
    } else if (item.object_type === 'Category' || item.object_type === 'Subcategory') {
      this.router.navigate(['/categories']);
    } else if (item.object_type === 'Profile') {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate([`/${item.object_type.toLowerCase()}`]);
    }
  }
}
