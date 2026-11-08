import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '<p>Dummy</p>' })
class DummyComponent {}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'bienvenida', component: DummyComponent },
          { path: 'dashboard', component: DummyComponent },
          { path: 'pedidos', component: DummyComponent },
          { path: 'live-activo', component: DummyComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render public header and skip link on public routes', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.skip-link')?.textContent).toContain('Saltar al contenido');
    expect(compiled.querySelector('.brand strong')?.textContent).toContain('MIO');
  });

  it('should switch to seller workspace shell with sidebar and mobile bottom nav on seller routes', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.workspace-sidebar')).toBeTruthy();
    expect(compiled.querySelector('.mobile-bottom-nav')).toBeTruthy();
    expect(compiled.querySelector('.workspace-breadcrumb__current')?.textContent).toContain('Resumen de tienda');
  });
});
