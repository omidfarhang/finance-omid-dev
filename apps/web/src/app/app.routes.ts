import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth.guard';
import { AdminPage } from './pages/admin/admin.page';
import { LoginPage } from './pages/login/login.page';
import { ProfilePage } from './pages/profile/profile.page';
import { RegisterPage } from './pages/register/register.page';
import { StatusPage } from './pages/status/status.page';
import { WalletsPage } from './pages/wallets/wallets.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'wallets' },
  { path: 'status', component: StatusPage },
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: 'wallets', component: WalletsPage, canActivate: [authGuard] },
  { path: 'admin', component: AdminPage, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'wallets' },
];
