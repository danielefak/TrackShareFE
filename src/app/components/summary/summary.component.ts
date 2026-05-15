import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    @if (loading) {
      <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
    } @else if (summary) {
      <div class="summary-grid">
        <div class="summary-card income">
          <div class="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </div>
          <div class="summary-label">Income</div>
          <div class="summary-value">{{ summary.positive | currency:'EUR' }}</div>
        </div>

        <div class="summary-card expense">
          <div class="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
          <div class="summary-label">Expenses</div>
          <div class="summary-value">{{ summary.negative | currency:'EUR' }}</div>
        </div>

        <div class="summary-card total">
          <div class="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="summary-label">Total</div>
          <div class="summary-value">{{ summary.total | currency:'EUR' }}</div>
        </div>
      </div>
    }
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .summary-card {
      background: var(--mat-sys-surface-container-low);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .summary-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .income .summary-icon {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .expense .summary-icon {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .total .summary-icon {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .summary-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    @media (max-width: 600px) {
      .summary-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 24px;
      }

      .summary-card {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .summary-icon {
        margin-bottom: 0;
        flex-shrink: 0;
      }

      .summary-value {
        font-size: 1.125rem;
      }
    }
  `],
})
export class SummaryComponent {
  @Input() summary: any;
  @Input() loading: boolean = false;
}
