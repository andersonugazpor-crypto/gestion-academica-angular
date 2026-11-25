import { Pipe, PipeTransform } from '@angular/core';
import { Rol } from '../../core/models';

const NOMBRES: Record<Rol, string> = {
  admin: 'Administrador',
  profesor: 'Profesor',
  estudiante: 'Estudiante',
};

const COLORES: Record<Rol, string> = {
  admin: 'danger',
  profesor: 'primary',
  estudiante: 'success',
};

/**
 * Pipe propio: convierte el código de rol en texto legible o en un color de Bootstrap.
 *   {{ 'admin' | rol }}          -> Administrador
 *   {{ 'admin' | rol: 'color' }} -> danger
 */
@Pipe({ name: 'rol', standalone: false })
export class RolPipe implements PipeTransform {
  transform(rol: Rol | null | undefined, modo: 'texto' | 'color' = 'texto'): string {
    if (!rol) return modo === 'color' ? 'secondary' : '—';
    return modo === 'color' ? COLORES[rol] : NOMBRES[rol];
  }
}
