import { Injectable } from '@angular/core';
import { Usuario, UsuarioForm } from '../models';
import { BaseCrudService } from './base-crud.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends BaseCrudService<Usuario, UsuarioForm> {
  protected readonly endpoint = 'usuarios';
}
