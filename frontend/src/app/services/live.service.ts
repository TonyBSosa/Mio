import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class LiveService {
  private apiUrl = 'http://localhost:3000/api/lives';

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

  listarLives() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  crearLive(live: any) {
    return this.http.post(this.apiUrl, live, this.getHeaders());
  }

  actualizarLive(id: string, live: any) {
    return this.http.put(`${this.apiUrl}/${id}`, live, this.getHeaders());
  }

  cambiarEstado(id: string, estado: string) {
    return this.http.patch(
      `${this.apiUrl}/${id}/estado`,
      { estado },
      this.getHeaders(),
    );
  }

  eliminarLive(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
