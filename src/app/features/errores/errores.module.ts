import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AccesoDenegadoComponent } from './acceso-denegado.component';
import { NoEncontradoComponent } from './no-encontrado.component';

@NgModule({
  declarations: [NoEncontradoComponent, AccesoDenegadoComponent],
  imports: [SharedModule],
})
export class ErroresModule {}
