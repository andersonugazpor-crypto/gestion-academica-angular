export type EstadoCurso = 'ACTIVO' | 'INACTIVO';

export interface EstudianteResumen {
  id: number;
  nombre: string;
  email: string;
}

export interface Curso {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  horas: number;
  cupos: number;
  estado: EstadoCurso;
  profesorId: number;
  profesorNombre: string | null;
  inscritos: number;
  /** true si el estudiante que consulta está inscrito. */
  inscrito?: boolean;
  /** Solo para admin y profesor en el detalle. */
  listaEstudiantes?: EstudianteResumen[];
}

export interface CursoForm {
  codigo: string;
  nombre: string;
  descripcion: string;
  creditos: number;
  horas: number;
  cupos: number;
  estado: EstadoCurso;
  profesorId: number | null;
}

export interface ProfesorOpcion {
  id: number;
  nombre: string;
}
