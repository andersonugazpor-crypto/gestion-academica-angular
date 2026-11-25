import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-barra-carga',
  standalone: false,
  template: `@if (cargando$ | async) {
    <div class="ga-loading-bar" role="progressbar" aria-label="Cargando"></div>
  }`,
})
export class BarraCargaComponent {
  readonly cargando$ = inject(LoadingService).cargando$;
}
