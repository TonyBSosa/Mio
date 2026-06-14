import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  nombre = '';
  email = '';
  password = '';
  mensaje = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  register() {
    if (this.cargando) return;

    if (!this.nombre || !this.email || !this.password) {
      this.mensaje = 'Nombre, email y password son obligatorios';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService
      .register(this.nombre, this.email, this.password)
      .subscribe({
        next: (respuesta) => {
          this.authService.guardarSesion(respuesta);
          this.cargando = false;
          this.detectorCambios.detectChanges();
          this.router.navigate(['/clientes']);
        },
        error: (error) => {
          console.error('Error al registrar usuario', error);
          this.mensaje = this.obtenerMensajeError(error);
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
  }

  obtenerMensajeError(error: any) {
    const mensaje = error.error?.mensaje || '';

    if (mensaje === 'Ya existe un usuario con ese email') {
      return 'Ya hay una cuenta registrada con ese correo';
    }

    return mensaje || 'Error al registrar usuario';
  }
}
