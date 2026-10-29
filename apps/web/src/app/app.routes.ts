import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { LoginPage } from './pages/login/login.page';
import { ProfilePage } from './pages/profile/profile.page';
import { RegisterPage } from './pages/register/register.page';
import { StatusPage } from './pages/status/status.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'profile' },
  { path: 'status', component: StatusPage },
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'profile' },
];
