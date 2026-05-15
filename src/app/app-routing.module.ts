import { provideRouter, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'signin', loadComponent: () => import('./pages/signin/signin.component').then(m => m.SigninComponent) },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'about', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'accounts', loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent) },
      { path: 'accounts/:id', loadComponent: () => import('./pages/account-detail/account-detail.component').then(m => m.AccountDetailComponent) },
      { path: 'categories', loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'attention', loadComponent: () => import('./pages/attention/attention.component').then(m => m.AttentionComponent) },
      { path: 'activity-history', loadComponent: () => import('./pages/activity-history/activity-history.component').then(m => m.ActivityHistoryComponent) },
      { path: 'logs', redirectTo: '/activity-history', pathMatch: 'full' },
      { path: '', redirectTo: '/home', pathMatch: 'full' }
    ]
  },
  { path: '**', loadComponent: () => import('./pages/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent) }
];

export const appRoutingProviders = [
  provideRouter(routes)
];