import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/api/productos';

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

  listarProductos() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  crearProducto(producto: any) {
    return this.http.post(this.apiUrl, producto, this.getHeaders());
  }

  actualizarProducto(id: string, producto: any) {
    return this.http.put(`${this.apiUrl}/${id}`, producto, this.getHeaders());
  }

  cambiarEstado(id: string, estado: string) {
    return this.http.patch(
      `${this.apiUrl}/${id}/estado`,
      { estado },
      this.getHeaders(),
    );
  }

  eliminarProducto(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
