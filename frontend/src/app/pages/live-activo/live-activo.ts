import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { ResumenService } from '../../services/resumen.service';

@Component({
  selector: 'app-live-activo',
  imports: [FormsModule, RouterModule],
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
  mensaje = '';
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
      return;
    }

    this.pedido.producto = producto.nombre;
    this.pedido.precio = producto.precio;
    this.productoSeleccionadoId = producto._id;
  }

  seleccionarProductoPorId() {
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
    this.pedidoService.crearPedido(this.pedido).subscribe({
      next: (pedidoCreado: any) => {
        const productoId = this.productoSeleccionadoId;

        this.pedidos.push(pedidoCreado);
        this.pedidos = [...this.pedidos];
        this.filtrarPedidosDelLive();

        if (productoId) {
          this.apartarProductoSeleccionado(productoId);
        }

        this.limpiarFormularioPedido();
        this.limpiarClienteRapido();
        this.modoCliente = 'existente';
        this.consultarResumen();
        this.mensaje = 'Pedido agregado al Live correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al crear pedido', error);
        this.error = clienteRapidoCreado
          ? 'Cliente creado, pero no se pudo registrar el pedido.'
          : error.error?.mensaje || 'Error al crear pedido';
        this.cargando = false;
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

  marcarPagado(pedido: any) {
    this.actualizarPago(pedido, 'pagado');
  }

  marcarPendientePago(pedido: any) {
    this.actualizarPago(pedido, 'pendiente');
  }

  marcarEntregado(pedido: any) {
    this.actualizarEntrega(pedido, 'entregado');
  }

  marcarPendienteEntrega(pedido: any) {
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

  pausarLive() {
    this.cambiarEstadoLive('pausado', 'Live pausado correctamente');
  }

  continuarLive() {
    this.cambiarEstadoLive('activo', 'Live activo nuevamente');
  }

  finalizarLive() {
    this.cambiarEstadoLive('finalizado', 'Live finalizado correctamente');
  }

  cancelarLive() {
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

  obtenerNombreCliente(clienteId: any) {
    if (clienteId && clienteId.nombre) {
      return clienteId.nombre;
    }

    const id = this.obtenerId(clienteId);
    const cliente = this.clientes.find((clienteItem) => clienteItem._id === id);

    return cliente ? cliente.nombre : id;
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
