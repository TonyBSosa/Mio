import { Component } from '@angular/core';
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
  ) {}

  login() {
    if (this.cargando) return;

    this.cargando = true;
    this.mensaje = '';

    this.authService
      .login(this.email, this.password)
      .subscribe({
        next: (respuesta) => {
          this.authService.guardarSesion(respuesta);
          this.cargando = false;

          const usuario: any = this.authService.getUsuario();

          if (usuario?.rol === 'admin') {
            this.router.navigate(['/admin/usuarios']);
            return;
          }

          if (usuario?.rol === 'vendedor') {
            this.router.navigate(['/clientes']);
            return;
          }

          this.mensaje = 'Rol de usuario no valido';
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al iniciar sesion', error);
          this.mensaje = error.error?.mensaje || 'Error al iniciar sesion';
          this.cargando = false;
        },
      });
  }
}
