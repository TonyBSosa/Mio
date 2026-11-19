import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EMPTY } from 'rxjs';
import { HttpClient, provideHttpClient } from '@angular/common/http';
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
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); vi.restoreAllMocks(); vi.useRealTimers(); });

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
  it('avisa después del segundo intento sin consultar cuotas; separa correos y vence tras una hora', async () => {
    const { component, http, fixture } = await preparar();
    let ahora = 1000000; vi.spyOn(Date, 'now').mockImplementation(() => ahora);
    const solicitar = (email = 'test@example.invalid') => {
      component.email = email; component.enviar();
      http.expectOne(req => req.url.endsWith('/auth/forgot-password')).flush({ mensaje: 'Si la cuenta existe, recibirás un enlace.' });
    };
    solicitar(); expect(component.mensaje).toContain('Si la cuenta existe');
    solicitar(' TEST@example.invalid '); expect(component.mensaje).toContain('Te queda un intento');
    fixture.detectChanges(); expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('una hora');
    solicitar(); expect(component.mensaje).toContain('espera una hora');
    solicitar('otra@example.invalid'); expect(component.mensaje).toContain('Si la cuenta existe');
    ahora += 3600000; solicitar(); expect(component.mensaje).toContain('Si la cuenta existe');
  });

  it('actualiza la pantalla al responder HTTP sin requerir otro clic', async () => {
    const { fixture, component, http } = await preparar({}, 'token=' + token);
    component.password = component.confirmacion = 'Una frase sintética';
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Procesando...');
    http.expectOne(req => req.url.endsWith('/auth/reset-password')).flush({ mensaje: 'Contraseña actualizada. Inicia sesion de nuevo.' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Procesando...');
    expect(fixture.nativeElement.textContent).toContain('Contraseña actualizada');
  });

  it('muestra el enlace vencido y retira Procesando sin otro clic', async () => {
    const { fixture, component, http } = await preparar({}, 'token=' + token);
    component.password = component.confirmacion = 'Una frase sintética'; fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    http.expectOne(req => req.url.endsWith('/auth/reset-password')).flush({ mensaje: 'Enlace invalido o vencido' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Procesando...');
    expect(fixture.nativeElement.textContent).toContain('ya fue utilizado');
  });
  it('termina la espera a los 75 segundos sin afirmar que el cambio fracasó', async () => {
    const { component, http } = await preparar({}, 'token=' + token);
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    component.password = component.confirmacion = 'Una frase sintética'; component.enviar();
    const req = http.expectOne(r => r.url.endsWith('/auth/reset-password'));
    await vi.advanceTimersByTimeAsync(75000);
    expect(req.cancelled).toBe(true); expect(component.cargando).toBe(false);
    expect(component.mensaje).toContain('ya puedes iniciar sesión');
    expect(component.completado).toBe(false); expect(component.mensaje).not.toContain(token);
  });
  it('una respuesta vacía también termina la espera y orienta al usuario', async () => {
    const { component } = await preparar();
    vi.spyOn(TestBed.inject(HttpClient), 'post').mockReturnValue(EMPTY);
    component.email = 'test@example.invalid'; component.enviar();
    expect(component.cargando).toBe(false); expect(component.mensaje).toContain('No se pudo confirmar');
  });

});
