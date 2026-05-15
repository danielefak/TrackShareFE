import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-add-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit Category' : 'New Category' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Shopping" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        @if (!isEdit()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Type</mat-label>
            <mat-select formControlName="is_expense">
              <mat-option [value]="0">Expense</mat-option>
              <mat-option [value]="2">Income</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? (isEdit() ? 'Saving...' : 'Creating...') : (isEdit() ? 'Save' : 'Create') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 12px; }
    mat-dialog-content { min-width: 320px; }
  `],
})
export class AddCategoryDialogComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<AddCategoryDialogComponent>);
  private snackbar = inject(MatSnackBar);
  data = inject<Category | null>(MAT_DIALOG_DATA);

  isEdit = signal(!!this.data);
  saving = signal(false);

  form = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    is_expense: [0, Validators.required],
  });

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    if (this.isEdit()) {
      this.categoryService.update(this.data!.id, { name: this.form.value.name! }).subscribe({
        next: () => {
          this.snackbar.open('Category updated', 'Close', { verticalPosition: 'top' });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbar.open(err.error?.detail || 'Failed to update category', 'Close', { verticalPosition: 'top' });
        },
      });
    } else {
      this.categoryService.create(this.form.value as any).subscribe({
        next: () => {
          this.snackbar.open('Category created', 'Close', { verticalPosition: 'top' });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbar.open(err.error?.detail || 'Failed to create category', 'Close', { verticalPosition: 'top' });
        },
      });
    }
  }
}
