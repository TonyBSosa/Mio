import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
export const accesoRol: CanActivateFn = route => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado() && route.data['roles'].includes(auth.getRol()) ? true : router.createUrlTree(['/login']);
};
