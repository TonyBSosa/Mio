import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private apiUrl = 'http://localhost:3000/api/clientes';

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

  listarClientes() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  crearCliente(cliente: any) {
    return this.http.post(this.apiUrl, cliente, this.getHeaders());
  }

  actualizarCliente(id: string, cliente: any) {
    return this.http.put(`${this.apiUrl}/${id}`, cliente, this.getHeaders());
  }

  eliminarCliente(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
