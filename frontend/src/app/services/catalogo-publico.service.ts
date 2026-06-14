import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CatalogoPublicoService {
  private apiUrl = 'http://localhost:3000/api/public/catalogo';

  constructor(private http: HttpClient) {}

  obtenerCatalogo(vendedorId: string) {
    return this.http.get(`${this.apiUrl}/${vendedorId}`);
  }
}
