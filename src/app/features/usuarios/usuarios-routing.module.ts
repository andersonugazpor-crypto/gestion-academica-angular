import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { cambiosPendientesGuard } from '../../core/guards/cambios-pendientes.guard';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';
import { UsuariosListaComponent } from './usuarios-lista/usuarios-lista.component';

/**
 * Rutas hijas de /usuarios (RouterModule.forChild).
 * Todo el módulo ya está protegido por RoleGuard (solo admin) en AppRoutingModule.
 */
const routes: Routes = [
  { path: '', title: 'Usuarios', component: UsuariosListaComponent },
  { path: 'nuevo', title: 'Nuevo usuario', component: UsuarioFormComponent, canDeactivate: [cambiosPendientesGuard] },
  {
    path: ':id/editar',
    title: 'Editar usuario',
    component: UsuarioFormComponent,
    canDeactivate: [cambiosPendientesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsuariosRoutingModule {}
