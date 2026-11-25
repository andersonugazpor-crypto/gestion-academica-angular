import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiError } from '../models';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

/**
 * Manejo global de errores HTTP:
 *  - 0   -> la API no está encendida.
 *  - 401 -> token ausente, inválido o expirado: cierra la sesión y lleva al login.
 *  - 403 -> el rol no tiene permiso.
 *  - 5xx -> error del servidor.
 * Siempre re-lanza un ApiError para que el componente pueda reaccionar.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  // Se usa el Injector para obtener AuthService de forma diferida y evitar
  // una dependencia circular (AuthService -> HttpClient -> interceptores).
  private readonly injector = inject(Injector);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

        const notificaciones = this.injector.get(NotificacionService);
        const esLogin = req.url.endsWith('/auth/login');
        const cuerpo = (err.error ?? {}) as { mensaje?: string; errores?: Record<string, string> };
        let mensaje = cuerpo.mensaje ?? 'Ocurrió un error inesperado';

        switch (true) {
          case err.status === 0:
            mensaje = 'No se pudo conectar con la API. Verifica que esté encendida (npm run api).';
            notificaciones.error(mensaje);
            break;
          case err.status === 401 && !esLogin:
            mensaje = 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.';
            this.injector.get(AuthService).cerrarSesion('expirada');
            break;
          case err.status === 403:
            notificaciones.error(mensaje);
            break;
          case err.status >= 500:
            mensaje = 'Error interno del servidor. Inténtalo más tarde.';
            notificaciones.error(mensaje);
            break;
          case err.status === 400 && !!cuerpo.errores:
            // Errores de validación: los muestra el formulario campo por campo.
            break;
          default:
            if (!esLogin) notificaciones.error(mensaje);
        }

        return throwError(() => new ApiError(err.status, mensaje, cuerpo.errores));
      })
    );
  }
}
