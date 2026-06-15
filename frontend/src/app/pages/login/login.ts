import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email = '';
  password = '';
  mensaje = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.authService.estaAutenticado()) {
      this.authService.redirigirPorRol();
    }
  }

  login() {
    if (this.cargando) return;

    if (!this.email || !this.password) {
      this.mensaje = 'Email y password son obligatorios';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    this.authService
      .login(this.email, this.password)
      .subscribe({
        next: (respuesta) => {
          this.authService.guardarSesion(respuesta);
          this.cargando = false;
          this.detectorCambios.detectChanges();

          if (!this.authService.getRol()) {
            this.mensaje = 'Rol de usuario no valido';
            this.authService.logout();
            this.detectorCambios.detectChanges();
            return;
          }

          this.authService.redirigirPorRol();
        },
        error: (error) => {
          console.error('Error al iniciar sesion', error);
          this.mensaje = this.obtenerMensajeError(error);
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
  }

  obtenerMensajeError(error: any) {
    const mensaje = error.error?.mensaje || '';

    if (error.status === 401 || mensaje === 'Credenciales invalidas') {
      return 'Email o password incorrecto';
    }

    return mensaje || 'Error al iniciar sesion';
  }
}
