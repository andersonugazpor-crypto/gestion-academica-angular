import { Component, inject } from '@angular/core';
import { EstadisticasProfesor } from '../../../core/models';
import { EstadisticaService } from '../../../core/services/estadistica.service';

@Component({
  selector: 'app-profesor-panel',
  standalone: false,
  template: `
    @if (estadisticas$ | async; as e) {
      <div class="row g-3 mb-4">
        <div class="col-sm-6">
          <div class="card ga-card ga-stat"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-journal-bookmark"></i> Mis cursos</div>
            <div class="display-6">{{ e.misCursos }}</div>
          </div></div>
        </div>
        <div class="col-sm-6">
          <div class="card ga-card ga-stat"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-mortarboard"></i> Estudiantes a cargo</div>
            <div class="display-6">{{ e.totalEstudiantes }}</div>
          </div></div>
        </div>
      </div>
      <div class="card ga-card">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>Cursos que dicto</strong>
          <a class="btn btn-sm btn-primary" routerLink="/cursos/nuevo"><i class="bi bi-plus"></i> Nuevo curso</a>
        </div>
        <ul class="list-group list-group-flush">
          @for (c of e.cursos; track c.id) {
            <li class="list-group-item d-flex justify-content-between align-items-center" appResaltar>
              <a [routerLink]="['/cursos', c.id]">{{ c.codigo }} · {{ c.nombre }}</a>
              <span class="badge text-bg-light">{{ c.inscritos }}/{{ c.cupos }} inscritos</span>
            </li>
          } @empty {
            <li class="list-group-item text-secondary">Aún no tienes cursos asignados.</li>
          }
        </ul>
      </div>
    }
  `,
})
export class ProfesorPanelComponent {
  readonly estadisticas$ = inject(EstadisticaService).obtener<EstadisticasProfesor>();
}
