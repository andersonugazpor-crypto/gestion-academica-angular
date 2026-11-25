/** Tipos de usuario que maneja el sistema. */
export type Rol = 'admin' | 'profesor' | 'estudiante';

export const ROLES: readonly Rol[] = ['admin', 'profesor', 'estudiante'] as const;
