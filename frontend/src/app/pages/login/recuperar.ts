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
    <section class="auth-shell" aria-labelledby="recuperar-title">
      <aside class="auth-aside" aria-label="Seguridad y recuperación de cuenta">
        <div class="auth-aside__top">
          <span class="auth-badge">Seguridad de cuenta</span>
          <h2>Recupera el acceso a tu espacio en MIO de forma segura.</h2>
          <p>
            Protegemos tu tienda y tu información comercial mediante enlaces temporales de
            restablecimiento enviados únicamente al correo registrado.
          </p>
        </div>

        <ul class="auth-highlights">
          <li>
            <strong>1. Solicita tu enlace</strong>
            <span>Ingresa el correo con el que creaste tu cuenta de vendedor o comprador.</span>
          </li>
          <li>
            <strong>2. Define una nueva contraseña</strong>
            <span>Utiliza una clave segura de entre 10 y 128 caracteres.</span>
          </li>
        </ul>

        <div class="auth-aside__footer">
          <span>¿Recordaste tu contraseña?</span>
          <div class="auth-aside__links">
            <a routerLink="/login">Volver a iniciar sesión</a>
            <span aria-hidden="true">·</span>
            <a routerLink="/bienvenida">Ir al inicio público</a>
          </div>
        </div>
      </aside>

      <div class="login-container">
        <div class="auth-header">
          <p class="auth-kicker">Recuperación de acceso</p>
          <h1 id="recuperar-title">
            {{ token ? 'Definir nueva contraseña' : 'Recuperar contraseña' }}
          </h1>
          <p class="auth-intro">
            @if (!token) {
              Ingresa tu correo electrónico registrado. Si la cuenta existe, te enviaremos las
              instrucciones para restablecer tu acceso.
            } @else {
              Crea tu nueva contraseña segura para volver a ingresar a tu cuenta de MIO.
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
            <strong>{{ esError ? 'Atención' : 'Solicitud procesada' }}</strong>
            <span>{{ mensaje }}</span>
          </div>
        }

        <form class="auth-form" (ngSubmit)="enviar()" novalidate>
          @if (!token) {
            <div class="form-group">
              <label for="rec-email">Correo electrónico registrado</label>
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
              <p class="field-hint">
                Revisa tu bandeja de entrada y carpeta de correo no deseado después de enviar.
              </p>
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
              <p class="field-hint">Debe contener entre 10 y 128 caracteres.</p>
            </div>
          }

          <button type="submit" class="auth-submit-btn" [disabled]="cargando">
            @if (cargando) {
              Procesando solicitud...
            } @else {
              {{ token ? 'Guardar nueva contraseña' : 'Enviar enlace de recuperación' }}
            }
          </button>
        </form>

        <div class="auth-divider" role="separator">
          <span>Opciones de acceso</span>
        </div>

        <div class="register-links-grid">
          <a class="role-link-card" routerLink="/login">
            <strong>Volver a iniciar sesión</strong>
            <small>Ingresa con tu correo y contraseña actual</small>
          </a>
          <a class="role-link-card" routerLink="/register-vendedor">
            <strong>Crear una cuenta nueva</strong>
            <small>Regístrate como vendedor o comprador</small>
          </a>
        </div>
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
