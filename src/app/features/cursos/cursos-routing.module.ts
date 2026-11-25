import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { cambiosPendientesGuard } from '../../core/guards/cambios-pendientes.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { CursoDetalleComponent } from './curso-detalle/curso-detalle.component';
import { CursoFormComponent } from './curso-form/curso-form.component';
import { CursosListaComponent } from './cursos-lista/cursos-lista.component';

/**
 * Rutas hijas de /cursos (RouterModule.forChild).
 *   /cursos            listado (todos los roles)
 *   /cursos/nuevo      crear  (admin, profesor)
 *   /cursos/:id        detalle (ruta parametrizada)
 *   /cursos/:id/editar editar (admin, profesor dueño)
 */
const routes: Routes = [
  { path: '', title: 'Cursos', component: CursosListaComponent },
  {
    path: 'nuevo',
    title: 'Nuevo curso',
    component: CursoFormComponent,
    canActivate: [roleGuard],
    canDeactivate: [cambiosPendientesGuard],
    data: { roles: ['admin', 'profesor'] },
  },
  { path: ':id', title: 'Detalle del curso', component: CursoDetalleComponent },
  {
    path: ':id/editar',
    title: 'Editar curso',
    component: CursoFormComponent,
    canActivate: [roleGuard],
    canDeactivate: [cambiosPendientesGuard],
    data: { roles: ['admin', 'profesor'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CursosRoutingModule {}
