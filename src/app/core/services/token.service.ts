import { Injectable } from '@angular/core';
import { JwtPayload, UsuarioSesion } from '../models';

/**
 * Encapsula el almacenamiento del JWT en localStorage y la lectura de su payload.
 * Ningún otro archivo accede directamente a localStorage.
 */
@Injectable({ providedIn: 'root' })
export class TokenService {
  private static readonly CLAVE = 'ga_token';

  guardar(token: string): void {
    localStorage.setItem(TokenService.CLAVE, token);
  }

  obtener(): string | null {
    return localStorage.getItem(TokenService.CLAVE);
  }

  eliminar(): void {
    localStorage.removeItem(TokenService.CLAVE);
  }

  /** Decodifica el payload (parte central) del JWT. No valida la firma: eso lo hace la API. */
  decodificar(token: string | null = this.obtener()): JwtPayload | null {
    if (!token) return null;
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    try {
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  /** Fecha de expiración en milisegundos, o null si el token no es válido. */
  expiraEn(token: string | null = this.obtener()): number | null {
    const payload = this.decodificar(token);
    return payload?.exp ? payload.exp * 1000 : null;
  }

  estaExpirado(token: string | null = this.obtener()): boolean {
    const exp = this.expiraEn(token);
    return exp === null || exp <= Date.now();
  }

  usuarioDelToken(token: string | null = this.obtener()): UsuarioSesion | null {
    const p = this.decodificar(token);
    return p ? { id: p.sub, nombre: p.nombre, email: p.email, rol: p.rol } : null;
  }
}
