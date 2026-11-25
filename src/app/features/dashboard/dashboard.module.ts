import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { AdminPanelComponent } from './paneles/admin-panel.component';
import { EstudiantePanelComponent } from './paneles/estudiante-panel.component';
import { ProfesorPanelComponent } from './paneles/profesor-panel.component';

/** Módulo lazy del dashboard con un panel distinto por rol. */
@NgModule({
  declarations: [DashboardComponent, AdminPanelComponent, ProfesorPanelComponent, EstudiantePanelComponent],
  imports: [SharedModule, DashboardRoutingModule],
})
export class DashboardModule {}
