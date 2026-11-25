import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Las estadísticas cambian según el rol del token; cada panel indica el tipo que espera. */
@Injectable({ providedIn: 'root' })
export class EstadisticaService {
  private readonly http = inject(HttpClient);

  obtener<T>(): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}/estadisticas`);
  }
}
