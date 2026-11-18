import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginationComponent, paginarLista } from '../../shared/ui/pagination/pagination';

const CODIGO_PAIS_DEFAULT = '504';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, RouterModule, TitleCasePipe, PageHeaderComponent, PaginationComponent],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'],
})
export class Clientes implements OnInit {
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  filtroBusqueda = '';
  orden: 'reciente' | 'asc' | 'desc' = 'reciente';
  paginaActual = 1;
  elementosPorPagina = 10;

  cliente = {
    nombre: '',
    telefono: '',
    direccion: '',
  };

  usuario: any = null;
  editando = false;
  clienteEditandoId = '';
  confirmandoEliminarId = '';
  formularioExpandido = false;
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.listarClientes();
  }

  listarClientes() {
    this.cargando = true;
    this.error = '';

    this.clienteService.listarClientes().subscribe({
      next: (respuesta: any) => {
        this.clientes = Array.isArray(respuesta) ? respuesta : [];
        if (this.clientes.length === 0) {
          this.formularioExpandido = true;
        }
        this.filtrarClientes();
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar clientes', error);
        this.error = error.error?.mensaje || 'Error al listar clientes';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  filtrarClientes() {
    const q = this.normalizar(this.filtroBusqueda);
    const qDigitos = q.replace(/\D/g, '');

    let lista = this.clientes.filter((c) => {
      if (!q) return true;
      const nom = this.normalizar(String(c.nombre || ''));
      const dir = this.normalizar(String(c.direccion || ''));
      const telNorm = this.normalizar(String(c.telefono || ''));
      const telDigitos = this.soloDigitos(c.telefono);
      return (
        nom.includes(q) ||
        dir.includes(q) ||
        telNorm.includes(q) ||
        (qDigitos.length > 0 && telDigitos.includes(qDigitos))
      );
    });

    if (this.orden !== 'reciente') {
      const dir = this.orden === 'asc' ? 1 : -1;
      lista = [...lista].sort((a, b) =>
        dir *
        String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', {
          sensitivity: 'base',
        }),
      );
    }

    this.clientesFiltrados = lista;
    const totalPaginas = Math.max(
      1,
      Math.ceil(this.clientesFiltrados.length / Math.max(1, this.elementosPorPagina)),
    );
    if (this.paginaActual > totalPaginas) {
      this.paginaActual = totalPaginas;
    }
  }

  get clientesPaginados(): any[] {
    const res = paginarLista(this.clientesFiltrados, this.paginaActual, this.elementosPorPagina);
    if (res.paginaSegura !== this.paginaActual) {
      this.paginaActual = res.paginaSegura;
    }
    return res.itemsPagina;
  }

  alCambiarBusqueda() {
    this.paginaActual = 1;
    this.filtrarClientes();
  }

  alternarOrden() {
    if (this.orden === 'reciente') {
      this.orden = 'asc';
    } else if (this.orden === 'asc') {
      this.orden = 'desc';
    } else {
      this.orden = 'reciente';
    }
    this.filtrarClientes();
  }

  guardarCliente() {
    this.mensaje = '';
    this.error = '';

    if (!this.cliente.nombre?.trim()) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    this.cargando = true;

    if (this.editando) {
      this.clienteService
        .actualizarCliente(this.clienteEditandoId, this.cliente)
        .subscribe({
          next: (clienteActualizado: any) => {
            const index = this.clientes.findIndex(
              (clienteItem) => clienteItem._id === this.clienteEditandoId,
            );

            if (index !== -1) {
              this.clientes[index] = clienteActualizado;
              this.clientes = [...this.clientes];
              this.filtrarClientes();
            }

            this.cerrarFormulario();
            this.mensaje = 'Cliente actualizado correctamente';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
          error: (error) => {
            console.error('Error al actualizar cliente', error);
            this.error = error.error?.mensaje || 'Error al actualizar cliente';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
        });
    } else {
      this.clienteService.crearCliente(this.cliente).subscribe({
        next: (clienteCreado: any) => {
          this.clientes = [clienteCreado, ...this.clientes];
          this.filtrarClientes();
          this.cerrarFormulario();
          this.mensaje = 'Cliente creado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear cliente', error);
          this.error = error.error?.mensaje || 'Error al crear cliente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  get totalConTelefono(): number {
    return this.clientes.filter((c) => Boolean(String(c.telefono || '').trim())).length;
  }

  get totalConDireccion(): number {
    return this.clientes.filter((c) => Boolean(String(c.direccion || '').trim())).length;
  }

  alternarFormulario() {
    if (this.formularioExpandido) {
      this.cerrarFormulario();
    } else {
      this.editando = false;
      this.clienteEditandoId = '';
      this.limpiarFormulario();
      this.formularioExpandido = true;
      this.mensaje = '';
      this.error = '';
    }
  }

  cerrarFormulario() {
    this.formularioExpandido = false;
    this.editando = false;
    this.clienteEditandoId = '';
    this.limpiarFormulario();
  }

  limpiarBusqueda() {
    this.filtroBusqueda = '';
    this.filtrarClientes();
  }

  solicitarEliminarCliente(id: string) {
    this.confirmandoEliminarId = id;
  }

  cancelarEliminarCliente() {
    this.confirmandoEliminarId = '';
  }

  obtenerIniciales(nombre: string): string {
    const limpio = String(nombre || '').trim();
    if (!limpio) return 'C';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  telefonoFormateado(tel?: string | null): string | null {
    const d = this.soloDigitos(tel);
    if (!d) return null;
    if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return String(tel || '').trim();
  }

  whatsappUrl(tel?: string | null): string | null {
    const d = this.soloDigitos(tel);
    if (d.length === 8) return `https://wa.me/${CODIGO_PAIS_DEFAULT}${d}`;
    if (d.length >= 10 && d.length <= 15) return `https://wa.me/${d}`;
    return null;
  }

  editarCliente(cliente: any) {
    this.editando = true;
    this.formularioExpandido = true;
    this.confirmandoEliminarId = '';
    this.clienteEditandoId = cliente._id;
    this.cliente = {
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
    };
    this.mensaje = '';
    this.error = '';
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelarEdicion() {
    this.cerrarFormulario();
  }

  eliminarCliente(id: string) {
    this.confirmandoEliminarId = '';
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter((clienteItem) => clienteItem._id !== id);
        this.filtrarClientes();
        this.mensaje = 'Cliente eliminado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar cliente', error);
        this.error = error.error?.mensaje || 'Error al eliminar cliente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  limpiarFormulario() {
    this.cliente = {
      nombre: '',
      telefono: '',
      direccion: '',
    };
  }

  cerrarSesion() {
    this.authService.logout();
  }

  private soloDigitos(valor?: string | null): string {
    return String(valor ?? '').replace(/\D/g, '');
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
