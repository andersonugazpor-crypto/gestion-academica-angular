import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';

/** Cuenta las peticiones HTTP en curso para mostrar la barra de carga. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendientes = new BehaviorSubject<number>(0);
  readonly cargando$ = this.pendientes.pipe(
    map((n) => n > 0),
    distinctUntilChanged()
  );

  iniciar(): void {
    this.pendientes.next(this.pendientes.value + 1);
  }

  terminar(): void {
    this.pendientes.next(Math.max(this.pendientes.value - 1, 0));
  }
}
