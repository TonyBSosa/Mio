import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterModule],
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
  mensaje = '';
  error = '';
  cargando = false;
  usuario: any = null;
  liveActivo: any = null;
  liveSeleccionadoId = '';

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

  cargarDashboard() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;
    this.cargasPendientes = 4;

    this.clienteService.listarClientes().subscribe({
      next: (respuesta: any) => {
        this.clientes = respuesta;
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
        this.lives = respuesta;
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
        this.productos = respuesta;
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
        this.pedidos = respuesta;
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
    const ventasPorLive: any = {};
    const pedidosPorLive: any = {};
    const ventasPorArticulo: any = {};
    const pedidosPorCliente: any = {};

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
      const precio = Number(pedido.precio) || 0;
      const totalPedido = cantidad * precio;
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

      ventasPorLive[liveId] = (ventasPorLive[liveId] || 0) + totalPedido;
      pedidosPorLive[liveId] = (pedidosPorLive[liveId] || 0) + 1;
      ventasPorArticulo[producto] = (ventasPorArticulo[producto] || 0) + cantidad;
      pedidosPorCliente[clienteId] = (pedidosPorCliente[clienteId] || 0) + 1;
    }

    this.topLive = this.obtenerTopLive(ventasPorLive, pedidosPorLive);
    this.topArticulo = this.obtenerTopArticulo(ventasPorArticulo);
    this.topCliente = this.obtenerTopCliente(pedidosPorCliente);
  }

  obtenerTopLive(ventasPorLive: any, pedidosPorLive: any) {
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

  obtenerTopArticulo(ventasPorArticulo: any) {
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

  obtenerTopCliente(pedidosPorCliente: any) {
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

  obtenerNombreCliente(clienteId: any) {
    if (clienteId && clienteId.nombre) {
      return clienteId.nombre;
    }

    const id = this.obtenerId(clienteId);
    const cliente = this.clientes.find((clienteItem) => clienteItem._id === id);

    return cliente ? cliente.nombre : id;
  }

  obtenerNombreLive(liveId: any) {
    if (liveId && liveId.nombre) {
      return liveId.nombre;
    }

    const id = this.obtenerId(liveId);
    const live = this.lives.find((liveItem) => liveItem._id === id);

    return live ? live.nombre : id;
  }

  obtenerId(valor: any) {
    return valor && valor._id ? valor._id : valor;
  }

  obtenerLivesParaActivar() {
    return this.lives.filter(
      (live) => live.estado === 'programado' || live.estado === 'pausado'
    );
  }

  activarLiveSeleccionado() {
    this.mensaje = '';
    this.error = '';

    if (!this.liveSeleccionadoId) {
      this.error = 'Seleccione un Live para activar';
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

  pausarLive() {
    this.cambiarEstadoLiveActivo('pausado', 'Live pausado correctamente');
  }

  finalizarLive() {
    this.cambiarEstadoLiveActivo('finalizado', 'Live finalizado correctamente');
  }

  cancelarLive() {
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
    this.router.navigate(['/login']);
  }
}
