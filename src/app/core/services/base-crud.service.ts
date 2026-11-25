import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Clase base genérica (POO: herencia + genéricos) que centraliza las
 * operaciones HTTP de un CRUD. Cada entidad solo define su endpoint.
 *
 * @typeParam T     Modelo que devuelve la API.
 * @typeParam TForm Datos que se envían al crear o actualizar.
 */
export abstract class BaseCrudService<T, TForm> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly endpoint: string;

  protected get url(): string {
    return `${environment.apiUrl}/${this.endpoint}`;
  }

  listar(filtros: Record<string, string | number | undefined> = {}): Observable<T[]> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<T[]>(this.url, { params });
  }

  obtener(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  crear(datos: TForm): Observable<T> {
    return this.http.post<T>(this.url, datos);
  }

  actualizar(id: number, datos: Partial<TForm>): Observable<T> {
    return this.http.put<T>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
