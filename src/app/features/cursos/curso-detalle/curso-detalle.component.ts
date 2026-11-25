import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, EMPTY, Observable, catchError, combineLatest, map, switchMap } from 'rxjs';
import { Curso } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CursoService } from '../../../core/services/curso.service';
import { NotificacionService } from '../../../core/services/notificacion.service';

/** Detalle de /cursos/:id. Reacciona a cambios del parámetro :id con paramMap (Observable). */
@Component({
  selector: 'app-curso-detalle',
  standalone: false,
  templateUrl: './curso-detalle.component.html',
})
export class CursoDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cursoService = inject(CursoService);
  private readonly notificaciones = inject(NotificacionService);
  readonly usuario = inject(AuthService).usuarioActual;

  private readonly recargar$ = new BehaviorSubject<void>(undefined);
  procesando = false;

  readonly curso$ = combineLatest([this.route.paramMap, this.recargar$]).pipe(
    map(([params]) => Number(params.get('id'))),
    switchMap((id) =>
      this.cursoService.obtener(id).pipe(
        catchError(() => {
          this.router.navigate(['/cursos']);
          return EMPTY;
        })
      )
    )
  );

  puedeEditar(curso: Curso): boolean {
    const u = this.usuario;
    return !!u && (u.rol === 'admin' || (u.rol === 'profesor' && curso.profesorId === u.id));
  }

  alternarInscripcion(curso: Curso): void {
    this.procesando = true;
    const peticion: Observable<unknown> = curso.inscrito
      ? this.cursoService.anularInscripcion(curso.id)
      : this.cursoService.inscribirse(curso.id);
    peticion.subscribe({
      next: () => {
        this.notificaciones.exito(curso.inscrito ? 'Inscripción anulada' : 'Inscripción registrada');
        this.procesando = false;
        this.recargar$.next();
      },
      error: () => (this.procesando = false),
    });
  }
}
