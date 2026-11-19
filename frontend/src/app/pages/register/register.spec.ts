import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('registro pendiente no guarda sesión completa y navega a verificación', () => {
    const auth=TestBed.inject(AuthService);
    vi.spyOn(auth,'register').mockReturnValue(of({verificationRequired:true,verificationToken:'limitado'}));
    const iniciar=vi.spyOn(auth,'iniciarVerificacion').mockReturnValue(true);
    const guardar=vi.spyOn(auth,'guardarSesion'); const redirigir=vi.spyOn(auth,'redirigirPorRol');
    component.nombre='Prueba';component.email='test@example.invalid';component.password='Una frase sintética';component.register();
    expect(iniciar).toHaveBeenCalled();expect(guardar).not.toHaveBeenCalled();expect(redirigir).not.toHaveBeenCalled();expect(component.password).toBe('');
  });

});
