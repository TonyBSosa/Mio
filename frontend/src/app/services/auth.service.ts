import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

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
  }

  getToken() {
    return localStorage.getItem('token');
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
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/bienvenida']);
  }

  estaAutenticado() {
    return !!this.getToken() && !!this.getUsuario();
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
}
