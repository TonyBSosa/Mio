import { Component } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { authSessionInterceptor } from './auth-session.interceptor';
import { ToastService } from './toast.service';

@Component({ selector: 'test-dummy-login', standalone: true, template: '<p>Login</p>' })
class DummyLogin {}

@Component({ selector: 'test-dummy-dashboard', standalone: true, template: '<p>Dashboard</p>' })
class DummyDashboard {}

function crearJwt(expSegundos: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ id: 'u1', sid: 's1', exp: expSegundos }));
  return `${header}.${payload}.firma`;
}

describe('authSessionInterceptor y expiración de sesión', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;
  let toastService: ToastService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authSessionInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: DummyLogin },
          { path: 'dashboard', component: DummyDashboard },
        ]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    authService.cancelarTemporizadorExpiracion();
    httpMock.verify();
    localStorage.clear();
  });

  it('limpia un JWT expirado al comprobar estaAutenticado()', () => {
    const expirado = crearJwt(Math.floor(Date.now() / 1000) - 60);
    localStorage.setItem('token', expirado);
    localStorage.setItem('usuario', JSON.stringify({ _id: 'u1', rol: 'vendedor' }));

    expect(authService.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  it('redirige automáticamente a /login y limpia sesión cuando la API devuelve 401 Token invalido', async () => {
    await router.navigateByUrl('/dashboard');
    localStorage.setItem('token', crearJwt(Math.floor(Date.now() / 1000) + 600));
    localStorage.setItem('usuario', JSON.stringify({ _id: 'u1', rol: 'vendedor' }));

    let errorRecibido = false;
    http.get('/api/pedidos', { headers: { Authorization: 'Bearer tok' } }).subscribe({
      error: () => {
        errorRecibido = true;
      },
    });

    httpMock.expectOne('/api/pedidos').flush(
      { mensaje: 'Token invalido' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 20));

    expect(errorRecibido).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(router.url).toBe('/login');
    expect(toastService.toasts().some((t) => t.texto.includes('sesión expiró'))).toBe(true);
  });

  it('no intercepta el 401 de /auth/login para permitir mostrar error de credenciales', () => {
    let statusRecibido = 0;
    http.post('/api/auth/login', { email: 'a@b.com', password: 'mal' }).subscribe({
      error: (err) => {
        statusRecibido = err.status;
      },
    });

    httpMock.expectOne('/api/auth/login').flush(
      { mensaje: 'Credenciales invalidas' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(statusRecibido).toBe(401);
  });
});
