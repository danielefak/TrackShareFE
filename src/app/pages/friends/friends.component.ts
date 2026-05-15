import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { FriendService } from '../../services/friend.service';
import { FriendAccount } from '../../models/friend.model';
import { AddFriendDialogComponent } from './add-friend-dialog.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule,
    DragDropModule,
  ],
  template: `
    <div class="friends-page">
      <div class="page-header">
        <div>
          <h1>Friends</h1>
          <p class="page-subtitle">Shared accounts with other users</p>
        </div>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>person_add</mat-icon> Add Friend
        </button>
      </div>

      <div class="summary-grid">
        <div class="summary-card total">
          <span class="summary-label">Total Balance</span>
          <span class="summary-value" [class.positive]="totalBalance() >= 0" [class.negative]="totalBalance() < 0">
            €{{ totalBalance() | number:'1.2-2' }}
          </span>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
        </div>
      } @else if (friends().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">group</mat-icon>
          <h3>No friends yet</h3>
          <p>Add a friend to start sharing transactions.</p>
        </div>
      } @else {
        <div class="friends-list" cdkDropList (cdkDropListDropped)="drop($event)">
          @for (friend of friends(); track friend.id) {
            <div class="friend-card" cdkDrag [cdkDragStartDelay]="200" [class.is-positive]="friend.balance >= 0" [class.is-negative]="friend.balance < 0">
              <div class="card-accent"></div>
              <div class="card-body">
                <div class="card-top">
                  <div class="friend-info">
                    <span class="friend-name">{{ friend.name }}</span>
                    <span class="friend-tag">{{ friend.friend_name }}</span>
                  </div>
                  <div class="friend-actions">
                    <button mat-icon-button (click)="deleteFriend(friend)" matTooltip="Remove">
                      <mat-icon>person_remove</mat-icon>
                    </button>
                  </div>
                </div>
                <span class="friend-balance" [class.positive]="friend.balance >= 0" [class.negative]="friend.balance < 0">
                  €{{ friend.balance | number:'1.2-2' }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .friends-page { animation: fadeIn 0.3s ease-out; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
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

    .summary-grid { margin-bottom: 32px; }

    .summary-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-high);
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      max-width: 320px;
    }

    .summary-card:hover {
      box-shadow: var(--mat-sys-level2);
      transform: translateY(-1px);
    }

    .summary-label {
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .positive { color: #22bb33; }
    .negative { color: var(--mat-sys-error); }

    .friends-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .friend-card {
      display: flex;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.15s ease, transform 0.15s ease;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .friend-card:hover {
      box-shadow: var(--mat-sys-level2);
      transform: translateX(3px);
    }

    .friend-card {
      cursor: grab;
    }

    .friend-card:active { cursor: grabbing; }

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

    .friends-list.cdk-drop-list-dragging .friend-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .card-accent {
      width: 4px;
      flex-shrink: 0;
      transition: width 0.2s ease;
    }

    .is-positive .card-accent { background: #22bb33; }
    .is-negative .card-accent { background: var(--mat-sys-error); }

    .friend-card:hover .card-accent { width: 5px; }

    .card-body {
      flex: 1;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .friend-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .friend-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .friend-tag {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .friend-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .friend-card:hover .friend-actions {
      opacity: 1;
    }

    .friend-balance {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
      }

      .page-header h1 { font-size: 1.25rem; }

      .summary-card { max-width: 100%; }

      .summary-value { font-size: 1.25rem; }

      .friend-card { border-radius: 10px; }

      .friend-card:hover { transform: none; }

      .friend-balance { font-size: 1.25rem; }

      .friend-actions { opacity: 1; }
    }
  `],
})
export class FriendsComponent implements OnInit {
  private friendService = inject(FriendService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  friends = signal<FriendAccount[]>([]);
  loading = signal(true);

  totalBalance = () => this.friends().reduce((sum, f) => sum + f.balance, 0);

  ngOnInit() {
    this.loadFriends();
  }

  loadFriends() {
    this.loading.set(true);
    this.friendService.list().subscribe({
      next: (data) => {
        this.friends.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.open('Failed to load friends', 'Close', { verticalPosition: 'top' });
        this.loading.set(false);
      },
    });
  }

  openAddDialog() {
    const ref = this.dialog.open(AddFriendDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadFriends();
    });
  }

  drop(event: CdkDragDrop<FriendAccount[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const items = [...this.friends()];
    const moved = items.splice(event.previousIndex, 1)[0];
    items.splice(event.currentIndex, 0, moved);
    this.friends.set(items);
    const prev = items[Math.min(event.currentIndex, event.previousIndex)];
    const curr = items[Math.max(event.currentIndex, event.previousIndex)];
    this.friendService.reorder(curr.id, prev.id).subscribe({
      error: () => this.snackbar.open('Failed to reorder'),
    });
  }

  deleteFriend(friend: FriendAccount) {
    if (confirm(`Remove friend "${friend.name}"?`)) {
      this.friendService.delete(friend.id).subscribe({
        next: () => {
          this.snackbar.open('Friend removed', 'Close', { verticalPosition: 'top' });
          this.loadFriends();
        },
        error: () => this.snackbar.open('Failed to remove friend', 'Close', { verticalPosition: 'top' }),
      });
    }
  }
}
