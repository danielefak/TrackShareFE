import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FriendService } from '../../services/friend.service';

@Component({
  selector: 'app-add-friend-dialog',
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
    <h2 mat-dialog-title>Add Friend</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Account Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Shared holiday" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Friend's Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="friend@email.com" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <mat-error>Valid email is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Friend's Key</mat-label>
          <input matInput formControlName="key" placeholder="e.g. ABC123DEF4" />
          @if (form.get('key')?.invalid && form.get('key')?.touched) {
            <mat-error>Key is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Initial Balance (€)</mat-label>
          <input matInput formControlName="balance" type="number" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Adding...' : 'Add Friend' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    mat-dialog-content { min-width: 320px; }
  `],
})
export class AddFriendDialogComponent {
  private fb = inject(FormBuilder);
  private friendService = inject(FriendService);
  private dialogRef = inject(MatDialogRef<AddFriendDialogComponent>);
  private snackbar = inject(MatSnackBar);

  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    key: ['', Validators.required],
    balance: [0],
  });

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.friendService.add(this.form.value as any).subscribe({
      next: () => {
        this.snackbar.open('Friend added!', 'Close', { verticalPosition: 'top' });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackbar.open(err.error?.detail || 'Failed to add friend', 'Close', { verticalPosition: 'top' });
      },
    });
  }
}
