import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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
  mostrarPassword = false;

  constructor(
    private authService: AuthService,
    private detectorCambios: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.authService.estaAutenticado()) {
      this.continuar();
    }
  }

  alternarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
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
          this.password = '';
          if (this.authService.iniciarVerificacion(respuesta)) { this.cargando = false; return; }
          this.authService.guardarSesion(respuesta);
          this.cargando = false;
          this.detectorCambios.detectChanges();

          if (!this.authService.getRol()) {
            this.mensaje = 'Rol de usuario no valido';
            this.authService.logout();
            this.detectorCambios.detectChanges();
            return;
          }

          this.continuar();
        },
        error: (error) => {

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

  private continuar() {
    const volver = this.route.snapshot.queryParamMap.get('volver') || '';
    // Solo una ruta interna de catálogo y producto; nunca redirecciones externas.
    if (this.authService.getRol() === 'cliente' && /^\/catalogo\/[a-f\d]{24}\?producto=[a-f\d]{24}$/i.test(volver)) {
      this.router.navigateByUrl(volver);
    } else {
      this.authService.redirigirPorRol();
    }
  }
}
