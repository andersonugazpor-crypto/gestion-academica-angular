import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { ErroresModule } from './features/errores/errores.module';
import { LayoutModule } from './layout/layout.module';
import { SharedModule } from './shared/shared.module';

/**
 * Módulo raíz. Los módulos de funcionalidad (auth, dashboard, cursos, usuarios)
 * NO se importan aquí: se cargan bajo demanda (lazy loading) desde AppRoutingModule.
 */
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, CoreModule, SharedModule, LayoutModule, ErroresModule, AppRoutingModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
