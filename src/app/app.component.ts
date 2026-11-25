import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <app-barra-carga></app-barra-carga>
    <app-notificaciones></app-notificaciones>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
