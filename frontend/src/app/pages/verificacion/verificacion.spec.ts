import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Verificacion } from './verificacion';
describe('Verificación de correo',()=>{
  const token='a'.repeat(24)+'.'+'b'.repeat(64);
  async function preparar(fragment:string|null=null, identidad=''){
    const auth={getTokenVerificacion:()=>identidad,getToken:()=>null,limpiarVerificacion:vi.fn()};
    await TestBed.configureTestingModule({imports:[Verificacion],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),
      {provide:AuthService,useValue:auth},{provide:ActivatedRoute,useValue:{snapshot:{fragment,queryParamMap:convertToParamMap({})}}}]}).compileComponents();
    const replace=vi.spyOn(TestBed.inject(Location),'replaceState');
    const fixture=TestBed.createComponent(Verificacion);
    return {fixture,component:fixture.componentInstance,http:TestBed.inject(HttpTestingController),replace,auth};
  }
  afterEach(()=>{TestBed.inject(HttpTestingController).verify();vi.restoreAllMocks();});
  it('retira token de URL y no verifica automáticamente; exige contraseña final para cuenta nueva',async()=>{
    const {component,http,replace,auth}=await preparar('token='+token);
    expect(replace).toHaveBeenCalledWith('/verificar-correo');
    const consulta=http.expectOne(r=>r.url.endsWith('/link-status'));expect(consulta.request.body.token).toBe(token);consulta.flush({requiresPassword:true});
    component.confirmar();expect(component.mensaje()).toContain('Revisa la longitud');
    component.password=component.confirmacion='Una frase definitiva 2026';component.confirmar();
    const confirmar=http.expectOne(r=>r.url.endsWith('/confirm'));expect(confirmar.request.body.password).toBe(component.password);confirmar.flush({});
    expect(component.confirmado()).toBe(true);expect(component.password).toBe('');expect(auth.limpiarVerificacion).toHaveBeenCalled();
    expect(localStorage.getItem('verificationToken')).toBeNull();
  });
  it('histórico confirma sin cambiar su contraseña y sin iniciar sesión automática',async()=>{
    const {component,http}=await preparar('token='+token);
    http.expectOne(r=>r.url.endsWith('/link-status')).flush({requiresPassword:false});component.confirmar();
    const r=http.expectOne(r=>r.url.endsWith('/confirm'));expect(r.request.body.password).toBeUndefined();r.flush({});expect(component.confirmado()).toBe(true);
  });
  it('enlace vencido o inválido ofrece solicitar otro',async()=>{
    const {component,http,fixture}=await preparar('token='+token);
    http.expectOne(r=>r.url.endsWith('/link-status')).flush({}, {status:400,statusText:'Bad Request'});
    expect(component.invalido()).toBe(true);fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Solicitar otro enlace');
  });
  it('estado y reenvío usan solo credencial limitada; bloqueo local de reenvíos y 429 seguro',async()=>{
    const {component,http}=await preparar(null,'credencial-sintetica');
    const estado=http.expectOne(r=>r.url.endsWith('/status'));expect(estado.request.headers.get('Authorization')).toBe('Bearer credencial-sintetica');estado.flush({verified:false,registrationExpired:false});
    component.reenviar();http.expectOne(r=>r.url.endsWith('/resend')).flush({mensaje:'Si corresponde, recibirás un enlace.'});
    component.reenviar();http.expectNone(r=>r.url.endsWith('/resend'));expect(component.mensaje()).toContain('Si corresponde');
    component.proximoEnvio=0;component.reenviar();http.expectOne(r=>r.url.endsWith('/resend')).flush({}, {status:429,statusText:'Too Many Requests'});expect(component.mensaje()).toContain('Espera unos minutos');
    component.ngOnDestroy();
  });
  it('registro abandonado informa soporte y no reenvía; sin identidad solicita login',async()=>{
    const {component,http,fixture}=await preparar(null,'credencial-sintetica');
    http.expectOne(r=>r.url.endsWith('/status')).flush({verified:false,registrationExpired:true});component.reenviar();fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Contacta con soporte');
  });
});
