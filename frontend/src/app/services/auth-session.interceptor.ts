import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

const RUTAS_AUTH_PUBLICAS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/logout',
  '/auth/email-verification',
];

export const authSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const esRutaAuthPublica = RUTAS_AUTH_PUBLICAS.some((ruta) => req.url.includes(ruta));
        const teniaSesion = !!authService.getToken() || req.headers.has('Authorization');

        if (!esRutaAuthPublica && teniaSesion) {
          authService.manejarSesionExpirada();
          return EMPTY;
        }
      }

      return throwError(() => error);
    }),
  );
};
