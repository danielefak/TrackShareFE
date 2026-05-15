import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryResponse, MultiTransactionDetail } from '../../models/transaction-summary.model';
import { KeyValue } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';



@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (!loading && summary) {
      <div class="overall-summary-bar">
        <div class="summary-item income">
          <span class="summary-label">Income</span>
          <span class="summary-value positive">{{ summary.positive | currency:'EUR':'symbol':'1.2-2' }}</span>
        </div>
        <div class="summary-item expense">
          <span class="summary-label">Expenses</span>
          <span class="summary-value negative">{{ (summary.negative * -1) | currency:'EUR':'symbol':'1.2-2' }}</span>
        </div>
        <div class="summary-item total">
          <span class="summary-label">Difference</span>
          <span class="summary-value" [class.positive]="summary.total >= 0" [class.negative]="summary.total < 0">
            {{ summary.total | currency:'EUR':'symbol':'1.2-2' }}
          </span>
        </div>
      </div>
      <div class="transactions-list">
        @for (month of summary.data | keyvalue: sortMonths; track month.key) {
          <div class="month-item">
            <div class="month-header">
              <h3>{{ month.key | date:'MMMM yyyy' }}</h3>
              <div class="month-summary">
                <div class="summary-stat income">
                  <span class="stat-label">Income</span>
                  <span class="stat-value positive">{{ month.value.pos | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-stat expense">
                  <span class="stat-label">Expenses</span>
                  <span class="stat-value negative">{{ (month.value.neg * -1) | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-stat total">
                  <span class="stat-label">Total</span>
                  <span class="stat-value" [class.positive]="month.value.total >= 0" [class.negative]="month.value.total < 0">
                    {{ month.value.total | currency:'EUR':'symbol':'1.2-2' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="days-container">
              @for (day of month.value.days | keyvalue: sortDays; track day.key) {
                <div class="day-group">
                  <div class="day-header" (click)="dayClick.emit(getDayItemIds(day.value.items))">
                    <div class="day-info">
                      <span class="day-number">{{ day.key }}</span>
                      <span class="day-name">{{ month.key + '-' + day.key | date:'EEEE' }}</span>
                    </div>
                    <span class="day-balance" [class.positive]="day.value.balance >= 0" [class.negative]="day.value.balance < 0">
                      {{ day.value.balance | currency:'EUR':'symbol':'1.2-2' }}
                    </span>
                  </div>
                  <div class="day-items">
                    @for (item of day.value.items; track item.id) {
                      <div>
                          <div class="transaction-item" [class.is-income]="item.balance >= 0" [class.is-expense]="item.balance < 0" [class.is-expanded]="expandedIds.has(item.id)" (click)="itemClick.emit(item.id)">
                            <div class="item-accent"></div>
                            <div class="item-body">
                              <span class="item-title">{{ item.title }}</span>
                              <span class="item-tags">{{ item.category_name }} · {{ item.subcategory_name }}</span>
                              @if (item.period1 && item.period2 && item.period1.slice(0,7) !== item.period2.slice(0,7)) {
                                <span class="item-split">Payed {{ item.mt_date }}</span>
                              }
                            </div>
                           <span class="item-amount" [class.positive]="item.balance >= 0" [class.negative]="item.balance < 0">
                             {{ (item.balance >= 0 ? '+' : '') + (item.balance | currency:'EUR':'symbol':'1.2-2') }}
                           </span>
                            <mat-icon class="expand-icon">{{ expandedIds.has(item.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                         </div>
                        @if (expandedIds.has(item.id)) {
                          @if (expandedDetailMap.get(item.id); as detail) {
                          <div class="expand-detail">
                            <div class="detail-header">
                              <div class="detail-title">{{ detail.title }}</div>
                              <div class="detail-actions">
                                <button class="da-btn" (click)="$event.stopPropagation(); editItem.emit(item.id)" title="Edit"><mat-icon>edit</mat-icon></button>
                                <button class="da-btn" (click)="$event.stopPropagation(); duplicateItem.emit(item.id)" title="Duplicate"><mat-icon>content_copy</mat-icon></button>
                                <button class="da-btn da-del" (click)="$event.stopPropagation(); deleteItem.emit(item.id)" title="Delete"><mat-icon>delete</mat-icon></button>
                              </div>
                            </div>
                            @if (detail.period1.slice(0,7) !== detail.period2.slice(0,7)) {
                              <div class="detail-period">
                                <mat-icon>date_range</mat-icon>
                                <span>{{ fmtPeriod(detail.period1) }} – {{ fmtPeriod(detail.period2) }} ({{ splitMonths(detail.period1, detail.period2) }}mo)</span>
                                <span class="detail-total">{{ detail.total | number:'1.2-2' }} €</span>
                              </div>
                            }
                            @for (t of detail.transactions; track t.account_id) {
                              <div class="detail-row">
                                <span class="detail-account">{{ t.account_name }}</span>
                                <span class="detail-value" [class.positive]="t.value >= 0" [class.negative]="t.value < 0">
                                  {{ t.value | currency:'EUR':'symbol':'1.2-2' }}
                                </span>
                              </div>
                            }
                          </div>
                          }
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .month-header {
      text-align: center;
      padding: 14px 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      border-radius: 12px;
      position: sticky;
      top: 0;
      z-index: 3;
      margin-bottom: 4px;
      backdrop-filter: blur(8px);
      background: color-mix(in srgb, var(--mat-sys-surface) 85%, transparent);
    }

    .month-header h3 {
      margin: 0 0 10px;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .month-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .summary-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
    }

    .stat-value {
      font-weight: 700;
      font-size: 0.85rem;
    }

    .positive { color: #22bb33; }
    .negative { color: var(--mat-sys-error); }

    .days-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .day-group {
      display: flex;
      flex-direction: column;
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px 8px 4px;
      margin-bottom: 4px;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.15s;
    }

    .day-header:hover {
      background: var(--mat-sys-surface-container-highest);
    }

    .day-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .day-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font-weight: 700;
      font-size: 0.9rem;
    }

    .day-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: capitalize;
    }

    .day-balance {
      font-weight: 700;
      font-size: 0.85rem;
    }

    .day-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-left: 46px;
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 10px 10px 0 0;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      animation: slideIn 0.3s ease both;
      cursor: pointer;
    }

    .transaction-item:hover {
      box-shadow: var(--mat-sys-level2);
      transform: translateX(3px);
    }

    .transaction-item.is-expanded {
      box-shadow: var(--mat-sys-level1);
      transform: none;
    }

    .expand-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .expand-detail {
      background: var(--mat-sys-surface-container);
      border-radius: 0 0 10px 10px;
      padding: 8px 12px 10px 46px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      animation: slideIn 0.2s ease;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .detail-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .detail-actions { display:flex; gap:2px; }
    .da-btn { background:none; border:none; cursor:pointer; width:26px; height:26px; border-radius:5px; display:flex; align-items:center; justify-content:center; color:var(--mat-sys-on-surface-variant); transition:background .15s; }
    .da-btn:hover { background:var(--mat-sys-surface-container-high); color:var(--mat-sys-primary); }
    .da-btn.da-del:hover { color:var(--mat-sys-error); }
    .da-btn .mat-icon { font-size:16px; width:16px; height:16px; }

    .detail-period { display:flex; align-items:center; gap:4px; font-size:.72rem; color:var(--mat-sys-on-surface-variant); margin-bottom:6px; }
    .detail-total { margin-left:auto; font-weight:700; color:var(--mat-sys-on-surface); }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
    }

    .detail-account {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface);
    }

    .detail-value {
      font-weight: 700;
      font-size: 0.8125rem;
    }

    .item-accent {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      border-radius: 0 2px 2px 0;
      transition: width 0.2s ease;
    }

    .is-income .item-accent {
      background: #22bb33;
    }

    .is-expense .item-accent {
      background: var(--mat-sys-error);
    }

    .transaction-item:hover .item-accent {
      width: 5px;
    }

    .item-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-tags {
      font-size: 0.6875rem;
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-split { font-size:.63rem; color:var(--mat-sys-primary); display:block; margin-top:1px; }

    .item-amount {
      font-weight: 700;
      font-size: 0.875rem;
      white-space: nowrap;
      text-align: right;
      flex-shrink: 0;
      min-width: 80px;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .overall-summary-bar {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 14px 20px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .summary-label {
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
    }

    .summary-value {
      font-weight: 700;
      font-size: 0.95rem;
    }

    @media (max-width: 600px) {
      .month-header {
        padding: 10px 12px;
      }

      .month-header h3 {
        font-size: 0.9375rem;
      }

      .stat-value {
        font-size: 0.78rem;
      }

      .day-items {
        padding-left: 0;
      }

      .day-number {
        width: 30px;
        height: 30px;
        font-size: 0.8rem;
      }

      .transaction-item {
        padding: 8px 10px;
      }

      .item-title {
        font-size: 0.8125rem;
      }

      .item-amount {
        font-size: 0.8125rem;
        min-width: 70px;
      }

      .overall-summary-bar {
        gap: 12px;
        padding: 10px 12px;
        flex-wrap: wrap;
      }

      .summary-value {
        font-size: 0.82rem;
      }

    }
  `],
})
export class TransactionsComponent {
  @Input() summary: SummaryResponse | null = null;
  @Input() loading: boolean = false;
  @Input() sortMonths: (a: KeyValue<string, any>, b: KeyValue<string, any>) => number = () => 0;
  @Input() sortDays: (a: KeyValue<string, any>, b: KeyValue<string, any>) => number = () => 0;
  @Input() expandedIds: Set<number> = new Set();
  @Input() expandedDetailMap: Map<number, MultiTransactionDetail> = new Map();
  @Output() itemClick = new EventEmitter<number>();
  @Output() dayClick = new EventEmitter<number[]>();
  @Output() editItem = new EventEmitter<number>();
  @Output() duplicateItem = new EventEmitter<number>();
  @Output() deleteItem = new EventEmitter<number>();

  private MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  fmtPeriod(d: string): string {
    const [y, m] = d.split('-').map(Number);
    return `${this.MONTH_LABELS[m - 1]} ${y}`;
  }

  splitMonths(p1: string, p2: string): number {
    const [y1, m1] = p1.split('-').map(Number);
    const [y2, m2] = p2.split('-').map(Number);
    return (y2 - y1) * 12 + (m2 - m1) + 1;
  }

  getDayItemIds(items: any[]): number[] {
    return items.map(i => i.id);
  }
}
