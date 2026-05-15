import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface CalculatorData {
  value: number;
  isNegative: boolean;
  account: { id: number; name: string; balance: number } | null;
  otherAbsValues: number[];
}

export interface CalculatorResult {
  value: number;
  isNegative: boolean;
}

@Component({
  selector: 'app-calculator-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Amount</h2>
    <mat-dialog-content>
      @if (data.account) {
        <div class="bal-preview">
          <div class="acc-name">{{ data.account.name }}</div>
          <div class="bal-row">
            <span class="bll">Old: <strong>€{{ data.account.balance | number:'1.2-2' }}</strong></span>
            <span class="bll">→</span>
            <span class="bll">New: <strong [class.pos]="signedPreview() >= 0" [class.neg]="signedPreview() < 0">
              €{{ (data.account.balance + signedPreview()) | number:'1.2-2' }}
            </strong></span>
          </div>
        </div>
      }
      <div class="sign-bar">
        <button type="button" class="sign-btn" [class.neg]="!isNeg()" [class.pos]="isNeg()" (click)="toggleSign()">
          <span class="sval">{{ isNeg() ? '−' : '+' }}</span>
        </button>
        <div class="scr-screen">
          <div class="scr-expr">{{ calcExpr() || '&nbsp;' }}</div>
          <div class="scr-res">{{ calcResult() | number:'1.2-2' }} €</div>
        </div>
      </div>
      <div class="calc-grid">
        <button type="button" class="cb op" (click)="cClear()">C</button>
        <button type="button" class="cb op" (click)="cBack()">⌫</button>
        <button type="button" class="cb op" (click)="cChar('(')">(</button>
        <button type="button" class="cb op" (click)="cChar(')')">)</button>
        <button type="button" class="cb fn" (click)="cTot()">TOT</button>

        <button type="button" class="cb" (click)="cChar('7')">7</button>
        <button type="button" class="cb" (click)="cChar('8')">8</button>
        <button type="button" class="cb" (click)="cChar('9')">9</button>
        <button type="button" class="cb op" (click)="cChar('/')">÷</button>
        <button type="button" class="cb eq" (click)="cEval()">=</button>

        <button type="button" class="cb" (click)="cChar('4')">4</button>
        <button type="button" class="cb" (click)="cChar('5')">5</button>
        <button type="button" class="cb" (click)="cChar('6')">6</button>
        <button type="button" class="cb op" (click)="cChar('*')">×</button>
        <button type="button" class="cb set" (click)="cApply()">SET</button>

        <button type="button" class="cb" (click)="cChar('1')">1</button>
        <button type="button" class="cb" (click)="cChar('2')">2</button>
        <button type="button" class="cb" (click)="cChar('3')">3</button>
        <button type="button" class="cb op" (click)="cChar('-')">−</button>
        <button type="button" class="cb op" (click)="cChar('+')">+</button>

        <button type="button" class="cb" (click)="cChar('0')">0</button>
        <button type="button" class="cb" (click)="cChar('.')">.</button>
        <button type="button" class="cb dummy"></button>
        <button type="button" class="cb dummy"></button>
        <button type="button" class="cb dummy"></button>
      </div>
      <div class="calc-msg">Keyboard: type numbers, Enter =, SET to confirm</div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 280px; }
    .bal-preview { margin-bottom:8px; padding:8px; background:var(--mat-sys-surface-container-high); border-radius:8px; text-align:center; }
    .acc-name { font-weight:600; font-size:.82rem; margin-bottom:3px; color:var(--mat-sys-primary); }
    .bal-row { display:flex; gap:8px; justify-content:center; font-size:.8rem; }
    .bll { color:var(--mat-sys-on-surface-variant); }
    .bll strong { font-weight:700; }
    .bll .pos { color:#2e7d32; }
    .bll .neg { color:#c62828; }

    .sign-bar { display:flex; gap:8px; align-items:stretch; margin-bottom:6px; }
    .sign-btn { width:44px; border-radius:8px; border:none; font-size:1.5rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s; }
    .sign-btn.neg { background:#ffebee; color:#c62828; }
    .sign-btn.pos { background:#e8f5e9; color:#2e7d32; }
    .scr-screen { flex:1; background:var(--mat-sys-surface-container-high); border-radius:8px; padding:6px 10px; text-align:right; display:flex; flex-direction:column; justify-content:center; }
    .scr-expr { font-size:.72rem; color:var(--mat-sys-on-surface-variant); min-height:1em; word-break:break-all; }
    .scr-res { font-weight:700; font-size:1.2rem; color:var(--mat-sys-on-surface); }

    .calc-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; }
    .cb { padding:9px 0; border-radius:6px; border:1px solid var(--mat-sys-outline-variant); background:var(--mat-sys-surface-container-high); cursor:pointer; font-weight:600; font-size:.9rem; text-align:center; color:var(--mat-sys-on-surface); user-select:none; transition:background .1s; }
    .cb:active { background:var(--mat-sys-surface-container-highest); }
    .cb.op { color:var(--mat-sys-primary); font-weight:700; }
    .cb.fn { color:var(--mat-sys-tertiary); font-weight:700; }
    .cb.eq { background:var(--mat-sys-primary); color:var(--mat-sys-on-primary); border-color:var(--mat-sys-primary); }
    .cb.set { background:#2e7d32; color:#fff; border-color:#2e7d32; }
    .cb.dummy { visibility:hidden; }
    .calc-msg { text-align:center; font-size:.68rem; margin-top:4px; color:var(--mat-sys-primary); font-weight:600; }
    @media(max-width:600px) {
      mat-dialog-content { min-width:0; }
      .cb { padding:8px 0; font-size:.85rem; }
    }
  `],
})
export class CalculatorDialogComponent {
  data = inject<CalculatorData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<CalculatorDialogComponent, CalculatorResult>);

  calcExpr = signal('');
  calcResult = signal(this.data.value);
  isNeg = signal(this.data.isNegative);

  signedPreview = computed(() => {
    const v = this.calcResult();
    return v * (this.isNeg() ? -1 : 1);
  });

  toggleSign() { this.isNeg.update(v => !v); }

  cChar(ch: string) {
    this.calcExpr.update(v => v + ch);
    this.calcPreview();
  }

  cClear() { this.calcExpr.set(''); this.calcResult.set(0); }

  cBack() { this.calcExpr.update(v => v.slice(0, -1)); this.calcPreview(); }

  private calcPreview() {
    const e = this.calcExpr();
    if (!e) { this.calcResult.set(0); return; }
    if (/^\d+\.?\d*$/.test(e)) this.calcResult.set(parseFloat(e) || 0);
  }

  cTot() {
    let t = 0;
    for (const v of this.data.otherAbsValues) t += v;
    this.calcExpr.set(t > 0 ? t.toString() : '');
    this.calcResult.set(t);
    this.calcPreview();
  }

  cEval() {
    const e = this.calcExpr();
    if (!e) return;
    try {
      const r = Function('"use strict"; return (' + e + ')')();
      if (typeof r !== 'number' || !isFinite(r)) throw Error('');
      this.calcResult.set(Math.abs(Math.round(r * 100) / 100));
    } catch { /* ignore */ }
  }

  cApply() {
    if (this.calcResult() <= 0 && this.calcExpr()) this.cEval();
    const v = this.calcResult();
    if (v <= 0) return;
    this.dialogRef.close({ value: v, isNegative: this.isNeg() });
  }
}
