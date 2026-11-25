import { Directive, HostBinding, HostListener } from '@angular/core';

/**
 * Directiva de atributo propia: resalta una fila de tabla o una tarjeta al pasar el mouse.
 *   <tr appResaltar> ... </tr>
 */
@Directive({ selector: '[appResaltar]', standalone: false })
export class ResaltarDirective {
  @HostBinding('class.ga-resaltado') activo = false;

  @HostListener('mouseenter')
  alEntrar(): void {
    this.activo = true;
  }

  @HostListener('mouseleave')
  alSalir(): void {
    this.activo = false;
  }
}
