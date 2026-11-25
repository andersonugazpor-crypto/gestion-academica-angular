import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';

interface CuentaDemo {
  rol: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificaciones = inject(NotificacionService);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly cuentasDemo: CuentaDemo[] = [
    { rol: 'Administrador', email: 'admin@idat.edu.pe', password: 'admin123' },
    { rol: 'Profesor', email: 'profesor@idat.edu.pe', password: 'profe123' },
    { rol: 'Estudiante', email: 'estudiante@idat.edu.pe', password: 'estu123' },
  ];

  enviando = false;
  mostrarPassword = false;
  errorLogin = '';
  sesionExpirada = false;
  private returnUrl = '/dashboard';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.sesionExpirada = params.get('motivo') === 'expirada';
    const destino = params.get('returnUrl');
    // Solo se aceptan rutas internas para evitar redirecciones abiertas.
    if (destino && destino.startsWith('/') && !destino.startsWith('//')) this.returnUrl = destino;
  }

  campoInvalido(campo: 'email' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  usarCuenta(cuenta: CuentaDemo): void {
    this.formulario.setValue({ email: cuenta.email, password: cuenta.password });
    this.errorLogin = '';
  }

  ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.errorLogin = '';
    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: (respuesta) => {
        this.notificaciones.exito(`Bienvenido(a), ${respuesta.usuario.nombre}`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: ApiError) => {
        this.enviando = false;
        this.errorLogin = err.message || 'No se pudo iniciar sesión';
      },
    });
  }
}
