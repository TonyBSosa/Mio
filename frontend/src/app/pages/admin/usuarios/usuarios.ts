import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { UsuarioService } from '../../../services/usuario.service';

@Component({
  selector: 'app-usuarios-admin',
  imports: [FormsModule, RouterModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosAdmin implements OnInit {
  usuarios: any[] = [];

  usuario = {
    nombre: '',
    email: '',
    password: '',
    rol: 'vendedor',
    estado: 'activo',
  };

  editando = false;
  usuarioEditandoId = '';
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.listarUsuarios();
  }

  listarUsuarios() {
    this.cargando = true;
    this.error = '';

    this.usuarioService.listarUsuarios().subscribe({
      next: (respuesta: any) => {
        this.usuarios = respuesta;
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar usuarios', error);
        this.error = error.error?.mensaje || 'Error al listar usuarios';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  guardarUsuario() {
    this.mensaje = '';
    this.error = '';

    if (!this.usuario.nombre) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    if (!this.usuario.email) {
      this.error = 'El email es obligatorio';
      return;
    }

    if (!this.editando && !this.usuario.password) {
      this.error = 'El password es obligatorio';
      return;
    }

    this.cargando = true;
    const datosUsuario: any = {
      nombre: this.usuario.nombre,
      email: this.usuario.email,
      rol: this.usuario.rol,
      estado: this.usuario.estado,
    };

    if (this.usuario.password) {
      datosUsuario.password = this.usuario.password;
    }

    if (this.editando) {
      this.usuarioService
        .actualizarUsuario(this.usuarioEditandoId, datosUsuario)
        .subscribe({
          next: (usuarioActualizado: any) => {
            const index = this.usuarios.findIndex(
              (usuarioItem) => usuarioItem._id === this.usuarioEditandoId
            );

            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
              this.usuarios = [...this.usuarios];
            }

            this.limpiarFormulario();
            this.editando = false;
            this.usuarioEditandoId = '';
            this.mensaje = 'Usuario actualizado correctamente';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
          error: (error) => {
            console.error('Error al actualizar usuario', error);
            this.error = error.error?.mensaje || 'Error al actualizar usuario';
            this.cargando = false;
            this.detectorCambios.detectChanges();
          },
        });
    } else {
      this.usuarioService.crearUsuario(datosUsuario).subscribe({
        next: (usuarioCreado: any) => {
          this.usuarios.push(usuarioCreado);
          this.usuarios = [...this.usuarios];
          this.limpiarFormulario();
          this.mensaje = 'Usuario creado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear usuario', error);
          this.error = error.error?.mensaje || 'Error al crear usuario';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  editarUsuario(usuario: any) {
    this.editando = true;
    this.usuarioEditandoId = usuario._id;
    this.usuario = {
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      estado: usuario.estado,
    };
    this.mensaje = '';
    this.error = '';
  }

  cancelarEdicion() {
    this.editando = false;
    this.usuarioEditandoId = '';
    this.limpiarFormulario();
  }

  eliminarUsuario(id: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.usuarioService.eliminarUsuario(id).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(
          (usuarioItem) => usuarioItem._id !== id
        );
        this.mensaje = 'Usuario eliminado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar usuario', error);
        this.error = error.error?.mensaje || 'Error al eliminar usuario';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  cambiarEstado(usuario: any, estado: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.usuarioService.cambiarEstado(usuario._id, estado).subscribe({
      next: (usuarioActualizado: any) => {
        const index = this.usuarios.findIndex(
          (usuarioItem) => usuarioItem._id === usuario._id
        );

        if (index !== -1) {
          this.usuarios[index] = usuarioActualizado;
          this.usuarios = [...this.usuarios];
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
    this.usuario = {
      nombre: '',
      email: '',
      password: '',
      rol: 'vendedor',
      estado: 'activo',
    };
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
