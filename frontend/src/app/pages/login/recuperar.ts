import { Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
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
            {{ modoReset ? 'Nueva contraseña' : 'Recuperar contraseña' }}
          </h1>
          <p class="auth-intro">
            @if (!modoReset) {
              Ingresa tu correo. Si hay una cuenta habilitada, recibirás un enlace.
              Puedes solicitar otro después de un minuto; revisa también el correo no deseado.
            } @else {
              Define tu nueva contraseña: mínimo 15 caracteres y máximo 72 bytes UTF-8.
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

        @if (!completado && !enlaceInvalido) {
        <form class="auth-form" (ngSubmit)="enviar()" novalidate [attr.aria-busy]="cargando">
          @if (!modoReset) {
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
                  placeholder="Mínimo 15 caracteres"
                  [(ngModel)]="password"
                  minlength="15"
                  maxlength="72"
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
              <p class="field-hint">Al menos 15 caracteres; máximo 72 bytes UTF-8.</p>
              <label for="rec-confirmar">Repite la nueva contraseña</label>
              <input id="rec-confirmar" name="confirmar" type="password" autocomplete="new-password"
                [(ngModel)]="confirmacion" [disabled]="cargando" required />
            </div>
          }

          <button type="submit" class="auth-submit-btn" [disabled]="cargando">
            @if (cargando) {
              Procesando...
            } @else {
              {{ modoReset ? 'Guardar contraseña' : 'Enviar enlace de recuperación' }}
            }
          </button>
        </form>
        }

        <footer class="auth-footer">
          <div class="auth-footer__links">
            @if (modoReset) {
              <button type="button" class="btn-ghost" [disabled]="cargando" (click)="solicitarOtro()">Solicitar un enlace nuevo</button>
            }
            <a routerLink="/login">Volver a iniciar sesión</a>
          </div>
        </footer>
      </div>
    </section>
  `,
})
export class Recuperar implements OnDestroy {
  private http = inject(HttpClient);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  token = '';
  modoReset = false;
  enlaceInvalido = false;
  completado = false;
  email = '';
  password = '';
  confirmacion = '';
  mensaje = '';
  cargando = false;
  esError = false;
  mostrarPassword = false;
  // Orientación local: no consulta ni revela la cuota de una cuenta del servidor.
  private solicitudes = new Map<string, { inicio: number; cantidad: number }>();

  private avisoSolicitud(email: string): string {
    const ahora = Date.now();
    const clave = email.trim().toLowerCase();
    for (const [correo, ventana] of this.solicitudes) {
      if (ahora - ventana.inicio >= 3600000) this.solicitudes.delete(correo);
    }
    const ventana = this.solicitudes.get(clave) ?? { inicio: ahora, cantidad: 0 };
    ventana.cantidad++;
    this.solicitudes.set(clave, ventana);
    if (ventana.cantidad === 2) return 'Te queda un intento. Después deberás esperar una hora para volver a solicitar el enlace.';
    if (ventana.cantidad >= 3) return 'Si no recibes el enlace, espera una hora antes de volver a solicitarlo. Revisa también el correo no deseado.';
    return '';
  }

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    const fragment = new URLSearchParams(this.route.snapshot.fragment || '');
    this.modoReset = query.has('token') || fragment.has('token');
    const valores = [...query.getAll('token'), ...fragment.getAll('token')];
    if (this.modoReset) {
      this.location.replaceState('/recuperar'); // Mantener secreto solo en memoria, nunca storage.
      this.token = valores.length === 1 && /^[a-f0-9]{64}$/.test(valores[0]) ? valores[0] : '';
      if (!this.token) this.invalidarEnlace();
    }
  }

  ngOnDestroy() { this.token = ''; this.password = ''; this.confirmacion = ''; }

  private invalidarEnlace() {
    this.enlaceInvalido = true; this.token = ''; this.esError = true;
    this.mensaje = 'Este enlace no es válido, venció o ya fue utilizado. Solicita uno nuevo.';
  }

  solicitarOtro() {
    if (this.cargando) return;
    this.token = ''; this.password = ''; this.confirmacion = ''; this.modoReset = false;
    this.enlaceInvalido = false; this.completado = false; this.mensaje = ''; this.esError = false;
  }

  enviar() {
    if (this.cargando || this.completado || this.enlaceInvalido) return;

    if (!this.token && !this.email.trim()) {
      this.esError = true;
      this.mensaje = 'Ingresa tu correo electrónico para continuar.';
      return;
    }

    if (this.token && (!this.password || [...this.password].length < 15 || new TextEncoder().encode(this.password).length > 72)) {
      this.esError = true;
      this.mensaje = 'La nueva contraseña necesita al menos 15 caracteres y como máximo 72 bytes UTF-8.';
      return;
    }
    if (this.modoReset && this.password !== this.confirmacion) {
      this.esError = true; this.mensaje = 'Las contraseñas no coinciden.'; return;
    }

    this.cargando = true;
    this.esError = false;
    this.mensaje = '';

    const emailSolicitud = this.email;
    this.http
      .post<{ mensaje: string }>(
        environment.apiUrl + '/auth/' + (this.token ? 'reset-password' : 'forgot-password'),
        this.token ? { token: this.token, password: this.password } : { email: this.email },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.esError = false;
          const aviso = this.modoReset ? '' : this.avisoSolicitud(emailSolicitud);
          this.mensaje = aviso || r.mensaje;
          this.cargando = false;
          this.password = '';
          this.confirmacion = '';
          if (this.modoReset) { this.token = ''; this.completado = true; }
        },
        error: (e) => {
          this.esError = true;
          if (this.modoReset && e.status === 400 && e.error?.mensaje === 'Enlace invalido o vencido') {
            this.invalidarEnlace();
          } else {
            this.mensaje = e.status === 429 ? 'Has realizado demasiados intentos. Espera 15 minutos e intenta de nuevo.' :
              e.status === 400 ? (e.error?.mensaje || 'Revisa la nueva contraseña.') :
              'No se pudo completar la solicitud. Intenta de nuevo más tarde.';
          }
          this.cargando = false;
        },
      });
  }
}
