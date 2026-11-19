import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'mio-verificacion', standalone: true, imports: [FormsModule, RouterLink],
  styleUrls: ['../login/login.css'],
  template: `<section class="auth-page" aria-labelledby="verificacion-titulo"><div class="login-container">
    <div class="auth-header"><h1 id="verificacion-titulo">{{ confirmado() ? 'Correo verificado' : conEnlace ? 'Confirma tu correo' : 'Revisa tu correo' }}</h1>
      <p class="auth-intro">{{ conEnlace ? 'Confirma tu dirección para proteger tu cuenta en MIO.' : 'Busca el enlace de verificación en tu bandeja de entrada y en el correo no deseado.' }}</p></div>
    @if (mensaje()) { <div class="auth-alert" [class.auth-alert--error]="error()" [class.auth-alert--info]="!error()" role="status">{{ mensaje() }}</div> }
    @if (cargando()) { <p role="status">Procesando…</p> }
    @if (conEnlace && !confirmado() && !invalido() && listo()) {
      <form class="auth-form" (ngSubmit)="confirmar()" [attr.aria-busy]="cargando()">
        @if (requierePassword()) {
          <p class="field-hint">Elige la contraseña definitiva de tu cuenta: al menos 15 caracteres y máximo 72 bytes UTF-8.</p>
          <div class="form-group"><label for="ver-password">Contraseña</label><input id="ver-password" name="password" type="password" autocomplete="new-password" [(ngModel)]="password" [disabled]="cargando()" required /></div>
          <div class="form-group"><label for="ver-confirmacion">Repite la contraseña</label><input id="ver-confirmacion" name="confirmacion" type="password" autocomplete="new-password" [(ngModel)]="confirmacion" [disabled]="cargando()" required /></div>
        }
        <button class="auth-submit-btn" type="submit" [disabled]="cargando()">Verificar mi correo</button>
      </form>
    }
    @if (!conEnlace && identidad) {
      @if (registroVencido()) { <p>Este registro pendiente venció. Contacta con soporte para recuperar el acceso sin perder tus datos.</p> }
      @else if (!confirmado()) { <button type="button" class="auth-submit-btn" [disabled]="cargando() || DateNow() < proximoEnvio" (click)="reenviar()">Reenviar enlace</button> }
    }
    @if (!conEnlace && !identidad) { <p>Inicia sesión para consultar tu verificación y solicitar otro enlace.</p> }
    <footer class="auth-footer"><div class="auth-footer__links">
      <a routerLink="/login">Ir a iniciar sesión</a>
      @if (invalido()) { <a routerLink="/registro-pendiente">Solicitar otro enlace</a> }
      <a routerLink="/bienvenida">Volver al inicio</a>
    </div></footer>
  </div></section>`,
})
export class Verificacion implements OnDestroy {
  private http = inject(HttpClient); private auth = inject(AuthService);
  private route = inject(ActivatedRoute); private location = inject(Location); private destroy = inject(DestroyRef);
  private base = environment.apiUrl + '/auth/email-verification';
  private token = ''; private reloj?: ReturnType<typeof setTimeout>;
  readonly identidad = this.auth.getTokenVerificacion() || this.auth.getToken() || '';
  readonly conEnlace: boolean;
  readonly cargando = signal(false); readonly error = signal(false); readonly mensaje = signal('');
  readonly confirmado = signal(false); readonly invalido = signal(false); readonly listo = signal(false);
  readonly requierePassword = signal(false); readonly registroVencido = signal(false);
  password = ''; confirmacion = ''; proximoEnvio = 0; readonly DateNow = signal(Date.now());
  constructor() {
    const fragment = new URLSearchParams(this.route.snapshot.fragment || '');
    const query = this.route.snapshot.queryParamMap;
    this.conEnlace = fragment.has('token') || query.has('token');
    if (this.conEnlace) {
      const tokens = [...fragment.getAll('token'), ...query.getAll('token')];
      this.location.replaceState('/verificar-correo');
      if (tokens.length !== 1 || !/^[a-f0-9]{24}\.[a-f0-9]{64}$/.test(tokens[0])) { this.falloEnlace(); return; }
      this.token = tokens[0]; this.comprobarEnlace();
    } else if (this.identidad) this.estado();
  }
  private cabeceras() { return { Authorization: 'Bearer ' + this.identidad }; }
  private falloEnlace() { this.invalido.set(true); this.error.set(true); this.token = ''; this.mensaje.set('Este enlace venció, ya se utilizó o no es válido. Solicita uno nuevo.'); }
  private comprobarEnlace() {
    this.cargando.set(true);
    this.http.post<{ requiresPassword: boolean }>(this.base + '/link-status', { token: this.token }).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: r => { this.requierePassword.set(r.requiresPassword); this.listo.set(true); this.cargando.set(false); },
      error: e => { this.cargando.set(false); if (e.status === 400) this.falloEnlace(); else { this.error.set(true); this.mensaje.set('No pudimos comprobar el enlace. Abre de nuevo el enlace del correo para reintentar.'); } },
    });
  }
  private estado() {
    this.cargando.set(true);
    this.http.get<{ verified: boolean; registrationExpired: boolean }>(this.base + '/status', { headers: this.cabeceras() }).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: r => { this.confirmado.set(r.verified); this.registroVencido.set(r.registrationExpired); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.error.set(true); this.mensaje.set('Inicia sesión nuevamente para consultar tu verificación.'); },
    });
  }
  reenviar() {
    if (this.cargando() || !this.identidad || Date.now() < this.proximoEnvio || this.registroVencido()) return;
    this.cargando.set(true); this.error.set(false);
    this.http.post<{ mensaje: string }>(this.base + '/resend', {}, { headers: this.cabeceras() }).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: r => { this.cargando.set(false); this.mensaje.set(r.mensaje); this.proximoEnvio = Date.now() + 60000; this.DateNow.set(Date.now()); this.reloj = setTimeout(() => this.DateNow.set(Date.now()), 60000); },
      error: e => { this.cargando.set(false); this.error.set(true); this.mensaje.set(e.status === 429 ? 'Espera unos minutos antes de solicitar otro enlace.' : 'No pudimos procesar la solicitud. Inicia sesión y vuelve a intentarlo.'); },
    });
  }
  confirmar() {
    if (!this.token || this.cargando() || !this.listo() || this.confirmado()) return;
    if (this.requierePassword() && (this.password !== this.confirmacion || [...this.password].length < 15 || new TextEncoder().encode(this.password).length > 72)) {
      this.error.set(true); this.mensaje.set('Revisa la longitud de la contraseña y que ambas coincidan.'); return;
    }
    this.cargando.set(true); this.error.set(false);
    this.http.post(this.base + '/confirm', { token: this.token, ...(this.requierePassword() ? { password: this.password } : {}) }).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.confirmado.set(true); this.cargando.set(false); this.token = ''; this.password = ''; this.confirmacion = ''; this.auth.limpiarVerificacion(); this.mensaje.set('Tu correo está verificado. Ya puedes iniciar sesión.'); },
      error: e => { this.cargando.set(false); this.error.set(true); if (e.status === 400 && e.error?.mensaje?.startsWith('El enlace')) this.falloEnlace(); else this.mensaje.set(e.status === 400 ? 'Elige otra contraseña que cumpla los requisitos.' : 'No pudimos confirmar el correo. Comprueba tu acceso antes de reintentar.'); },
    });
  }
  ngOnDestroy() { clearTimeout(this.reloj); this.token = ''; this.password = ''; this.confirmacion = ''; }
}
