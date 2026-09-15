import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = typeof window !== 'undefined' ? localStorage.getItem('smarthnl_token') : null;
  if (token) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
