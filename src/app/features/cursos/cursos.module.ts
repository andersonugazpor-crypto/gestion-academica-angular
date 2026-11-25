import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { CursoDetalleComponent } from './curso-detalle/curso-detalle.component';
import { CursoFormComponent } from './curso-form/curso-form.component';
import { CursosListaComponent } from './cursos-lista/cursos-lista.component';
import { CursosRoutingModule } from './cursos-routing.module';

/** Módulo lazy de cursos. */
@NgModule({
  declarations: [CursosListaComponent, CursoFormComponent, CursoDetalleComponent],
  imports: [SharedModule, CursosRoutingModule],
})
export class CursosModule {}
