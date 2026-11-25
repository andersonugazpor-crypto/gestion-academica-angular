import { Component, inject } from '@angular/core';
import { EstadisticasEstudiante } from '../../../core/models';
import { EstadisticaService } from '../../../core/services/estadistica.service';

@Component({
  selector: 'app-estudiante-panel',
  standalone: false,
  template: `
    @if (estadisticas$ | async; as e) {
      <div class="row g-3 mb-4">
        <div class="col-sm-6">
          <div class="card ga-card ga-stat"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-bookmark-check"></i> Cursos inscritos</div>
            <div class="display-6">{{ e.cursosInscritos }}</div>
          </div></div>
        </div>
        <div class="col-sm-6">
          <div class="card ga-card ga-stat"><div class="card-body">
            <div class="text-secondary"><i class="bi bi-award"></i> Créditos matriculados</div>
            <div class="display-6">{{ e.creditos }}</div>
          </div></div>
        </div>
      </div>
      <div class="card ga-card">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>Mis cursos</strong>
          <a class="btn btn-sm btn-primary" routerLink="/cursos"><i class="bi bi-search"></i> Ver catálogo</a>
        </div>
        <ul class="list-group list-group-flush">
          @for (c of e.cursos; track c.id) {
            <li class="list-group-item d-flex justify-content-between align-items-center" appResaltar>
              <a [routerLink]="['/cursos', c.id]">{{ c.nombre }}</a>
              <span class="text-secondary small">{{ c.profesorNombre }} · {{ c.creditos | creditos }}</span>
            </li>
          } @empty {
            <li class="list-group-item text-secondary">Todavía no te inscribes en ningún curso.</li>
          }
        </ul>
      </div>
    }
  `,
})
export class EstudiantePanelComponent {
  readonly estadisticas$ = inject(EstadisticaService).obtener<EstadisticasEstudiante>();
}
