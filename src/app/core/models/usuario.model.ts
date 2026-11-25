import { Rol } from './rol.model';

/** Usuario tal como lo devuelve la API (sin contraseña). */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
}

/** Datos que se envían al crear o editar un usuario. */
export interface UsuarioForm {
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  /** Obligatoria al crear; opcional al editar (solo si se cambia). */
  password?: string;
}

/** Datos mínimos del usuario que inició sesión (se leen del JWT). */
export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}
