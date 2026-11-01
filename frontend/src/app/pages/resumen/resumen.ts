import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LiveService } from '../../services/live.service';
import { ResumenService } from '../../services/resumen.service';

@Component({
  selector: 'app-resumen',
  imports: [FormsModule, RouterModule],
  templateUrl: './resumen.html',
  styleUrl: './resumen.css',
})
export class Resumen implements OnInit {
  lives: any[] = [];
  liveId = 'todos';
  resumen: any = null;
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private liveService: LiveService,
    private resumenService: ResumenService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.listarLives();
    this.consultarResumen(true);
  }

  listarLives() {
    this.error = '';

    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = Array.isArray(respuesta) ? respuesta : [];
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar Lives', error);
        this.error = error.error?.mensaje || 'Error al listar Lives';
        this.detectorCambios.detectChanges();
      },
    });
  }

  consultarResumen(silencioso = false) {
    this.mensaje = '';
    this.error = '';
    this.resumen = null;

    if (!this.liveId) {
      this.error = 'Debe seleccionar una modalidad o Live';
      return;
    }

    this.cargando = true;

    this.resumenService.obtenerResumenPorLive(this.liveId).subscribe({
      next: (respuesta: any) => {
        this.resumen = respuesta;
        if (!silencioso) {
          this.mensaje = 'Resumen consultado correctamente';
        }
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al consultar resumen', error);
        this.error = error.error?.mensaje || 'Error al consultar resumen';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  limpiarResumen() {
    this.liveId = 'todos';
    this.mensaje = '';
    this.error = '';
    this.consultarResumen(true);
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
