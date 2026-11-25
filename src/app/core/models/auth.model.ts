import { Rol } from './rol.model';
import { Usuario } from './usuario.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: 'Bearer';
  /** Vida del token en segundos. */
  expiraEn: number;
  usuario: Usuario;
}

/** Contenido (payload) del JWT emitido por la API. */
export interface JwtPayload {
  sub: number;
  email: string;
  nombre: string;
  rol: Rol;
  iat: number;
  exp: number;
}
