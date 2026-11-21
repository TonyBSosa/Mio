import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, Optional, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal/modal';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginationComponent, paginarLista } from '../../shared/ui/pagination/pagination';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';
import { SolicitudesApartado } from '../../shared/solicitudes-apartado/solicitudes-apartado';

import { EntregaDialog } from '../../shared/entrega-dialog/entrega-dialog';

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

export type FiltroOperativoPedidos = '' | 'por-cobrar' | 'por-entregar';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    TitleCasePipe,
    ModalComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    PaginationComponent,
    SolicitudesApartado,
    EntregaDialog,
  ],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  entregaPedido: any = null;
  entregaConfirmando = false;
  entregaGuardando = false;
  entregaError = '';
  planEntrega = { tipo: 'local', lugar: '', fecha: '' };

  abrirEntrega(pedido: any, confirmar = false) {
    if (this.cargando || this.entregaGuardando) return;
    this.entregaPedido = pedido;
    this.entregaConfirmando = confirmar && !!pedido.planEntrega;
    this.entregaError = '';
    this.planEntrega = pedido.planEntrega
      ? { ...pedido.planEntrega }
      : { tipo: 'local', lugar: '', fecha: '' };
  }

  cerrarEntrega() {
    if (!this.entregaGuardando) this.entregaPedido = null;
  }

  guardarEntrega() {
    if (this.entregaGuardando || !this.entregaPedido) return;
    if (!this.planEntrega.lugar.trim() || !this.planEntrega.fecha) {
      this.entregaError = 'Completá el lugar y la fecha acordados para la entrega.';
      return;
    }
    this.entregaGuardando = true;
    this.entregaError = '';
    const id = this.entregaPedido._id;
    const solicitud = this.entregaConfirmando
      ? this.pedidoService.marcarEntrega(id, 'entregado')
      : this.pedidoService.programarEntrega(id, this.planEntrega);
    solicitud.subscribe({
      next: (actualizado: any) => {
        this.pedidos = this.pedidos.map(item => item._id === id ? actualizado : item);
        this.filtrarPedidos(false);
        this.mensaje = this.entregaConfirmando ? 'Entrega confirmada' : 'Entrega programada';
        this.entregaGuardando = false;
        this.entregaPedido = null;
        this.detectorCambios.detectChanges();
      },
      error: error => {
        this.entregaError = error.error?.mensaje || 'No se pudo guardar la entrega. Intentá de nuevo.';
        this.entregaGuardando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  fechaEntrega(fecha: string): string {
    if (!fecha) return '';
    const [ano, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  solicitudesAbiertas = false;
  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  clientes: any[] = [];
  lives: any[] = [];
  productos: any[] = [];
  liveActivo: any = null;

  filtroLiveId = '';
  filtroClienteId = '';
  filtroProducto = '';
  filtroOperativo: FiltroOperativoPedidos = '';

  paginaActual = 1;
  elementosPorPagina = 10;

  busquedaPieza = '';
  piezaSeleccionada: any = null;

  pedido = {
    productoId: '',
    clienteId: '',
    liveId: '',
    producto: '',
    cantidad: 1,
    precio: 0,
    estadoPago: 'pendiente',
    estadoEntrega: 'pendiente',
    observaciones: '',
  };

  editando = false;
  pedidoEditandoId = '';
  confirmandoEliminarId = '';
  formularioExpandido = false;
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

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private liveService: LiveService,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
    @Optional() private route?: ActivatedRoute,
  ) {}

  get pedidosPaginados(): any[] {
    const res = paginarLista(this.pedidosFiltrados, this.paginaActual, this.elementosPorPagina);
    if (res.paginaSegura !== this.paginaActual) {
      this.paginaActual = res.paginaSegura;
    }
    return res.itemsPagina;
  }

  ngOnInit() {
    const filtroParam = this.route?.snapshot?.queryParamMap?.get('filtro');
    if (filtroParam === 'por-cobrar' || filtroParam === 'por-entregar') {
      this.filtroOperativo = filtroParam;
    }
    const abrirNuevo = this.route?.snapshot?.queryParamMap?.get('nuevo');
    if (abrirNuevo === '1') {
      this.formularioExpandido = true;
    }
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.cargarLiveActivo();
    this.listarClientes();
    this.listarLives();
    this.listarProductos();
    this.listarPedidos();
  }

  cargarLiveActivo() {
    this.liveService.obtenerLiveActivo().subscribe({
      next: (respuesta: any) => {
        this.liveActivo = respuesta;

        if (this.liveActivo && !this.editando && !this.pedido.liveId) {
          this.pedido.liveId = this.liveActivo._id;
        }

        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar Live activo', error);
        this.liveActivo = null;
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarPedidos() {
    this.cargando = true;
    this.error = '';

    this.pedidoService.listarPedidos().subscribe({
      next: (respuesta: any) => {
        this.pedidos = Array.isArray(respuesta) ? respuesta : [];
        this.filtrarPedidos(false);
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar pedidos', error);
        this.error = error.error?.mensaje || error.error?.error || 'Error al listar pedidos';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (respuesta: any) => {
        this.clientes = Array.isArray(respuesta) ? respuesta : [];
        this.filtrarPedidos(false);
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar clientes', error);
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarLives() {
    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = Array.isArray(respuesta) ? respuesta : [];
        this.filtrarPedidos(false);
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar Lives', error);
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarProductos() {
    this.productoService.listarProductos().subscribe({
      next: (respuesta: any) => {
        this.productos = Array.isArray(respuesta) ? respuesta : [];
        if (this.editando && this.pedido.productoId) {
          this.piezaSeleccionada =
            this.productos.find(
              (p) => String(this.obtenerId(p._id)) === String(this.pedido.productoId),
            ) || null;
        }
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar productos', error);
        this.detectorCambios.detectChanges();
      },
    });
  }

  cerrarPopover(popoverId: string) {
    const el = typeof document !== 'undefined' ? document.getElementById(popoverId) : null;
    if (el && typeof (el as any).hidePopover === 'function') {
      try {
        (el as any).hidePopover();
      } catch {
        // Ignorar si ya estaba cerrado
      }
    }
  }

  get piezasDisponibles(): any[] {
    const texto = this.normalizar(this.busquedaPieza);
    return this.productos.filter((p) => {
      if (p.estado !== 'activo') {
        return false;
      }
      if (!texto) {
        return true;
      }
      const cod = this.normalizar(String(p.codigo || ''));
      const nom = this.normalizar(String(p.nombre || ''));
      return cod.includes(texto) || nom.includes(texto);
    });
  }

  get livesDisponibles(): any[] {
    return this.lives.filter((l) => {
      if (this.editando && String(this.obtenerId(l._id)) === String(this.pedido.liveId)) {
        return true;
      }
      return l.estado === 'activo';
    });
  }

  seleccionarProducto(producto: any) {
    if (!producto) {
      this.deseleccionarProducto();
      return;
    }

    this.piezaSeleccionada = producto;
    this.pedido.productoId = producto._id;
    this.pedido.producto = producto.nombre;
    this.pedido.precio = Number(producto.precio) || 0;
    this.pedido.cantidad = 1;
    this.busquedaPieza = '';
    this.detectorCambios.detectChanges();
  }

  deseleccionarProducto() {
    this.piezaSeleccionada = null;
    this.pedido.productoId = '';
    this.pedido.producto = '';
    this.pedido.cantidad = 1;
    this.pedido.precio = 0;
    this.busquedaPieza = '';
    this.detectorCambios.detectChanges();
  }

  onSelectorPiezaChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const productoId = select?.value;
    if (!productoId) {
      this.deseleccionarProducto();
      return;
    }
    const producto = this.productos.find((p) => String(p._id) === String(productoId));
    if (producto) {
      this.seleccionarProducto(producto);
    }
  }

  guardarPedido() {
    if (this.cargando) {
      return;
    }

    this.mensaje = '';
    this.error = '';

    if (!this.pedido.clienteId) {
      this.error = 'El cliente es obligatorio';
      return;
    }

    if (!this.pedido.producto && !this.pedido.productoId) {
      this.error = 'Debes seleccionar o ingresar un producto';
      return;
    }

    if (
      this.pedido.precio === null ||
      this.pedido.precio === undefined ||
      Number(this.pedido.precio) < 0
    ) {
      this.error = 'El precio debe ser mayor o igual a 0';
      return;
    }

    if (this.pedido.productoId) {
      this.pedido.cantidad = 1;
      if (this.piezaSeleccionada && !this.editando) {
        this.pedido.producto = this.piezaSeleccionada.nombre;
      }
    } else if (Number(this.pedido.cantidad) < 1) {
      this.error = 'La cantidad debe ser mayor o igual a 1';
      return;
    }

    this.cargando = true;

    if (this.editando) {
      const payload: any = {
        clienteId: this.pedido.clienteId,
        liveId: this.pedido.liveId || null,
        precio: Number(this.pedido.precio),
        estadoPago: this.pedido.estadoPago,
        estadoEntrega: this.pedido.estadoEntrega,
        observaciones: this.pedido.observaciones || '',
      };

      if (this.pedido.productoId) {
        payload.productoId = this.pedido.productoId;
        payload.producto = this.pedido.producto;
        payload.cantidad = 1;
      } else {
        payload.producto = this.pedido.producto;
        payload.cantidad = Number(this.pedido.cantidad || 1);
      }

      this.pedidoService.actualizarPedido(this.pedidoEditandoId, payload).subscribe({
        next: (pedidoActualizado: any) => {
          const index = this.pedidos.findIndex(
            (pedidoItem) => pedidoItem._id === this.pedidoEditandoId,
          );

          if (index !== -1) {
            this.pedidos[index] = pedidoActualizado;
            this.pedidos = [...this.pedidos];
            this.filtrarPedidos(false);
          }

          this.cerrarFormulario();
          this.mensaje = 'Pedido actualizado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al actualizar pedido', error);
          this.error =
            error.error?.mensaje || error.error?.error || 'Error al actualizar pedido';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    } else {
      const payload: any = {
        clienteId: this.pedido.clienteId,
        producto: this.pedido.producto,
        cantidad: this.pedido.productoId ? 1 : Number(this.pedido.cantidad || 1),
        precio: Number(this.pedido.precio),
        estadoPago: this.pedido.estadoPago,
        estadoEntrega: this.pedido.estadoEntrega,
        observaciones: this.pedido.observaciones || '',
      };

      if (this.pedido.productoId) {
        payload.productoId = this.pedido.productoId;
      }

      if (this.pedido.liveId) {
        payload.liveId = this.pedido.liveId;
      }

      this.pedidoService.crearPedido(payload).subscribe({
        next: (pedidoCreado: any) => {
          this.pedidos = [pedidoCreado, ...this.pedidos];
          this.filtrarPedidos(true);
          this.cerrarFormulario();
          this.mensaje = 'Pedido registrado correctamente';
          this.cargando = false;
          this.listarProductos();
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear pedido', error);
          this.error =
            error.error?.mensaje || error.error?.error || 'Error al crear pedido';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  get totalImporteFiltrado(): number {
    return this.pedidosFiltrados.reduce((acc, p) => acc + this.calcularTotal(p), 0);
  }

  get totalPendientesPago(): number {
    return this.pedidos.filter((p) => p.estadoPago === 'pendiente').length;
  }

  get totalPendientesEntrega(): number {
    return this.pedidos.filter((p) => p.estadoEntrega === 'pendiente').length;
  }

  get pendientesPagoFiltrados(): number {
    return this.pedidosFiltrados.filter((p) => p.estadoPago === 'pendiente').length;
  }

  get pendientesEntregaFiltrados(): number {
    return this.pedidosFiltrados.filter((p) => p.estadoEntrega === 'pendiente').length;
  }

  get tieneFiltrosActivos(): boolean {
    return Boolean(
      this.filtroLiveId ||
        this.filtroClienteId ||
        this.filtroProducto.trim() ||
        this.filtroOperativo,
    );
  }

  seleccionarKpiOperativo(filtro: FiltroOperativoPedidos) {
    this.filtroOperativo = this.filtroOperativo === filtro ? '' : filtro;
    this.filtrarPedidos(true);
  }

  alternarFormulario() {
    if (this.formularioExpandido) {
      this.cerrarFormulario();
    } else {
      this.editando = false;
      this.pedidoEditandoId = '';
      this.limpiarFormulario();
      this.formularioExpandido = true;
      this.mensaje = '';
      this.error = '';
    }
  }

  cerrarFormulario() {
    this.formularioExpandido = false;
    this.editando = false;
    this.pedidoEditandoId = '';
    this.limpiarFormulario();
  }

  solicitarEliminarPedido(id: string, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.confirmandoEliminarId = id;
  }

  cancelarEliminarPedido() {
    this.confirmandoEliminarId = '';
  }

  editarPedido(pedido: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    if (this.cargando || pedido.reservaSolicitudId) return;
    this.editando = true;
    this.formularioExpandido = true;
    this.confirmandoEliminarId = '';
    this.pedidoEditandoId = pedido._id;
    const prodId = this.obtenerId(pedido.productoId) || '';

    this.piezaSeleccionada = prodId
      ? this.productos.find((p) => String(this.obtenerId(p._id)) === String(prodId)) || null
      : null;

    this.pedido = {
      productoId: prodId,
      clienteId: this.obtenerId(pedido.clienteId),
      liveId: this.obtenerId(pedido.liveId) || '',
      producto: pedido.producto || '',
      cantidad: pedido.cantidad || 1,
      precio: pedido.precio !== undefined ? pedido.precio : 0,
      estadoPago: pedido.estadoPago || 'pendiente',
      estadoEntrega: pedido.estadoEntrega || 'pendiente',
      observaciones: pedido.observaciones || '',
    };
    this.mensaje = '';
    this.error = '';
    this.detectorCambios.detectChanges();
  }

  cancelarEdicion() {
    this.cerrarFormulario();
    this.mensaje = '';
    this.error = '';
    this.detectorCambios.detectChanges();
  }

  eliminarPedido(id: string) {
    if (this.cargando) return;
    this.confirmandoEliminarId = '';
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.eliminarPedido(id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter((pedidoItem) => pedidoItem._id !== id);
        this.filtrarPedidos(false);
        this.listarProductos();
        this.mensaje = 'Pedido eliminado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar pedido', error);
        this.error = error.error?.mensaje || error.error?.error || 'Error al eliminar pedido';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  marcarPagado(pedido: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.actualizarPago(pedido, 'pagado');
  }

  marcarPendientePago(pedido: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.actualizarPago(pedido, 'pendiente');
  }

  marcarEntregado(pedido: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.abrirEntrega(pedido, true);
  }

  marcarPendienteEntrega(pedido: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.actualizarEntrega(pedido, 'pendiente');
  }

  actualizarPago(pedido: any, estadoPago: string) {
    if (this.cargando) return;
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.marcarPago(pedido._id, estadoPago).subscribe({
      next: (pedidoActualizado: any) => {
        const index = this.pedidos.findIndex((pedidoItem) => pedidoItem._id === pedido._id);

        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.pedidos = [...this.pedidos];
          this.filtrarPedidos(false);
        }

        this.mensaje = 'Estado de pago actualizado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar pago', error);
        this.error = error.error?.mensaje || error.error?.error || 'Error al cambiar pago';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  actualizarEntrega(pedido: any, estadoEntrega: string) {
    if (this.cargando) return;
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.marcarEntrega(pedido._id, estadoEntrega).subscribe({
      next: (pedidoActualizado: any) => {
        const index = this.pedidos.findIndex((pedidoItem) => pedidoItem._id === pedido._id);

        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.pedidos = [...this.pedidos];
          this.filtrarPedidos(false);
        }

        this.mensaje = 'Estado de entrega actualizado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar entrega', error);
        this.error = error.error?.mensaje || error.error?.error || 'Error al cambiar entrega';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  filtrarPedidos(reiniciarPagina = true) {
    const q = this.normalizar(this.filtroProducto);

    this.pedidosFiltrados = this.pedidos.filter((pedidoItem) => {
      const pedidoLiveId = String(this.obtenerId(pedidoItem.liveId) || '');
      const pedidoClienteId = String(this.obtenerId(pedidoItem.clienteId) || '');
      const producto = this.normalizar(String(pedidoItem.producto || ''));
      const notas = this.normalizar(String(pedidoItem.observaciones || ''));
      const clienteNom = this.normalizar(this.obtenerNombreCliente(pedidoItem.clienteId));

      let coincideLive = true;
      if (this.filtroLiveId === 'directa') {
        coincideLive = !pedidoItem.liveId;
      } else if (this.filtroLiveId) {
        coincideLive = pedidoLiveId === String(this.filtroLiveId);
      }

      const coincideCliente =
        !this.filtroClienteId || pedidoClienteId === String(this.filtroClienteId);

      const cod = this.normalizar(this.obtenerCodigoPieza(pedidoItem));
      const coincideTexto =
        !q ||
        producto.includes(q) ||
        cod.includes(q) ||
        clienteNom.includes(q) ||
        notas.includes(q);

      let coincideOperativo = true;
      if (this.filtroOperativo === 'por-cobrar') {
        coincideOperativo = pedidoItem.estadoPago === 'pendiente';
      } else if (this.filtroOperativo === 'por-entregar') {
        coincideOperativo = pedidoItem.estadoEntrega === 'pendiente';
      }

      return coincideLive && coincideCliente && coincideTexto && coincideOperativo;
    });

    if (reiniciarPagina) {
      this.paginaActual = 1;
    } else {
      const totalPaginas = Math.max(
        1,
        Math.ceil(this.pedidosFiltrados.length / Math.max(1, this.elementosPorPagina)),
      );
      if (this.paginaActual > totalPaginas) {
        this.paginaActual = totalPaginas;
      }
    }
  }

  limpiarFiltros() {
    this.filtroLiveId = '';
    this.filtroClienteId = '';
    this.filtroProducto = '';
    this.filtroOperativo = '';
    this.filtrarPedidos(true);
  }

  esClienteSinRegistro(clienteId: any): boolean {
    if (clienteId && clienteId.nombre) return false;
    const id = String(this.obtenerId(clienteId) || '').trim();
    if (!id) return true;
    const cliente = this.clientes.find((c) => String(c._id) === id);
    return !cliente && OBJECT_ID_REGEX.test(id);
  }

  obtenerNombreCliente(clienteId: any): string {
    if (clienteId && clienteId.nombre) {
      return clienteId.nombre;
    }

    const id = String(this.obtenerId(clienteId) || '').trim();
    const cliente = this.clientes.find((clienteItem) => String(clienteItem._id) === id);

    if (cliente) return cliente.nombre;
    if (!id || OBJECT_ID_REGEX.test(id)) return 'Cliente sin registro';
    return id;
  }

  obtenerNombreLive(liveId: any): string {
    if (!liveId) return 'Venta directa';
    if (liveId && liveId.nombre) {
      return liveId.nombre;
    }

    const id = this.obtenerId(liveId);
    const live = this.lives.find(
      (liveItem) => String(this.obtenerId(liveItem._id)) === String(id),
    );

    if (live) {
      return live.nombre;
    }

    if (this.liveActivo && String(this.liveActivo._id) === String(id)) {
      return this.liveActivo.nombre;
    }

    return 'Transmisión anterior';
  }

  obtenerCodigoPieza(pedidoItem: any): string {
    const prodId = this.obtenerId(pedidoItem?.productoId);
    if (!prodId) return '';
    const prod = this.productos.find((p) => String(this.obtenerId(p._id)) === String(prodId));
    return prod?.codigo || '';
  }

  obtenerId(valor: any) {
    return valor && valor._id ? valor._id : valor;
  }

  calcularTotal(pedido: any): number {
    const cant = Number(pedido?.cantidad) || 0;
    const prec = Number(pedido?.precio) || 0;
    return cant * prec;
  }

  formatearMonto(valor: any): string {
    const n = Number(valor ?? 0);
    if (Number.isNaN(n)) return '0.00';
    return n.toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  limpiarFormulario() {
    this.piezaSeleccionada = null;
    this.busquedaPieza = '';
    this.pedido = {
      productoId: '',
      clienteId: '',
      liveId: this.liveActivo ? this.liveActivo._id : '',
      producto: '',
      cantidad: 1,
      precio: 0,
      estadoPago: 'pendiente',
      estadoEntrega: 'pendiente',
      observaciones: '',
    };
  }

  cerrarSesion() {
    this.authService.logout();
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
