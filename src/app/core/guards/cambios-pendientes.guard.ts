import { CanDeactivateFn } from '@angular/router';

/** Contrato que implementan los formularios protegidos por este guard. */
export interface ConCambiosPendientes {
  tieneCambiosPendientes(): boolean;
}

/** Pide confirmación antes de abandonar un formulario con cambios sin guardar. */
export const cambiosPendientesGuard: CanDeactivateFn<ConCambiosPendientes> = (componente) =>
  !componente.tieneCambiosPendientes() || confirm('Tienes cambios sin guardar. ¿Deseas salir de todos modos?');
