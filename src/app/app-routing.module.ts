import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { roleGuard } from './core/guards/role.guard';
import { AccesoDenegadoComponent } from './features/errores/acceso-denegado.component';
import { NoEncontradoComponent } from './features/errores/no-encontrado.component';
import { MainLayoutComponent } from './layout/main-layout.component';

/**
 * Rutas raíz (RouterModule.forRoot).
 *  - /login            pública, protegida por LoginGuard (si ya hay sesión, va al dashboard).
 *  - '' (layout)       privada, protegida por AuthGuard; sus hijas se cargan con lazy loading.
 *  - /usuarios         además exige rol admin (RoleGuard con canMatch: ni siquiera descarga el módulo).
 *  - **                cualquier ruta inexistente muestra la página 404.
 */
const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [loginGuard],
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'cursos',
        loadChildren: () => import('./features/cursos/cursos.module').then((m) => m.CursosModule),
      },
      {
        path: 'usuarios',
        canMatch: [roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/usuarios/usuarios.module').then((m) => m.UsuariosModule),
      },
      { path: 'acceso-denegado', title: 'Acceso denegado', component: AccesoDenegadoComponent },
      { path: 'inicio', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', title: 'Página no encontrada', component: NoEncontradoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
