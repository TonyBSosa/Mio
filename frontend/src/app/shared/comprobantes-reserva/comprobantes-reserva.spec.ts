import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComprobantesReserva } from './comprobantes-reserva';
import { environment } from '../../../environments/environment';

describe('Comprobantes de una reserva', () => {
  const id = '507f1f77bcf86cd799439020';
  const url = `${environment.apiUrl}/solicitudes-apartado/${id}/comprobantes`;
  const disponible = { comprobantes: [], cargaHabilitada: true, almacenamientoConfigurado: true,
    politicaCorreccion: 'Una corrección durante 24 horas.', limiteCargaEn: '2030-01-04T00:00:00Z' };
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:comprobante-prueba'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  function componente(vista: 'cliente' | 'vendedor' = 'cliente') {
    const fixture = TestBed.createComponent(ComprobantesReserva);
    fixture.componentRef.setInput('reservaId', id);
    fixture.componentRef.setInput('vista', vista);
    fixture.detectChanges();
    return fixture;
  }
  function seleccionar(fixture: ReturnType<typeof componente>, archivo: File) {
    const input = fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [archivo] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('muestra vacío y bloquea la carga si el almacenamiento no está configurado', () => {
    const fixture = componente();
    http.expectOne(url).flush({ ...disponible, cargaHabilitada: false, almacenamientoConfigurado: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('todavía no está configurada');
    expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
  });

  it('muestra vista previa y solo envía el archivo tras confirmar', () => {
    const fixture = componente();
    http.expectOne(url).flush(disponible);
    fixture.detectChanges();
    seleccionar(fixture, new File(['png-de-prueba'], 'imagen.png', { type: 'image/png' }));
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe('blob:comprobante-prueba');
    http.expectNone(req => req.method === 'POST');
    fixture.componentInstance.enviar();
    fixture.componentInstance.enviar();
    const peticion = http.expectOne(req => req.url === url && req.method === 'POST');
    expect(peticion.request.body instanceof FormData).toBe(true);
    expect(peticion.request.body.get('archivo')).toBeTruthy();
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(peticion.request.headers.has('Content-Type')).toBe(false);
    peticion.flush({ _id: 'c1', estado: 'en_revision' });
    http.expectOne(url).flush({ ...disponible, cargaHabilitada: false, comprobantes: [{ _id: 'c1', estado: 'en_revision' }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('pago queda pendiente de revisión');
    expect(fixture.nativeElement.textContent).toContain('Pendiente de revisión');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:comprobante-prueba');
  });

  it('rechaza formato y tamaño antes de enviar y revoca la vista previa al destruir', () => {
    const fixture = componente();
    http.expectOne(url).flush(disponible); fixture.detectChanges();
    seleccionar(fixture, new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }));
    expect(fixture.nativeElement.textContent).toContain('hasta 5 MB');
    seleccionar(fixture, new File([new Uint8Array(5242881)], 'x.png', { type: 'image/png' }));
    expect(fixture.componentInstance.archivo).toBeNull();
    seleccionar(fixture, new File(['x'], 'x.png', { type: 'image/png' }));
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:comprobante-prueba');
  });

  it('obtiene un acceso temporal para ver la imagen sin guardar una URL permanente', () => {
    const fixture = componente('vendedor');
    http.expectOne(url).flush({ ...disponible, cargaHabilitada: false, comprobantes: [{ _id: 'c1', estado: 'en_revision' }] });
    fixture.detectChanges();
    fixture.componentInstance.ver('c1');
    http.expectOne(`${url}/c1/acceso`).flush({ url: 'https://storage.example.invalid/signed?token=temporal', duraSegundos: 60 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toContain('token=temporal');
    expect(fixture.nativeElement.textContent).toContain('60 segundos');
    expect(localStorage.getItem('comprobante')).toBeNull();
  });

  it('exige motivo antes de rechazar y conserva el historial después de la revisión', () => {
    const fixture = componente('vendedor');
    http.expectOne(url).flush({ ...disponible, cargaHabilitada: false, comprobantes: [{ _id: 'c1', estado: 'en_revision' }] });
    fixture.detectChanges();
    fixture.componentInstance.preparar('c1', 'rechazar');
    fixture.componentInstance.revisar();
    http.expectNone(`${url}/c1/rechazar`);
    expect(fixture.componentInstance.error()).toContain('motivo');
    fixture.componentInstance.motivo = 'No se lee el importe';
    fixture.componentInstance.revisar();
    const peticion = http.expectOne(`${url}/c1/rechazar`);
    expect(peticion.request.body).toEqual({ motivo: 'No se lee el importe' });
    peticion.flush({ _id: 'c1', estado: 'rechazado' });
    http.expectOne(url).flush({ ...disponible, comprobantes: [{ _id: 'c1', estado: 'rechazado', motivo: 'No se lee el importe' }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se lee el importe');
  });

  it('aprueba en dos pasos y muestra el error sin declarar éxito si falla', () => {
    const fixture = componente('vendedor');
    http.expectOne(url).flush({ ...disponible, cargaHabilitada: false, comprobantes: [{ _id: 'c1', estado: 'en_revision' }] });
    fixture.detectChanges();
    fixture.componentInstance.preparar('c1', 'aprobar');
    http.expectNone(`${url}/c1/aprobar`);
    fixture.componentInstance.revisar();
    http.expectOne(`${url}/c1/aprobar`).flush({ mensaje: 'La reserva requiere revisión' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La reserva requiere revisión');
    expect(fixture.componentInstance.mensaje()).toBe('');
  });

  it('ante carga fallida consulta nuevamente el historial y no anuncia pago', () => {
    const fixture = componente();
    http.expectOne(url).flush(disponible); fixture.detectChanges();
    seleccionar(fixture, new File(['png'], 'x.png', { type: 'image/png' }));
    fixture.componentInstance.enviar();
    http.expectOne(req => req.url === url && req.method === 'POST').flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectOne(url).flush(disponible);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Revisá el historial');
    expect(fixture.componentInstance.mensaje()).toBe('');
  });
});
