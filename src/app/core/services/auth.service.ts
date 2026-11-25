import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Rol, UsuarioSesion } from '../models';
import { TokenService } from './token.service';

export type MotivoCierre = 'manual' | 'expirada';

/**
 * Gestiona la sesión: login contra la API, estado del usuario actual (Observable),
 * verificación de roles y cierre de sesión automático cuando el JWT expira.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  private readonly usuarioSubject = new BehaviorSubject<UsuarioSesion | null>(null);
  /** Emite el usuario actual cada vez que inicia o cierra sesión. */
  readonly usuario$: Observable<UsuarioSesion | null> = this.usuarioSubject.asObservable();

  private temporizador: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Restaura la sesión al recargar la página, solo si el token sigue vigente.
    if (this.estaAutenticado()) {
      this.usuarioSubject.next(this.tokenService.usuarioDelToken());
      this.programarExpiracion();
    } else {
      this.tokenService.eliminar();
    }
  }

  get usuarioActual(): UsuarioSesion | null {
    return this.usuarioSubject.value;
  }

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((respuesta) => {
        this.tokenService.guardar(respuesta.token);
        this.usuarioSubject.next(this.tokenService.usuarioDelToken(respuesta.token));
        this.programarExpiracion();
      })
    );
  }

  /** Borra el token y el estado, sin navegar. */
  limpiarSesion(): void {
    this.tokenService.eliminar();
    this.usuarioSubject.next(null);
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }

  /** Cierra la sesión y redirige al login (indicando si fue por expiración). */
  cerrarSesion(motivo: MotivoCierre = 'manual'): void {
    const habiaSesion = this.usuarioActual !== null;
    this.limpiarSesion();
    if (motivo === 'expirada' && habiaSesion) {
      this.router.navigate(['/login'], { queryParams: { motivo: 'expirada' } });
    } else {
      this.router.navigate(['/login']);
    }
  }

  estaAutenticado(): boolean {
    const token = this.tokenService.obtener();
    return !!token && !this.tokenService.estaExpirado(token);
  }

  tieneRol(roles: readonly Rol[]): boolean {
    const usuario = this.usuarioActual;
    return !!usuario && this.estaAutenticado() && roles.includes(usuario.rol);
  }

  /** Programa el cierre de sesión para el momento exacto en que vence el token. */
  private programarExpiracion(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    const expira = this.tokenService.expiraEn();
    if (!expira) return;
    const restante = Math.max(expira - Date.now(), 0);
    this.temporizador = setTimeout(() => this.cerrarSesion('expirada'), restante);
  }
}
