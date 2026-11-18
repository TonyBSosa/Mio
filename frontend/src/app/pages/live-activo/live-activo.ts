import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { ResumenService } from '../../services/resumen.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal/modal';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginationComponent, paginarLista } from '../../shared/ui/pagination/pagination';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

export type FiltroPedidosLive = 'todos' | 'por-cobrar' | 'por-entregar';

@Component({
  selector: 'app-live-activo',
  imports: [
    FormsModule,
    RouterModule,
    TitleCasePipe,
    ModalComponent,
    PageHeaderComponent,
    PaginationComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './live-activo.html',
  styleUrl: './live-activo.css',
})
export class LiveActivo implements OnInit {
  liveActivo: any = null;
  clientes: any[] = [];
  productos: any[] = [];
  pedidos: any[] = [];
  pedidosDelLive: any[] = [];
  resumen: any = null;

  pedido = {
    clienteId: '',
    liveId: '',
    producto: '',
    cantidad: 1,
    precio: 0,
    estadoPago: 'pendiente',
    estadoEntrega: 'pendiente',
    observaciones: '',
  };

  modoCliente = 'existente';

  clienteRapido = {
    nombre: '',
    telefono: '',
    direccion: '',
  };

  productoSeleccionadoId = '';
  accionConfirmando: '' | 'finalizar' | 'cancelar' = '';
  filtroPedidosLive: FiltroPedidosLive = 'todos';
  paginaPedidosLive = 1;
  porPaginaPedidosLive = 8;

  editandoPedido = false;
  guardandoEdicion = false;
  errorEdicion = '';
  pedidoEditandoId = '';
  pedidoEditandoProductoId = '';
  confirmandoEliminarId = '';
  pedidoEdicion = {
    clienteId: '',
    producto: '',
    cantidad: 1,
    precio: 0,
    estadoPago: 'pendiente',
    estadoEntrega: 'pendiente',
    observaciones: '',
  };

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
    private resumenService: ResumenService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarLiveActivo();
  }

  cargarLiveActivo() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.obtenerLiveActivo().subscribe({
      next: (respuesta: any) => {
        this.liveActivo = respuesta;
        this.cargando = false;

        if (this.liveActivo) {
          this.pedido.liveId = this.liveActivo._id;
          this.cargarDatos();
        }

        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar Live activo', error);
        this.buscarLiveActivoDesdeLista(error);
      },
    });
  }

  buscarLiveActivoDesdeLista(errorOriginal: any) {
    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        const livesActivos = respuesta
          .filter((live: any) => live.estado === 'activo')
          .sort((liveA: any, liveB: any) => {
            const fechaA = new Date(liveA.updatedAt || liveA.createdAt || 0).getTime();
            const fechaB = new Date(liveB.updatedAt || liveB.createdAt || 0).getTime();

            return fechaB - fechaA;
          });

        this.liveActivo = livesActivos.length > 0 ? livesActivos[0] : null;
        this.cargando = false;

        if (this.liveActivo) {
          this.pedido.liveId = this.liveActivo._id;
          this.cargarDatos();
        } else {
          this.error = errorOriginal.error?.mensaje || 'Error al cargar Live activo';
        }

        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al buscar Live activo en lista', error);
        this.error = error.error?.mensaje || 'Error al cargar Live activo';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  cargarDatos() {
    this.listarClientes();
    this.listarProductos();
    this.listarPedidos();
    this.consultarResumen();
  }

  listarClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (respuesta: any) => {
        this.clientes = respuesta;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar clientes', error);
        this.error = error.error?.mensaje || 'Error al cargar clientes';
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarProductos() {
    this.productoService.listarProductos().subscribe({
      next: (respuesta: any) => {
        this.productos = respuesta.filter(
          (producto: any) => producto.estado === 'activo'
        );
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos', error);
        this.error = error.error?.mensaje || 'Error al cargar productos';
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarPedidos() {
    this.pedidoService.listarPedidos().subscribe({
      next: (respuesta: any) => {
        this.pedidos = respuesta;
        this.filtrarPedidosDelLive();
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar pedidos', error);
        this.error = error.error?.mensaje || 'Error al cargar pedidos';
        this.detectorCambios.detectChanges();
      },
    });
  }

  filtrarPedidosDelLive() {
    if (!this.liveActivo) {
      this.pedidosDelLive = [];
      return;
    }

    this.pedidosDelLive = this.pedidos.filter(
      (pedidoItem) => this.obtenerId(pedidoItem.liveId) === this.liveActivo._id
    );
  }

  seleccionarProducto(producto: any) {
    if (!producto) {
      this.productoSeleccionadoId = '';
      this.pedido.producto = '';
      this.pedido.precio = 0;
      this.pedido.cantidad = 1;
      return;
    }

    this.pedido.producto = producto.nombre;
    this.pedido.precio = producto.precio;
    this.pedido.cantidad = 1;
    this.productoSeleccionadoId = producto._id;
  }

  seleccionarProductoPorId() {
    if (!this.productoSeleccionadoId) {
      this.seleccionarProducto(null);
      return;
    }

    const producto = this.productos.find(
      (productoItem) => productoItem._id === this.productoSeleccionadoId
    );

    this.seleccionarProducto(producto);
  }

  guardarPedido() {
    this.mensaje = '';
    this.error = '';

    if (!this.liveActivo) {
      this.error = 'No hay un Live activo';
      return;
    }

    if (this.liveActivo.estado !== 'activo') {
      this.error = 'No se pueden registrar pedidos si el Live esta pausado o cerrado';
      return;
    }

    if (!this.pedido.producto) {
      this.error = 'El producto es obligatorio';
      return;
    }

    if (this.pedido.cantidad < 1) {
      this.error = 'La cantidad debe ser mayor o igual a 1';
      return;
    }

    if (this.pedido.precio < 0) {
      this.error = 'El precio debe ser mayor o igual a 0';
      return;
    }

    this.cargando = true;
    this.pedido.liveId = this.liveActivo._id;

    if (this.modoCliente === 'nuevo') {
      this.crearPedidoConClienteRapido();
    } else {
      this.crearPedidoConClienteExistente();
    }
  }

  crearPedidoConClienteExistente() {
    if (!this.pedido.clienteId) {
      this.error = 'El cliente es obligatorio';
      this.cargando = false;
      return;
    }

    this.crearPedidoFinal();
  }

  crearPedidoConClienteRapido() {
    if (!this.clienteRapido.nombre) {
      this.error = 'El nombre del cliente es obligatorio';
      this.cargando = false;
      return;
    }

    this.clienteService.crearCliente(this.clienteRapido).subscribe({
      next: (clienteCreado: any) => {
        this.clientes.push(clienteCreado);
        this.clientes = [...this.clientes];
        this.pedido.clienteId = clienteCreado._id;
        this.crearPedidoFinal(true);
      },
      error: (error) => {
        console.error('Error al crear cliente rapido', error);
        this.error = 'No se pudo crear el cliente rapido.';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  crearPedidoFinal(clienteRapidoCreado = false) {
    const payload = {
      ...this.pedido,
      cantidad: this.productoSeleccionadoId ? 1 : Number(this.pedido.cantidad || 1),
      productoId: this.productoSeleccionadoId || undefined,
    };

    this.pedidoService.crearPedido(payload).subscribe({
      next: (pedidoCreado: any) => {
        const productoId = this.productoSeleccionadoId;

        this.pedidos.unshift(pedidoCreado);
        this.pedidos = [...this.pedidos];
        this.filtrarPedidosDelLive();

        if (productoId) {
          this.productos = this.productos.filter(
            (producto) => producto._id !== productoId
          );
        }

        this.limpiarFormularioPedido();
        this.limpiarClienteRapido();
        this.modoCliente = 'existente';
        this.consultarResumen();
        this.mensaje = productoId
          ? 'Pedido agregado al Live y pieza apartada automáticamente.'
          : 'Pedido agregado al Live correctamente.';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al crear pedido', error);
        this.error = clienteRapidoCreado
          ? 'Cliente creado, pero no se pudo registrar el pedido: ' +
            (error.error?.mensaje || '')
          : error.error?.mensaje || 'Error al crear pedido';
        this.cargando = false;
        this.listarProductos();
        this.detectorCambios.detectChanges();
      },
    });
  }

  apartarProductoSeleccionado(productoId: string) {
    this.productoService.cambiarEstado(productoId, 'apartado').subscribe({
      next: () => {
        this.productos = this.productos.filter(
          (producto) => producto._id !== productoId
        );
        this.mensaje = 'Pedido agregado al Live correctamente. Producto apartado.';
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al apartar producto', error);
        this.error =
          error.error?.mensaje ||
          'Pedido creado, pero no se pudo marcar el producto como apartado.';
        this.detectorCambios.detectChanges();
      },
    });
  }

  get totalPorCobrarLive(): number {
    return this.pedidosDelLive.filter((p) => p.estadoPago === 'pendiente').length;
  }

  get totalPorEntregarLive(): number {
    return this.pedidosDelLive.filter((p) => p.estadoEntrega === 'pendiente').length;
  }

  get pedidosDelLiveFiltrados(): any[] {
    if (this.filtroPedidosLive === 'por-cobrar') {
      return this.pedidosDelLive.filter((p) => p.estadoPago === 'pendiente');
    }
    if (this.filtroPedidosLive === 'por-entregar') {
      return this.pedidosDelLive.filter((p) => p.estadoEntrega === 'pendiente');
    }
    return this.pedidosDelLive;
  }

  get paginacionPedidosLive() {
    return paginarLista(
      this.pedidosDelLiveFiltrados,
      this.paginaPedidosLive,
      this.porPaginaPedidosLive,
    );
  }

  cambiarFiltroPedidosLive(filtro: FiltroPedidosLive) {
    this.filtroPedidosLive = filtro;
    this.paginaPedidosLive = 1;
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

  abrirEdicionPedido(item: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    if (this.cargando || item?.reservaSolicitudId) return;

    this.confirmandoEliminarId = '';
    this.errorEdicion = '';
    this.pedidoEditandoId = item._id;
    this.pedidoEditandoProductoId = this.obtenerId(item.productoId) || '';
    this.pedidoEdicion = {
      clienteId: this.obtenerId(item.clienteId) || '',
      producto: item.producto || '',
      cantidad: Number(item.cantidad) || 1,
      precio: item.precio !== undefined ? Number(item.precio) : 0,
      estadoPago: item.estadoPago || 'pendiente',
      estadoEntrega: item.estadoEntrega || 'pendiente',
      observaciones: item.observaciones || '',
    };
    this.editandoPedido = true;
    this.detectorCambios.detectChanges();
  }

  cerrarEdicionPedido() {
    if (this.guardandoEdicion) return;
    this.editandoPedido = false;
    this.errorEdicion = '';
    this.pedidoEditandoId = '';
    this.pedidoEditandoProductoId = '';
  }

  guardarEdicionPedido() {
    this.errorEdicion = '';

    if (!this.pedidoEdicion.clienteId) {
      this.errorEdicion = 'Debe seleccionar un cliente';
      return;
    }

    if (!this.pedidoEdicion.producto.trim()) {
      this.errorEdicion = 'El nombre del producto es obligatorio';
      return;
    }

    if (Number(this.pedidoEdicion.cantidad) <= 0) {
      this.errorEdicion = 'La cantidad debe ser mayor a 0';
      return;
    }

    if (Number(this.pedidoEdicion.precio) < 0) {
      this.errorEdicion = 'El precio no puede ser negativo';
      return;
    }

    this.guardandoEdicion = true;
    const payload: any = {
      clienteId: this.pedidoEdicion.clienteId,
      liveId: this.liveActivo?._id || '',
      producto: this.pedidoEdicion.producto.trim(),
      cantidad: Number(this.pedidoEdicion.cantidad),
      precio: Number(this.pedidoEdicion.precio),
      estadoPago: this.pedidoEdicion.estadoPago,
      estadoEntrega: this.pedidoEdicion.estadoEntrega,
      observaciones: this.pedidoEdicion.observaciones.trim(),
    };

    if (this.pedidoEditandoProductoId) {
      payload.productoId = this.pedidoEditandoProductoId;
    }

    this.pedidoService.actualizarPedido(this.pedidoEditandoId, payload).subscribe({
      next: (pedidoActualizado: any) => {
        this.reemplazarPedido(pedidoActualizado);
        this.consultarResumen();
        this.guardandoEdicion = false;
        this.cerrarEdicionPedido();
        this.mensaje = 'Pedido actualizado correctamente';
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al actualizar pedido en vivo', error);
        this.errorEdicion =
          error.error?.mensaje || error.error?.error || 'No se pudo actualizar el pedido';
        this.guardandoEdicion = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  solicitarEliminarPedido(id: string, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.confirmandoEliminarId = id;
  }

  cancelarEliminarPedido() {
    this.confirmandoEliminarId = '';
  }

  eliminarPedido(id: string) {
    this.confirmandoEliminarId = '';
    this.error = '';

    this.pedidoService.eliminarPedido(id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter((p) => p._id !== id);
        this.filtrarPedidosDelLive();
        this.listarProductos();
        this.consultarResumen();
        this.mensaje = 'Pedido eliminado correctamente';
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar pedido en vivo', error);
        this.error = error.error?.mensaje || 'No se pudo eliminar el pedido';
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
    this.actualizarEntrega(pedido, 'entregado');
  }

  marcarPendienteEntrega(pedido: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.actualizarEntrega(pedido, 'pendiente');
  }

  actualizarPago(pedido: any, estadoPago: string) {
    this.pedidoService.marcarPago(pedido._id, estadoPago).subscribe({
      next: (pedidoActualizado: any) => {
        this.reemplazarPedido(pedidoActualizado);
        this.consultarResumen();
        this.mensaje = 'Estado de pago actualizado';
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar pago', error);
        this.error = error.error?.mensaje || 'Error al cambiar pago';
        this.detectorCambios.detectChanges();
      },
    });
  }

  actualizarEntrega(pedido: any, estadoEntrega: string) {
    this.pedidoService.marcarEntrega(pedido._id, estadoEntrega).subscribe({
      next: (pedidoActualizado: any) => {
        this.reemplazarPedido(pedidoActualizado);
        this.consultarResumen();
        this.mensaje = 'Estado de entrega actualizado';
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar entrega', error);
        this.error = error.error?.mensaje || 'Error al cambiar entrega';
        this.detectorCambios.detectChanges();
      },
    });
  }

  reemplazarPedido(pedidoActualizado: any) {
    const index = this.pedidos.findIndex(
      (pedidoItem) => pedidoItem._id === pedidoActualizado._id
    );

    if (index !== -1) {
      this.pedidos[index] = pedidoActualizado;
      this.pedidos = [...this.pedidos];
      this.filtrarPedidosDelLive();
    }
  }

  cambiarModoCliente(modo: 'existente' | 'nuevo') {
    this.modoCliente = modo;
  }

  solicitarConfirmacion(accion: 'finalizar' | 'cancelar') {
    this.accionConfirmando = accion;
  }

  cancelarConfirmacion() {
    this.accionConfirmando = '';
  }

  pausarLive() {
    this.accionConfirmando = '';
    this.cambiarEstadoLive('pausado', 'Live pausado correctamente');
  }

  continuarLive() {
    this.accionConfirmando = '';
    this.cambiarEstadoLive('activo', 'Live activo nuevamente');
  }

  finalizarLive() {
    this.accionConfirmando = '';
    this.cambiarEstadoLive('finalizado', 'Live finalizado correctamente');
  }

  cancelarLive() {
    this.accionConfirmando = '';
    this.cambiarEstadoLive('cancelado', 'Live cancelado correctamente');
  }

  cambiarEstadoLive(estado: string, mensaje: string) {
    if (!this.liveActivo) {
      this.error = 'No hay un Live activo';
      return;
    }

    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.cambiarEstado(this.liveActivo._id, estado).subscribe({
      next: (liveActualizado: any) => {
        this.liveActivo = liveActualizado;
        this.pedido.liveId = liveActualizado._id;
        this.mensaje = mensaje;
        this.cargando = false;
        this.consultarResumen();
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

  consultarResumen() {
    if (!this.liveActivo) {
      return;
    }

    this.resumenService.obtenerResumenPorLive(this.liveActivo._id).subscribe({
      next: (respuesta: any) => {
        this.resumen = respuesta;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al consultar resumen', error);
        this.error = error.error?.mensaje || 'Error al consultar resumen';
        this.detectorCambios.detectChanges();
      },
    });
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

  esClienteSinRegistro(clienteId: any): boolean {
    return this.obtenerNombreCliente(clienteId) === 'Cliente sin registro';
  }

  formatearMonto(valor: number): string {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  obtenerId(valor: any) {
    return valor && valor._id ? valor._id : valor;
  }

  calcularTotal(pedido: any) {
    return pedido.cantidad * pedido.precio;
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

  limpiarFormularioPedido() {
    this.pedido = {
      clienteId: '',
      liveId: this.liveActivo ? this.liveActivo._id : '',
      producto: '',
      cantidad: 1,
      precio: 0,
      estadoPago: 'pendiente',
      estadoEntrega: 'pendiente',
      observaciones: '',
    };
    this.productoSeleccionadoId = '';
  }

  limpiarFormulario() {
    this.limpiarFormularioPedido();
  }

  limpiarClienteRapido() {
    this.clienteRapido = {
      nombre: '',
      telefono: '',
      direccion: '',
    };
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
