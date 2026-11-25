import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Curso, CursoForm, ProfesorOpcion } from '../models';
import { BaseCrudService } from './base-crud.service';

@Injectable({ providedIn: 'root' })
export class CursoService extends BaseCrudService<Curso, CursoForm> {
  protected readonly endpoint = 'cursos';

  inscribirse(id: number): Observable<Curso> {
    return this.http.post<Curso>(`${this.url}/${id}/inscripcion`, {});
  }

  anularInscripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}/inscripcion`);
  }

  listarProfesores(): Observable<ProfesorOpcion[]> {
    return this.http.get<ProfesorOpcion[]>(`${environment.apiUrl}/profesores`);
  }
}
