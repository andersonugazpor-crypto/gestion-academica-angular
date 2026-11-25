import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';

/**
 * Inserta automáticamente "Authorization: Bearer <token>" en cada petición a la API.
 * Si el token ya venció, no envía la petición y responde con un 401 local,
 * que el ErrorInterceptor convierte en cierre de sesión.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly tokenService = inject(TokenService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const esApi = req.url.startsWith(environment.apiUrl);
    const esLogin = req.url.endsWith('/auth/login');
    const token = this.tokenService.obtener();

    if (!esApi || esLogin || !token) {
      return next.handle(req);
    }

    if (this.tokenService.estaExpirado(token)) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            url: req.url,
            error: { mensaje: 'Token expirado' },
          })
      );
    }

    const conToken = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next.handle(conToken);
  }
}
