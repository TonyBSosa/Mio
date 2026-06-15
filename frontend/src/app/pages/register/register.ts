import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
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
  rolRegistro = 'vendedor';
  titulo = 'Crear cuenta de vendedor';

  constructor(
    private authService: AuthService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const ruta = this.router.url;

    if (ruta.includes('register-cliente')) {
      this.rolRegistro = 'cliente';
      this.titulo = 'Crear cuenta de cliente';
    } else {
      this.rolRegistro = 'vendedor';
      this.titulo = 'Crear cuenta de vendedor';
    }
  }

  register() {
    if (this.cargando) return;

    if (!this.nombre || !this.email || !this.password) {
      this.mensaje = 'Nombre, email y password son obligatorios';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService
      .register(this.nombre, this.email, this.password, this.rolRegistro)
      .subscribe({
        next: (respuesta) => {
          this.authService.guardarSesion(respuesta);
          this.cargando = false;
          this.detectorCambios.detectChanges();

          if (this.rolRegistro === 'cliente') {
            this.router.navigate(['/cliente/inicio']);
            return;
          }

          this.router.navigate(['/dashboard']);
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
