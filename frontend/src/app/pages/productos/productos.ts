import { ChangeDetectorRef, Component, OnInit, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { BadgeTone, StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-productos',
  imports: [FormsModule, RouterModule, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categorias: string[] = [];
  filtroNombre = '';
  filtroCategoria = '';
  filtroEstado = '';

  producto = {
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    foto: '',
    precio: 0,
    estado: 'activo',
  };

  editando = false;
  productoEditandoId = '';
  confirmandoEliminarId = '';
  confirmandoReactivarId = '';
  formularioExpandido = true;
  mensaje = '';
  error = '';
  cargando = false;

  fotosConError = new Set<string>();
  productosConPedidoIds = new Set<string>();

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
    @Optional() private pedidoService?: PedidoService,
  ) {}

  ngOnInit() {
    this.listarProductos();
    this.cargarPedidosVinculados();
  }

  cargarPedidosVinculados() {
    if (!this.pedidoService) return;

    this.pedidoService.listarPedidos().subscribe({
      next: (pedidos: any) => {
        const lista = Array.isArray(pedidos) ? pedidos : [];
        const ids = lista
          .map((p: any) => String(p?.productoId?._id || p?.productoId || '').trim())
          .filter(Boolean);
        this.productosConPedidoIds = new Set(ids);
        this.detectorCambios.detectChanges();
      },
      error: () => {
        // Si falla la consulta auxiliar de pedidos, el backend mantiene la validación 409
      },
    });
  }

  tienePedidoVinculado(productoId: string): boolean {
    if (!productoId) return false;
    return this.productosConPedidoIds.has(String(productoId).trim());
  }

  obtenerClaveFoto(item: any): string {
    const id = item?._id || 'formulario';
    const url = String(item?.foto || '').trim();
    return `${id}::${url}`;
  }

  tieneFotoValida(item: any): boolean {
    const url = String(item?.foto || '').trim();
    if (!url) return false;
    return !this.fotosConError.has(this.obtenerClaveFoto(item));
  }

  tieneErrorFoto(item: any): boolean {
    const url = String(item?.foto || '').trim();
    if (!url) return false;
    return this.fotosConError.has(this.obtenerClaveFoto(item));
  }

  marcarErrorFoto(item: any) {
    const url = String(item?.foto || '').trim();
    if (!url) return;
    this.fotosConError.add(this.obtenerClaveFoto(item));
    this.detectorCambios.detectChanges();
  }

  alCambiarUrlFoto() {
    this.detectorCambios.detectChanges();
  }

  listarProductos() {
    this.cargando = true;
    this.error = '';

    this.productoService.listarProductos().subscribe({
      next: (respuesta: any) => {
        this.productos = Array.isArray(respuesta) ? respuesta : [];
        this.actualizarCategorias();
        this.filtrarProductos();
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar productos', error);
        this.error = error.error?.mensaje || 'Error al listar productos';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  guardarProducto() {
    this.mensaje = '';
    this.error = '';

    if (!this.producto.nombre || !this.producto.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    if (this.producto.precio < 0) {
      this.error = 'El precio debe ser mayor o igual a 0';
      return;
    }

    if (
      this.editando &&
      this.tienePedidoVinculado(this.productoEditandoId) &&
      (this.producto.estado === 'activo' || this.producto.estado === 'inactivo')
    ) {
      this.error =
        'No se puede cambiar la disponibilidad de un producto vinculado a un pedido.';
      return;
    }

    this.cargando = true;

    if (this.editando) {
      this.productoService
        .actualizarProducto(this.productoEditandoId, this.producto)
        .subscribe({
          next: (productoActualizado: any) => {
            const index = this.productos.findIndex(
              (productoItem) => productoItem._id === this.productoEditandoId
            );

            if (index !== -1) {
              this.productos[index] = productoActualizado;
              this.productos = [...this.productos];
              this.actualizarCategorias();
              this.filtrarProductos();
            }

            this.limpiarFormulario();
            this.editando = false;
            this.productoEditandoId = '';
            this.mensaje = 'Producto actualizado correctamente';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
          error: (error) => {
            console.error('Error al actualizar producto', error);
            this.error = error.error?.mensaje || 'Error al actualizar producto';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
        });
    } else {
      this.productoService.crearProducto(this.producto).subscribe({
        next: (productoCreado: any) => {
          this.productos.push(productoCreado);
          this.productos = [...this.productos];
          this.actualizarCategorias();
          this.filtrarProductos();
          this.limpiarFormulario();
          this.mensaje = 'Producto creado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear producto', error);
          this.error = error.error?.mensaje || 'Error al crear producto';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  get totalDisponibles(): number {
    return this.productos.filter((p) => p.estado === 'activo').length;
  }

  get totalApartados(): number {
    return this.productos.filter((p) => p.estado === 'apartado').length;
  }

  get totalInactivos(): number {
    return this.productos.filter((p) => p.estado === 'inactivo').length;
  }

  get tieneFiltrosActivos(): boolean {
    return Boolean(
      this.filtroNombre.trim() || this.filtroCategoria || this.filtroEstado
    );
  }

  alternarFormulario() {
    this.formularioExpandido = !this.formularioExpandido;
  }

  solicitarEliminarProducto(id: string) {
    this.confirmandoReactivarId = '';
    this.confirmandoEliminarId = id;
  }

  cancelarEliminarProducto() {
    this.confirmandoEliminarId = '';
  }

  solicitarReactivarProducto(productoItem: any) {
    this.confirmandoEliminarId = '';
    this.confirmandoReactivarId = '';
    if (this.tienePedidoVinculado(productoItem._id)) {
      this.error =
        'No se puede activar un producto vinculado a un pedido. Gestiona primero el pedido.';
      return;
    }
    if (productoItem.estado === 'apartado') {
      this.confirmandoReactivarId = productoItem._id;
      return;
    }
    this.cambiarEstado(productoItem, 'activo');
  }

  cancelarReactivarProducto() {
    this.confirmandoReactivarId = '';
  }

  confirmarReactivarProducto(productoItem: any) {
    this.confirmandoReactivarId = '';
    this.cambiarEstado(productoItem, 'activo');
  }

  obtenerTonoEstado(estado: string): BadgeTone {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'apartado':
        return 'warning';
      case 'inactivo':
      default:
        return 'neutral';
    }
  }

  obtenerEtiquetaEstado(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'Disponible';
      case 'apartado':
        return 'Apartado';
      case 'inactivo':
        return 'Inactivo';
      default:
        return estado || 'Sin estado';
    }
  }

  editarProducto(producto: any) {
    this.editando = true;
    this.formularioExpandido = true;
    this.confirmandoEliminarId = '';
    this.confirmandoReactivarId = '';
    this.productoEditandoId = producto._id;
    this.producto = {
      codigo: producto.codigo || '',
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      foto: producto.foto || '',
      precio: producto.precio,
      estado: producto.estado,
    };
    this.mensaje = '';
    this.error = '';
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelarEdicion() {
    this.editando = false;
    this.productoEditandoId = '';
    this.limpiarFormulario();
  }

  eliminarProducto(id: string) {
    this.confirmandoEliminarId = '';
    this.mensaje = '';
    this.error = '';

    if (this.tienePedidoVinculado(id)) {
      this.error = 'No se puede eliminar un producto que tiene pedidos asociados';
      return;
    }

    this.cargando = true;

    this.productoService.eliminarProducto(id).subscribe({
      next: () => {
        this.productos = this.productos.filter(
          (productoItem) => productoItem._id !== id
        );
        this.actualizarCategorias();
        this.filtrarProductos();
        this.mensaje = 'Producto eliminado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar producto', error);
        this.error = error.error?.mensaje || 'Error al eliminar producto';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  cambiarEstado(producto: any, estado: string) {
    this.confirmandoReactivarId = '';
    this.mensaje = '';
    this.error = '';

    if (
      this.tienePedidoVinculado(producto._id) &&
      (estado === 'activo' || estado === 'inactivo')
    ) {
      this.error =
        'No se puede cambiar la disponibilidad de un producto vinculado a un pedido';
      return;
    }

    this.cargando = true;

    this.productoService.cambiarEstado(producto._id, estado).subscribe({
      next: (productoActualizado: any) => {
        const index = this.productos.findIndex(
          (productoItem) => productoItem._id === producto._id
        );

        if (index !== -1) {
          this.productos[index] = productoActualizado;
          this.productos = [...this.productos];
          this.actualizarCategorias();
          this.filtrarProductos();
        }

        this.mensaje = 'Estado actualizado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cambiar estado', error);
        this.error = error.error?.mensaje || 'Error al cambiar estado';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  limpiarFormulario() {
    this.producto = {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: '',
      foto: '',
      precio: 0,
      estado: 'activo',
    };
  }

  filtrarProductos() {
    const textoNombre = this.filtroNombre.trim().toLowerCase();

    this.productosFiltrados = this.productos.filter((productoItem) => {
      const nombre = String(productoItem.nombre || '').toLowerCase();
      const categoria = String(productoItem.categoria || '');
      const estado = String(productoItem.estado || '');

      const codigo = String(productoItem.codigo || '').toLowerCase();
      const coincideNombre =
        !textoNombre || nombre.includes(textoNombre) || codigo.includes(textoNombre);
      const coincideCategoria =
        !this.filtroCategoria || categoria === this.filtroCategoria;
      const coincideEstado = !this.filtroEstado || estado === this.filtroEstado;

      return coincideNombre && coincideCategoria && coincideEstado;
    });
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.filtroEstado = '';
    this.filtrarProductos();
  }

  actualizarCategorias() {
    const categoriasUnicas = this.productos
      .map((productoItem) => productoItem.categoria)
      .filter((categoria) => !!categoria);

    this.categorias = [...new Set(categoriasUnicas)];
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
