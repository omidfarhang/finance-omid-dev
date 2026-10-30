import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.loaded() && auth.user()) {
    return true;
  }

  return auth.refreshSession().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.loaded() && auth.user()) {
    return router.createUrlTree(['/']);
  }

  return auth.refreshSession().pipe(
    map((user) => (user ? router.createUrlTree(['/']) : true)),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowAdmin = (user: ReturnType<AuthService['user']>) =>
    user?.role === 'ADMIN' ? true : router.createUrlTree(['/']);

  if (auth.loaded()) {
    return allowAdmin(auth.user());
  }

  return auth.refreshSession().pipe(map((user) => allowAdmin(user)));
};
