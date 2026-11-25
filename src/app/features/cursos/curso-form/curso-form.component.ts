import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ConCambiosPendientes } from '../../../core/guards/cambios-pendientes.guard';
import { ApiError, Curso, CursoForm, EstadoCurso, ProfesorOpcion } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CursoService } from '../../../core/services/curso.service';
import { NotificacionService } from '../../../core/services/notificacion.service';

type CampoCurso = 'codigo' | 'nombre' | 'descripcion' | 'creditos' | 'horas' | 'cupos' | 'estado' | 'profesorId';

/** Un mismo componente sirve para /cursos/nuevo y /cursos/:id/editar. */
@Component({
  selector: 'app-curso-form',
  standalone: false,
  templateUrl: './curso-form.component.html',
})
export class CursoFormComponent implements OnInit, ConCambiosPendientes {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cursoService = inject(CursoService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly formulario = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,12}$/)]],
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    descripcion: ['', [Validators.maxLength(300)]],
    creditos: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
    horas: [48, [Validators.required, Validators.min(16), Validators.max(160)]],
    cupos: [30, [Validators.required, Validators.min(1), Validators.max(100)]],
    estado: ['ACTIVO' as EstadoCurso, [Validators.required]],
    profesorId: [null as number | null],
  });

  readonly esAdmin = this.auth.usuarioActual?.rol === 'admin';
  profesores: ProfesorOpcion[] = [];
  idCurso: number | null = null;
  cargando = false;
  guardando = false;
  private guardado = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.idCurso = id ? Number(id) : null;

    if (this.esAdmin) {
      this.formulario.controls.profesorId.addValidators(Validators.required);
      this.cursoService
        .listarProfesores()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((lista) => (this.profesores = lista));
    }

    if (this.idCurso) this.cargarCurso(this.idCurso);
  }

  get titulo(): string {
    return this.idCurso ? 'Editar curso' : 'Nuevo curso';
  }

  private cargarCurso(id: number): void {
    this.cargando = true;
    this.cursoService.obtener(id).subscribe({
      next: (curso) => {
        const usuario = this.auth.usuarioActual;
        if (usuario?.rol === 'profesor' && curso.profesorId !== usuario.id) {
          this.notificaciones.error('Solo puedes editar los cursos que dictas.');
          this.router.navigate(['/acceso-denegado']);
          return;
        }
        this.formulario.patchValue(curso);
        this.formulario.markAsPristine();
        this.cargando = false;
      },
      error: () => this.router.navigate(['/cursos']),
    });
  }

  invalido(campo: CampoCurso): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  mensaje(campo: CampoCurso): string {
    const errores = this.formulario.get(campo)?.errors;
    if (!errores) return '';
    if (errores['servidor']) return errores['servidor'];
    if (errores['required']) return 'Este campo es obligatorio.';
    if (errores['pattern']) return 'Usa de 3 a 12 letras, números o guiones (ej. WEB-301).';
    if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres.`;
    if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres.`;
    if (errores['min']) return `El valor mínimo es ${errores['min'].min}.`;
    if (errores['max']) return `El valor máximo es ${errores['max'].max}.`;
    return 'Valor inválido.';
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const datos: CursoForm = { ...valores, codigo: valores.codigo.toUpperCase() };

    const peticion: Observable<Curso> = this.idCurso
      ? this.cursoService.actualizar(this.idCurso, datos)
      : this.cursoService.crear(datos);

    this.guardando = true;
    peticion.subscribe({
      next: (curso) => {
        this.guardado = true;
        this.notificaciones.exito(this.idCurso ? 'Curso actualizado' : 'Curso creado');
        this.router.navigate(['/cursos', curso.id]);
      },
      error: (err: ApiError) => {
        this.guardando = false;
        // Muestra en cada campo el mensaje de validación que devolvió la API.
        Object.entries(err.errores ?? {}).forEach(([campo, mensaje]) => {
          const control = this.formulario.get(campo);
          control?.setErrors({ servidor: mensaje });
          control?.markAsTouched();
        });
      },
    });
  }

  tieneCambiosPendientes(): boolean {
    return this.formulario.dirty && !this.guardado;
  }
}
