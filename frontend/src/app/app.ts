import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './services/auth.service';

const RUTAS_VENDEDOR = new Set([
  '/dashboard',
  '/live-activo',
  '/pedidos',
  '/productos',
  '/clientes',
  '/lives',
  '/resumen',
  '/perfil-vendedor',
]);

const TITULOS_RUTA: Record<string, string> = {
  '/dashboard': 'Resumen de tienda',
  '/live-activo': 'Cabina Live en vivo',
  '/pedidos': 'Pedidos y apartados',
  '/productos': 'Catálogo de productos',
  '/clientes': 'Directorio de clientes',
  '/lives': 'Eventos Live',
  '/resumen': 'Reportes y cierres',
  '/perfil-vendedor': 'Perfil y vitrina pública',
  '/admin/usuarios': 'Gestión de usuarios',
  '/cliente/inicio': 'Explorar tiendas y eventos',
};

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private routerSub?: Subscription;

  protected readonly title = signal('MIO');
  protected readonly rutaActual = signal('/bienvenida');
  protected readonly usuario = signal<any>(null);
  protected readonly estaAutenticado = signal(false);
  protected readonly menuMovilAbierto = signal(false);

  protected readonly esWorkspaceVendedor = computed(() =>
    RUTAS_VENDEDOR.has(this.rutaActual()),
  );

  protected readonly esWorkspaceAdmin = computed(() =>
    this.rutaActual().startsWith('/admin'),
  );

  protected readonly esWorkspaceCliente = computed(() =>
    this.rutaActual().startsWith('/cliente'),
  );

  protected readonly esModoWorkspace = computed(
    () =>
      this.esWorkspaceVendedor() ||
      this.esWorkspaceAdmin() ||
      this.esWorkspaceCliente(),
  );

  protected readonly tituloSeccionActual = computed(
    () => TITULOS_RUTA[this.rutaActual()] || 'Espacio de trabajo',
  );

  protected readonly enlaceCatalogoPublico = computed(() => {
    const u = this.usuario();
    const id = u?._id || u?.id;
    return id ? `/catalogo/${id}` : '';
  });

  protected readonly inicialesUsuario = computed(() => {
    const nombre = (this.usuario()?.nombre || '').trim();
    if (!nombre) return 'M';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  ngOnInit() {
    this.sincronizarEstado(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.sincronizarEstado(event.urlAfterRedirects || event.url);
        this.menuMovilAbierto.set(false);
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.menuMovilAbierto()) {
      this.menuMovilAbierto.set(false);
    }
  }

  protected alternarMenuMovil() {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenuMovil() {
    this.menuMovilAbierto.set(false);
  }

  protected irAMiEspacio() {
    this.cerrarMenuMovil();
    this.authService.redirigirPorRol();
  }

  protected cerrarSesion() {
    this.cerrarMenuMovil();
    this.authService.logout();
  }

  private sincronizarEstado(url: string) {
    const limpia = (url || '/bienvenida').split('?')[0].split('#')[0] || '/bienvenida';
    this.rutaActual.set(limpia);
    this.usuario.set(this.authService.getUsuario());
    this.estaAutenticado.set(this.authService.estaAutenticado());
  }
}
