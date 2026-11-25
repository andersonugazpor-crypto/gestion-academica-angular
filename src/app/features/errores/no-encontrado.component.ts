import { Component } from '@angular/core';

@Component({
  selector: 'app-no-encontrado',
  standalone: false,
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center text-center p-4">
      <div>
        <div class="display-1 fw-bold text-primary">404</div>
        <h1 class="h3">Página no encontrada</h1>
        <p class="text-secondary">La ruta que buscas no existe o fue movida.</p>
        <a class="btn btn-primary" routerLink="/dashboard"><i class="bi bi-house"></i> Ir al inicio</a>
      </div>
    </div>
  `,
})
export class NoEncontradoComponent {}
