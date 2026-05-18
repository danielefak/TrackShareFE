import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { NotificationService } from './services/notification.service';
import { RefreshService } from './services/refresh.service';
import { DarkModeService } from './services/dark-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterModule]
})
export class AppComponent implements OnInit, OnDestroy {
  private notif = inject(NotificationService);
  private refresh = inject(RefreshService);
  private swPush = inject(SwPush);
  private darkMode = inject(DarkModeService);
  private pollTimer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.darkMode.init();
    this.notif.refreshCount();
    this.pollTimer = setInterval(() => {
      this.notif.refreshCount();
      this.refresh.triggerNotifications();
    }, 30000);

    this.swPush.notificationClicks.subscribe(({ notification }) => {
      const logId = notification.data?.['logId'];
      if (logId) this.notif.markRead(logId);
      else this.notif.refreshCount();
    });
  }

  ngOnDestroy() {
    clearInterval(this.pollTimer);
  }
}