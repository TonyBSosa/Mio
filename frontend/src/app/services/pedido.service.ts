import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  private apiUrl = 'http://localhost:3000/api/pedidos';

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

  listarPedidos() {
    return this.http.get<any[]>(this.apiUrl, this.getHeaders());
  }

  crearPedido(pedido: any) {
    return this.http.post(this.apiUrl, pedido, this.getHeaders());
  }

  actualizarPedido(id: string, pedido: any) {
    return this.http.put(`${this.apiUrl}/${id}`, pedido, this.getHeaders());
  }

  marcarPago(id: string, estadoPago: string) {
    return this.http.patch(
      `${this.apiUrl}/${id}/pago`,
      { estadoPago },
      this.getHeaders(),
    );
  }

  marcarEntrega(id: string, estadoEntrega: string) {
    return this.http.patch(
      `${this.apiUrl}/${id}/entrega`,
      { estadoEntrega },
      this.getHeaders(),
    );
  }

  eliminarPedido(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders());
  }
}
