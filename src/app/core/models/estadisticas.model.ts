import { Curso } from './curso.model';
import { Rol } from './rol.model';

export interface EstadisticasAdmin {
  totalUsuarios: number;
  totalCursos: number;
  cursosActivos: number;
  porRol: Record<Rol, number>;
}

export interface EstadisticasProfesor {
  misCursos: number;
  totalEstudiantes: number;
  cursos: Curso[];
}

export interface EstadisticasEstudiante {
  cursosInscritos: number;
  creditos: number;
  cursos: Curso[];
}
