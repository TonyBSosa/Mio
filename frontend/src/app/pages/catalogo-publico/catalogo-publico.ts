import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { CatalogoPublicoService } from '../../services/catalogo-publico.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-catalogo-publico',
  imports: [FormsModule, RouterModule, StatusBadgeComponent],
  templateUrl: './catalogo-publico.html',
  styleUrl: './catalogo-publico.css',
})
export class CatalogoPublico implements OnInit {
  perfil: any = null;
  productos: any[] = [];
  productosFiltrados: any[] = [];
  categorias: string[] = [];
  lives: any[] = [];
  liveActivo: any = null;
  livesProgramados: any[] = [];
  filtroProducto = '';
  filtroCategoria = '';
  filtroPrecioMaximo: any = '';
  filtrosAbiertos = false;
  mensaje = '';
  error = '';
  cargando = false;
  vendedorId = '';
  fotosConError = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private catalogoPublicoService: CatalogoPublicoService,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.vendedorId = this.route.snapshot.paramMap.get('vendedorId') || '';
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.mensaje = '';
    this.error = '';

    if (!this.vendedorId) {
      this.error = 'Catalogo no encontrado';
      this.cargando = false;
      this.detectorCambios.detectChanges();
      return;
    }

    this.cargando = true;

    this.catalogoPublicoService.obtenerCatalogo(this.vendedorId).subscribe({
      next: (respuesta: any) => {
        this.perfil = respuesta.perfil;
        this.productos = respuesta.productos || [];
        this.fotosConError.clear();
        this.actualizarCategorias();
        this.filtrarProductos();
        this.lives = respuesta.lives || [];
        this.liveActivo = this.lives.find((live) => live.estado === 'activo') || null;
        this.livesProgramados = this.lives.filter(
          (live) => live.estado === 'programado',
        );
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar catalogo publico', error);
        this.error = error.error?.mensaje || 'Error al cargar catalogo publico';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  mostrarMensajeSeguimiento() {
    this.mensaje = 'Funcion disponible en una proxima version.';
    this.detectorCambios.detectChanges();
  }

  filtrarProductos() {
    const textoProducto = this.filtroProducto.trim().toLowerCase();
    const precioMaximo = Number(this.filtroPrecioMaximo);

    this.productosFiltrados = this.productos.filter((producto) => {
      const codigo = String(producto.codigo || '').toLowerCase();
      const nombre = String(producto.nombre || '').toLowerCase();
      const descripcion = String(producto.descripcion || '').toLowerCase();
      const categoria = String(producto.categoria || '');
      const precio = Number(producto.precio) || 0;

      const coincideProducto =
        !textoProducto ||
        codigo.includes(textoProducto) ||
        nombre.includes(textoProducto) ||
        descripcion.includes(textoProducto);
      const coincideCategoria =
        !this.filtroCategoria || categoria === this.filtroCategoria;
      const coincidePrecio =
        !this.filtroPrecioMaximo ||
        (!Number.isNaN(precioMaximo) && precio <= precioMaximo);

      return coincideProducto && coincideCategoria && coincidePrecio;
    });
  }

  alternarFiltros() {
    this.filtrosAbiertos = !this.filtrosAbiertos;
  }

  seleccionarCategoria(categoria: string) {
    this.filtroCategoria = this.filtroCategoria === categoria ? '' : categoria;
    this.filtrarProductos();
  }

  tieneFiltrosActivos(): boolean {
    return Boolean(
      this.filtroProducto.trim() ||
        this.filtroCategoria ||
        (this.filtroPrecioMaximo !== '' && this.filtroPrecioMaximo !== null),
    );
  }

  limpiarFiltros() {
    this.filtroProducto = '';
    this.filtroCategoria = '';
    this.filtroPrecioMaximo = '';
    this.filtrarProductos();
  }

  actualizarCategorias() {
    const categoriasUnicas = this.productos
      .map((producto) => producto.categoria)
      .filter((categoria) => !!categoria);

    this.categorias = [...new Set(categoriasUnicas)];
  }

  obtenerFotoProducto(producto: any) {
    const foto =
      producto.foto || producto.imagen || producto.imagenUrl || producto.urlFoto || '';

    if (!foto) {
      return '';
    }

    if (
      foto.startsWith('http://') ||
      foto.startsWith('https://') ||
      foto.startsWith('/') ||
      foto.startsWith('data:')
    ) {
      return foto;
    }

    return `https://${foto}`;
  }

  private obtenerClaveFoto(producto: any): string {
    return String(producto?._id || producto?.codigo || producto?.nombre || '');
  }

  tieneFotoValida(producto: any): boolean {
    const url = this.obtenerFotoProducto(producto);
    if (!url) return false;
    return !this.fotosConError.has(this.obtenerClaveFoto(producto));
  }

  marcarErrorFoto(producto: any) {
    const clave = this.obtenerClaveFoto(producto);
    if (clave) {
      this.fotosConError.add(clave);
      this.detectorCambios.detectChanges();
    }
  }

  obtenerInicialesTienda(): string {
    const nombre = (this.perfil?.nombrePublico || 'Tienda MIO').trim();
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  }

  obtenerEnlaceCanal(valor: string, tipo: 'whatsapp' | 'web' = 'web'): string {
    const limpio = String(valor || '').trim();
    if (!limpio) return '';

    if (limpio.startsWith('http://') || limpio.startsWith('https://') || limpio.startsWith('/')) {
      return limpio;
    }

    if (tipo === 'whatsapp') {
      const digitos = limpio.replace(/[^\d]/g, '');
      if (digitos.length >= 8 && !limpio.includes('wa.me')) {
        return `https://wa.me/${digitos}`;
      }
    }

    return `https://${limpio}`;
  }

  tieneCanalesContacto(): boolean {
    if (!this.perfil) return false;
    return Boolean(
      this.perfil.whatsapp ||
        this.perfil.instagram ||
        this.perfil.facebook ||
        this.perfil.tiktok ||
        this.perfil.enlaceLive,
    );
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
}
