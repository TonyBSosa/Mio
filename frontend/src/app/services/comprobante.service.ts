import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Comprobante {
  _id: string;
  estado: 'preparando' | 'en_revision' | 'aprobado' | 'rechazado' | 'fallido';
  recibidoEn?: string;
  revisadoEn?: string;
  motivo?: string;
  corregirHasta?: string;
}
export interface HistorialComprobantes {
  comprobantes: Comprobante[];
  cargaHabilitada: boolean;
  almacenamientoConfigurado: boolean;
  politicaCorreccion: string;
  limiteCargaEn?: string;
}
@Injectable({ providedIn: 'root' })
export class ComprobanteService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private url(id: string) { return `${environment.apiUrl}/solicitudes-apartado/${id}/comprobantes`; }
  private opciones() { return { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }; }
  historial(id: string) { return this.http.get<HistorialComprobantes>(this.url(id), this.opciones()).pipe(timeout(20000)); }
  subir(id: string, archivo: File) {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<Comprobante>(this.url(id), form, this.opciones()).pipe(timeout(45000));
  }
  acceso(id: string, comprobanteId: string) {
    return this.http.get<{url: string; duraSegundos: number}>(`${this.url(id)}/${comprobanteId}/acceso`, this.opciones()).pipe(timeout(20000));
  }
  revisar(id: string, comprobanteId: string, accion: 'aprobar' | 'rechazar', motivo = '') {
    return this.http.patch<Comprobante>(`${this.url(id)}/${comprobanteId}/${accion}`, accion === 'rechazar' ? { motivo } : {}, this.opciones()).pipe(timeout(20000));
  }
}
