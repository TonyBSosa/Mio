import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ResumenService {
  private apiUrl = 'http://localhost:3000/api/resumen';

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

  obtenerResumenPorLive(liveId: string) {
    return this.http.get(`${this.apiUrl}/live/${liveId}`, this.getHeaders());
  }
}
