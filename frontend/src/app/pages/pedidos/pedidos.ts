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
  standalone: true,
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
        this.filtrarPedidos();
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
        this.filtrarPedidos();
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
        this.filtrarPedidos();
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
              (p) => String(this.obtenerId(p._id)) === String(this.pedido.productoId)
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

  get piezasDisponibles(): any[] {
    const texto = this.busquedaPieza.trim().toLowerCase();
    return this.productos.filter((p) => {
      if (p.estado !== 'activo') {
        return false;
      }
      if (!texto) {
        return true;
      }
      const cod = String(p.codigo || '').toLowerCase();
      const nom = String(p.nombre || '').toLowerCase();
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

      this.pedidoService
        .actualizarPedido(this.pedidoEditandoId, payload)
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
            this.error =
              error.error?.mensaje ||
              error.error?.error ||
              'Error al actualizar pedido';
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
          this.pedidos.unshift(pedidoCreado);
          this.pedidos = [...this.pedidos];
          this.filtrarPedidos();
          this.limpiarFormulario();
          this.mensaje = 'Pedido registrado correctamente';
          this.cargando = false;
          this.listarProductos();
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear pedido', error);
          this.error =
            error.error?.mensaje ||
            error.error?.error ||
            'Error al crear pedido';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  editarPedido(pedido: any) {
    if (this.cargando) return;
    this.editando = true;
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

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.detectorCambios.detectChanges();
  }

  cancelarEdicion() {
    this.editando = false;
    this.pedidoEditandoId = '';
    this.limpiarFormulario();
    this.mensaje = '';
    this.error = '';
    this.detectorCambios.detectChanges();
  }

  eliminarPedido(id: string) {
    if (this.cargando) return;
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.pedidoService.eliminarPedido(id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter((pedidoItem) => pedidoItem._id !== id);
        this.filtrarPedidos();
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
    if (this.cargando) return;
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
        this.error = error.error?.mensaje || error.error?.error || 'Error al cambiar entrega';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  filtrarPedidos() {
    const textoProducto = this.filtroProducto.trim().toLowerCase();

    this.pedidosFiltrados = this.pedidos.filter((pedidoItem) => {
      const pedidoLiveId = String(this.obtenerId(pedidoItem.liveId) || '');
      const pedidoClienteId = String(this.obtenerId(pedidoItem.clienteId) || '');
      const producto = String(pedidoItem.producto || '').toLowerCase();

      let coincideLive = true;
      if (this.filtroLiveId === 'directa') {
        coincideLive = !pedidoItem.liveId;
      } else if (this.filtroLiveId) {
        coincideLive = pedidoLiveId === String(this.filtroLiveId);
      }

      const coincideCliente =
        !this.filtroClienteId || pedidoClienteId === String(this.filtroClienteId);

      const cod = this.obtenerCodigoPieza(pedidoItem).toLowerCase();
      const coincideProducto =
        !textoProducto || producto.includes(textoProducto) || cod.includes(textoProducto);

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
    const cliente = this.clientes.find((clienteItem) => String(clienteItem._id) === String(id));

    return cliente ? cliente.nombre : (id || 'Sin cliente');
  }

  obtenerNombreLive(liveId: any) {
    if (!liveId) return 'Venta directa (sin Live)';
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

  obtenerCodigoPieza(pedidoItem: any): string {
    const prodId = this.obtenerId(pedidoItem?.productoId);
    if (!prodId) return '';
    const prod = this.productos.find((p) => String(this.obtenerId(p._id)) === String(prodId));
    return prod?.codigo || '';
  }

  obtenerId(valor: any) {
    return valor && valor._id ? valor._id : valor;
  }

  calcularTotal(pedido: any) {
    const cant = Number(pedido?.cantidad) || 0;
    const prec = Number(pedido?.precio) || 0;
    return cant * prec;
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
}
