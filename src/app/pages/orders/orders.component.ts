import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TransactionService } from '../../services/transaction.service';
import { RefreshService } from '../../services/refresh.service';
import { OrderResponse } from '../../models/transaction.model';
import { AddTransactionDialogComponent, AddTransactionData } from '../../components/add-transaction-dialog/add-transaction-dialog.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="orders-container">
      <div class="page-header">
        <h1>Orders</h1>
        @if (orders().length) {
          <span class="item-count">{{ orders().length }} pending</span>
        }
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <p>No orders yet. Create a transaction and check "Is order?".</p>
        </div>
      } @else {
        <div class="orders-list">
          <div class="order-cards">
            @for (order of orders(); track order.id) {
              <div class="order-card" [class.is-income]="order.value >= 0" [class.is-expense]="order.value < 0">
                <div class="order-accent"></div>
                <div class="order-main" (click)="toggleExpand(order.id)">
                  <div class="item-body">
                    <span class="item-title">{{ order.title }}</span>
                    <span class="item-tags">{{ order.category_name }}{{ order.subcategory_name ? ' · ' + order.subcategory_name : '' }}</span>
                    @if (order.period1 && order.period2 && order.period1.slice(0,7) !== order.period2.slice(0,7)) {
                      <span class="item-split">{{ order.period1.slice(0,7) }} – {{ order.period2.slice(0,7) }}</span>
                    }
                    <span class="item-date">
                      <mat-icon>calendar_today</mat-icon>
                      {{ order.date }}
                      @if (daysUntil(order.date); as d) {
                        <span class="days-badge">in {{ d }}d</span>
                      }
                    </span>
                  </div>
                  <span class="item-amount" [class.positive]="order.value >= 0" [class.negative]="order.value < 0">
                    {{ (order.value >= 0 ? '+' : '') + (order.value | currency:'EUR':'symbol':'1.2-2') }}
                  </span>
                  <mat-icon class="expand-icon">{{ expandedId() === order.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </div>
                @if (expandedId() === order.id) {
                  <div class="expand-detail">
                    <div class="detail-header">
                      <div class="detail-actions">
                        <button class="da-btn da-edit" (click)="$event.stopPropagation(); editOrder(order)" title="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button class="da-btn da-activate" (click)="$event.stopPropagation(); activateOrder(order.id)" title="Activate now">
                          <mat-icon>play_arrow</mat-icon>
                        </button>
                        <button class="da-btn da-del" (click)="$event.stopPropagation(); deleteOrder(order.id)" title="Delete">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                    @if (order.period1 && order.period2 && order.period1.slice(0,7) !== order.period2.slice(0,7)) {
                      <div class="detail-period">
                        <mat-icon>date_range</mat-icon>
                        <span>{{ order.period1.slice(0,7) }} – {{ order.period2.slice(0,7) }}</span>
                      </div>
                    }
                    <div class="items-section">
                      @for (item of order.items; track item.id) {
                        <div class="detail-row">
                          <span class="detail-account">{{ item.account_name }}</span>
                          <span class="detail-value" [class.positive]="item.value >= 0" [class.negative]="item.value < 0">
                            {{ (item.value >= 0 ? '+' : '') + (item.value | currency:'EUR':'symbol':'1.2-2') }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-container { max-width:720px; margin:0 auto; padding:24px 16px; }
    .page-header { display:flex; align-items:baseline; gap:12px; margin-bottom:20px; }
    .page-header h1 { margin:0; font-size:1.4rem; font-weight:700; color:var(--mat-sys-on-surface); }
    .item-count { font-size:.82rem; color:var(--mat-sys-on-surface-variant); }

    .loading { text-align:center; padding:40px; color:var(--mat-sys-on-surface-variant); }

    .empty-state { text-align:center; padding:60px 20px; color:var(--mat-sys-on-surface-variant); }
    .empty-state .mat-icon { font-size:48px; width:48px; height:48px; margin-bottom:12px; }
    .empty-state p { font-size:.9rem; margin:0; }

    .order-cards { display:flex; flex-direction:column; gap:8px; }

    .order-card {
      display:flex; flex-direction:column;
      background:var(--mat-sys-surface-container-high);
      border-radius:10px; position:relative; overflow:hidden;
      transition:box-shadow .15s;
    }
    .order-card:hover { box-shadow:var(--mat-sys-level2); }

    .order-accent {
      position:absolute; left:0; top:0; height:100%; width:4px;
      border-radius:0 2px 2px 0;
    }
    .is-income .order-accent { background:#22bb33; }
    .is-expense .order-accent { background:var(--mat-sys-error); }

    .order-main {
      display:flex; align-items:center; gap:10px; padding:12px 14px;
      cursor:pointer;
    }

    .item-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
    .item-title { font-weight:600; font-size:.875rem; color:var(--mat-sys-on-surface); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .item-tags { font-size:.68rem; color:var(--mat-sys-on-surface-variant); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .item-split { font-size:.63rem; color:var(--mat-sys-primary); }
    .item-date { font-size:.63rem; color:var(--mat-sys-on-surface-variant); display:flex; align-items:center; gap:3px; margin-top:1px; }
    .item-date .mat-icon { font-size:10px; width:10px; height:10px; }
    .days-badge {
      background:var(--mat-sys-primary-container); color:var(--mat-sys-on-primary-container);
      padding:1px 6px; border-radius:4px; font-weight:600; font-size:.6rem;
    }

    .item-amount {
      font-weight:700; font-size:.875rem; white-space:nowrap; text-align:right;
      flex-shrink:0; min-width:80px;
    }
    .positive { color:#22bb33; }
    .negative { color:var(--mat-sys-error); }

    .expand-icon { font-size:20px; width:20px; height:20px; flex-shrink:0; color:var(--mat-sys-on-surface-variant); }

    .expand-detail {
      background:var(--mat-sys-surface-container); border-radius:0 0 10px 10px;
      padding:8px 12px 10px 18px; border-top:1px solid var(--mat-sys-outline-variant);
    }
    .detail-header {
      display:flex; align-items:center; justify-content:flex-end; margin-bottom:6px;
    }
    .detail-actions { display:flex; gap:2px; }
    .da-btn {
      background:none; border:none; cursor:pointer; width:26px; height:26px; border-radius:5px;
      display:flex; align-items:center; justify-content:center;
      color:var(--mat-sys-on-surface-variant); transition:background .15s;
    }
    .da-btn:hover { background:var(--mat-sys-surface-container-high); color:var(--mat-sys-primary); }
    .da-btn.da-edit:hover { color:var(--mat-sys-primary); }
    .da-btn.da-activate:hover { color:#22bb33; }
    .da-btn.da-del:hover { color:var(--mat-sys-error); }
    .da-btn .mat-icon { font-size:16px; width:16px; height:16px; }

    .detail-period { display:flex; align-items:center; gap:4px; font-size:.72rem; color:var(--mat-sys-on-surface-variant); margin-bottom:6px; }

    .items-section { margin-top:8px; border-top:1px solid var(--mat-sys-outline-variant); padding-top:6px; }

    .detail-row {
      display:flex; justify-content:space-between; align-items:center; padding:3px 0;
    }
    .detail-account { font-size:.8125rem; color:var(--mat-sys-on-surface); }
    .detail-value { font-weight:700; font-size:.8125rem; }

    @media(max-width:600px) {
      .orders-container { padding:16px 12px; }
      .item-amount { min-width:70px; font-size:.8125rem; }
    }
  `],
})
export class OrdersComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private snackbar = inject(MatSnackBar);
  private refresh = inject(RefreshService);
  private dialog = inject(MatDialog);

  orders = signal<OrderResponse[]>([]);
  loading = signal(true);
  expandedId = signal<number | null>(null);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.transactionService.getOrders().subscribe({
      next: (data) => this.orders.set(data),
      error: () => {},
      complete: () => this.loading.set(false),
    });
  }

  toggleExpand(id: number) {
    this.expandedId.update(v => v === id ? null : id);
  }

  editOrder(order: OrderResponse) {
    this.dialog.open<AddTransactionDialogComponent, AddTransactionData>(AddTransactionDialogComponent, {
      width: '600px',
      data: { orderData: order },
    }).afterClosed().subscribe(result => {
      if (result) this.loadOrders();
    });
  }

  activateOrder(id: number) {
    this.transactionService.activateOrder(id).subscribe({
      next: () => {
        this.snackbar.open('Order activated', 'Close', { duration: 2000, verticalPosition: 'top' });
        this.refresh.triggerTransactions();
      },
      error: (e) => this.snackbar.open(e.error?.detail || 'Activation failed', 'Close', { duration: 3000 }),
    });
  }

  deleteOrder(id: number) {
    if (!window.confirm('Delete this order?')) return;
    this.transactionService.deleteOrder(id).subscribe({
      next: () => {
        this.snackbar.open('Order deleted', 'Close', { duration: 2000 });
        this.loadOrders();
      },
      error: (e) => this.snackbar.open(e.error?.detail || 'Delete failed', 'Close', { duration: 3000 }),
    });
  }

  daysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
