import { Component } from '@angular/core';
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
  ) {}

  register() {
    if (this.cargando) return;

    this.cargando = true;
    this.mensaje = '';

    this.authService
      .register(this.nombre, this.email, this.password)
      .subscribe({
        next: (respuesta) => {
          this.authService.guardarSesion(respuesta);
          this.cargando = false;
          this.router.navigate(['/clientes']);
        },
        error: (error) => {
          console.error('Error al registrar usuario', error);
          this.mensaje = error.error?.mensaje || 'Error al registrar usuario';
          this.cargando = false;
        },
      });
  }
}
