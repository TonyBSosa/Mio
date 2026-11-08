import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, RouterModule, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'],
})
export class Clientes implements OnInit {
  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  filtroBusqueda = '';

  cliente = {
    nombre: '',
    telefono: '',
    direccion: '',
  };

  usuario: any = null;
  editando = false;
  clienteEditandoId = '';
  confirmandoEliminarId = '';
  formularioExpandido = true;
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
    const texto = this.filtroBusqueda.trim().toLowerCase();
    if (!texto) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter((c) => {
      const nom = String(c.nombre || '').toLowerCase();
      const tel = String(c.telefono || '').toLowerCase();
      const dir = String(c.direccion || '').toLowerCase();
      return nom.includes(texto) || tel.includes(texto) || dir.includes(texto);
    });
  }

  guardarCliente() {
    this.mensaje = '';
    this.error = '';

    if (!this.cliente.nombre) {
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
              (clienteItem) => clienteItem._id === this.clienteEditandoId
            );

            if (index !== -1) {
              this.clientes[index] = clienteActualizado;
              this.clientes = [...this.clientes];
              this.filtrarClientes();
            }

            this.limpiarFormulario();
            this.editando = false;
            this.clienteEditandoId = '';
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
          this.clientes.unshift(clienteCreado);
          this.clientes = [...this.clientes];
          this.filtrarClientes();
          this.limpiarFormulario();
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
    this.formularioExpandido = !this.formularioExpandido;
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

  editarCliente(cliente: any) {
    this.editando = true;
    this.formularioExpandido = true;
    this.confirmandoEliminarId = '';
    this.clienteEditandoId = cliente._id;
    this.cliente = {
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    };
    this.mensaje = '';
    this.error = '';
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelarEdicion() {
    this.editando = false;
    this.clienteEditandoId = '';
    this.limpiarFormulario();
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
}
