/**
 * Error normalizado que devuelve el ErrorInterceptor a los componentes,
 * para que no dependan del formato de HttpErrorResponse.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    mensaje: string,
    /** Errores por campo (validación 400), p. ej. { email: 'Correo inválido' }. */
    public readonly errores: Record<string, string> = {}
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }

  get esValidacion(): boolean {
    return this.status === 400 && Object.keys(this.errores).length > 0;
  }
}
