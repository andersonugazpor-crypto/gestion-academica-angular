import { Pipe, PipeTransform } from '@angular/core';

/** Pipe propio: 4 -> "4 créditos", 1 -> "1 crédito". */
@Pipe({ name: 'creditos', standalone: false })
export class CreditosPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '—';
    return `${valor} ${valor === 1 ? 'crédito' : 'créditos'}`;
  }
}
