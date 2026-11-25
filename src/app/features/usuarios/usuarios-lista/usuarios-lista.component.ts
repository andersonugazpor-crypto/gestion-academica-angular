import { Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, of, switchMap } from 'rxjs';
import { ROLES, Rol, Usuario } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-usuarios-lista',
  standalone: false,
  templateUrl: './usuarios-lista.component.html',
})
export class UsuariosListaComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly notificaciones = inject(NotificacionService);
  readonly idActual = inject(AuthService).usuarioActual?.id;

  readonly roles = ROLES;
  readonly camposBusqueda: (keyof Usuario)[] = ['nombre', 'email'];
  busqueda = '';
  eliminandoId: number | null = null;

  /** El filtro por rol se envía a la API (?rol=...); cada cambio dispara una nueva petición. */
  private readonly filtroRol$ = new BehaviorSubject<Rol | ''>('');
  readonly usuarios$ = this.filtroRol$.pipe(
    switchMap((rol) =>
      this.usuarioService.listar({ rol: rol || undefined }).pipe(catchError(() => of([] as Usuario[])))
    )
  );

  get filtroRol(): Rol | '' {
    return this.filtroRol$.value;
  }

  set filtroRol(valor: Rol | '') {
    this.filtroRol$.next(valor);
  }

  eliminar(usuario: Usuario): void {
    if (!confirm(`¿Eliminar a ${usuario.nombre}?`)) return;
    this.eliminandoId = usuario.id;
    this.usuarioService.eliminar(usuario.id).subscribe({
      next: () => {
        this.notificaciones.exito('Usuario eliminado');
        this.eliminandoId = null;
        this.filtroRol$.next(this.filtroRol$.value);
      },
      error: () => (this.eliminandoId = null),
    });
  }
}
