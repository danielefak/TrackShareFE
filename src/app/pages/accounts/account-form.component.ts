import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit Account' : 'New Account' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Account Name</mat-label>
          <input matInput formControlName="name" required />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Initial Balance</mat-label>
          <input matInput type="number" formControlName="balance" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
        {{ isEdit() ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width { width: 100%; margin-bottom: 12px; }
      mat-dialog-content { min-width: 300px; }
    `,
  ],
})
export class AccountFormComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private dialogRef = inject(MatDialogRef<AccountFormComponent>);
  private snackbar = inject(MatSnackBar);
  data = inject<Account | null>(MAT_DIALOG_DATA);

  isEdit = signal(!!this.data);

  form: FormGroup = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    balance: [this.data?.initial_balance || 0],
  });

  save() {
    if (this.form.invalid) return;
    const val = this.form.value;
    if (this.isEdit()) {
      this.accountService.update(this.data!.id, val).subscribe({
        next: () => {
          this.snackbar.open('Account updated', 'Close', { verticalPosition: 'top' });
          this.dialogRef.close(true);
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Update failed', 'Close', { verticalPosition: 'top' }),
      });
    } else {
      this.accountService.create(val).subscribe({
        next: () => {
          this.snackbar.open('Account created', 'Close', { verticalPosition: 'top' });
          this.dialogRef.close(true);
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Creation failed', 'Close', { verticalPosition: 'top' }),
      });
    }
  }
}
