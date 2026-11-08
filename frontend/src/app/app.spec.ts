import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { Component } from '@angular/core';
import { Productos } from './pages/productos/productos';
import { CatalogoPublico } from './pages/catalogo-publico/catalogo-publico';
import { PerfilVendedor } from './pages/perfil-vendedor/perfil-vendedor';
import { Bienvenida } from './pages/bienvenida/bienvenida';

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
          { path: 'clientes', component: DummyComponent },
          { path: 'productos', component: DummyComponent },
          { path: 'resumen', component: DummyComponent },
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

  it('should highlight only the active route in mobile drawer and close via button or backdrop', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const trigger = compiled.querySelector('.mobile-menu-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const activeLinks = Array.from(compiled.querySelectorAll('.mobile-drawer__nav a.active'));
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0].textContent).toContain('Mi tienda (Dashboard)');

    const closeBtn = compiled.querySelector('.drawer-close-btn') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();
    expect(compiled.querySelector('.mobile-drawer')).toBeNull();
  });

  it('should update workspace breadcrumb for Incremento 3 routes (/productos, /clientes, /resumen)', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/productos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.workspace-breadcrumb__current')?.textContent).toContain('Catálogo de productos');

    await router.navigateByUrl('/clientes');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.querySelector('.workspace-breadcrumb__current')?.textContent).toContain('Directorio de clientes');

    await router.navigateByUrl('/resumen');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.querySelector('.workspace-breadcrumb__current')?.textContent).toContain('Reportes y cierres');
  });

  it('should handle broken product image fallback and protect reserved products linked to orders', () => {
    const fixture = TestBed.createComponent(Productos);
    const comp = fixture.componentInstance;

    const prodSinFoto = { _id: 'p1', nombre: 'Cafetera Italiana', foto: '' };
    expect(comp.tieneFotoValida(prodSinFoto)).toBe(false);
    expect(comp.tieneErrorFoto(prodSinFoto)).toBe(false);

    const prodFotoRota = { _id: 'p2', nombre: 'Lámpara de Mesa', foto: 'https://invalid.example/broken.jpg' };
    expect(comp.tieneFotoValida(prodFotoRota)).toBe(true);
    comp.marcarErrorFoto(prodFotoRota);
    expect(comp.tieneFotoValida(prodFotoRota)).toBe(false);
    expect(comp.tieneErrorFoto(prodFotoRota)).toBe(true);

    // Producto apartado manualmente (sin pedido vinculado) requiere confirmación antes de reactivar
    const prodApartadoManual = { _id: 'p3', nombre: 'Reloj de Pared', estado: 'apartado' };
    comp.solicitarReactivarProducto(prodApartadoManual);
    expect(comp.confirmandoReactivarId).toBe('p3');

    // Producto vinculado a un pedido activo bloquea reactivación y eliminación
    comp.productosConPedidoIds.add('p4');
    const prodConPedido = { _id: 'p4', nombre: 'Bolso Artesanal', estado: 'apartado' };
    comp.solicitarReactivarProducto(prodConPedido);
    expect(comp.confirmandoReactivarId).toBe('');
    expect(comp.error).toContain('vinculado a un pedido');
  });

  it('should normalize public storefront contact links, handle image fallbacks, and compute seller profile preview data', () => {
    const catFixture = TestBed.createComponent(CatalogoPublico);
    const catComp = catFixture.componentInstance;

    expect(catComp.obtenerEnlaceCanal('+504 9988-7766', 'whatsapp')).toBe('https://wa.me/50499887766');
    expect(catComp.obtenerEnlaceCanal('instagram.com/mitienda')).toBe('https://instagram.com/mitienda');
    expect(catComp.obtenerEnlaceCanal('https://tiktok.com/@mitienda')).toBe('https://tiktok.com/@mitienda');

    const itemFoto = { _id: 'c1', codigo: 'SKU-10', nombre: 'Lámpara LED', foto: 'https://invalid.example/item.jpg' };
    expect(catComp.tieneFotoValida(itemFoto)).toBe(true);
    catComp.marcarErrorFoto(itemFoto);
    expect(catComp.tieneFotoValida(itemFoto)).toBe(false);

    const perfilFixture = TestBed.createComponent(PerfilVendedor);
    const perfilComp = perfilFixture.componentInstance;
    perfilComp.perfil = {
      nombrePublico: 'Estudio Lumina',
      descripcion: 'Artículos de hogar y oficina',
      whatsapp: '+504 9988-7766',
      enlaceLive: 'https://instagram.com/lumina/live',
      instagram: 'https://instagram.com/lumina',
      facebook: '',
      tiktok: '',
    };
    expect(perfilComp.obtenerInicialesTienda()).toBe('EL');
    expect(perfilComp.contarCanalesActivos()).toBe(3);
  });

  it('should switch interactive hero demo views in Bienvenida via click, keyboard arrows, and pause controls', () => {
    const fixture = TestBed.createComponent(Bienvenida);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.vistaActiva).toBe('catalogo');
    expect(comp.indiceVistaActiva).toBe(0);

    // Keyboard navigation ArrowRight -> pedidos
    comp.manejarTecladoTabs(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(comp.vistaActiva).toBe('pedidos');
    expect(comp.indiceVistaActiva).toBe(1);

    // Keyboard navigation ArrowRight -> vitrina
    comp.manejarTecladoTabs(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(comp.vistaActiva).toBe('vitrina');
    expect(comp.indiceVistaActiva).toBe(2);

    // Keyboard navigation ArrowLeft -> pedidos
    comp.manejarTecladoTabs(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(comp.vistaActiva).toBe('pedidos');

    // Manual selection and interaction pause/resume
    comp.seleccionarVista('catalogo');
    expect(comp.vistaActiva).toBe('catalogo');
    comp.pausarPorInteraccion();
    expect(comp.pausadoInteraccion).toBe(true);
    comp.reanudarPorInteraccion();
    // Keyboard selection retains focus: leaving hover must not resume rotation.
    expect(comp.pausadoInteraccion).toBe(true);
    (document.activeElement as HTMLElement)?.blur();
    comp.reanudarPorInteraccion('foco');
    expect(comp.pausadoInteraccion).toBe(false);
    comp.alternarAutoplayManual();
    expect(comp.pausadoManual).toBe(true);
  });
});
