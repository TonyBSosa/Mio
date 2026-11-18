import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

export type PeriodoBalance = 'hoy' | 'semana' | 'mes' | 'todo';
export type VistaPendientes = 'cobro' | 'entrega';
export type ModoSerieLives = 'recientes' | 'top';

export interface PuntoSerieLive {
  id: string;
  etiqueta: string;
  monto: number;
  pedidos: number;
  ts: number;
}

const DIA_MS = 86_400_000;
const DIAS_PERIODO: Record<PeriodoBalance, number | null> = {
  hoy: 1,
  semana: 7,
  mes: 30,
  todo: null,
};
const HORAS_URGENTE = 48;
const HORAS_LIVE_SOSPECHOSO = 12;
const CODIGO_PAIS = '504';
const MAX_PENDIENTES_VISIBLES = 3;
const MAX_BARRAS_LIVES = 6;
const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule, TitleCasePipe, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  clientes: any[] = [];
  lives: any[] = [];
  productos: any[] = [];
  pedidos: any[] = [];

  totalClientes = 0;
  totalLives = 0;
  totalProductos = 0;
  totalPedidos = 0;
  totalVendido = 0;
  totalPagado = 0;
  totalPendientePago = 0;
  totalPendienteEntrega = 0;
  topLive = '';
  topArticulo = '';
  topCliente = '';
  private readonly toast = inject(ToastService);
  private _mensaje = '';
  get mensaje(): string {
    return this._mensaje;
  }
  set mensaje(valor: string) {
    this._mensaje = valor;
    if (valor) {
      this.toast.exito(valor);
    }
  }
  error = '';
  cargando = false;
  usuario: any = null;
  liveActivo: any = null;
  liveSeleccionadoId = '';
  accionLiveConfirmando: '' | 'finalizar' | 'cancelar' = '';

  readonly periodos: { clave: PeriodoBalance; etiqueta: string }[] = [
    { clave: 'hoy', etiqueta: 'Hoy' },
    { clave: 'semana', etiqueta: '7 días' },
    { clave: 'mes', etiqueta: '30 días' },
    { clave: 'todo', etiqueta: 'Todo' },
  ];
  periodo: PeriodoBalance = 'todo';
  vistaPendientes: VistaPendientes = 'cobro';
  modoSerieLives: ModoSerieLives = 'recientes';
  paginaSerieLives = 0;
  resolviendoPedidoId = '';

  private cargasPendientes = 0;

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private liveService: LiveService,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.cargarDashboard();
  }

  get saludoTitulo(): string {
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
    const nombre = (this.usuario?.nombre || '').trim();
    return nombre ? `${saludo}, ${nombre}` : `${saludo}, Mi tienda`;
  }

  cambiarPeriodo(p: PeriodoBalance) {
    this.periodo = p;
  }

  cambiarVistaPendientes(vista: VistaPendientes) {
    this.vistaPendientes = vista;
  }

  cargarDashboard() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;
    this.cargasPendientes = 4;

    this.clienteService.listarClientes().subscribe({
      next: (respuesta: any) => {
        this.clientes = respuesta || [];
        this.finalizarCarga();
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.error = error.error?.mensaje || 'Error al cargar clientes';
        this.finalizarCarga();
      },
    });

    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = respuesta || [];
        this.asignarLiveActivoDesdeLista();
        this.finalizarCarga();
      },
      error: (error) => {
        console.error('Error al cargar Lives', error);
        this.error = error.error?.mensaje || 'Error al cargar Lives';
        this.finalizarCarga();
      },
    });

    this.productoService.listarProductos().subscribe({
      next: (respuesta: any) => {
        this.productos = respuesta || [];
        this.finalizarCarga();
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.error = error.error?.mensaje || 'Error al cargar productos';
        this.finalizarCarga();
      },
    });

    this.pedidoService.listarPedidos().subscribe({
      next: (respuesta: any) => {
        this.pedidos = respuesta || [];
        this.finalizarCarga();
      },
      error: (error) => {
        console.error('Error al cargar pedidos', error);
        this.error = error.error?.mensaje || 'Error al cargar pedidos';
        this.finalizarCarga();
      },
    });

    this.cargarLiveActivo();
  }

  cargarLiveActivo() {
    this.liveService.obtenerLiveActivo().subscribe({
      next: (respuesta: any) => {
        this.liveActivo = respuesta;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar Live activo', error);
        this.asignarLiveActivoDesdeLista();

        if (!this.liveActivo) {
          this.error = error.error?.mensaje || 'Error al cargar Live activo';
        }

        this.detectorCambios.detectChanges();
      },
    });
  }

  asignarLiveActivoDesdeLista() {
    if (this.liveActivo || this.lives.length === 0) {
      return;
    }

    const livesActivos = this.lives
      .filter((live) => live.estado === 'activo')
      .sort((liveA, liveB) => {
        const fechaA = new Date(liveA.updatedAt || liveA.createdAt || 0).getTime();
        const fechaB = new Date(liveB.updatedAt || liveB.createdAt || 0).getTime();

        return fechaB - fechaA;
      });

    this.liveActivo = livesActivos.length > 0 ? livesActivos[0] : null;

    if (this.liveActivo && this.error.includes('Live activo')) {
      this.error = '';
    }
  }

  finalizarCarga() {
    this.cargasPendientes -= 1;

    if (this.cargasPendientes === 0) {
      this.calcularMetricas();
      this.cargando = false;
      this.detectorCambios.detectChanges();
    }
  }

  calcularMetricas() {
    const ventasPorLive: Record<string, number> = {};
    const pedidosPorLive: Record<string, number> = {};
    const ventasPorArticulo: Record<string, number> = {};
    const pedidosPorCliente: Record<string, number> = {};

    this.totalClientes = this.clientes.length;
    this.totalLives = this.lives.length;
    this.totalProductos = this.productos.length;
    this.totalPedidos = this.pedidos.length;
    this.totalVendido = 0;
    this.totalPagado = 0;
    this.totalPendientePago = 0;
    this.totalPendienteEntrega = 0;
    this.topLive = '';
    this.topArticulo = '';
    this.topCliente = '';

    for (const pedido of this.pedidos) {
      const cantidad = Number(pedido.cantidad) || 0;
      const totalPedido = this.totalPedido(pedido);
      const liveId = this.obtenerId(pedido.liveId);
      const clienteId = this.obtenerId(pedido.clienteId);
      const producto = pedido.producto || 'Sin producto';

      this.totalVendido += totalPedido;

      if (pedido.estadoPago === 'pagado') {
        this.totalPagado += totalPedido;
      }

      if (pedido.estadoPago === 'pendiente') {
        this.totalPendientePago += totalPedido;
      }

      if (pedido.estadoEntrega === 'pendiente') {
        this.totalPendienteEntrega += 1;
      }

      if (liveId) {
        ventasPorLive[liveId] = (ventasPorLive[liveId] || 0) + totalPedido;
        pedidosPorLive[liveId] = (pedidosPorLive[liveId] || 0) + 1;
      }
      ventasPorArticulo[producto] = (ventasPorArticulo[producto] || 0) + cantidad;
      if (clienteId) {
        pedidosPorCliente[clienteId] = (pedidosPorCliente[clienteId] || 0) + 1;
      }
    }

    this.topLive = this.obtenerTopLive(ventasPorLive, pedidosPorLive);
    this.topArticulo = this.obtenerTopArticulo(ventasPorArticulo);
    this.topCliente = this.obtenerTopCliente(pedidosPorCliente);
  }

  get pendientesCobro(): any[] {
    return this.pedidos
      .filter((p) => p.estadoPago === 'pendiente')
      .sort((a, b) => this.tiempoPedido(a) - this.tiempoPedido(b));
  }

  get pendientesEntrega(): any[] {
    return this.pedidos
      .filter((p) => p.estadoEntrega === 'pendiente')
      .sort((a, b) => this.tiempoPedido(a) - this.tiempoPedido(b));
  }

  get pendientesActuales(): any[] {
    return this.vistaPendientes === 'cobro' ? this.pendientesCobro : this.pendientesEntrega;
  }

  get pendientesVisibles(): any[] {
    return this.pendientesActuales.slice(0, MAX_PENDIENTES_VISIBLES);
  }

  get montoPorCobrar(): number {
    return this.pendientesCobro.reduce((acc, p) => acc + this.totalPedido(p), 0);
  }

  get siguientePaso(): { tipo: 'cobro' | 'entrega'; texto: string; cta: string; filtro: string } | null {
    const cobro = this.pendientesCobro;
    if (cobro.length > 0) {
      const urgentes = cobro.filter((p) => this.esUrgente(p)).length;
      let texto = `${cobro.length} ${this.plural(cobro.length, 'pago por confirmar', 'pagos por confirmar')}`;
      if (urgentes > 0) {
        texto += `, ${urgentes} ${this.plural(urgentes, 'lleva', 'llevan')} más de ${HORAS_URGENTE} h`;
      }
      return { tipo: 'cobro', texto, cta: 'Revisar cobros', filtro: 'por-cobrar' };
    }

    const entrega = this.pendientesEntrega;
    if (entrega.length > 0) {
      return {
        tipo: 'entrega',
        texto: `${entrega.length} ${this.plural(entrega.length, 'pedido pagado listo', 'pedidos pagados listos')} para despachar`,
        cta: 'Ver entregas',
        filtro: 'por-entregar',
      };
    }

    return null;
  }

  get balance() {
    const dias = DIAS_PERIODO[this.periodo];
    let actuales = this.pedidos;
    let previos: any[] | null = null;

    if (dias !== null) {
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);
      const fin = inicioHoy.getTime() + DIA_MS;
      const inicio = fin - dias * DIA_MS;

      actuales = this.pedidos.filter((p) => {
        const ts = this.tiempoPedido(p);
        return ts > 0 && ts >= inicio && ts < fin;
      });
      previos = this.pedidos.filter((p) => {
        const ts = this.tiempoPedido(p);
        return ts > 0 && ts >= inicio - dias * DIA_MS && ts < inicio;
      });
    }

    const total = actuales.reduce((acc, p) => acc + this.totalPedido(p), 0);
    const cobrado = actuales
      .filter((p) => p.estadoPago === 'pagado')
      .reduce((acc, p) => acc + this.totalPedido(p), 0);
    const porCobrar = Math.max(0, total - cobrado);
    const porcentaje = total > 0 ? Math.round((cobrado / total) * 100) : 0;

    let variacion: number | null = null;
    if (previos) {
      const anterior = previos.reduce((acc, p) => acc + this.totalPedido(p), 0);
      if (anterior > 0) {
        variacion = ((total - anterior) / anterior) * 100;
      }
    }

    return {
      total,
      cobrado,
      porCobrar,
      porcentaje,
      variacion,
      variacionAbs: variacion === null ? 0 : Math.round(Math.abs(variacion)),
      cantidad: actuales.length,
    };
  }

  get etiquetaPeriodo(): string {
    switch (this.periodo) {
      case 'hoy':
        return 'Vendido hoy';
      case 'semana':
        return 'Vendido en los últimos 7 días';
      case 'mes':
        return 'Vendido en los últimos 30 días';
      default:
        return 'Total vendido acumulado';
    }
  }

  get estadisticasLiveActivo(): { ventas: number; pedidos: number; horasAbierto: number; sospechoso: boolean } | null {
    if (!this.liveActivo) return null;
    const liveId = this.obtenerId(this.liveActivo);
    const pedidosLive = this.pedidos.filter((p) => this.obtenerId(p.liveId) === liveId);
    const ventas = pedidosLive.reduce((acc, p) => acc + this.totalPedido(p), 0);
    const inicioTs = this.parsearTiempo(this.liveActivo.updatedAt || this.liveActivo.fecha || this.liveActivo.createdAt);
    const horasAbierto = inicioTs > 0 ? Math.max(0, Math.floor((Date.now() - inicioTs) / 3_600_000)) : 0;
    return {
      ventas,
      pedidos: pedidosLive.length,
      horasAbierto,
      sospechoso: horasAbierto >= HORAS_LIVE_SOSPECHOSO,
    };
  }

  cambiarModoSerieLives(modo: ModoSerieLives) {
    if (this.modoSerieLives === modo) return;
    this.modoSerieLives = modo;
    this.paginaSerieLives = 0;
  }

  get serieLivesCompleta(): PuntoSerieLive[] {
    const acumulado = new Map<string, { monto: number; pedidos: number }>();
    for (const p of this.pedidos) {
      const id = this.obtenerId(p.liveId);
      if (!id) continue;
      const actual = acumulado.get(id) || { monto: 0, pedidos: 0 };
      actual.monto += this.totalPedido(p);
      actual.pedidos += 1;
      acumulado.set(id, actual);
    }

    const puntos: PuntoSerieLive[] = Array.from(acumulado.entries())
      .map(([id, datos]) => {
        const live = this.lives.find((l) => l._id === id);
        const ts = this.parsearTiempo(live?.fecha || live?.createdAt);
        return {
          id,
          etiqueta: this.obtenerNombreLive(id),
          monto: datos.monto,
          pedidos: datos.pedidos,
          ts,
        };
      })
      .filter((pt) => pt.monto > 0);

    if (this.modoSerieLives === 'top') {
      return puntos.sort((a, b) => b.monto - a.monto || b.ts - a.ts);
    }

    return puntos.sort((a, b) => a.ts - b.ts);
  }

  get totalPaginasSerieLives(): number {
    return Math.max(1, Math.ceil(this.serieLivesCompleta.length / MAX_BARRAS_LIVES));
  }

  get paginaSerieLivesSegura(): number {
    return Math.min(Math.max(0, this.paginaSerieLives), this.totalPaginasSerieLives - 1);
  }

  get serieLives(): PuntoSerieLive[] {
    const todas = this.serieLivesCompleta;
    if (todas.length <= MAX_BARRAS_LIVES) {
      return todas;
    }

    if (this.modoSerieLives === 'recientes') {
      const fin = todas.length - this.paginaSerieLivesSegura * MAX_BARRAS_LIVES;
      const inicio = Math.max(0, fin - MAX_BARRAS_LIVES);
      return todas.slice(inicio, fin);
    }

    const inicio = this.paginaSerieLivesSegura * MAX_BARRAS_LIVES;
    return todas.slice(inicio, inicio + MAX_BARRAS_LIVES);
  }

  get puedeMoverSerieIzquierda(): boolean {
    if (this.totalPaginasSerieLives <= 1) return false;
    return this.modoSerieLives === 'recientes'
      ? this.paginaSerieLivesSegura < this.totalPaginasSerieLives - 1
      : this.paginaSerieLivesSegura > 0;
  }

  get puedeMoverSerieDerecha(): boolean {
    if (this.totalPaginasSerieLives <= 1) return false;
    return this.modoSerieLives === 'recientes'
      ? this.paginaSerieLivesSegura > 0
      : this.paginaSerieLivesSegura < this.totalPaginasSerieLives - 1;
  }

  moverSerieLivesIzquierda() {
    if (!this.puedeMoverSerieIzquierda) return;
    this.paginaSerieLives =
      this.modoSerieLives === 'recientes'
        ? this.paginaSerieLivesSegura + 1
        : this.paginaSerieLivesSegura - 1;
  }

  moverSerieLivesDerecha() {
    if (!this.puedeMoverSerieDerecha) return;
    this.paginaSerieLives =
      this.modoSerieLives === 'recientes'
        ? this.paginaSerieLivesSegura - 1
        : this.paginaSerieLivesSegura + 1;
  }

  get resumenSerieLives(): string {
    const total = this.serieLivesCompleta.length;
    const visibles = this.serieLives.length;
    if (total <= MAX_BARRAS_LIVES) {
      return `${total} ${this.plural(total, 'transmisión', 'transmisiones')} con ventas`;
    }

    if (this.modoSerieLives === 'recientes') {
      const fin = total - this.paginaSerieLivesSegura * MAX_BARRAS_LIVES;
      const inicio = Math.max(1, fin - visibles + 1);
      return `${inicio}–${fin} de ${total} · Escala global`;
    }

    const inicio = this.paginaSerieLivesSegura * MAX_BARRAS_LIVES + 1;
    const fin = inicio + visibles - 1;
    return `Top ${inicio}–${fin} de ${total} · Escala global`;
  }

  get maxSerieLives(): number {
    return Math.max(1, ...this.serieLivesCompleta.map((pt) => pt.monto));
  }

  alturaBarra(monto: number): number {
    return Math.max(10, Math.round((monto / this.maxSerieLives) * 100));
  }

  resolverPendiente(pedido: any) {
    if (!pedido?._id || this.resolviendoPedidoId) return;

    this.mensaje = '';
    this.error = '';
    this.resolviendoPedidoId = pedido._id;

    if (this.vistaPendientes === 'cobro') {
      this.pedidoService.marcarPago(pedido._id, 'pagado').subscribe({
        next: () => {
          pedido.estadoPago = 'pagado';
          this.calcularMetricas();
          this.mensaje = `Pago confirmado para ${this.obtenerNombreCliente(pedido.clienteId)}`;
          this.resolviendoPedidoId = '';
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al confirmar pago desde dashboard', error);
          this.error = error.error?.mensaje || 'No se pudo confirmar el pago';
          this.resolviendoPedidoId = '';
          this.detectorCambios.detectChanges();
        },
      });
      return;
    }

    this.pedidoService.marcarEntrega(pedido._id, 'entregado').subscribe({
      next: () => {
        pedido.estadoEntrega = 'entregado';
        this.calcularMetricas();
        this.mensaje = `Pedido de ${this.obtenerNombreCliente(pedido.clienteId)} marcado como entregado`;
        this.resolviendoPedidoId = '';
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al marcar entrega desde dashboard', error);
        this.error = error.error?.mensaje || 'No se pudo marcar la entrega';
        this.resolviendoPedidoId = '';
        this.detectorCambios.detectChanges();
      },
    });
  }

  cerrarPopover(popoverEl?: HTMLElement | null) {
    try {
      (popoverEl as any)?.hidePopover?.();
    } catch {
      // Ignora si el navegador no soporta Popover API
    }
  }

  obtenerTopLive(ventasPorLive: Record<string, number>, pedidosPorLive: Record<string, number>) {
    let mejorLiveId = '';
    let mayorVenta = 0;
    let mayorPedidos = 0;

    for (const liveId in ventasPorLive) {
      if (
        ventasPorLive[liveId] > mayorVenta ||
        (ventasPorLive[liveId] === mayorVenta && pedidosPorLive[liveId] > mayorPedidos)
      ) {
        mejorLiveId = liveId;
        mayorVenta = ventasPorLive[liveId];
        mayorPedidos = pedidosPorLive[liveId];
      }
    }

    return mejorLiveId ? this.obtenerNombreLive(mejorLiveId) : 'Sin datos';
  }

  obtenerTopArticulo(ventasPorArticulo: Record<string, number>) {
    let mejorArticulo = '';
    let mayorCantidad = 0;

    for (const articulo in ventasPorArticulo) {
      if (ventasPorArticulo[articulo] > mayorCantidad) {
        mejorArticulo = articulo;
        mayorCantidad = ventasPorArticulo[articulo];
      }
    }

    return mejorArticulo || 'Sin datos';
  }

  obtenerTopCliente(pedidosPorCliente: Record<string, number>) {
    let mejorClienteId = '';
    let mayorPedidos = 0;

    for (const clienteId in pedidosPorCliente) {
      if (pedidosPorCliente[clienteId] > mayorPedidos) {
        mejorClienteId = clienteId;
        mayorPedidos = pedidosPorCliente[clienteId];
      }
    }

    return mejorClienteId ? this.obtenerNombreCliente(mejorClienteId) : 'Sin datos';
  }

  obtenerNombreCliente(clienteId: any): string {
    if (clienteId && typeof clienteId === 'object' && clienteId.nombre) {
      return clienteId.nombre;
    }

    const id = this.obtenerId(clienteId);
    const cliente = this.clientes.find((clienteItem) => clienteItem._id === id);
    if (cliente?.nombre) {
      return cliente.nombre;
    }

    if (!id || OBJECT_ID_REGEX.test(String(id))) {
      return 'Cliente sin registro';
    }

    return String(id);
  }

  obtenerTelefonoCliente(pedido: any): string {
    if (pedido?.clienteId && typeof pedido.clienteId === 'object' && pedido.clienteId.telefono) {
      return String(pedido.clienteId.telefono);
    }

    const id = this.obtenerId(pedido?.clienteId);
    const cliente = this.clientes.find((c) => c._id === id);
    return cliente?.telefono ? String(cliente.telefono) : '';
  }

  obtenerNombreLive(liveId: any): string {
    if (liveId && typeof liveId === 'object' && liveId.nombre) {
      return liveId.nombre;
    }

    const id = this.obtenerId(liveId);
    const live = this.lives.find((liveItem) => liveItem._id === id);

    if (live?.nombre) {
      return live.nombre;
    }

    if (!id || OBJECT_ID_REGEX.test(String(id))) {
      return 'Transmisión';
    }

    return String(id);
  }

  obtenerId(valor: any) {
    return valor && valor._id ? valor._id : valor;
  }

  totalPedido(pedido: any): number {
    const cantidad = Number(pedido?.cantidad) || 0;
    const precio = Number(pedido?.precio) || 0;
    return cantidad * precio;
  }

  iniciales(nombre: string): string {
    const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  hace(pedido: any): string {
    const ts = this.tiempoPedido(pedido);
    if (!ts) return 'Reciente';
    const min = Math.floor((Date.now() - ts) / 60_000);
    if (min < 1) return 'Hace un momento';
    if (min < 60) return `Hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Hace ${h} h`;
    const d = Math.floor(h / 24);
    return `Hace ${d} ${d === 1 ? 'día' : 'días'}`;
  }

  esUrgente(pedido: any): boolean {
    const ts = this.tiempoPedido(pedido);
    if (!ts) return false;
    return (Date.now() - ts) / 3_600_000 >= HORAS_URGENTE;
  }

  whatsappUrl(pedido: any, vista: VistaPendientes): string | null {
    const telefono = this.obtenerTelefonoCliente(pedido).replace(/\D/g, '');
    let numero: string | null = null;
    if (telefono.length === 8) numero = `${CODIGO_PAIS}${telefono}`;
    else if (telefono.length >= 10 && telefono.length <= 15) numero = telefono;
    if (!numero) return null;

    const nombreCompleto = this.obtenerNombreCliente(pedido.clienteId);
    const primerNombre = nombreCompleto === 'Cliente sin registro' ? '' : nombreCompleto.trim().split(/\s+/)[0] || '';
    const saludo = primerNombre ? `Hola ${primerNombre}` : 'Hola';
    const monto = this.formatearMonto(this.totalPedido(pedido));
    const texto =
      vista === 'cobro'
        ? `${saludo}, te escribimos por tu pedido de L ${monto}. ¿Nos confirmas el pago? ¡Gracias!`
        : `${saludo}, tu pedido ya está listo para entrega. ¿Coordinamos?`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  formatearMonto(valor: number): string {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  plural(n: number, singular: string, pluralStr: string): string {
    return n === 1 ? singular : pluralStr;
  }

  obtenerLivesParaActivar() {
    return this.lives.filter(
      (live) => live.estado === 'programado' || live.estado === 'pausado',
    );
  }

  activarLiveSeleccionado() {
    this.mensaje = '';
    this.error = '';

    if (!this.liveSeleccionadoId) {
      this.error = 'Seleccione un Live para activar o crea uno nuevo';
      return;
    }

    this.cargando = true;

    this.liveService.cambiarEstado(this.liveSeleccionadoId, 'activo').subscribe({
      next: (live: any) => {
        this.liveActivo = live;
        this.mensaje = 'Live activado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
        this.router.navigate(['/live-activo']);
      },
      error: (error) => {
        console.error('Error al activar Live', error);
        this.error = error.error?.mensaje || 'Error al activar Live';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  get cantidadPedidosPendientesPago(): number {
    return this.pedidos.filter((pedido) => pedido.estadoPago === 'pendiente').length;
  }

  get cantidadPedidosEntregados(): number {
    return this.pedidos.filter((pedido) => pedido.estadoEntrega === 'entregado').length;
  }

  solicitarConfirmacionLive(accion: 'finalizar' | 'cancelar') {
    this.accionLiveConfirmando = accion;
  }

  cancelarConfirmacionLive() {
    this.accionLiveConfirmando = '';
  }

  pausarLive() {
    this.accionLiveConfirmando = '';
    this.cambiarEstadoLiveActivo('pausado', 'Live pausado correctamente');
  }

  finalizarLive() {
    this.accionLiveConfirmando = '';
    this.cambiarEstadoLiveActivo('finalizado', 'Live finalizado correctamente');
  }

  cancelarLive() {
    this.accionLiveConfirmando = '';
    this.cambiarEstadoLiveActivo('cancelado', 'Live cancelado correctamente');
  }

  cambiarEstadoLiveActivo(estado: string, mensaje: string) {
    if (!this.liveActivo) {
      this.error = 'No hay un Live activo';
      return;
    }

    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.cambiarEstado(this.liveActivo._id, estado).subscribe({
      next: () => {
        this.liveActivo = null;
        this.liveSeleccionadoId = '';
        this.mensaje = mensaje;
        this.cargando = false;
        this.cargarDashboard();
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar estado del Live', error);
        this.error = this.obtenerMensajeErrorEstado(error);
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  obtenerMensajeErrorEstado(error: any) {
    const mensaje = error.error?.mensaje || 'Error al cambiar estado del Live';

    if (mensaje === 'Estado de Live invalido') {
      return 'Estado de Live invalido. Reinicia el backend para cargar el estado pausado.';
    }

    return mensaje;
  }

  mostrarFecha(fecha: any) {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return 'Sin fecha';
    }

    return fechaObjeto.toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  cerrarSesion() {
    this.authService.logout();
  }

  private tiempoPedido(pedido: any): number {
    return this.parsearTiempo(pedido?.createdAt || pedido?.fecha);
  }

  private parsearTiempo(fecha: any): number {
    if (!fecha) return 0;
    const ts = new Date(fecha).getTime();
    return Number.isNaN(ts) ? 0 : ts;
  }
}
