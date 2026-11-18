import { environment } from '../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { ToastService } from './toast.service';

interface AuthResponse {
  token: string;
  [key: string]: unknown;
}

export interface PerfilUsuario {
  _id: string;
  nombre: string;
  email: string;
  rol: 'cliente' | 'vendedor' | 'admin';
}

const PREFIJOS_RUTAS_PUBLICAS = [
  '/bienvenida',
  '/login',
  '/register',
  '/recuperar',
  '/restablecer',
  '/catalogo/',
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly toast = inject(ToastService);
  private timerExpiracion: ReturnType<typeof setTimeout> | null = null;
  private redirigiendoPorExpiracion = false;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password,
    });
  }

  register(nombre: string, email: string, password: string, rol = 'vendedor') {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      nombre,
      email,
      password,
      rol,
    });
  }

  guardarSesion(respuesta: AuthResponse) {
    const { token, ...usuario } = respuesta;

    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.redirigiendoPorExpiracion = false;
    this.programarExpiracionSesion();
  }

  getToken() {
    return localStorage.getItem('token');
  }

  obtenerPerfil() {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });
  }

  descartarSesionVencida(volver?: string) {
    this.limpiarAlmacenamiento();
    return this.router.navigate(['/login'], { queryParams: volver ? { volver } : undefined });
  }

  manejarSesionExpirada(mostrarAviso = true) {
    this.limpiarAlmacenamiento();

    if (this.redirigiendoPorExpiracion) {
      return;
    }

    this.redirigiendoPorExpiracion = true;

    if (mostrarAviso) {
      this.toast.info('Tu sesión expiró. Inicia sesión nuevamente.', 5000);
    }

    const urlActual = (this.router.url || '').split('?')[0];
    if (urlActual !== '/login') {
      this.router.navigate(['/login']).finally(() => {
        setTimeout(() => {
          this.redirigiendoPorExpiracion = false;
        }, 800);
      });
    } else {
      setTimeout(() => {
        this.redirigiendoPorExpiracion = false;
      }, 800);
    }
  }

  iniciarVigilanciaSesion() {
    if (!this.verificarSesionActiva(true)) {
      return;
    }
    this.programarExpiracionSesion();
  }

  verificarSesionActiva(redirigirSiProtegida = true): boolean {
    const token = this.getToken();
    if (!token) {
      this.cancelarTemporizadorExpiracion();
      return false;
    }

    if (this.tokenExpirado(token)) {
      if (redirigirSiProtegida && this.esRutaProtegida(this.router.url)) {
        this.manejarSesionExpirada(true);
      } else {
        this.limpiarAlmacenamiento();
      }
      return false;
    }

    return true;
  }

  programarExpiracionSesion() {
    this.cancelarTemporizadorExpiracion();
    const expMs = this.obtenerExpiracionTokenMs(this.getToken());
    if (expMs === null) return;

    const restante = expMs - Date.now();
    if (restante <= 0) {
      this.verificarSesionActiva(true);
      return;
    }

    const espera = Math.min(restante + 500, 2_147_483_647);
    this.timerExpiracion = setTimeout(() => {
      this.timerExpiracion = null;
      this.verificarSesionActiva(true);
    }, espera);
  }

  cancelarTemporizadorExpiracion() {
    if (this.timerExpiracion !== null) {
      clearTimeout(this.timerExpiracion);
      this.timerExpiracion = null;
    }
  }

  tokenExpirado(token: string | null): boolean {
    const expMs = this.obtenerExpiracionTokenMs(token);
    return expMs !== null && Date.now() >= expMs;
  }

  obtenerExpiracionTokenMs(token: string | null): number | null {
    if (!token) return null;
    const partes = token.split('.');
    if (partes.length !== 3) return null;

    try {
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  getUsuario() {
    const usuario = localStorage.getItem('usuario');

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario);
    } catch {
      return null;
    }
  }

  getRol() {
    const usuario = this.getUsuario();

    return usuario?.rol || '';
  }

  logout() {
    const token = this.getToken();
    const limpiar = () => {
      this.limpiarAlmacenamiento();
      this.router.navigate(['/bienvenida']);
    };
    if (!token || this.tokenExpirado(token)) {
      limpiar();
      return;
    }
    this.http.post(this.apiUrl + '/logout', {}, { headers: { Authorization: 'Bearer ' + token } }).subscribe({
      next: limpiar,
      error: e => {
        if (e.status === 401) limpiar();
        else window.alert('No se pudo cerrar la sesión en el servidor. Revisa tu conexión e intenta de nuevo.');
      }
    });
  }

  estaAutenticado() {
    const token = this.getToken();
    const usuario = this.getUsuario();
    if (!token || !usuario) {
      return false;
    }
    if (this.tokenExpirado(token)) {
      this.limpiarAlmacenamiento();
      return false;
    }
    return true;
  }

  redirigirPorRol() {
    const rol = this.getRol();

    if (rol === 'admin') {
      this.router.navigate(['/admin/usuarios']);
      return;
    }

    if (rol === 'vendedor') {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (rol === 'cliente') {
      this.router.navigate(['/cliente/inicio']);
      return;
    }

    this.router.navigate(['/login']);
  }

  private limpiarAlmacenamiento() {
    this.cancelarTemporizadorExpiracion();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  private esRutaProtegida(url: string): boolean {
    const limpia = (url || '').split('?')[0].split('#')[0];
    if (!limpia || limpia === '/') return false;
    return !PREFIJOS_RUTAS_PUBLICAS.some((prefijo) => limpia.startsWith(prefijo));
  }
}
