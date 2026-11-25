import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

/** Directiva de atributo propia: enfoca el campo al mostrarse el formulario. */
@Directive({ selector: '[appAutofocus]', standalone: false })
export class AutofocusDirective implements AfterViewInit {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    setTimeout(() => this.elemento.nativeElement.focus());
  }
}
