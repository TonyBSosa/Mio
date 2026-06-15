import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExplorarPublicoService {
  private apiUrl = 'http://localhost:3000/api/public/explorar';

  constructor(private http: HttpClient) {}

  listarVendedores() {
    return this.http.get<any[]>(`${this.apiUrl}/vendedores`);
  }

  listarEventos() {
    return this.http.get<any[]>(`${this.apiUrl}/eventos`);
  }

  buscar(texto: string) {
    return this.http.get(`${this.apiUrl}/buscar?texto=${encodeURIComponent(texto)}`);
  }
}
