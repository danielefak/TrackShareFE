import { Component, Input, computed, effect, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/api.auth.service';
import { MatButtonModule} from '@angular/material/button';
import { DarkModeService } from '../../services/dark-mode.service'; // Import the DarkModeService
//import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';  // Import MatMenuModule
import { MatTooltipModule } from '@angular/material/tooltip'; 


export type MenuItem = {
  title: string;  // Title of the menu item
  icon: string;   // Icon of the menu item  (Material Icon)
  route: string;   // Router link of the menu item (e.g. /dashboard)   
  action: Function;
}


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatMenuModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    RouterLink, RouterLinkActive,
    MatButtonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() sidenav!: any;
  @Input() isMobile!: boolean;
  darkMode = signal(false);



  selectedPalette = "azure"

  colorPalettes = [
    { name: 'Azure', value: 'azure' },
    { name: 'Orange', value: 'orange' },
    { name: 'Violet', value: 'violet' },
    { name: 'Green', value: 'green' },
    { name: 'Red', value: 'red' },
    { name: 'Blue', value: 'blue' },
    { name: 'Yellow', value: 'yellow' },
    { name: 'Cyan', value: 'cyan' },
    { name: 'Magenta', value: 'magenta' },
    { name: 'Chartreuse', value: 'chartreuse' },
    { name: 'Spring Green', value: 'spring-green' },
    { name: 'Rose', value: 'rose' }
  ];
  

  menuItems = signal<MenuItem[]>([
    { title: 'Home', icon: 'home', route: '/home', action: () => this.closeSidenav() },
    { title: 'Accounts', icon: 'account_balance', route: '/accounts', action: () => this.closeSidenav() },
    { title: 'Categories', icon: 'category', route: '/categories', action: () => this.closeSidenav() },
    { title: 'Attention', icon: 'report_problem', route: '/attention', action: () => this.closeSidenav() },
    { title: 'About', icon: 'info', route: '/about', action: () => this.closeSidenav() },
    { title: 'Activity History', icon: 'history', route: '/activity-history', action: () => this.closeSidenav() },
    { title: 'Import/Export', icon: 'import_export', route: '/import-export', action: () => this.closeSidenav() },
    { title: 'Profile', icon: 'person', route: '/profile', action: () => this.closeSidenav() },
    { title: 'Logout', icon: 'exit_to_app', route: '/logout', action: () => this.logout() }
  ]);



  constructor(private authService: AuthService, private router: Router, private darkModeService: DarkModeService) {}

  toggleDarkMode() {
    this.darkModeService.toggleDarkMode();
  }

  isDarkMode(){
    return this.darkModeService.isDarkMode()
  }

  closeSidenav() {
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  logout() {
    this.authService.logout();
  }

  changeColorPalette(color: string) {
    this.darkModeService.changeColor(color);
  }

}
