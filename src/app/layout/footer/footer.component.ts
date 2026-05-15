import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [
    RouterLink, RouterLinkActive,
    MatIconModule,
  ]
})
export class FooterComponent {
  @Input() snav!: MatSidenav;
  @Input() isMobile!: boolean;

  links = [
    { title: 'Home', icon: 'home', route: '/home' },
    { title: 'Accounts', icon: 'account_balance', route: '/accounts' },
    { title: 'Profile', icon: 'person', route: '/profile' },
  ];

  closeSidenav() {
    if (this.isMobile) {
      this.snav.close();
    }
  }
}
