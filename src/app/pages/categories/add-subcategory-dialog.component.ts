import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService } from '../../services/category.service';
import { SubCategory } from '../../models/category.model';

export interface SubcategoryDialogData {
  categoryId: number;
  subcategory?: SubCategory;
}

@Component({
  selector: 'app-add-subcategory-dialog',
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
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit Subcategory' : 'Add Subcategory' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Subcategory Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Clothes" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? (isEdit() ? 'Saving...' : 'Adding...') : (isEdit() ? 'Save' : 'Add') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 20px; }
    .full-width:last-child { margin-bottom: 0; }
    mat-dialog-content { min-width: 340px; }
    form { padding-top: 6px; }
  `],
})
export class AddSubcategoryDialogComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<AddSubcategoryDialogComponent>);
  private snackbar = inject(MatSnackBar);
  data = inject<SubcategoryDialogData>(MAT_DIALOG_DATA);

  isEdit = signal(!!this.data.subcategory);
  saving = signal(false);

  form = this.fb.group({
    name: [this.data.subcategory?.name || '', Validators.required],
  });

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    if (this.isEdit()) {
      this.categoryService.updateSubcategory(this.data.subcategory!.id, { name: this.form.value.name! }).subscribe({
        next: () => {
          this.snackbar.open('Subcategory updated', 'Close', { verticalPosition: 'top' });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbar.open(err.error?.detail || 'Failed to update subcategory', 'Close', { verticalPosition: 'top' });
        },
      });
    } else {
      this.categoryService.createSubcategory({
        name: this.form.value.name!,
        category_id: this.data.categoryId,
      }).subscribe({
        next: () => {
          this.snackbar.open('Subcategory added', 'Close', { verticalPosition: 'top' });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.snackbar.open(err.error?.detail || 'Failed to add subcategory', 'Close', { verticalPosition: 'top' });
        },
      });
    }
  }
}
