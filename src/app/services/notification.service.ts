import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../environment';
import { NotificationItem, LogItem } from '../models/transaction-summary.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private swPush = inject(SwPush);
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;
  unreadCount = signal(0);

  private get token() {
    return localStorage.getItem('access_token') || '';
  }

  private async authFetch(url: string, opts?: RequestInit): Promise<Response> {
    const res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...(opts?.headers || {}),
      },
    });
    return res;
  }

  async refreshCount() {
    try {
      const res = await this.authFetch(`${this.apiUrl}/v1/notifications/count`);
      const data = await res.json();
      this.unreadCount.set(data.count);
    } catch { this.unreadCount.set(0); }
  }

  async list(): Promise<NotificationItem[]> {
    const res = await this.authFetch(`${this.apiUrl}/v1/notifications`);
    return res.json();
  }

  async markRead(id: number) {
    await this.authFetch(`${this.apiUrl}/v1/notifications/${id}/read`, { method: 'PUT' });
    await this.refreshCount();
  }

  async markAllRead() {
    await this.authFetch(`${this.apiUrl}/v1/notifications/read-all`, { method: 'PUT' });
    await this.refreshCount();
  }

  async getLogs(limit = 100, offset = 0): Promise<LogItem[]> {
    const res = await this.authFetch(`${this.apiUrl}/v1/logs?limit=${limit}&offset=${offset}`);
    return res.json();
  }

  async subscribe() {
    try {
      if (!this.swPush.isEnabled) return;
      const existing = await firstValueFrom(this.swPush.subscription);
      if (existing) return;
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: 'BERkPB7u4ueHg0Z4spvQrQYU77aKCsm5WPJ1RugNdNv6Jpoo8i8mdqVB05N4mcsjAGAwDHOCQCS_4vTj7OVuKis',
      });
      const json = sub.toJSON();
      await this.authFetch(`${this.apiUrl}/v1/push/subscribe`, {
        method: 'POST',
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys!['p256dh'],
          auth: json.keys!['auth'],
        }),
      });
    } catch { /* permission denied or push not supported */ }
  }

  async unsubscribe() {
    try {
      if (!this.swPush.isEnabled) return;
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        await this.authFetch(`${this.apiUrl}/v1/push/unsubscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' });
        await sub.unsubscribe();
      }
    } catch { /* ignore */ }
  }
}
