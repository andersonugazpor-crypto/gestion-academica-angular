import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { UsuarioFormComponent } from './usuario-form/usuario-form.component';
import { UsuariosListaComponent } from './usuarios-lista/usuarios-lista.component';
import { UsuariosRoutingModule } from './usuarios-routing.module';

/** Módulo lazy de usuarios (solo administradores). */
@NgModule({
  declarations: [UsuariosListaComponent, UsuarioFormComponent],
  imports: [SharedModule, UsuariosRoutingModule],
})
export class UsuariosModule {}
