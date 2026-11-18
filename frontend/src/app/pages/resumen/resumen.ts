import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ResumenService } from '../../services/resumen.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginationComponent, paginarLista } from '../../shared/ui/pagination/pagination';
import { BadgeTone, StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

export type OrdenComparativaLives = 'recientes' | 'ventas' | 'pedidos' | 'pendiente';

export interface FilaComparativaLive {
  id: string;
  nombre: string;
  estado: string;
  fechaTexto: string;
  ts: number;
  pedidos: number;
  totalVendido: number;
  totalPagado: number;
  pendientePago: number;
  porcentajeCobrado: number;
}

@Component({
  selector: 'app-resumen',
  imports: [
    FormsModule,
    RouterModule,
    PageHeaderComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './resumen.html',
  styleUrl: './resumen.css',
})
export class Resumen implements OnInit, OnDestroy {
  lives: any[] = [];
  pedidos: any[] = [];
  liveId = 'todos';
  resumen: any = null;
  mensaje = '';
  error = '';
  cargando = false;

  busquedaLive = '';
  filtroEstadoLive = 'todos';
  ordenLives: OrdenComparativaLives = 'ventas';
  soloConVentas = false;
  paginaLives = 1;
  porPaginaLives = 8;

  private readonly toast = inject(ToastService);
  private routeSub?: Subscription;
  private fragmentSub?: Subscription;

  get porcentajeCobrado(): number {
    const vendido = Number(this.resumen?.totalVendido) || 0;
    const pagado = Number(this.resumen?.totalPagado) || 0;
    if (vendido <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((pagado / vendido) * 100)));
  }

  get porcentajeEntregado(): number {
    const total = Number(this.resumen?.totalPedidos) || 0;
    const entregados = Number(this.resumen?.totalEntregados) || 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((entregados / total) * 100)));
  }

  get ticketPromedio(): number {
    const total = Number(this.resumen?.totalPedidos) || 0;
    const vendido = Number(this.resumen?.totalVendido) || 0;
    if (total <= 0) return 0;
    return Math.round(vendido / total);
  }

  get comparativaLivesBase(): FilaComparativaLive[] {
    const acum = new Map<string, { pedidos: number; vendido: number; pagado: number; pendiente: number }>();

    for (const p of this.pedidos) {
      const id = this.obtenerId(p.liveId);
      if (!id) continue;
      const total = (Number(p?.cantidad) || 0) * (Number(p?.precio) || 0);
      const actual = acum.get(id) || { pedidos: 0, vendido: 0, pagado: 0, pendiente: 0 };
      actual.pedidos += 1;
      actual.vendido += total;
      if (p.estadoPago === 'pagado') {
        actual.pagado += total;
      } else if (p.estadoPago === 'pendiente') {
        actual.pendiente += total;
      }
      acum.set(id, actual);
    }

    return this.lives.map((live) => {
      const id = String(live._id || '');
      const datos = acum.get(id) || { pedidos: 0, vendido: 0, pagado: 0, pendiente: 0 };
      const porcentaje =
        datos.vendido > 0
          ? Math.min(100, Math.max(0, Math.round((datos.pagado / datos.vendido) * 100)))
          : 0;
      const fechaRaw = live.fecha || live.createdAt;
      const ts = fechaRaw ? new Date(fechaRaw).getTime() : 0;

      return {
        id,
        nombre: live.nombre || 'Transmisión',
        estado: live.estado || 'programado',
        fechaTexto: this.formatearFechaCorta(fechaRaw),
        ts: Number.isNaN(ts) ? 0 : ts,
        pedidos: datos.pedidos,
        totalVendido: datos.vendido,
        totalPagado: datos.pagado,
        pendientePago: datos.pendiente,
        porcentajeCobrado: porcentaje,
      };
    });
  }

  get maxVentaComparativa(): number {
    return Math.max(1, ...this.comparativaLivesBase.map((f) => f.totalVendido));
  }

  get comparativaLivesFiltrada(): FilaComparativaLive[] {
    const q = this.busquedaLive.trim().toLowerCase();

    const filtradas = this.comparativaLivesBase.filter((fila) => {
      if (this.soloConVentas && fila.totalVendido <= 0) return false;
      if (this.filtroEstadoLive !== 'todos' && fila.estado !== this.filtroEstadoLive) return false;
      if (q && !fila.nombre.toLowerCase().includes(q)) return false;
      return true;
    });

    return filtradas.sort((a, b) => {
      switch (this.ordenLives) {
        case 'ventas':
          return b.totalVendido - a.totalVendido || b.ts - a.ts;
        case 'pedidos':
          return b.pedidos - a.pedidos || b.totalVendido - a.totalVendido;
        case 'pendiente':
          return b.pendientePago - a.pendientePago || b.totalVendido - a.totalVendido;
        default:
          return b.ts - a.ts;
      }
    });
  }

  get paginacionComparativa() {
    return paginarLista(this.comparativaLivesFiltrada, this.paginaLives, this.porPaginaLives);
  }

  get hayFiltrosComparativa(): boolean {
    return (
      Boolean(this.busquedaLive.trim()) ||
      this.filtroEstadoLive !== 'todos' ||
      this.soloConVentas
    );
  }

  anchoBarraComparativa(monto: number): number {
    if (monto <= 0) return 0;
    return Math.max(4, Math.round((monto / this.maxVentaComparativa) * 100));
  }

  reiniciarPaginaComparativa() {
    this.paginaLives = 1;
  }

  limpiarFiltrosComparativa() {
    this.busquedaLive = '';
    this.filtroEstadoLive = 'todos';
    this.soloConVentas = false;
    this.paginaLives = 1;
  }

  seleccionarDesdeComparativa(id: string) {
    this.liveId = id;
    this.consultarResumen();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  seleccionarModalidadRapida(id: string) {
    this.liveId = id;
    this.consultarResumen();
  }

  obtenerTonoEstadoLive(estado: string): BadgeTone {
    switch (estado) {
      case 'activo':
        return 'live';
      case 'finalizado':
        return 'success';
      case 'pausado':
        return 'warning';
      case 'cancelado':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  obtenerEtiquetaEstadoLive(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'En vivo';
      case 'finalizado':
        return 'Finalizado';
      case 'pausado':
        return 'Pausado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Programado';
    }
  }

  formatearMonto(valor: number): string {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  constructor(
    private authService: AuthService,
    private liveService: LiveService,
    private pedidoService: PedidoService,
    private resumenService: ResumenService,
    private route: ActivatedRoute,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.listarLives();
    this.listarPedidos();

    this.routeSub = this.route.queryParamMap.subscribe((params) => {
      const liveParam = params.get('liveId');
      this.liveId = liveParam || 'todos';
      this.consultarResumen(true);
    });

    this.fragmentSub = this.route.fragment.subscribe((fragment) => {
      if (fragment === 'comparativa-lives' && typeof document !== 'undefined') {
        setTimeout(() => {
          document.getElementById('comparativa-lives')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.fragmentSub?.unsubscribe();
  }

  listarLives() {
    this.error = '';

    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = Array.isArray(respuesta) ? respuesta : [];
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar Lives', error);
        this.error = error.error?.mensaje || 'Error al listar Lives';
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarPedidos() {
    this.pedidoService.listarPedidos().subscribe({
      next: (respuesta: any) => {
        this.pedidos = Array.isArray(respuesta) ? respuesta : [];
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar pedidos para comparativa', error);
      },
    });
  }

  consultarResumen(silencioso = false) {
    this.mensaje = '';
    this.error = '';
    this.resumen = null;

    if (!this.liveId) {
      this.error = 'Debe seleccionar una modalidad o Live';
      return;
    }

    this.cargando = true;

    this.resumenService.obtenerResumenPorLive(this.liveId).subscribe({
      next: (respuesta: any) => {
        this.resumen = respuesta;
        if (!silencioso) {
          this.toast.exito('Resumen actualizado');
        }
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al consultar resumen', error);
        this.error = error.error?.mensaje || 'Error al consultar resumen';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  limpiarResumen() {
    this.liveId = 'todos';
    this.mensaje = '';
    this.error = '';
    this.consultarResumen(true);
  }

  cerrarSesion() {
    this.authService.logout();
  }

  private obtenerId(valor: any): string {
    if (!valor) return '';
    return String(valor._id || valor);
  }

  private formatearFechaCorta(fecha: any): string {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
