import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';
import { PerfilCliente } from './perfil-cliente';
import { environment } from '../../../../environments/environment';
import { routes } from '../../../app.routes';

@Component({ template: '' })
class LoginPrueba {}

describe('Perfil del comprador', () => {
  const perfil = { _id: 'cliente-1', nombre: 'Ana López', email: 'ana@example.test', rol: 'cliente' };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('usuario', JSON.stringify({ ...perfil, nombre: 'Dato antiguo' }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([
        routes.find(route => route.path === 'cliente/perfil')!,
        { path: 'login', component: LoginPrueba },
        { path: 'bienvenida', component: LoginPrueba },
      ])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('consulta la identidad actual al servidor y muestra nombre, correo e iniciales', () => {
    const fixture = TestBed.createComponent(PerfilCliente);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando tu información');
    const request = http.expectOne(`${environment.apiUrl}/auth/me`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    request.flush(perfil);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana López');
    expect(fixture.nativeElement.textContent).toContain('ana@example.test');
    expect(fixture.nativeElement.textContent).not.toContain('Dato antiguo');
    expect(fixture.nativeElement.querySelector('.avatar').textContent).toBe('AL');
    expect(fixture.nativeElement.querySelector('a[href="/recuperar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
  });

  it('permite reintentar tras un fallo de red sin mostrar identidad almacenada', () => {
    const fixture = TestBed.createComponent(PerfilCliente);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar tu perfil');
    expect(fixture.nativeElement.textContent).not.toContain('Dato antiguo');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(perfil);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana López');
  });

  it('descarta la sesión vencida y redirige al login', async () => {
    const fixture = TestBed.createComponent(PerfilCliente);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('no muestra el perfil si el servidor devuelve otro rol', () => {
    const fixture = TestBed.createComponent(PerfilCliente);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({ ...perfil, rol: 'vendedor' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('solo para cuentas de comprador');
    expect(fixture.nativeElement.textContent).not.toContain(perfil.email);
  });

  it('muestra el rechazo de acceso del servidor sin exponer datos ni ofrecer reintento', () => {
    const fixture = TestBed.createComponent(PerfilCliente);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tenés acceso');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('reutiliza el logout del servidor y elimina la sesión después de confirmarlo', async () => {
    const fixture = TestBed.createComponent(PerfilCliente);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(perfil);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-danger-ghost').click();
    const request = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(request.request.method).toBe('POST');
    expect(localStorage.getItem('token')).toBeTruthy();
    request.flush({ mensaje: 'Sesion cerrada' });
    await fixture.whenStable();
    expect(localStorage.getItem('token')).toBeNull();
  });

  for (const rol of ['vendedor', 'admin', 'sin-sesion']) {
    it(`el guard rechaza ${rol} en la ruta real del perfil`, async () => {
      if (rol === 'sin-sesion') localStorage.clear();
      else localStorage.setItem('usuario', JSON.stringify({ ...perfil, rol }));
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/cliente/perfil', LoginPrueba);
      expect(TestBed.inject(Router).url).toBe('/login');
      http.expectNone(`${environment.apiUrl}/auth/me`);
    });
  }

  it('el guard permite al comprador abrir directamente el perfil', async () => {
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl('/cliente/perfil', PerfilCliente);
    await navigation;
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(perfil);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain(perfil.email);
  });
});
