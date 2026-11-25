import { Component, Type, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { AdminPanelComponent } from './paneles/admin-panel.component';
import { EstudiantePanelComponent } from './paneles/estudiante-panel.component';
import { ProfesorPanelComponent } from './paneles/profesor-panel.component';

/**
 * Carga dinámica de componentes según el tipo de usuario:
 * el dashboard no conoce el contenido; elige en tiempo de ejecución qué panel
 * crear con *ngComponentOutlet a partir del rol del JWT.
 */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    @if (vista$ | async; as vista) {
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 class="h3 mb-0">Hola, {{ vista.nombre }}</h1>
          <span class="text-secondary">Panel de {{ vista.rol | rol | lowercase }}</span>
        </div>
        <span class="badge fs-6" [class]="'text-bg-' + (vista.rol | rol: 'color')">{{ vista.rol | rol }}</span>
      </div>
      <ng-container *ngComponentOutlet="vista.panel"></ng-container>
    }
  `,
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);

  private readonly panelesPorRol: Record<Rol, Type<unknown>> = {
    admin: AdminPanelComponent,
    profesor: ProfesorPanelComponent,
    estudiante: EstudiantePanelComponent,
  };

  readonly vista$: Observable<{ nombre: string; rol: Rol; panel: Type<unknown> } | null> = this.auth.usuario$.pipe(
    map((u) => (u ? { nombre: u.nombre, rol: u.rol, panel: this.panelesPorRol[u.rol] } : null))
  );
}
