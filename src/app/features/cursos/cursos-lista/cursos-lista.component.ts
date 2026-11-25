import { Component, inject } from '@angular/core';
import { Observable, BehaviorSubject, catchError, of, switchMap } from 'rxjs';
import { Curso, EstadoCurso } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CursoService } from '../../../core/services/curso.service';
import { NotificacionService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-cursos-lista',
  standalone: false,
  templateUrl: './cursos-lista.component.html',
})
export class CursosListaComponent {
  private readonly cursoService = inject(CursoService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly auth = inject(AuthService);

  readonly usuario = this.auth.usuarioActual;
  readonly camposBusqueda: (keyof Curso)[] = ['codigo', 'nombre', 'profesorNombre'];
  busqueda = '';
  filtroEstado: '' | EstadoCurso = '';
  procesandoId: number | null = null;

  /** Cada next() vuelve a pedir la lista a la API (flujo con Observables). */
  private readonly recargar$ = new BehaviorSubject<void>(undefined);
  readonly cursos$ = this.recargar$.pipe(
    switchMap(() => this.cursoService.listar().pipe(catchError(() => of([] as Curso[]))))
  );

  puedeEditar(curso: Curso): boolean {
    const u = this.usuario;
    return !!u && (u.rol === 'admin' || (u.rol === 'profesor' && curso.profesorId === u.id));
  }

  eliminar(curso: Curso): void {
    if (!confirm(`¿Eliminar el curso "${curso.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.procesandoId = curso.id;
    this.cursoService.eliminar(curso.id).subscribe({
      next: () => {
        this.notificaciones.exito('Curso eliminado');
        this.procesandoId = null;
        this.recargar$.next();
      },
      error: () => (this.procesandoId = null),
    });
  }

  alternarInscripcion(curso: Curso): void {
    this.procesandoId = curso.id;
    const peticion: Observable<unknown> = curso.inscrito
      ? this.cursoService.anularInscripcion(curso.id)
      : this.cursoService.inscribirse(curso.id);
    peticion.subscribe({
      next: () => {
        this.notificaciones.exito(curso.inscrito ? 'Inscripción anulada' : `Te inscribiste en ${curso.nombre}`);
        this.procesandoId = null;
        this.recargar$.next();
      },
      error: () => (this.procesandoId = null),
    });
  }
}