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
    return router.createUrlTree(['/wallets']);
  }

  return auth.refreshSession().pipe(
    map((user) => (user ? router.createUrlTree(['/wallets']) : true)),
  );
};
