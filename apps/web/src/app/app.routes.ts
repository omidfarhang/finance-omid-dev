import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth.guard';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { GuestShellComponent } from './layout/guest-shell/guest-shell.component';
import { AccountDetailPage } from './pages/accounts/account-detail.page';
import { AccountsPage } from './pages/accounts/accounts.page';
import { ActivityPage } from './pages/activity/activity.page';
import { AdminPage } from './pages/admin/admin.page';
import { AdminUserPage } from './pages/admin/admin-user.page';
import { HomePage } from './pages/home/home.page';
import { ImportPage } from './pages/import/import.page';
import { LoginPage } from './pages/login/login.page';
import { OutlookPage } from './pages/outlook/outlook.page';
import { RegisterPage } from './pages/register/register.page';
import { SettingsPage } from './pages/settings/settings.page';
import { StatusPage } from './pages/status/status.page';

export const routes: Routes = [
  { path: 'wallets', redirectTo: 'accounts', pathMatch: 'full' },
  { path: 'profile', redirectTo: 'settings', pathMatch: 'full' },
  {
    path: 'login',
    component: GuestShellComponent,
    canActivate: [guestGuard],
    children: [{ path: '', component: LoginPage }],
  },
  {
    path: 'register',
    component: GuestShellComponent,
    canActivate: [guestGuard],
    children: [{ path: '', component: RegisterPage }],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminPage },
      { path: 'users/:userId', component: AdminUserPage },
    ],
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomePage },
      { path: 'activity', component: ActivityPage },
      { path: 'accounts', component: AccountsPage },
      { path: 'accounts/:accountId', component: AccountDetailPage },
      { path: 'import', component: ImportPage },
      { path: 'outlook', component: OutlookPage },
      { path: 'settings', component: SettingsPage },
      { path: 'status', component: StatusPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
