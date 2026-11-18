import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SolicitudApartado {
  _id: string;
  productoId: string;
  productoNombre: string;
  productoCodigo: string;
  compradorNombre: string;
  tiendaNombre: string;
  estado: 'pendiente' | 'confirmada' | 'rechazada' | 'expirada' | 'comprobante_en_revision' | 'comprobante_rechazado' | 'pagada' | 'cancelada';
  precioRegistrado?: number;
  precioConfirmado?: number;
  confirmadoEn?: string;
  rechazadoEn?: string;
  venceEn?: string;
  plazoReservaDias?: 3 | 7;
  esPrueba?: boolean;
  expiradoEn?: string;
  inventarioLiberado?: boolean;
  calculadoEn?: string;
  tiempoRestanteSegundos?: number | null;
  corregirHasta?: string;
  pagadoEn?: string;
  createdAt: string;
}

export interface ConfiguracionReserva {
  plazoReservaDias: 3 | 7;
  confirmacionPruebaHabilitada: boolean;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudApartadoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/solicitudes-apartado`;
  private opciones() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }

  crear(productoId: string) {
    return this.http.post<SolicitudApartado>(this.url, { productoId }, this.opciones()).pipe(timeout(15000));
  }
  listar() {
    return this.http.get<SolicitudApartado[]>(this.url, this.opciones()).pipe(timeout(15000));
  }
  cancelar(id: string) {
    return this.http.patch<SolicitudApartado>(`${this.url}/${id}/cancelar`, {}, this.opciones()).pipe(timeout(15000));
  }
  configuracion() {
    return this.http.get<ConfiguracionReserva>(`${this.url}/configuracion`, this.opciones()).pipe(timeout(15000));
  }
  guardarPlazo(plazoReservaDias: number) {
    return this.http.patch<ConfiguracionReserva>(`${this.url}/configuracion`, { plazoReservaDias }, this.opciones()).pipe(timeout(15000));
  }
  resolver(id: string, accion: 'confirmar' | 'rechazar') {
    return this.http.patch<SolicitudApartado>(`${this.url}/${id}/${accion}`, {}, this.opciones()).pipe(timeout(15000));
  }
}
