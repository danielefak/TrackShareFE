import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class RefreshService {
  private notif = inject(NotificationService);
  private _transactions = new Subject<void>();
  private _notifications = new Subject<void>();
  transactions$ = this._transactions.asObservable();
  notifications$ = this._notifications.asObservable();
  triggerTransactions() { this._transactions.next(); this.notif.refreshCount(); }
  triggerNotifications() { this._notifications.next(); }
}
