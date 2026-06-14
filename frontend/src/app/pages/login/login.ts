import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  mensaje = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

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

          const usuario: any = this.authService.getUsuario();

          if (usuario?.rol === 'admin') {
            this.router.navigate(['/admin/usuarios']);
            return;
          }

          if (usuario?.rol === 'vendedor') {
            this.router.navigate(['/dashboard']);
            return;
          }

          this.mensaje = 'Rol de usuario no valido';
          this.authService.logout();
          this.router.navigate(['/login']);
          this.detectorCambios.detectChanges();
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
