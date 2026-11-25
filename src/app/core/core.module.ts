import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

/**
 * CoreModule: servicios singleton e interceptores HTTP. Se importa una sola vez en AppModule.
 * Orden de los interceptores (petición): Loading -> Error -> Auth -> API.
 * Error va antes que Auth para capturar también el 401 local por token vencido.
 */
@NgModule({
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() moduloPadre: CoreModule | null) {
    if (moduloPadre) {
      throw new Error('CoreModule ya fue cargado. Impórtalo solo en AppModule.');
    }
  }
}
