import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'],
})
export class Clientes implements OnInit {
  clientes: any[] = [];

  cliente = {
    nombre: '',
    telefono: '',
    direccion: '',
  };

  usuario: any = null;
  editando = false;
  clienteEditandoId = '';
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
        this.clientes = respuesta;
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
          this.clientes.push(clienteCreado);
          this.clientes = [...this.clientes];
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

  editarCliente(cliente: any) {
    this.editando = true;
    this.clienteEditandoId = cliente._id;
    this.cliente = {
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    };
    this.mensaje = '';
    this.error = '';
  }

  cancelarEdicion() {
    this.editando = false;
    this.clienteEditandoId = '';
    this.limpiarFormulario();
  }

  eliminarCliente(id: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter((clienteItem) => clienteItem._id !== id);
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
