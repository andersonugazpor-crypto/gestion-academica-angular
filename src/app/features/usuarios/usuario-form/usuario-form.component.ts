import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ConCambiosPendientes } from '../../../core/guards/cambios-pendientes.guard';
import { ApiError, ROLES, Rol, Usuario, UsuarioForm } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { UsuarioService } from '../../../core/services/usuario.service';

type CampoUsuario = 'nombre' | 'email' | 'rol' | 'password';

@Component({
  selector: 'app-usuario-form',
  standalone: false,
  templateUrl: './usuario-form.component.html',
})
export class UsuarioFormComponent implements OnInit, ConCambiosPendientes {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly notificaciones = inject(NotificacionService);
  private readonly idActual = inject(AuthService).usuarioActual?.id;

  readonly roles = ROLES;
  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['estudiante' as Rol, [Validators.required]],
    activo: [true],
    password: [''],
  });

  idUsuario: number | null = null;
  cargando = false;
  guardando = false;
  private guardado = false;

  get esEdicion(): boolean {
    return this.idUsuario !== null;
  }

  get esMiCuenta(): boolean {
    return this.idUsuario !== null && this.idUsuario === this.idActual;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.idUsuario = id ? Number(id) : null;
    const password = this.formulario.controls.password;

    if (this.esEdicion) {
      // Al editar, la contraseña es opcional (solo si se quiere cambiar).
      password.setValidators([Validators.minLength(6)]);
      this.cargarUsuario(this.idUsuario as number);
    } else {
      password.setValidators([Validators.required, Validators.minLength(6)]);
    }
    password.updateValueAndValidity();
  }

  private cargarUsuario(id: number): void {
    this.cargando = true;
    this.usuarioService.obtener(id).subscribe({
      next: (u: Usuario) => {
        this.formulario.patchValue({ nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo });
        if (this.esMiCuenta) {
          // El administrador no puede quitarse su propio rol ni desactivarse.
          this.formulario.controls.rol.disable();
          this.formulario.controls.activo.disable();
        }
        this.formulario.markAsPristine();
        this.cargando = false;
      },
      error: () => this.router.navigate(['/usuarios']),
    });
  }

  invalido(campo: CampoUsuario): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  mensaje(campo: CampoUsuario): string {
    const errores = this.formulario.get(campo)?.errors;
    if (!errores) return '';
    if (errores['servidor']) return errores['servidor'];
    if (errores['required']) return 'Este campo es obligatorio.';
    if (errores['email']) return 'Ingresa un correo válido.';
    if (errores['minlength']) return `Mínimo ${errores['minlength'].requiredLength} caracteres.`;
    if (errores['maxlength']) return `Máximo ${errores['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { password, ...resto } = this.formulario.getRawValue();
    const datos: UsuarioForm = { ...resto, ...(password ? { password } : {}) };

    const peticion: Observable<Usuario> = this.idUsuario
      ? this.usuarioService.actualizar(this.idUsuario, datos)
      : this.usuarioService.crear(datos);

    this.guardando = true;
    peticion.subscribe({
      next: () => {
        this.guardado = true;
        this.notificaciones.exito(this.esEdicion ? 'Usuario actualizado' : 'Usuario creado');
        this.router.navigate(['/usuarios']);
      },
      error: (err: ApiError) => {
        this.guardando = false;
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
