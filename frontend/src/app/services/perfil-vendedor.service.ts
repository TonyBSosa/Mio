import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PerfilVendedorService {
  private apiUrl = 'http://localhost:3000/api/perfil-vendedor';

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

  obtenerMiPerfil() {
    return this.http.get(`${this.apiUrl}/me`, this.getHeaders());
  }

  guardarMiPerfil(perfil: any) {
    return this.http.put(`${this.apiUrl}/me`, perfil, this.getHeaders());
  }
}
