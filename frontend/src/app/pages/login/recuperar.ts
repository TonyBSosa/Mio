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
    <section class="auth-page" aria-labelledby="recuperar-title">
      <div class="login-container">
        <div class="auth-header">
          <h1 id="recuperar-title">
            {{ token ? 'Nueva contraseña' : 'Recuperar contraseña' }}
          </h1>
          <p class="auth-intro">
            @if (!token) {
              Ingresa tu correo registrado. Si la cuenta existe, te enviaremos un enlace para
              restablecer tu contraseña.
            } @else {
              Define tu nueva contraseña segura (de 10 a 128 caracteres).
            }
          </p>
        </div>

        @if (mensaje) {
          <div
            class="auth-alert"
            [class.auth-alert--error]="esError"
            [class.auth-alert--info]="!esError"
            role="status"
          >
            <span>{{ mensaje }}</span>
          </div>
        }

        <form class="auth-form" (ngSubmit)="enviar()" novalidate>
          @if (!token) {
            <div class="form-group">
              <label for="rec-email">Correo electrónico</label>
              <input
                id="rec-email"
                type="email"
                name="email"
                autocomplete="email"
                placeholder="nombre@ejemplo.com"
                [(ngModel)]="email"
                [disabled]="cargando"
                required
              />
            </div>
          } @else {
            <div class="form-group">
              <label for="rec-password">Nueva contraseña</label>
              <div class="password-input-wrap">
                <input
                  id="rec-password"
                  [type]="mostrarPassword ? 'text' : 'password'"
                  name="password"
                  autocomplete="new-password"
                  placeholder="Mínimo 10 caracteres"
                  [(ngModel)]="password"
                  minlength="10"
                  maxlength="128"
                  [disabled]="cargando"
                  required
                />
                <button
                  type="button"
                  class="btn-ghost password-toggle"
                  (click)="mostrarPassword = !mostrarPassword"
                  [attr.aria-label]="mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  {{ mostrarPassword ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
              <p class="field-hint">Entre 10 y 128 caracteres.</p>
            </div>
          }

          <button type="submit" class="auth-submit-btn" [disabled]="cargando">
            @if (cargando) {
              Procesando...
            } @else {
              {{ token ? 'Guardar contraseña' : 'Enviar enlace de recuperación' }}
            }
          </button>
        </form>

        <footer class="auth-footer">
          <div class="auth-footer__links">
            <a routerLink="/login">Volver a iniciar sesión</a>
          </div>
        </footer>
      </div>
    </section>
  `,
})
export class Recuperar {
  private http = inject(HttpClient);
  token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') || '';
  email = '';
  password = '';
  mensaje = '';
  cargando = false;
  esError = false;
  mostrarPassword = false;

  enviar() {
    if (this.cargando) return;

    if (!this.token && !this.email.trim()) {
      this.esError = true;
      this.mensaje = 'Ingresa tu correo electrónico para continuar.';
      return;
    }

    if (this.token && (!this.password || this.password.length < 10)) {
      this.esError = true;
      this.mensaje = 'La nueva contraseña debe tener entre 10 y 128 caracteres.';
      return;
    }

    this.cargando = true;
    this.esError = false;
    this.mensaje = '';

    this.http
      .post<{ mensaje: string }>(
        environment.apiUrl + '/auth/' + (this.token ? 'reset-password' : 'forgot-password'),
        this.token ? { token: this.token, password: this.password } : { email: this.email },
      )
      .subscribe({
        next: (r) => {
          this.esError = false;
          this.mensaje = r.mensaje;
          this.cargando = false;
          this.password = '';
        },
        error: (e) => {
          this.esError = true;
          this.mensaje = e.error?.mensaje || 'No se pudo completar. Intenta de nuevo.';
          this.cargando = false;
        },
      });
  }
}
