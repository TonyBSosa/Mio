import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private getHeaders() {
    const token = this.authService.getToken();

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  listarUsuarios() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  crearUsuario(usuario: any) {
    return this.http.post(this.apiUrl, usuario, this.getHeaders());
  }

  actualizarUsuario(id: string, usuario: any) {
    return this.http.put(`${this.apiUrl}/${id}`, usuario, this.getHeaders());
  }

  cambiarEstado(id: string, estado: string) {
    return this.http.patch(
      `${this.apiUrl}/${id}/estado`,
      { estado },
      this.getHeaders(),
    );
  }

  eliminarUsuario(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
