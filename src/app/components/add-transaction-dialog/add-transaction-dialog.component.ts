import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { AccountService } from '../../services/account.service';
import { RefreshService } from '../../services/refresh.service';
import { Account } from '../../models/account.model';
import { Category, SubCategory } from '../../models/category.model';
import { CalculatorDialogComponent, CalculatorData, CalculatorResult } from './calculator-dialog.component';
import { OrderResponse } from '../../models/transaction.model';

export interface AddTransactionData {
  transactionId?: number;
  duplicateOf?: number;
  orderData?: OrderResponse;
}

@Component({
  selector: 'app-add-transaction-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatDialogModule, MatSnackBarModule, MatIconModule, MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditOrder() ? 'Edit Order' : isEdit() ? 'Edit Transaction' : 'New Transaction' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="type-toggle">
          <button type="button" class="type-btn" [class.active]="form.value.is_expense === 0" (click)="setType(0)">
            <mat-icon>remove_circle_outline</mat-icon> Expense
          </button>
          <button type="button" class="type-btn" [class.active]="form.value.is_expense === 2" (click)="setType(2)">
            <mat-icon>add_circle_outline</mat-icon> Income
          </button>
          <button type="button" class="type-btn" [class.active]="form.value.is_expense === 1" (click)="setType(1)">
            <mat-icon>swap_horiz</mat-icon> Transfer
          </button>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="dp" [formControl]="dateCtrl">
          <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
        </mat-form-field>

        @if (!isEdit()) {
          <button type="button" class="split-toggle" (click)="toggleSplit()">
            <mat-icon>{{ splitEnabled() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
            Split over months
          </button>
          <button type="button" class="split-toggle order-toggle" [class.active]="isOrder()" (click)="toggleOrder()">
            <mat-icon>{{ isOrder() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
            Is order
          </button>
        } @else if (!isSplit()) {
          <button type="button" class="split-toggle" (click)="toggleSplit()">
            <mat-icon>{{ splitEnabled() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
            Split over months
          </button>
        }

        @if (splitEnabled() || isSplit()) {
          <div class="split-block">
            <div class="split-row">
              <span class="split-label">From</span>
              <select class="month-select" [ngModel]="sfMonth()" (ngModelChange)="setFromMonth($event)" [ngModelOptions]="{standalone: true}">
                @for (m of MONTHS; track m.v) {
                  <option [value]="m.v">{{ m.l }}</option>
                }
              </select>
              <select class="year-select" [ngModel]="sfYear()" (ngModelChange)="setFromYear($event)" [ngModelOptions]="{standalone: true}">
                @for (y of YEARS; track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
            <div class="split-row">
              <span class="split-label">To</span>
              <select class="month-select" [ngModel]="stMonth()" (ngModelChange)="setToMonth($event)" [ngModelOptions]="{standalone: true}">
                @for (m of MONTHS; track m.v) {
                  <option [value]="m.v">{{ m.l }}</option>
                }
              </select>
              <select class="year-select" [ngModel]="stYear()" (ngModelChange)="setToYear($event)" [ngModelOptions]="{standalone: true}">
                @for (y of YEARS; track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
          </div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input #titleInput matInput formControlName="title" placeholder="e.g. Supermarket" />
        </mat-form-field>

        @if (form.value.is_expense !== 1) {
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category_id" (selectionChange)="onCategoryChange()">
              @for (cat of filteredCategories(); track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (subcategories().length) {
            <mat-form-field appearance="outline">
              <mat-label>Subcategory</mat-label>
              <mat-select #subSelect formControlName="subcategory_id">
                @for (sub of subcategories(); track sub.id) {
                  <mat-option [value]="sub.id">{{ sub.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        }

        <div class="items-section">
          <div class="items-header">
            <span class="items-title">Items</span>
            <div class="add-btns">
              <button type="button" class="add-neg" (click)="addItem(true)">−</button>
              <button type="button" class="add-pos" (click)="addItem(false)">+</button>
            </div>
          </div>
          <div class="total-row" [class.neg]="total() < 0" [class.pos]="total() >= 0">
            Total: <span class="total-val">{{ total() | number:'1.2-2' }} €</span>
          </div>
          <div formArrayName="items" class="items-list">
            @for (item of items.controls; track item; let i = $index) {
              <div class="item-row" [formGroupName]="i">
                <mat-form-field appearance="outline" class="item-acc">
                  <mat-select formControlName="account_id" [attr.data-acc-idx]="i" (selectionChange)="onAccountChange(i)">
                    <mat-option [value]="null" disabled>Account</mat-option>
                    @for (acc of accounts(); track acc.id) {
                      <mat-option [value]="acc.id">{{ acc.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <div class="item-amt-badge" [class.neg]="item.value.is_negative" [class.pos]="!item.value.is_negative" (click)="openCalculator(i)">
                  <span class="iamount">{{ (getItemValue(i) * (item.value.is_negative ? -1 : 1)) | number:'1.2-2' }} €</span>
                </div>

                <button type="button" class="isign-btn" [class.neg]="item.value.is_negative" [class.pos]="!item.value.is_negative" (click)="toggleSign(i)">
                  <mat-icon>swap_horiz</mat-icon>
                </button>

                <button type="button" mat-icon-button class="iremove" (click)="removeItem(i)" [disabled]="items.length <= 1">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? (isEdit() ? 'Updating...' : 'Saving...') : (isEdit() ? 'Update' : 'Save') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 420px; }
    .type-toggle { display: flex; gap: 6px; margin-bottom: 16px; }
    .type-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:8px; border-radius:8px; border:2px solid var(--mat-sys-outline-variant); background:transparent; cursor:pointer; font-weight:600; font-size:.85rem; color:var(--mat-sys-on-surface-variant); transition:all .15s; }
    .type-btn.active { border-color:var(--mat-sys-primary); background:var(--mat-sys-primary-container); color:var(--mat-sys-on-primary-container); }

    .split-toggle { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; border:2px solid var(--mat-sys-outline-variant); background:transparent; cursor:pointer; font-size:.82rem; font-weight:500; color:var(--mat-sys-on-surface-variant); margin-bottom:12px; transition:all .15s; width:100%; }
    .split-toggle:hover { border-color:var(--mat-sys-primary); color:var(--mat-sys-primary); }
    .order-toggle.active { border-color:#e67e22; background:#fef3e2; color:#e67e22; }
    .order-toggle.active .mat-icon { color:#e67e22; }
    .split-toggle .mat-icon { font-size:18px; width:18px; height:18px; }
    .split-block { margin-bottom:12px; }
    .split-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
    .split-label { font-size:.82rem; font-weight:600; color:var(--mat-sys-on-surface-variant); min-width:36px; white-space:nowrap; }
    .month-select, .year-select { padding:6px 8px; border-radius:6px; border:1px solid var(--mat-sys-outline); background:var(--mat-sys-surface); font-size:.85rem; color:var(--mat-sys-on-surface); cursor:pointer; }
    .month-select:hover, .year-select:hover { border-color:var(--mat-sys-primary); }
    .month-select { flex:1; min-width:90px; }
    .year-select { width:80px; }

    .items-section { margin-top:8px; border-top:1px solid var(--mat-sys-outline-variant); padding-top:8px; }
    .items-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .total-row { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-radius:8px; margin-bottom:6px; font-weight:700; font-size:.95rem; }
    .total-row.pos { background:#e8f5e9; color:#2e7d32; }
    .total-row.neg { background:#ffebee; color:#c62828; }
    .total-val { font-family:monospace; }
    .items-title { font-weight:600; font-size:.85rem; color:var(--mat-sys-on-surface); }
    .add-btns { display:flex; gap:6px; }
    .add-neg, .add-pos { width:34px; height:34px; border-radius:50%; border:none; font-size:1.4rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#fff; transition:transform .15s; }
    .add-neg:active, .add-pos:active { transform:scale(.88); }
    .add-neg { background:#c62828; }
    .add-pos { background:#2e7d32; }
    .items-list { display:flex; flex-direction:column; gap:5px; }

    .item-row { display:flex; gap:5px; align-items:center; }
    .item-acc { flex:1; }
    .item-acc .mat-mdc-form-field-subscript-wrapper { display:none; }

    .item-amt-badge { display:flex; align-items:center; gap:3px; padding:6px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:700; font-size:.88rem; min-width:80px; justify-content:center; transition:box-shadow .15s; }
    .item-amt-badge.neg { background:#ffebee; color:#c62828; }
    .item-amt-badge.pos { background:#e8f5e9; color:#2e7d32; }
    .item-amt-badge:active { box-shadow:0 0 0 2px var(--mat-sys-primary); }
    .iamount { font-family:monospace; }

    .isign-btn { width:28px; height:28px; border-radius:6px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .isign-btn .mat-icon { font-size:16px; width:16px; height:16px; }
    .isign-btn.neg { background:#ffcdd2; color:#c62828; }
    .isign-btn.pos { background:#c8e6c9; color:#2e7d32; }
    .iremove { flex-shrink:0; }

    @media(max-width:600px) {
      mat-dialog-content { min-width:0; }
      .item-amt-badge { min-width:60px; font-size:.82rem; }
    }
  `],
})
export class AddTransactionDialogComponent {
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  @ViewChild('subSelect') subSelect!: MatSelect;

  data = inject<AddTransactionData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddTransactionDialogComponent>);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);
  private refreshService = inject(RefreshService);

  readonly MONTHS = [
    { v: 1, l: 'Jan' }, { v: 2, l: 'Feb' }, { v: 3, l: 'Mar' }, { v: 4, l: 'Apr' },
    { v: 5, l: 'May' }, { v: 6, l: 'Jun' }, { v: 7, l: 'Jul' }, { v: 8, l: 'Aug' },
    { v: 9, l: 'Sep' }, { v: 10, l: 'Oct' }, { v: 11, l: 'Nov' }, { v: 12, l: 'Dec' },
  ];
  readonly YEARS: number[] = Array.from({ length: 301 }, (_, i) => 1900 + i);

  saving = signal(false);
  editId = signal(this.data?.transactionId ?? this.data?.duplicateOf ?? 0);
  isEdit = signal(!!this.data?.transactionId && !this.data?.duplicateOf);
  isEditOrder = signal(!!this.data?.orderData);
  accounts = signal<Account[]>([]);
  allCategories = signal<Category[]>([]);
  splitEnabled = signal(false);
  isOrder = signal(false);

  sfMonth = signal(new Date().getMonth() + 1);
  sfYear = signal(new Date().getFullYear());
  stMonth = signal(new Date().getMonth() + 1);
  stYear = signal(new Date().getFullYear());

  total = signal(0);

  private recalcTotal() {
    let sum = 0;
    for (const ctrl of this.items.controls) {
      const raw = ctrl.get('value')?.value || 0;
      const neg = ctrl.get('is_negative')?.value;
      sum += raw * (neg ? -1 : 1);
    }
    this.total.set(sum);
  }

  form = this.fb.group({
    is_expense: [0, Validators.required],
    date: [this.today(), Validators.required],
    title: ['', Validators.required],
    period1: [this.today()],
    period2: [this.today()],
    category_id: [null as number | null, Validators.required],
    subcategory_id: [null as number | null],
    items: this.fb.array([this.createItem(true)]),
  });

  isSplit = computed(() => {
    if (!this.isEdit()) return false;
    return this.sfYear() !== this.stYear() || this.sfMonth() !== this.stMonth();
  });

  get items(): FormArray { return this.form.get('items') as FormArray; }

  dateCtrl = new FormControl<Date | null>(new Date(), Validators.required);

  private createItem(neg: boolean) {
    return this.fb.group({ account_id: [null as number | null, Validators.required], value: [0, [Validators.required, Validators.min(0.01)]], is_negative: [neg] });
  }

  private fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  constructor() {
    this.dateCtrl.valueChanges.subscribe((d: Date | null) => {
      if (d) this.form.patchValue({ date: this.fmtDate(d) }, { emitEvent: false });
    });
    this.items.valueChanges.subscribe(() => this.recalcTotal());
    this.accountService.list().subscribe(a => this.accounts.set(a));
    this.categoryService.list('all').subscribe(c => {
      this.allCategories.set(c);
      if (this.form.value.is_expense === 1 && !this.form.value.category_id) {
        const tc = c.find(x => x.is_expense === 1);
        if (tc) this.form.patchValue({ category_id: tc.id, subcategory_id: tc.subcategories[0]?.id ?? tc.id });
      }
    });
    if (this.data?.orderData) this.loadOrder(this.data.orderData);
    else if (this.editId()) this.loadTransaction(this.editId());
    this.recalcTotal();
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  filteredCategories(): Category[] {
    return this.allCategories().filter(c => c.is_expense === this.form.value.is_expense);
  }

  subcategories(): SubCategory[] {
    const cid = this.form.value.category_id;
    if (!cid) return [];
    return this.allCategories().find(c => c.id === cid)?.subcategories || [];
  }

  getItemValue(i: number): number {
    return this.items.at(i)?.get('value')?.value || 0;
  }

  private loadOrder(o: OrderResponse) {
    if (o.date) {
      const p = o.date.split('-');
      this.dateCtrl.setValue(new Date(+p[0], +p[1] - 1, +p[2]));
    }
    this.isOrder.set(true);
    this.form.patchValue({
      is_expense: o.is_expense,
      title: o.title,
      period1: o.period1 ? o.period1.slice(0, 7) + '-01' : null,
      period2: o.period2 ? o.period2.slice(0, 7) + '-01' : null,
    });
    const p1m = parseInt(o.period1?.slice(5, 7) ?? '0');
    const p1y = parseInt(o.period1?.slice(0, 4) ?? '0');
    const p2m = parseInt(o.period2?.slice(5, 7) ?? '0');
    const p2y = parseInt(o.period2?.slice(0, 4) ?? '0');
    if (p1m && p1y) { this.sfMonth.set(p1m); this.sfYear.set(p1y); }
    if (p2m && p2y) { this.stMonth.set(p2m); this.stYear.set(p2y); }
    if (o.period1?.slice(0, 7) !== o.period2?.slice(0, 7)) this.splitEnabled.set(true);
    setTimeout(() => {
      this.form.patchValue({ category_id: o.category_id, subcategory_id: o.subcategory_id || o.category_id });
    });
    while (this.items.length) this.items.removeAt(0);
    for (const t of o.items) {
      const neg = t.value < 0;
      this.items.push(this.fb.group({
        account_id: [t.account_id, Validators.required],
        value: [Math.abs(t.value), [Validators.required, Validators.min(0.01)]],
        is_negative: [neg],
      }));
    }
    this.recalcTotal();
  }

  private loadTransaction(id: number) {
    this.transactionService.getDetail(id).subscribe({
      next: (d) => {
        if (d.date) {
          const p = d.date.split('-');
          this.dateCtrl.setValue(new Date(+p[0], +p[1] - 1, +p[2]));
        }
        this.form.patchValue({ is_expense: d.is_expense, title: d.title, period1: d.period1?.slice(0, 7) + '-01', period2: d.period2?.slice(0, 7) + '-01' });
        const p1m = parseInt(d.period1?.slice(5, 7) ?? '0');
        const p1y = parseInt(d.period1?.slice(0, 4) ?? '0');
        const p2m = parseInt(d.period2?.slice(5, 7) ?? '0');
        const p2y = parseInt(d.period2?.slice(0, 4) ?? '0');
        if (p1m && p1y) { this.sfMonth.set(p1m); this.sfYear.set(p1y); }
        if (p2m && p2y) { this.stMonth.set(p2m); this.stYear.set(p2y); }
        if (d.period1?.slice(0, 7) !== d.period2?.slice(0, 7)) this.splitEnabled.set(true);
        setTimeout(() => {
          this.form.patchValue({ category_id: d.category_id, subcategory_id: d.subcategory_id || d.category_id });
        });
        while (this.items.length) this.items.removeAt(0);
        for (const t of d.transactions) {
          const neg = t.value < 0;
          this.items.push(this.fb.group({
            account_id: [t.account_id, Validators.required],
            value: [Math.abs(t.value), [Validators.required, Validators.min(0.01)]],
            is_negative: [neg],
          }));
        }
        this.recalcTotal();
      },
      error: () => this.snackbar.open('Failed to load transaction', 'Close', { duration: 3000, verticalPosition: 'top' }),
    });
  }

  setType(t: number) {
    this.form.patchValue({ is_expense: t, category_id: null, subcategory_id: null });
    if (this.items.length) this.items.at(0).get('is_negative')?.setValue(t === 0);
    if (t === 1) {
      const tc = this.allCategories().find(c => c.is_expense === 1);
      if (tc) this.form.patchValue({ category_id: tc.id, subcategory_id: tc.subcategories[0]?.id ?? tc.id });
    }
    setTimeout(() => this.titleInput?.nativeElement?.focus());
  }

  onCategoryChange() {
    this.form.patchValue({ subcategory_id: null });
    setTimeout(() => this.subSelect?.open());
  }

  onAccountChange(i: number) {
    setTimeout(() => this.openCalculator(i));
  }

  openCalculator(i: number) {
    const g = this.items.at(i);
    const v = this.getItemValue(i);
    const neg = g?.get('is_negative')?.value ?? true;
    const aid = g?.get('account_id')?.value;
    const acc = aid ? this.accounts().find(a => a.id === aid) : null;
    const otherAbs: number[] = [];
    for (let j = 0; j < this.items.length; j++) {
      if (j !== i) otherAbs.push(this.getItemValue(j));
    }
    const ref = this.dialog.open<CalculatorDialogComponent, CalculatorData, CalculatorResult>(CalculatorDialogComponent, {
      width: '340px',
      data: { value: v, isNegative: neg, account: acc ? { id: acc.id, name: acc.name, balance: acc.balance } : null, otherAbsValues: otherAbs },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      g?.get('value')?.setValue(result.value);
      g?.get('is_negative')?.setValue(result.isNegative);
    });
  }

  addItem(neg: boolean) {
    this.items.push(this.createItem(neg));
    const idx = this.items.length - 1;
    setTimeout(() => (document.querySelector(`[data-acc-idx="${idx}"]`) as HTMLElement)?.click());
  }

  removeItem(i: number) {
    if (this.items.length <= 1) return;
    this.items.removeAt(i);
  }

  toggleSign(i: number) {
    const c = this.items.at(i).get('is_negative');
    c?.setValue(!c?.value);
  }

  private updateOrder() {
    this.saving.set(true);
    const r = this.form.getRawValue();
    const items = (r.items || []) as any[];
    const signed = items.map((x: any) => ({ account_id: x.account_id!, value: (x.value || 0) * (x.is_negative ? -1 : 1) }));
    const p1 = r.period1 ?? (r.date ? r.date.slice(0, 7) + '-01' : undefined);
    const p2 = r.period2 ?? (r.date ? r.date.slice(0, 7) + '-01' : undefined);
    this.transactionService.updateOrder(this.data.orderData!.id, {
      title: r.title!,
      date: r.date!,
      period1: p1,
      period2: p2,
      category_id: r.category_id!,
      subcategory_id: r.subcategory_id ?? r.category_id!,
      is_expense: r.is_expense!,
      items: signed,
    }).subscribe({
      next: () => {
        this.snackbar.open('Order updated', 'Close', { duration: 2000, verticalPosition: 'top' });
        this.refreshService.triggerTransactions();
        this.dialogRef.close(true);
      },
      error: (e) => { this.saving.set(false); this.snackbar.open(e.error?.detail || 'Failed', 'Close', { duration: 3000, verticalPosition: 'top' }); },
    });
  }

  save() {
    if (this.form.invalid) return;
    if (this.isEditOrder()) this.updateOrder();
    else if (this.isEdit()) this.update();
    else this.create();
  }

  toggleSplit() {
    this.splitEnabled.update(v => !v);
    const d = this.form.value.date || this.today();
    const m = parseInt(d.slice(5, 7));
    const y = parseInt(d.slice(0, 4));
    this.sfMonth.set(m); this.sfYear.set(y);
    this.stMonth.set(m); this.stYear.set(y);
    this.form.patchValue({ period1: d.slice(0, 7) + '-01', period2: d.slice(0, 7) + '-01' });
  }

  toggleOrder() {
    this.isOrder.update(v => !v);
  }

  setFromMonth(m: number) {
    this.sfMonth.set(m);
    this.form.patchValue({ period1: `${this.sfYear()}-${String(m).padStart(2, '0')}-01` });
  }
  setFromYear(y: number) {
    this.sfYear.set(y);
    this.form.patchValue({ period1: `${y}-${String(this.sfMonth()).padStart(2, '0')}-01` });
  }
  setToMonth(m: number) {
    this.stMonth.set(m);
    this.form.patchValue({ period2: `${this.stYear()}-${String(m).padStart(2, '0')}-01` });
  }
  setToYear(y: number) {
    this.stYear.set(y);
    this.form.patchValue({ period2: `${y}-${String(this.stMonth()).padStart(2, '0')}-01` });
  }

  private create() {
    this.saving.set(true);
    const r = this.form.getRawValue();
    const p1 = this.splitEnabled() ? (r.period1 ?? undefined) : (r.date ? r.date.slice(0, 7) + '-01' : undefined);
    const p2 = this.splitEnabled() ? (r.period2 ?? undefined) : (r.date ? r.date.slice(0, 7) + '-01' : undefined);
    const h: any = { title: r.title!, date: r.date!, period1: p1, period2: p2, category_id: r.category_id!, subcategory_id: r.subcategory_id ?? r.category_id!, is_expense: r.is_expense!, is_order: this.isOrder() };
    const items = (r.items || []) as any[];
    if (!items.length) { this.saving.set(false); return; }
    const signed = (x: any) => ({ account_id: x.account_id!, value: (x.value || 0) * (x.is_negative ? -1 : 1) });
    const extras = items.slice(1).map(x => signed(x));
    this.transactionService.create({ ...h, ...signed(items[0]), items: extras }).subscribe({
      next: () => { this.snackbar.open('Transaction created', 'Close', { duration: 2000, verticalPosition: 'top' }); this.refreshService.triggerTransactions(); this.dialogRef.close(true); },
      error: (e) => { this.saving.set(false); this.snackbar.open(e.error?.detail || 'Failed', 'Close', { duration: 3000, verticalPosition: 'top' }); },
    });
  }

  private update() {
    this.saving.set(true);
    const r = this.form.getRawValue();
    const items = (r.items || []) as any[];
    const signed = items.map((x: any) => ({ account_id: x.account_id!, value: (x.value || 0) * (x.is_negative ? -1 : 1) }));
    const p1 = r.period1 ?? (r.date ? r.date.slice(0, 7) + '-01' : undefined);
    const p2 = r.period2 ?? (r.date ? r.date.slice(0, 7) + '-01' : undefined);
    this.transactionService.update(this.editId(), {
      title: r.title!,
      date: r.date!,
      period1: p1,
      period2: p2,
      category_id: r.category_id!,
      subcategory_id: r.subcategory_id ?? r.category_id!,
      is_expense: r.is_expense!,
      items: signed,
    }).subscribe({
      next: () => {
        this.snackbar.open('Transaction updated', 'Close', { duration: 2000, verticalPosition: 'top' });
        this.refreshService.triggerTransactions();
        this.dialogRef.close(true);
      },
      error: (e) => { this.saving.set(false); this.snackbar.open(e.error?.detail || 'Failed', 'Close', { duration: 3000, verticalPosition: 'top' }); },
    });
  }
}
