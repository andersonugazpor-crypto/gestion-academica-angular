import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe propio: filtra una lista por texto en los campos indicados,
 * sin distinguir mayúsculas ni tildes.
 *   @for (c of cursos | filtroTexto: busqueda : ['nombre', 'codigo']; track c.id)
 */
@Pipe({ name: 'filtroTexto', standalone: false })
export class FiltroTextoPipe implements PipeTransform {
  transform<T>(lista: T[] | null | undefined, texto: string | null | undefined, campos: (keyof T)[]): T[] {
    if (!lista) return [];
    const buscado = FiltroTextoPipe.normalizar(texto ?? '');
    if (!buscado) return lista;
    return lista.filter((item) =>
      campos.some((campo) => FiltroTextoPipe.normalizar(String(item[campo] ?? '')).includes(buscado))
    );
  }

  private static normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
