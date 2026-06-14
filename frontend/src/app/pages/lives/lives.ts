import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LiveService } from '../../services/live.service';

@Component({
  selector: 'app-lives',
  imports: [FormsModule, RouterModule],
  templateUrl: './lives.html',
  styleUrl: './lives.css',
})
export class Lives implements OnInit {
  lives: any[] = [];

  live = {
    nombre: '',
    descripcion: '',
    fecha: '',
    estado: 'programado',
  };

  editando = false;
  liveEditandoId = '';
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private liveService: LiveService,
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

  guardarLive() {
    this.mensaje = '';
    this.error = '';

    if (!this.live.nombre) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    this.cargando = true;

    if (this.editando) {
      this.liveService.actualizarLive(this.liveEditandoId, this.live).subscribe({
        next: (liveActualizado: any) => {
          const index = this.lives.findIndex(
            (liveItem) => liveItem._id === this.liveEditandoId
          );

          if (index !== -1) {
            this.lives[index] = liveActualizado;
            this.lives = [...this.lives];
          }

          this.limpiarFormulario();
          this.editando = false;
          this.liveEditandoId = '';
          this.mensaje = 'Live actualizado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al actualizar Live', error);
          this.error = error.error?.mensaje || 'Error al actualizar Live';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    } else {
      this.liveService.crearLive(this.live).subscribe({
        next: (liveCreado: any) => {
          this.lives.push(liveCreado);
          this.lives = [...this.lives];
          this.limpiarFormulario();
          this.mensaje = 'Live creado correctamente';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
        error: (error) => {
          console.error('Error al crear Live', error);
          this.error = error.error?.mensaje || 'Error al crear Live';
          this.cargando = false;
          this.detectorCambios.detectChanges();
        },
      });
    }
  }

  editarLive(live: any) {
    this.editando = true;
    this.liveEditandoId = live._id;
    this.live = {
      nombre: live.nombre,
      descripcion: live.descripcion,
      fecha: this.formatearFechaParaInput(live.fecha),
      estado: live.estado,
    };
    this.mensaje = '';
    this.error = '';
  }

  cancelarEdicion() {
    this.editando = false;
    this.liveEditandoId = '';
    this.limpiarFormulario();
  }

  eliminarLive(id: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.eliminarLive(id).subscribe({
      next: () => {
        this.lives = this.lives.filter((liveItem) => liveItem._id !== id);
        this.mensaje = 'Live eliminado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al eliminar Live', error);
        this.error = error.error?.mensaje || 'Error al eliminar Live';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  cambiarEstado(live: any, estado: string) {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.cambiarEstado(live._id, estado).subscribe({
      next: (liveActualizado: any) => {
        const index = this.lives.findIndex(
          (liveItem) => liveItem._id === live._id
        );

        if (index !== -1) {
          this.lives[index] = liveActualizado;
          this.lives = [...this.lives];
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
    this.live = {
      nombre: '',
      descripcion: '',
      fecha: '',
      estado: 'programado',
    };
  }

  formatearFechaParaInput(fecha: any) {
    if (!fecha) {
      return '';
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return '';
    }

    const fechaLocal = new Date(
      fechaObjeto.getTime() - fechaObjeto.getTimezoneOffset() * 60000
    );

    return fechaLocal.toISOString().slice(0, 16);
  }

  mostrarFecha(fecha: any) {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return 'Sin fecha';
    }

    return fechaObjeto.toLocaleString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
