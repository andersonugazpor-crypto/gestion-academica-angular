import { Pipe, PipeTransform } from '@angular/core';

/** Pipe propio: "Anderson Ugaz" -> "AU" (para los avatares). */
@Pipe({ name: 'iniciales', standalone: false })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined, maximo = 2): string {
    if (!nombre) return '?';
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, maximo)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }
}
