import { MediaMatcher } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ToolbarComponent } from "./toolbar/toolbar.component";
import { Router, RouterModule } from '@angular/router';
import { FooterComponent } from "./footer/footer.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { MatTabsModule } from '@angular/material/tabs';
import { AddTransactionDialogComponent } from '../components/add-transaction-dialog/add-transaction-dialog.component';


@Component({
  selector: 'LayoutComponent',
  templateUrl: 'layout.component.html',
  styleUrl: 'layout.component.scss',
  imports: [MatTabsModule,
    MatToolbarModule,
     FooterComponent,
      MatButtonModule,
      MatIconModule,
      MatSidenavModule,
      MatDialogModule,
       ToolbarComponent,
       RouterModule,
       SidebarComponent],
    })
export class LayoutComponent{
  protected readonly isMobile = signal(false);
  protected readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  private readonly _mobileQuery: MediaQueryList;
  private readonly _mobileQueryListener: () => void;

  constructor() {
    const media = inject(MediaMatcher);
    this._mobileQuery = media.matchMedia('(max-width: 600px)');
    this.isMobile.set(this._mobileQuery.matches);
    this._mobileQueryListener = () => this.isMobile.set(this._mobileQuery.matches);
    this._mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  protected openAddTransaction() {
    this.dialog.open(AddTransactionDialogComponent, { width: '600px' });
  }
}