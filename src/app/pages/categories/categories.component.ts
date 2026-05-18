import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CategoryService } from '../../services/category.service';
import { Category, SubCategory } from '../../models/category.model';
import { AddCategoryDialogComponent } from './add-category-dialog.component';
import { AddSubcategoryDialogComponent } from './add-subcategory-dialog.component';



@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    DragDropModule,
  ],
  template: `
    <div class="categories-page">
      <div class="page-header">
        <div>
          <h1>Categories</h1>
          <p class="page-subtitle">Manage your expense and income categories</p>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> New Category
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
        </div>
      } @else {
        <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
          <mat-tab label="Expenses">
            @if (expenseCategories().length === 0) {
              <div class="empty-state">
                <mat-icon class="empty-icon">category</mat-icon>
                <p>No expense categories yet.</p>
              </div>
            } @else {
              <div class="categories-list" cdkDropList (cdkDropListDropped)="drop($event, 'expense')">
                @for (cat of expenseCategories(); track cat.id) {
                  <div class="category-card" cdkDrag [cdkDragStartDelay]="200">
                    <div class="card-header" (click)="toggle(cat.id)" role="button" tabindex="0">
                      <mat-icon class="chevron">{{ expanded().has(cat.id) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                      <span class="cat-name">{{ cat.name }}</span>
                      @if (cat.subcategories.length > 0) {
                        <span class="subcount">{{ cat.subcategories.length }}</span>
                      }
                      <div class="cat-actions" (click)="$event.stopPropagation()">
                        <button mat-icon-button (click)="openEditDialog(cat)" matTooltip="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="openAddSubcategory(cat)" matTooltip="Add subcategory">
                          <mat-icon>add_circle_outline</mat-icon>
                        </button>
                        @if (!cat.default) {
                          <button mat-icon-button (click)="deleteCategory(cat)" matTooltip="Delete">
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                    @if (expanded().has(cat.id) && cat.subcategories.length > 0) {
                      <div class="subcat-list">
                        @for (sub of cat.subcategories; track sub.id) {
                          <div class="subcat-item">
                            <span class="subcat-name" [class.is-main]="sub.is_main">{{ sub.name }}</span>
                            <div class="subcat-actions">
                              @if (!sub.is_main) {
                                <button mat-icon-button (click)="openEditSubcategory(sub, cat)" matTooltip="Edit" class="subcat-btn">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button (click)="deleteSubcategory(sub)" matTooltip="Remove" class="subcat-btn">
                                  <mat-icon>close</mat-icon>
                                </button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </mat-tab>
          <mat-tab label="Income">
            @if (incomeCategories().length === 0) {
              <div class="empty-state">
                <mat-icon class="empty-icon">category</mat-icon>
                <p>No income categories yet.</p>
              </div>
            } @else {
              <div class="categories-list" cdkDropList (cdkDropListDropped)="drop($event, 'income')">
                @for (cat of incomeCategories(); track cat.id) {
                  <div class="category-card" cdkDrag [cdkDragStartDelay]="200">
                    <div class="card-header" (click)="toggle(cat.id)" role="button" tabindex="0">
                      <mat-icon class="chevron">{{ expanded().has(cat.id) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                      <span class="cat-name">{{ cat.name }}</span>
                      @if (cat.subcategories.length > 0) {
                        <span class="subcount">{{ cat.subcategories.length }}</span>
                      }
                      <div class="cat-actions" (click)="$event.stopPropagation()">
                        <button mat-icon-button (click)="openEditDialog(cat)" matTooltip="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="openAddSubcategory(cat)" matTooltip="Add subcategory">
                          <mat-icon>add_circle_outline</mat-icon>
                        </button>
                        @if (!cat.default) {
                          <button mat-icon-button (click)="deleteCategory(cat)" matTooltip="Delete">
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                    @if (expanded().has(cat.id) && cat.subcategories.length > 0) {
                      <div class="subcat-list">
                        @for (sub of cat.subcategories; track sub.id) {
                          <div class="subcat-item">
                            <span class="subcat-name" [class.is-main]="sub.is_main">{{ sub.name }}</span>
                            <div class="subcat-actions">
                              @if (!sub.is_main) {
                                <button mat-icon-button (click)="openEditSubcategory(sub, cat)" matTooltip="Edit" class="subcat-btn">
                                  <mat-icon>edit</mat-icon>
                                </button>
                                <button mat-icon-button (click)="deleteSubcategory(sub)" matTooltip="Remove" class="subcat-btn">
                                  <mat-icon>close</mat-icon>
                                </button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .categories-page { animation: fadeIn 0.3s ease-out; padding-bottom: 64px; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .page-subtitle {
      margin: 4px 0 0;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 16px;
    }

    .category-card {
      background: var(--mat-sys-surface-container-high);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.15s ease;
      cursor: grab;
    }

    .category-card:active { cursor: grabbing; }

    .cdk-drag-preview {
      border-radius: 12px;
      box-shadow: var(--mat-sys-level3);
      opacity: 0.9;
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .categories-list.cdk-drop-list-dragging .category-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      cursor: pointer;
      user-select: none;
    }

    .card-header:focus-visible {
      outline: 2px solid var(--mat-sys-primary);
      outline-offset: -2px;
    }

    .chevron {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-on-surface-variant);
      transition: transform 0.15s ease;
      flex-shrink: 0;
    }

    .cat-name {
      flex: 1;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
    }

    .subcount {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container);
      padding: 2px 8px;
      border-radius: 10px;
      line-height: 1.4;
      flex-shrink: 0;
    }

    .cat-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .category-card:hover .cat-actions {
      opacity: 1;
    }

    .subcat-list {
      border-top: 1px solid var(--mat-sys-outline-variant);
      padding: 4px 0;
    }

    .subcat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px 6px 58px;
      transition: background 0.1s ease;
    }

    .subcat-item:hover {
      background: var(--mat-sys-surface-container);
    }

    .subcat-name {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .subcat-name.is-main {
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .subcat-actions {
      display: flex;
      gap: 0;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .subcat-item:hover .subcat-actions {
      opacity: 1;
    }

    .subcat-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
    }

    .subcat-btn .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        gap: 12px;
      }

      .page-header h1 { font-size: 1.25rem; }

      .cat-actions { opacity: 1; }

      .cat-actions .mat-icon { font-size: 20px; }

      .subcat-item { padding-left: 48px; }

      .subcat-actions { opacity: 1; }
    }
  `],
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  expenseCategories = signal<Category[]>([]);
  incomeCategories = signal<Category[]>([]);
  loading = signal(true);
  activeTab = signal(0);
  expanded = signal<Set<number>>(new Set());

  toggle(catId: number) {
    this.expanded.update(s => {
      const next = new Set(s);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  }

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.categoryService.list('all').subscribe({
      next: (data) => {
        this.expenseCategories.set(
          data.filter((c) => c.is_expense === 0 && !c.default).sort((a, b) => a.order - b.order)
        );
        this.incomeCategories.set(
          data.filter((c) => c.is_expense === 2 && !c.default).sort((a, b) => a.order - b.order)
        );
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.open('Failed to load categories', 'Close', { verticalPosition: 'top' });
        this.loading.set(false);
      },
    });
  }

  onTabChange(index: number) {
    this.activeTab.set(index);
  }

  drop(event: CdkDragDrop<Category[]>, type: 'expense' | 'income') {
    if (event.previousIndex === event.currentIndex) return;
    const items = [...(type === 'expense' ? this.expenseCategories() : this.incomeCategories())];
    const moved = items.splice(event.previousIndex, 1)[0];
    items.splice(event.currentIndex, 0, moved);
    if (type === 'expense') this.expenseCategories.set(items);
    else this.incomeCategories.set(items);
    const prev = items[Math.min(event.currentIndex, event.previousIndex)];
    const curr = items[Math.max(event.currentIndex, event.previousIndex)];
    this.categoryService.reorder(curr.id, prev.id).subscribe({
      error: () => this.snackbar.open('Failed to reorder'),
    });
  }

  openAddDialog() {
    const ref = this.dialog.open(AddCategoryDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  openAddSubcategory(cat: Category) {
    const ref = this.dialog.open(AddSubcategoryDialogComponent, {
      width: '420px',
      data: { categoryId: cat.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  openEditDialog(cat: Category) {
    const ref = this.dialog.open(AddCategoryDialogComponent, {
      width: '460px',
      data: cat,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  openEditSubcategory(sub: SubCategory, cat: Category) {
    const ref = this.dialog.open(AddSubcategoryDialogComponent, {
      width: '420px',
      data: { categoryId: cat.id, subcategory: sub },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAll();
    });
  }

  deleteCategory(cat: Category) {
    if (confirm(`Delete category "${cat.name}" and all its subcategories?`)) {
      this.categoryService.delete(cat.id).subscribe({
        next: () => {
          this.snackbar.open('Category deleted', 'Close', { verticalPosition: 'top' });
          this.loadAll();
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Failed to delete', 'Close', { verticalPosition: 'top' }),
      });
    }
  }

  deleteSubcategory(sub: any) {
    if (confirm(`Remove subcategory "${sub.name}"?`)) {
      this.categoryService.deleteSubcategory(sub.id).subscribe({
        next: () => {
          this.snackbar.open('Subcategory removed', 'Close', { verticalPosition: 'top' });
          this.loadAll();
        },
        error: (err) => this.snackbar.open(err.error?.detail || 'Failed to remove', 'Close', { verticalPosition: 'top' }),
      });
    }
  }
}
