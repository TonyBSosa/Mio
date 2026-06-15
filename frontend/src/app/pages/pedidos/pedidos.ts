import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { LiveService } from '../../services/live.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-pedidos',
  imports: [FormsModule, RouterModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos implements OnInit {
  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  clientes: any[] = [];
  lives: any[] = [];
  productos: any[] = [];
  liveActivo: any = null;
  filtroLiveId = '';
  filtroClienteId = '';
  filtroProducto = '';

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

  editando = false;
  pedidoEditandoId = '';
  mensaje = '';
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
  ) {}

  ngOnInit() {
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

        if (this.liveActivo && !this.editando) {
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
        this.pedidos = respuesta;
        this.filtrarPedidos();
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar pedidos', error);
        this.error = error.error?.mensaje || 'Error al listar pedidos';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarClientes() {
    this.clienteService.listarClientes().subscribe({
      next: (respuesta: any) => {
        this.clientes = respuesta;
        this.filtrarPedidos();
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar clientes', error);
        this.error = error.error?.mensaje || 'Error al listar clientes';
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarLives() {
    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = respuesta;
        this.filtrarPedidos();
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar Lives', error);
        this.error = error.error?.mensaje || 'Error al listar Lives';
        this.detectorCambios.detectChanges();
      },
    });
  }

  listarProductos() {
    this.productoService.listarProductos().subscribe({
      next: (respuesta: any) => {
        this.productos = respuesta;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar productos', error);
        this.error = error.error?.mensaje || 'Error al listar productos';
        this.detectorCambios.detectChanges();
      },
    });
  }

  guardarPedido() {
    this.mensaje = '';
    this.error = '';

    if (!this.pedido.clienteId) {
      this.error = 'El cliente es obligatorio';
      return;
    }

    if (!this.editando && !this.liveActivo) {
      this.error = 'Los pedidos deben registrarse en el Live activo';
      return;
    }

    if (!this.editando) {
      this.pedido.liveId = this.liveActivo._id;
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

    if (this.editando) {
      this.pedidoService
        .actualizarPedido(this.pedidoEditandoId, this.pedido)
        .subscribe({
          next: (pedidoActualizado: any) => {
            const index = this.pedidos.findIndex(
              (pedidoItem) => pedidoItem._id === this.pedidoEditandoId
            );

            if (index !== -1) {
              this.pedidos[index] = pedidoActualizado;
              this.pedidos = [...this.pedidos];
              this.filtrarPedidos();
            }

            this.limpiarFormulario();
            this.editando = false;
            this.pedidoEditandoId = '';
            this.mensaje = 'Pedido actualizado correctamente';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
          error: (error) => {
            console.error('Error al actualizar pedido', error);
            this.error = error.error?.mensaje || 'Error al actualizar pedido';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
        });
    } else {
      this.pedidoService.crearPedido(this.pedido).subscribe({
        next: (pedidoCreado: any) => {
          this.pedidos.push(pedidoCreado);
          this.pedidos = [...this.pedidos];
          this.filtrarPedidos();
          this.limpiarFormulario();
          this.mensaje = 'Pedido creado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear pedido', error);
          this.error = error.error?.mensaje || 'Error al crear pedido';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  editarPedido(pedido: any) {
    this.editando = true;
    this.pedidoEditandoId = pedido._id;
    this.pedido = {
      clienteId: this.obtenerId(pedido.clienteId),
      liveId: this.obtenerId(pedido.liveId),
      producto: pedido.producto,
      cantidad: pedido.cantidad,
      precio: pedido.precio,
      estadoPago: pedido.estadoPago,
      estadoEntrega: pedido.estadoEntrega,
      observaciones: pedido.observaciones,
    };
    this.mensaje = '';
    this.error = '';
  }

  cancelarEdicion() {
    this.editando = false;
    this.pedidoEditandoId = '';
    this.limpiarFormulario();
  }

  eliminarPedido(id: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.eliminarPedido(id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter((pedidoItem) => pedidoItem._id !== id);
        this.filtrarPedidos();
        this.mensaje = 'Pedido eliminado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar pedido', error);
        this.error = error.error?.mensaje || 'Error al eliminar pedido';
        this.cargando = false;
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
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.marcarPago(pedido._id, estadoPago).subscribe({
      next: (pedidoActualizado: any) => {
        const index = this.pedidos.findIndex(
          (pedidoItem) => pedidoItem._id === pedido._id
        );

        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.pedidos = [...this.pedidos];
          this.filtrarPedidos();
        }

        this.mensaje = 'Estado de pago actualizado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar pago', error);
        this.error = error.error?.mensaje || 'Error al cambiar pago';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  actualizarEntrega(pedido: any, estadoEntrega: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.marcarEntrega(pedido._id, estadoEntrega).subscribe({
      next: (pedidoActualizado: any) => {
        const index = this.pedidos.findIndex(
          (pedidoItem) => pedidoItem._id === pedido._id
        );

        if (index !== -1) {
          this.pedidos[index] = pedidoActualizado;
          this.pedidos = [...this.pedidos];
          this.filtrarPedidos();
        }

        this.mensaje = 'Estado de entrega actualizado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar entrega', error);
        this.error = error.error?.mensaje || 'Error al cambiar entrega';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  seleccionarProducto(producto: any) {
    if (!producto) {
      return;
    }

    this.pedido.producto = producto.nombre;
    this.pedido.precio = producto.precio;
  }

  filtrarPedidos() {
    const textoProducto = this.filtroProducto.trim().toLowerCase();

    this.pedidosFiltrados = this.pedidos.filter((pedidoItem) => {
      const pedidoLiveId = String(this.obtenerId(pedidoItem.liveId));
      const pedidoClienteId = String(this.obtenerId(pedidoItem.clienteId));
      const producto = String(pedidoItem.producto || '').toLowerCase();

      const coincideLive = !this.filtroLiveId || pedidoLiveId === String(this.filtroLiveId);
      const coincideCliente =
        !this.filtroClienteId || pedidoClienteId === String(this.filtroClienteId);
      const coincideProducto = !textoProducto || producto.includes(textoProducto);

      return coincideLive && coincideCliente && coincideProducto;
    });
  }

  limpiarFiltros() {
    this.filtroLiveId = '';
    this.filtroClienteId = '';
    this.filtroProducto = '';
    this.filtrarPedidos();
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
    const live = this.lives.find(
      (liveItem) => String(this.obtenerId(liveItem._id)) === String(id)
    );

    if (live) {
      return live.nombre;
    }

    if (this.liveActivo && String(this.liveActivo._id) === String(id)) {
      return this.liveActivo.nombre;
    }

    return 'Live no encontrado';
  }

  obtenerId(valor: any) {
    return valor && valor._id ? valor._id : valor;
  }

  calcularTotal(pedido: any) {
    return pedido.cantidad * pedido.precio;
  }

  limpiarFormulario() {
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
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
