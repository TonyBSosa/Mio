import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { Recuperar } from './recuperar';

describe('Recuperar: enlaces y mensajes seguros', () => {
  const token = 'a'.repeat(64);
  async function preparar(query: Record<string, string> = {}, fragment: string | null = null) {
    await TestBed.configureTestingModule({ imports: [Recuperar], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query), fragment } } },
    ] }).compileComponents();
    const location = TestBed.inject(Location);
    const replace = vi.spyOn(location, 'replaceState');
    const fixture = TestBed.createComponent(Recuperar);
    return { fixture, component: fixture.componentInstance, http: TestBed.inject(HttpTestingController), replace };
  }
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.restoreAllMocks(); });

  it('acepta fragmento y retira token de URL, sin guardarlo en storage', async () => {
    const { component, replace } = await preparar({}, 'token=' + token);
    expect(component.token).toBe(token); expect(replace).toHaveBeenCalledWith('/recuperar');
    expect(localStorage.getItem('recoveryToken')).toBeNull(); expect(sessionStorage.getItem('recoveryToken')).toBeNull();
    component.ngOnDestroy(); expect(component.token).toBe('');
  });
  it('conserva enlaces query heredados y elimina su URL', async () => {
    const { component, replace } = await preparar({ token });
    expect(component.token).toBe(token); expect(replace).toHaveBeenCalledWith('/recuperar');
  });
  it('enlace malformado o ambiguo no hace peticiones y permite solicitar otro', async () => {
    const { component } = await preparar({ token: 'invalido' }, 'token=' + token);
    expect(component.enlaceInvalido).toBe(true); component.enviar();
    expect(component.mensaje).toContain('ya fue utilizado');
    component.solicitarOtro(); expect(component.modoReset).toBe(false); expect(component.token).toBe('');
  });
  it('no permite contraseñas distintas y limpia token tras éxito', async () => {
    const { component, http } = await preparar({}, 'token=' + token);
    component.password = 'Una frase sintética'; component.confirmacion = 'Distinta'; component.enviar();
    expect(component.mensaje).toContain('no coinciden');
    component.confirmacion = component.password; component.enviar();
    const r = http.expectOne(req => req.url.endsWith('/auth/reset-password'));
    expect(r.request.body.token).toBe(token); expect(r.request.url).not.toContain(token);
    r.flush({ mensaje: 'Contraseña actualizada. Inicia sesion de nuevo.' });
    expect(component.completado).toBe(true); expect(component.token).toBe(''); expect(component.password).toBe('');
  });
  it('enlace vencido/usado informa sin mostrar el token', async () => {
    const { component, http } = await preparar({ token });
    component.password = component.confirmacion = 'Una frase sintética'; component.enviar();
    http.expectOne(req => req.url.endsWith('/auth/reset-password')).flush({ mensaje: 'Enlace invalido o vencido' }, { status: 400, statusText: 'Bad Request' });
    expect(component.enlaceInvalido).toBe(true); expect(component.token).toBe(''); expect(component.mensaje).not.toContain(token);
  });
  it('solicitud usa mensaje genérico y 429 ofrece espera sin exponer correo', async () => {
    const { component, http } = await preparar(); component.email = 'test@example.invalid'; component.enviar();
    http.expectOne(req => req.url.endsWith('/auth/forgot-password')).flush({ mensaje: 'Si la cuenta existe, recibiras un enlace de recuperacion.' });
    expect(component.mensaje).toContain('Si la cuenta existe');
    component.enviar(); http.expectOne(req => req.url.endsWith('/auth/forgot-password')).flush({}, { status: 429, statusText: 'Too Many Requests' });
    expect(component.mensaje).toContain('15 minutos'); expect(component.mensaje).not.toContain(component.email);
  });
});
