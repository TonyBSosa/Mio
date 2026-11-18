import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { Component } from '@angular/core';
import { Productos } from './pages/productos/productos';
import { CatalogoPublico } from './pages/catalogo-publico/catalogo-publico';
import { PerfilVendedor } from './pages/perfil-vendedor/perfil-vendedor';
import { Bienvenida } from './pages/bienvenida/bienvenida';
import { Lives } from './pages/lives/lives';
import { Clientes } from './pages/clientes/clientes';
import { Pedidos } from './pages/pedidos/pedidos';
import { paginarLista } from './shared/ui/pagination/pagination';

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
          { path: 'cliente/inicio', component: DummyComponent },
          { path: 'cliente/perfil', component: DummyComponent },
          { path: 'catalogo/:id', component: DummyComponent },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows one buyer header with explore and profile navigation', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Ana', rol: 'cliente' }));
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/cliente/perfil');
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('header').length).toBe(1);
    expect(element.querySelector('.workspace-sidebar')).toBeNull();
    expect(element.querySelector('.cliente-nav a[href="/cliente/inicio"]')).toBeTruthy();
    expect(element.querySelector('.cliente-nav a.active')?.textContent).toContain('Mi perfil');
  });

  it('should render public header and skip link on public routes', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.skip-link')?.textContent).toContain('Saltar al contenido');
    expect(compiled.querySelector('.brand strong')?.textContent).toContain('MIO');
  });

  it('keeps buyer identity and profile access when entering a store and returning', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Andrea Mejía', rol: 'cliente' }));
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/cliente/inicio');
    fixture.detectChanges();
    await router.navigateByUrl('/catalogo/tienda-1');
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('header').length).toBe(1);
    expect(element.querySelector('.buyer-identity')?.textContent).toContain('Andrea Mejía');
    expect(element.querySelector('.buyer-identity')?.textContent).toContain('Comprador');
    const profile = element.querySelector('.cliente-nav a[href="/cliente/perfil"]') as HTMLAnchorElement;
    expect(profile).toBeTruthy();
    profile.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/cliente/perfil');
    expect(localStorage.getItem('token')).toBe('test');
  });

  it('keeps the public catalogue navigation for visitors', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/catalogo/tienda-1');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cliente-nav')).toBeNull();
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

  it('should isolate active Live in spotlight, filter agenda cleanly, and toggle form in Lives', () => {
    const fixture = TestBed.createComponent(Lives);
    const comp = fixture.componentInstance;

    comp.lives = [
      { _id: 'l1', nombre: 'Especial Nocturno', estado: 'activo', fecha: '2026-11-11T15:44:00Z' },
      { _id: 'l2', nombre: 'Lanzamiento Hogar', estado: 'programado', fecha: '2026-11-15T18:00:00Z' },
      { _id: 'l3', nombre: 'Venta de zapatos', estado: 'finalizado', fecha: '2026-11-09T01:56:00Z' },
    ];

    expect(comp.liveDestacado?._id).toBe('l1');
    expect(comp.livesAgenda.map((l) => l._id)).toEqual(['l2', 'l3']);
    expect(comp.obtenerEtiquetaEstado('finalizado')).toBe('Finalizado');
    expect(comp.obtenerEtiquetaEstado('activo')).toBe('EN VIVO');

    comp.filtroEstado = 'proximos';
    expect(comp.livesAgenda.map((l) => l._id)).toEqual(['l2']);

    comp.filtroEstado = 'historial';
    expect(comp.livesAgenda.map((l) => l._id)).toEqual(['l3']);

    comp.abrirFormularioNuevo();
    expect(comp.formularioAbierto).toBe(true);
    comp.cerrarFormulario();
    expect(comp.formularioAbierto).toBe(false);
  });

  it('should format phones, generate WhatsApp URLs, filter accent-insensitively, and sort in Clientes', () => {
    const fixture = TestBed.createComponent(Clientes);
    const comp = fixture.componentInstance;

    comp.clientes = [
      { _id: 'c1', nombre: 'RAMIRO', telefono: '', direccion: '' },
      { _id: 'c2', nombre: 'José López', telefono: '99887766', direccion: 'Bloque C, casa 12' },
      { _id: 'c3', nombre: 'bryan', telefono: '022622', direccion: 'Colonia 2' },
    ];
    comp.filtrarClientes();

    expect(comp.telefonoFormateado('99887766')).toBe('9988-7766');
    expect(comp.whatsappUrl('99887766')).toBe('https://wa.me/50499887766');
    expect(comp.whatsappUrl('022622')).toBeNull();

    // Accent-insensitive search
    comp.filtroBusqueda = 'jose';
    comp.filtrarClientes();
    expect(comp.clientesFiltrados.map((c) => c._id)).toEqual(['c2']);

    // Digit-only phone search
    comp.filtroBusqueda = '9988-77';
    comp.filtrarClientes();
    expect(comp.clientesFiltrados.map((c) => c._id)).toEqual(['c2']);

    // Sort asc -> bryan, José López, RAMIRO
    comp.limpiarBusqueda();
    comp.alternarOrden();
    expect(comp.clientesFiltrados.map((c) => c._id)).toEqual(['c3', 'c2', 'c1']);
  });

  it('should paginate lists safely with clamping and handle Orders KPI filters & ObjectId fallback', () => {
    const items = Array.from({ length: 14 }, (_, i) => i + 1);
    const p1 = paginarLista(items, 1, 10);
    expect(p1.totalPaginas).toBe(2);
    expect(p1.itemsPagina.length).toBe(10);

    // Clamping out-of-range page (e.g. after deleting last item on page 3)
    const clamped = paginarLista(items, 5, 10);
    expect(clamped.paginaSegura).toBe(2);
    expect(clamped.itemsPagina).toEqual([11, 12, 13, 14]);

    const fixture = TestBed.createComponent(Pedidos);
    const comp = fixture.componentInstance;
    comp.clientes = [{ _id: 'cl1', nombre: 'Melissa Ochoa' }];
    comp.pedidos = Array.from({ length: 14 }, (_, i) => ({
      _id: `o${i + 1}`,
      clienteId: i === 5 ? '6a2f64c88b2995288647ee1c' : 'cl1',
      producto: `Producto ${i + 1}`,
      cantidad: 1,
      precio: 100,
      estadoPago: i < 12 ? 'pendiente' : 'pagado',
      estadoEntrega: i < 13 ? 'pendiente' : 'entregado',
    }));
    comp.filtrarPedidos(true);

    expect(comp.pedidosPaginados.length).toBe(10);
    expect(comp.obtenerNombreCliente('6a2f64c88b2995288647ee1c')).toBe('Cliente sin registro');
    expect(comp.esClienteSinRegistro('6a2f64c88b2995288647ee1c')).toBe(true);

    comp.paginaActual = 2;
    expect(comp.pedidosPaginados.length).toBe(4);

    // Filtering resets to page 1
    comp.seleccionarKpiOperativo('por-cobrar');
    expect(comp.paginaActual).toBe(1);
    expect(comp.pedidosFiltrados.length).toBe(12);
    expect(comp.pedidosPaginados.length).toBe(10);
  });
});
