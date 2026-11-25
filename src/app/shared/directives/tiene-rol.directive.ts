import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directiva estructural propia: muestra el elemento solo si el usuario tiene alguno de los roles.
 *   <a *appTieneRol="['admin']" routerLink="/usuarios">Usuarios</a>
 * Se actualiza sola al iniciar o cerrar sesión.
 */
@Directive({ selector: '[appTieneRol]', standalone: false })
export class TieneRolDirective implements OnInit, OnDestroy {
  private readonly plantilla = inject<TemplateRef<unknown>>(TemplateRef);
  private readonly contenedor = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  private roles: Rol[] = [];
  private visible = false;
  private suscripcion?: Subscription;

  @Input({ required: true })
  set appTieneRol(roles: Rol | Rol[]) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.actualizarVista();
  }

  ngOnInit(): void {
    this.suscripcion = this.auth.usuario$.subscribe(() => this.actualizarVista());
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  private actualizarVista(): void {
    const permitido = this.auth.tieneRol(this.roles);
    if (permitido && !this.visible) {
      this.contenedor.createEmbeddedView(this.plantilla);
      this.visible = true;
    } else if (!permitido && this.visible) {
      this.contenedor.clear();
      this.visible = false;
    }
  }
}
