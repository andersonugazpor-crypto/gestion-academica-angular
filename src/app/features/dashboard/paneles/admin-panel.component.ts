import { Component, inject } from '@angular/core';
import { EstadisticasAdmin } from '../../../core/models';
import { EstadisticaService } from '../../../core/services/estadistica.service';

@Component({
  selector: 'app-admin-panel',
  standalone: false,
  template: `
    @if (estadisticas$ | async; as e) {
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="card ga-card ga-stat h-100"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-people"></i> Usuarios</div>
            <div class="display-6">{{ e.totalUsuarios }}</div>
          </div></div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card ga-card ga-stat h-100"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-journal-bookmark"></i> Cursos</div>
            <div class="display-6">{{ e.totalCursos }}</div>
          </div></div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card ga-card ga-stat h-100"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-check2-circle"></i> Cursos activos</div>
            <div class="display-6 text-success">{{ e.cursosActivos }}</div>
          </div></div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="card ga-card h-100"><div class="card-body">
            <div class="text-secondary mb-2">Usuarios por rol</div>
            @for (fila of e.porRol | keyvalue; track fila.key) {
              <div class="d-flex justify-content-between">
                <span>{{ $any(fila.key) | rol }}</span><strong>{{ fila.value }}</strong>
              </div>
            }
          </div></div>
        </div>
      </div>
    }
    <div class="card ga-card"><div class="card-body d-flex flex-wrap gap-2">
      <a class="btn btn-primary" routerLink="/usuarios/nuevo"><i class="bi bi-person-plus"></i> Nuevo usuario</a>
      <a class="btn btn-outline-primary" routerLink="/cursos/nuevo"><i class="bi bi-plus-square"></i> Nuevo curso</a>
      <a class="btn btn-outline-secondary" routerLink="/usuarios"><i class="bi bi-people"></i> Gestionar usuarios</a>
    </div></div>
  `,
})
export class AdminPanelComponent {
  readonly estadisticas$ = inject(EstadisticaService).obtener<EstadisticasAdmin>();
}
