import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Mensajes emergentes (toasts) para toda la aplicación. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private contador = 0;
  private readonly lista = new BehaviorSubject<Notificacion[]>([]);
  readonly notificaciones$ = this.lista.asObservable();

  exito(mensaje: string): void {
    this.agregar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.agregar('error', mensaje);
  }

  info(mensaje: string): void {
    this.agregar('info', mensaje);
  }

  cerrar(id: number): void {
    this.lista.next(this.lista.value.filter((n) => n.id !== id));
  }

  private agregar(tipo: TipoNotificacion, mensaje: string): void {
    // Evita repetir el mismo mensaje si ya está en pantalla.
    if (this.lista.value.some((n) => n.mensaje === mensaje)) return;
    const id = ++this.contador;
    this.lista.next([...this.lista.value, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), 4500);
  }
}
