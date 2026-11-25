import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BarraCargaComponent } from './components/barra-carga.component';
import { NotificacionesComponent } from './components/notificaciones.component';
import { AutofocusDirective } from './directives/autofocus.directive';
import { ResaltarDirective } from './directives/resaltar.directive';
import { TieneRolDirective } from './directives/tiene-rol.directive';
import { CreditosPipe } from './pipes/creditos.pipe';
import { FiltroTextoPipe } from './pipes/filtro-texto.pipe';
import { InicialesPipe } from './pipes/iniciales.pipe';
import { RolPipe } from './pipes/rol.pipe';

const DECLARACIONES = [
  RolPipe,
  InicialesPipe,
  CreditosPipe,
  FiltroTextoPipe,
  TieneRolDirective,
  ResaltarDirective,
  AutofocusDirective,
  BarraCargaComponent,
  NotificacionesComponent,
];

/** SharedModule: pipes, directivas y componentes reutilizables por todos los módulos. */
@NgModule({
  declarations: DECLARACIONES,
  imports: [CommonModule, RouterModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ...DECLARACIONES],
})
export class SharedModule {}
