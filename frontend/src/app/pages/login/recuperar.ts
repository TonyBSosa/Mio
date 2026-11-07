import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
@Component({ selector: 'app-recuperar', standalone: true, imports: [FormsModule, RouterLink], template: `
<main style="max-width:440px;margin:4rem auto;padding:1.5rem"><h1>Recuperar acceso</h1>
<form (ngSubmit)="enviar()">
@if (!token) { <label>Email <input type="email" name="email" [(ngModel)]="email" required></label> }
@else { <label>Nueva contraseña (10 a 128 caracteres) <input type="password" name="password" [(ngModel)]="password" minlength="10" maxlength="128" required></label> }
<button type="submit" [disabled]="cargando">{{ token ? 'Cambiar contraseña' : 'Enviar enlace' }}</button>
</form><p role="status">{{ mensaje }}</p><a routerLink="/login">Volver al login</a></main>` })
export class Recuperar {
  private http = inject(HttpClient);
  token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') || '';
  email = ''; password = ''; mensaje = ''; cargando = false;
  enviar() {
    if (this.cargando) return;
    this.cargando = true;
    this.http.post<{mensaje:string}>(environment.apiUrl + '/auth/' + (this.token ? 'reset-password' : 'forgot-password'), this.token ? { token: this.token, password: this.password } : { email: this.email }).subscribe({
      next: r => { this.mensaje = r.mensaje; this.cargando = false; this.password = ''; },
      error: e => { this.mensaje = e.error?.mensaje || 'No se pudo completar. Intenta de nuevo.'; this.cargando = false; }
    });
  }
}
