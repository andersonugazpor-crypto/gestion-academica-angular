import { Component } from '@angular/core';

@Component({
  selector: 'app-acceso-denegado',
  standalone: false,
  template: `
    <div class="text-center py-5">
      <div class="display-1 text-danger"><i class="bi bi-shield-lock"></i></div>
      <h1 class="h3">Acceso denegado</h1>
      <p class="text-secondary">Tu rol no tiene permiso para ver esta sección.</p>
      <a class="btn btn-primary" routerLink="/dashboard">Volver al dashboard</a>
    </div>
  `,
})
export class AccesoDenegadoComponent {}
