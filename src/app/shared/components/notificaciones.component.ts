import { Component, inject } from '@angular/core';
import { NotificacionService, TipoNotificacion } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-notificaciones',
  standalone: false,
  template: `
    <div class="ga-toasts" aria-live="polite">
      @for (n of (notificaciones$ | async) ?? []; track n.id) {
        <div class="alert shadow-sm d-flex align-items-start gap-2 py-2" [class]="'alert-' + clase[n.tipo]" role="alert">
          <i class="bi mt-1" [class]="icono[n.tipo]"></i>
          <div class="flex-grow-1">{{ n.mensaje }}</div>
          <button type="button" class="btn-close" aria-label="Cerrar" (click)="servicio.cerrar(n.id)"></button>
        </div>
      }
    </div>
  `,
})
export class NotificacionesComponent {
  readonly servicio = inject(NotificacionService);
  readonly notificaciones$ = this.servicio.notificaciones$;

  readonly clase: Record<TipoNotificacion, string> = { exito: 'success', error: 'danger', info: 'info' };
  readonly icono: Record<TipoNotificacion, string> = {
    exito: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  };
}
