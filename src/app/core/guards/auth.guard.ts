import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

/**
 * AuthGuard: solo deja pasar si hay un JWT almacenado y vigente.
 * Si no, redirige al login recordando la URL solicitada (returnUrl).
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;

  const habiaToken = inject(TokenService).obtener() !== null;
  auth.limpiarSesion();
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url, ...(habiaToken ? { motivo: 'expirada' } : {}) },
  });
};

/** Misma regla aplicada a cada ruta hija del layout privado. */
export const authChildGuard: CanActivateChildFn = (route, state) => authGuard(route, state);
