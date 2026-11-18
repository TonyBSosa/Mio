import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, Optional, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PedidoService } from '../../services/pedido.service';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal/modal';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginationComponent, paginarLista } from '../../shared/ui/pagination/pagination';
import { BadgeTone, StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

export type OrdenProductos = 'reciente' | 'nombre-asc' | 'nombre-desc' | 'precio-asc' | 'precio-desc';

@Component({
  selector: 'app-productos',
  imports: [
    FormsModule,
    RouterModule,
    TitleCasePipe,
    ModalComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    PaginationComponent,
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categorias: string[] = [];
  categoriasFiltro: { clave: string; etiqueta: string }[] = [];
  filtroNombre = '';
  filtroCategoria = '';
  filtroEstado = '';
  orden: OrdenProductos = 'reciente';
  paginaActual = 1;
  elementosPorPagina = 10;

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

  cerrarPopover(popoverId: string) {
    const el = typeof document !== 'undefined' ? document.getElementById(popoverId) : null;
    if (el && typeof (el as any).hidePopover === 'function') {
      try {
        (el as any).hidePopover();
      } catch {
        // Ignorar si ya está cerrado
      }
    }
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
              (productoItem) => productoItem._id === this.productoEditandoId,
            );

            if (index !== -1) {
              this.productos[index] = productoActualizado;
              this.productos = [...this.productos];
              this.actualizarCategorias();
              this.filtrarProductos();
            }

            this.cerrarFormulario();
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
          this.productos = [productoCreado, ...this.productos];
          this.actualizarCategorias();
          this.filtrarProductos();
          this.cerrarFormulario();
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

  get productosPaginados(): any[] {
    const res = paginarLista(this.productosFiltrados, this.paginaActual, this.elementosPorPagina);
    if (res.paginaSegura !== this.paginaActual) {
      this.paginaActual = res.paginaSegura;
    }
    return res.itemsPagina;
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
    return Boolean(this.filtroNombre.trim() || this.filtroCategoria || this.filtroEstado);
  }

  alternarFormulario() {
    if (this.formularioExpandido) {
      this.cerrarFormulario();
    } else {
      this.editando = false;
      this.productoEditandoId = '';
      this.limpiarFormulario();
      this.formularioExpandido = true;
      this.mensaje = '';
      this.error = '';
    }
  }

  cerrarFormulario() {
    this.formularioExpandido = false;
    this.editando = false;
    this.productoEditandoId = '';
    this.limpiarFormulario();
  }

  seleccionarEstadoKpi(estado: string) {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.paginaActual = 1;
    this.filtrarProductos();
  }

  alternarOrdenNombre() {
    if (this.orden === 'nombre-asc') {
      this.orden = 'nombre-desc';
    } else if (this.orden === 'nombre-desc') {
      this.orden = 'reciente';
    } else {
      this.orden = 'nombre-asc';
    }
    this.filtrarProductos();
  }

  alternarOrdenPrecio() {
    if (this.orden === 'precio-asc') {
      this.orden = 'precio-desc';
    } else if (this.orden === 'precio-desc') {
      this.orden = 'reciente';
    } else {
      this.orden = 'precio-asc';
    }
    this.filtrarProductos();
  }

  formatearPrecio(precio: any): string {
    const n = Number(precio ?? 0);
    if (Number.isNaN(n)) return '0.00';
    return n.toLocaleString('es-HN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  solicitarEliminarProducto(id: string, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.confirmandoReactivarId = '';
    this.confirmandoEliminarId = id;
  }

  cancelarEliminarProducto() {
    this.confirmandoEliminarId = '';
  }

  solicitarReactivarProducto(productoItem: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
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

  editarProducto(producto: any, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
    this.editando = true;
    this.formularioExpandido = true;
    this.confirmandoEliminarId = '';
    this.confirmandoReactivarId = '';
    this.productoEditandoId = producto._id;
    this.producto = {
      codigo: producto.codigo || '',
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria || '',
      foto: producto.foto || '',
      precio: producto.precio,
      estado: producto.estado,
    };
    this.mensaje = '';
    this.error = '';
    this.detectorCambios.detectChanges();
  }

  cancelarEdicion() {
    this.cerrarFormulario();
    this.error = '';
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
        this.productos = this.productos.filter((productoItem) => productoItem._id !== id);
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

  cambiarEstado(producto: any, estado: string, popoverId?: string) {
    if (popoverId) this.cerrarPopover(popoverId);
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
          (productoItem) => productoItem._id === producto._id,
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
    const q = this.normalizar(this.filtroNombre);
    const catFiltro = this.normalizar(this.filtroCategoria);

    let lista = this.productos.filter((productoItem) => {
      const nombre = this.normalizar(String(productoItem.nombre || ''));
      const codigo = this.normalizar(String(productoItem.codigo || ''));
      const desc = this.normalizar(String(productoItem.descripcion || ''));
      const categoria = this.normalizar(String(productoItem.categoria || ''));
      const estado = String(productoItem.estado || '');

      const coincideNombre =
        !q ||
        nombre.includes(q) ||
        codigo.includes(q) ||
        desc.includes(q) ||
        categoria.includes(q);
      const coincideCategoria = !catFiltro || categoria === catFiltro;
      const coincideEstado = !this.filtroEstado || estado === this.filtroEstado;

      return coincideNombre && coincideCategoria && coincideEstado;
    });

    if (this.orden === 'nombre-asc' || this.orden === 'nombre-desc') {
      const dir = this.orden === 'nombre-asc' ? 1 : -1;
      lista = [...lista].sort((a, b) =>
        dir *
        String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', {
          sensitivity: 'base',
        }),
      );
    } else if (this.orden === 'precio-asc' || this.orden === 'precio-desc') {
      const dir = this.orden === 'precio-asc' ? 1 : -1;
      lista = [...lista].sort((a, b) => dir * (Number(a.precio || 0) - Number(b.precio || 0)));
    }

    this.productosFiltrados = lista;
    const totalPaginas = Math.max(
      1,
      Math.ceil(this.productosFiltrados.length / Math.max(1, this.elementosPorPagina)),
    );
    if (this.paginaActual > totalPaginas) {
      this.paginaActual = totalPaginas;
    }
  }

  alCambiarFiltros() {
    this.paginaActual = 1;
    this.filtrarProductos();
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroCategoria = '';
    this.filtroEstado = '';
    this.filtrarProductos();
  }

  actualizarCategorias() {
    const mapa = new Map<string, string>();
    for (const productoItem of this.productos) {
      const original = String(productoItem.categoria || '').trim();
      const clave = this.normalizar(original);
      if (clave && !mapa.has(clave)) {
        mapa.set(clave, original);
      }
    }

    this.categoriasFiltro = [...mapa.entries()]
      .map(([clave, etiqueta]) => ({ clave, etiqueta }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es', { sensitivity: 'base' }));

    this.categorias = this.categoriasFiltro.map((c) => c.etiqueta);
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
