import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-productos',
  imports: [FormsModule, RouterModule],
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
    nombre: '',
    descripcion: '',
    categoria: '',
    precio: 0,
    estado: 'activo',
  };

  editando = false;
  productoEditandoId = '';
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private productoService: ProductoService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.listarProductos();
  }

  listarProductos() {
    this.cargando = true;
    this.error = '';

    this.productoService.listarProductos().subscribe({
      next: (respuesta: any) => {
        this.productos = respuesta;
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

    if (!this.producto.nombre) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    if (this.producto.precio < 0) {
      this.error = 'El precio debe ser mayor o igual a 0';
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

  editarProducto(producto: any) {
    this.editando = true;
    this.productoEditandoId = producto._id;
    this.producto = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      precio: producto.precio,
      estado: producto.estado,
    };
    this.mensaje = '';
    this.error = '';
  }

  cancelarEdicion() {
    this.editando = false;
    this.productoEditandoId = '';
    this.limpiarFormulario();
  }

  eliminarProducto(id: string) {
    this.mensaje = '';
    this.error = '';
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
    this.mensaje = '';
    this.error = '';
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
      nombre: '',
      descripcion: '',
      categoria: '',
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

      const coincideNombre = !textoNombre || nombre.includes(textoNombre);
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
