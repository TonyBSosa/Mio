import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrls: ['./login.css'],
  template: `
    <div class="login-container">
      <p class="auth-kicker">Seguridad de cuenta</p>
      <h1>Recuperar acceso</h1>
      <p class="auth-intro">Ingresa tu correo para recibir instrucciones o define tu nueva contraseña.</p>
      <form (ngSubmit)="enviar()">
        @if (!token) {
          <div class="form-group">
            <label for="rec-email">Correo electrónico</label>
            <input id="rec-email" type="email" name="email" autocomplete="email" [(ngModel)]="email" required>
          </div>
        } @else {
          <div class="form-group">
            <label for="rec-password">Nueva contraseña (10 a 128 caracteres)</label>
            <input id="rec-password" type="password" name="password" autocomplete="new-password" [(ngModel)]="password" minlength="10" maxlength="128" required>
          </div>
        }
        <button type="submit" [disabled]="cargando">
          {{ token ? 'Cambiar contraseña' : 'Enviar enlace' }}
        </button>
      </form>
      @if (mensaje) {
        <p class="mensaje" role="status">{{ mensaje }}</p>
      }
      <p class="forgot-link"><a routerLink="/login">Volver a iniciar sesión</a></p>
    </div>
  `,
})
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
