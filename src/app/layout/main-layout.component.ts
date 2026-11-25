import { Component, inject } from '@angular/core';
import { Rol } from '../core/models';
import { AuthService } from '../core/services/auth.service';

interface OpcionMenu {
  etiqueta: string;
  icono: string;
  ruta: string;
  roles: Rol[];
}

/**
 * Layout de la zona privada: barra superior, menú lateral según el rol
 * y un <router-outlet> donde se cargan las rutas hijas (rutas anidadas).
 */
@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);
  readonly usuario$ = this.auth.usuario$;
  menuAbierto = false;

  readonly menu: OpcionMenu[] = [
    { etiqueta: 'Dashboard', icono: 'bi-speedometer2', ruta: '/dashboard', roles: ['admin', 'profesor', 'estudiante'] },
    { etiqueta: 'Cursos', icono: 'bi-journal-bookmark', ruta: '/cursos', roles: ['admin', 'profesor', 'estudiante'] },
    { etiqueta: 'Nuevo curso', icono: 'bi-plus-square', ruta: '/cursos/nuevo', roles: ['admin', 'profesor'] },
    { etiqueta: 'Usuarios', icono: 'bi-people', ruta: '/usuarios', roles: ['admin'] },
    { etiqueta: 'Nuevo usuario', icono: 'bi-person-plus', ruta: '/usuarios/nuevo', roles: ['admin'] },
  ];

  salir(): void {
    this.auth.cerrarSesion('manual');
  }
}
