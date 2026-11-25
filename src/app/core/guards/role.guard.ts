import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Route, Router, UrlTree } from '@angular/router';
import { Rol } from '../models';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

/**
 * RoleGuard: compara el rol del usuario con data.roles de la ruta.
 * Sirve como canMatch (impide incluso descargar el módulo lazy) y como canActivate.
 *
 *   { path: 'usuarios', canMatch: [roleGuard], data: { roles: ['admin'] }, loadChildren: ... }
 */
export const roleGuard = (route: Route | ActivatedRouteSnapshot): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data?.['roles'] ?? []) as Rol[];

  if (!auth.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }
  if (roles.length === 0 || auth.tieneRol(roles)) {
    return true;
  }
  inject(NotificacionService).error('No tienes permiso para acceder a esa sección.');
  return router.createUrlTree(['/acceso-denegado']);
};
