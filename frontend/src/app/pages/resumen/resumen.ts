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
  liveId = '';
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
  }

  listarLives() {
    this.cargando = true;
    this.error = '';

    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = respuesta;
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al listar Lives', error);
        this.error = error.error?.mensaje || 'Error al listar Lives';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  consultarResumen() {
    this.mensaje = '';
    this.error = '';
    this.resumen = null;

    if (!this.liveId) {
      this.error = 'Debe seleccionar un Live';
      return;
    }

    this.cargando = true;

    this.resumenService.obtenerResumenPorLive(this.liveId).subscribe({
      next: (respuesta: any) => {
        this.resumen = respuesta;
        this.mensaje = 'Resumen consultado correctamente';
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
    this.liveId = '';
    this.resumen = null;
    this.mensaje = '';
    this.error = '';
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
