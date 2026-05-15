import { Component, Input, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../../environment';
import { NotificationService } from '../../services/notification.service';
@Component({
  selector: 'ToolbarComponent',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatBadgeModule, MatMenuModule]
})
export class ToolbarComponent {
  private router = inject(Router);
  private swPush = inject(SwPush);
  private env = inject(ENVIRONMENT);
  notif = inject(NotificationService);

  @Input() snav!: MatSidenav;
  @Input() isMobile!: boolean;

  async openNotifications() {
    if (this.swPush.isEnabled) {
      try {
        const existing = await firstValueFrom(this.swPush.subscription);
        if (existing) await existing.unsubscribe();
        const sub = await this.swPush.requestSubscription({
          serverPublicKey: 'BERkPB7u4ueHg0Z4spvQrQYU77aKCsm5WPJ1RugNdNv6Jpoo8i8mdqVB05N4mcsjAGAwDHOCQCS_4vTj7OVuKis',
        });
        const json = sub.toJSON();
        fetch(`${this.env.apiUrl}/v1/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
          },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys!['p256dh'],
            auth: json.keys!['auth'],
          }),
        });
      } catch {}
    }
    this.router.navigate(['/activity-history']);
  }
}


