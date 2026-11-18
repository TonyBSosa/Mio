import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CatalogoPublico } from './pages/catalogo-publico/catalogo-publico';
import { Login } from './pages/login/login';
import { PerfilCliente } from './pages/cliente/perfil-cliente/perfil-cliente';
import { SolicitudesApartado } from './shared/solicitudes-apartado/solicitudes-apartado';
import { environment } from '../environments/environment';

@Component({ template: '' })
class InicioPrueba {}

describe('Solicitud de apartado: catálogo, login y consulta', () => {
  const vendedorId = '507f1f77bcf86cd799439020';
  const productoId = '507f1f77bcf86cd799439021';
  const producto = { _id: productoId, nombre: 'Blusa azul', precio: 200, estado: 'activo' };
  const cuenta = { _id: '507f1f77bcf86cd799439022', nombre: 'Ana', email: 'ana@example.test', rol: 'cliente' };
  const url = `${environment.apiUrl}/solicitudes-apartado`;
  let http: HttpTestingController;
  const sesion = () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('usuario', JSON.stringify(cuenta));
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([
      { path: 'catalogo/:vendedorId', component: CatalogoPublico },
      { path: 'login', component: Login },
      { path: 'cliente/inicio', component: InicioPrueba },
      { path: 'cliente/perfil', component: PerfilCliente },
    ])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  async function catalogo(query = '') {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(`/catalogo/${vendedorId}${query}`, CatalogoPublico);
    http.expectOne(`${environment.apiUrl}/public/catalogo/${vendedorId}`).flush({
      perfil: { nombrePublico: 'Tienda de prueba' }, productos: [producto], lives: [],
    });
    harness.detectChanges();
    return { harness, component };
  }

  it('envía al visitante a login y regresa al mismo producto tras autenticarse, sin solicitar automáticamente', async () => {
    const { component, harness } = await catalogo();
    component.solicitarApartado(producto);
    const router = TestBed.inject(Router);
    await harness.fixture.whenStable();
    const login = harness.routeDebugElement?.componentInstance as Login;
    expect(router.url).toContain('/login?volver=');
    expect(login).toBeTruthy();
    login.email = cuenta.email;
    login.password = 'clave-de-prueba';
    login.login();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ ...cuenta, token: 'test-token' });
    await harness.fixture.whenStable();
    harness.detectChanges();
    http.expectOne(`${environment.apiUrl}/public/catalogo/${vendedorId}`).flush({ perfil: {}, productos: [producto], lives: [] });
    expect(router.url).toBe(`/catalogo/${vendedorId}?producto=${productoId}`);
    http.expectNone(url);
  });

  it('confirma con solo productoId y muestra el envío sin reservar ni cobrar', async () => {
    sesion();
    const { component, harness } = await catalogo();
    component.solicitarApartado(producto);
    http.expectNone(url);
    component.confirmarSolicitud();
    component.confirmarSolicitud();
    const request = http.expectOne(url);
    expect(request.request.body).toEqual({ productoId });
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ _id: 'solicitud', estado: 'pendiente' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Solicitud enviada');
    expect(producto.estado).toBe('activo');
  });

  it('recupera el producto desde la URL y permite confirmar explícitamente', async () => {
    sesion();
    const { component } = await catalogo(`?producto=${productoId}`);
    expect(component.productoSolicitud?._id).toBe(productoId);
    http.expectNone(url);
  });

  it('no envía artículos no disponibles y muestra el conflicto de duplicado del servidor', async () => {
    sesion();
    const { component, harness } = await catalogo();
    component.solicitarApartado({ ...producto, estado: 'apartado' });
    expect(component.productoSolicitud).toBeNull();
    component.solicitarApartado(producto);
    component.confirmarSolicitud();
    http.expectOne(url).flush({ mensaje: 'Ya tenés una solicitud pendiente para este producto.' }, { status: 409, statusText: 'Conflict' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Ya tenés una solicitud pendiente');
    expect(component.solicitudesEnviadas.size).toBe(0);
  });

  it('rechaza una redirección externa desde login', async () => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/login?volver=https://example.test', Login);
    login.email = cuenta.email;
    login.password = 'clave-de-prueba';
    login.login();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({ ...cuenta, token: 'test-token' });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(TestBed.inject(Router).url).toBe('/cliente/inicio');
  });

  it('Mis apartados carga datos reales al abrirse y muestra producto, tienda, fecha y estado', async () => {
    sesion();
    const fixture = TestBed.createComponent(PerfilCliente);
    http.expectOne(`${environment.apiUrl}/auth/me`).flush(cuenta);
    fixture.detectChanges();
    http.expectNone(url);
    const details = Array.from(fixture.nativeElement.querySelectorAll('details') as NodeListOf<HTMLDetailsElement>)
      .find(element => element.querySelector('summary')?.textContent === 'Mis apartados')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    http.expectOne(url).flush([{
      _id: 'solicitud', productoId, productoNombre: producto.nombre, tiendaNombre: 'Mi tienda',
      compradorNombre: cuenta.nombre, estado: 'pendiente', createdAt: '2026-11-15T12:00:00Z',
    }]);
    fixture.detectChanges();
    expect(details.textContent).toContain('Blusa azul');
    expect(details.textContent).toContain('Mi tienda');
    expect(details.textContent).toContain('15/11/2026');
    expect(details.textContent).toContain('Pendiente de revisión');
  });

  it('muestra el estado vacío y permite reintentar si falla la consulta', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no tenés solicitudes');
  });

  it('el vendedor consulta solicitudes y tiene la confirmación bloqueada por defecto', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    fixture.componentRef.setInput('vista', 'vendedor');
    http.expectOne(url).flush([{
      _id: 'solicitud', productoNombre: producto.nombre, compradorNombre: 'Ana',
      estado: 'pendiente', createdAt: '2026-11-15T12:00:00Z',
    }]);
    fixture.detectChanges();
    http.expectOne(`${url}/configuracion`).flush({ plazoReservaDias: 3, confirmacionPruebaHabilitada: false, motivo: 'Confirmación deshabilitada' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Comprador: Ana');
    const botones = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    expect(botones.find(b => b.textContent?.includes('Confirmar'))?.disabled).toBe(true);
    expect(botones.find(b => b.textContent?.includes('Rechazar'))?.disabled).toBe(false);
  });

  function vendedor(pruebas = false) {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    fixture.componentRef.setInput('vista', 'vendedor');
    http.expectOne(url).flush([{ _id: 's1', productoNombre: 'Blusa', compradorNombre: 'Ana', estado: 'pendiente', precioRegistrado: 250, createdAt: '2026-11-15T12:00:00Z' }]);
    fixture.detectChanges();
    http.expectOne(`${url}/configuracion`).flush({ plazoReservaDias: 3, confirmacionPruebaHabilitada: pruebas, motivo: pruebas ? 'Solo pruebas' : 'Confirmación deshabilitada' });
    fixture.detectChanges();
    return fixture;
  }

  it('rechaza en dos pasos y elimina la fila', () => {
    const fixture = vendedor();
    fixture.componentInstance.preparar('s1', 'rechazar');
    http.expectNone(`${url}/s1/rechazar`);
    fixture.componentInstance.resolver();
    const request = http.expectOne(`${url}/s1/rechazar`);
    expect(request.request.body).toEqual({});
    request.flush({ _id: 's1', productoNombre: 'Blusa', estado: 'rechazada', rechazadoEn: '2026-11-15T13:00:00Z' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Solicitud rechazada y eliminada');
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
  });

  it('solo permite preparar confirmaciones de prueba autorizadas y comunica conflictos', () => {
    const fixture = vendedor(true);
    fixture.componentInstance.preparar('s1', 'confirmar');
    fixture.componentInstance.resolver();
    fixture.componentInstance.resolver();
    http.expectOne(`${url}/s1/confirmar`).flush({ mensaje: 'El producto ya no está disponible.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El producto ya no está disponible');
    expect(fixture.componentInstance.solicitudes()[0].estado).toBe('pendiente');
  });

  it('no envía confirmaciones aunque se invoque el método si el servidor no las habilitó', () => {
    const fixture = vendedor(false);
    fixture.componentInstance.preparar('s1', 'confirmar');
    fixture.componentInstance.resolver();
    http.expectNone(`${url}/s1/confirmar`);
  });

  it('muestra al comprador la reserva de prueba confirmada, sin controles de gestión', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    http.expectOne(url).flush([{ _id: 's1', productoNombre: 'Blusa', tiendaNombre: 'Mi tienda', estado: 'confirmada', esPrueba: true, precioRegistrado: 250, precioConfirmado: 250, confirmadoEn: '2026-11-15T12:00:00Z', venceEn: '2026-11-18T12:00:00Z' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reserva confirmada');
    expect(fixture.nativeElement.textContent).toContain('No usar para pagos reales');
    expect(fixture.nativeElement.textContent).not.toContain('Rechazar');
    http.expectNone(`${url}/configuracion`);
  });

  it('guarda el plazo y restaura la selección cuando falla el guardado', () => {
    const fixture = vendedor();
    const selector = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    selector.value = '7';
    selector.dispatchEvent(new Event('change'));
    const request = http.expectOne(`${url}/configuracion`);
    expect(request.request.body).toEqual({ plazoReservaDias: 7 });
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(selector.value).toBe('3');
    expect(fixture.nativeElement.textContent).toContain('No se guardó el plazo');
  });

  it('muestra el tiempo restante calculado por backend y refresca a expirada sin decidirlo localmente', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    const solicitud = {
      _id: 's1', productoNombre: 'Blusa', estado: 'confirmada', esPrueba: true,
      venceEn: '2030-01-04T00:00:00Z', calculadoEn: '2030-01-01T23:00:00Z', tiempoRestanteSegundos: 176400,
    };
    http.expectOne(url).flush([solicitud]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tiempo restante al actualizar: 2 días y 1 hora');
    expect(fixture.componentInstance.solicitudes()[0].estado).toBe('confirmada');
    fixture.componentInstance.cargar();
    http.expectOne(url).flush([{ ...solicitud, estado: 'expirada', expiradoEn: solicitud.venceEn, tiempoRestanteSegundos: null, inventarioLiberado: true }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reserva expirada');
    expect(fixture.nativeElement.textContent).not.toContain('Tiempo restante al actualizar');
    expect(fixture.nativeElement.textContent).not.toContain('Confirmar reserva');
  });

  it('presenta comprobante en revisión sin ofrecer un flujo de subida ni acciones de reserva', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    http.expectOne(url).flush([{ _id: 's1', productoNombre: 'Blusa', estado: 'comprobante_en_revision' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Comprobante en revisión');
    expect(fixture.nativeElement.textContent).toContain('La reserva se mantiene');
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
  });

  it('conserva el aviso de revisión si una reserva expira sin poder liberar inventario', () => {
    const fixture = vendedor();
    fixture.componentInstance.solicitudes.set([{
      _id: 's1', productoId: 'p1', productoNombre: 'Blusa', productoCodigo: '', compradorNombre: 'Ana', tiendaNombre: 'Tienda',
      estado: 'expirada', createdAt: '2030-01-01T00:00:00Z', expiradoEn: '2030-01-04T00:00:00Z', inventarioLiberado: false,
    }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El inventario requiere revisión');
    expect(fixture.nativeElement.textContent).not.toContain('Confirmar reserva');
  });

  it('el comprador cancela en dos pasos, envía solo la referencia y retira la fila', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    const solicitud = { _id: 's1', productoId, productoNombre: 'Blusa', productoCodigo: '', compradorNombre: 'Ana', tiendaNombre: 'Tienda', estado: 'pendiente' as const, createdAt: '2030-01-01T00:00:00Z' };
    http.expectOne(url).flush([solicitud]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cancelar apartado');
    fixture.componentInstance.prepararCancelacion(solicitud);
    http.expectNone(`${url}/s1/cancelar`);
    fixture.componentInstance.cancelarApartado();
    fixture.componentInstance.cancelarApartado();
    const request = http.expectOne(`${url}/s1/cancelar`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({});
    request.flush({ _id: 's1', estado: 'cancelada', eliminada: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Apartado cancelado');
  });

  it('no ofrece cancelación de pagos y mantiene la fila cuando el servidor rechaza cancelar', () => {
    sesion();
    const fixture = TestBed.createComponent(SolicitudesApartado);
    http.expectOne(url).flush([{ _id: 's1', productoNombre: 'Blusa', estado: 'pagada' }]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Cancelar apartado');
    fixture.componentInstance.solicitudes.set([{ _id: 's1', productoId, productoNombre: 'Blusa', productoCodigo: '', compradorNombre: 'Ana', tiendaNombre: 'Tienda', estado: 'confirmada', createdAt: '2030-01-01' }]);
    fixture.componentInstance.prepararCancelacion(fixture.componentInstance.solicitudes()[0]);
    fixture.componentInstance.cancelarApartado();
    http.expectOne(`${url}/s1/cancelar`).flush({ mensaje: 'Ya se recibió un comprobante.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ya se recibió un comprobante');
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(1);
  });
});
