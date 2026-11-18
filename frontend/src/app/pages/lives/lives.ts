import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LiveService } from '../../services/live.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { PaginationComponent, paginarLista } from '../../shared/ui/pagination/pagination';
import { BadgeTone, StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

export type FiltroLives = 'todos' | 'proximos' | 'historial';

@Component({
  selector: 'app-lives',
  imports: [FormsModule, RouterModule, PageHeaderComponent, StatusBadgeComponent, PaginationComponent],
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

  formularioAbierto = false;
  filtroEstado: FiltroLives = 'todos';
  paginaActual = 1;
  elementosPorPagina = 10;
  editando = false;
  liveEditandoId = '';
  confirmandoAccion: { id: string; tipo: 'cancelado' | 'finalizado' | 'eliminar' } | null = null;
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private liveService: LiveService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  get liveDestacado(): any | null {
    return (
      this.lives.find((item) => item.estado === 'activo') ||
      this.lives.find((item) => item.estado === 'pausado') ||
      null
    );
  }

  get livesAgenda(): any[] {
    const destacadoId = this.liveDestacado?._id;
    const base = this.lives.filter((item) => item._id !== destacadoId);

    if (this.filtroEstado === 'proximos') {
      return base.filter((item) => item.estado === 'programado' || item.estado === 'pausado');
    }
    if (this.filtroEstado === 'historial') {
      return base.filter((item) => item.estado === 'finalizado' || item.estado === 'cancelado');
    }
    return base;
  }

  get livesAgendaPaginados(): any[] {
    const res = paginarLista(this.livesAgenda, this.paginaActual, this.elementosPorPagina);
    if (res.paginaSegura !== this.paginaActual) {
      this.paginaActual = res.paginaSegura;
    }
    return res.itemsPagina;
  }

  cambiarFiltroEstado(filtro: FiltroLives) {
    this.filtroEstado = filtro;
    this.paginaActual = 1;
  }

  get conteoProximos(): number {
    const destacadoId = this.liveDestacado?._id;
    return this.lives.filter(
      (item) =>
        item._id !== destacadoId && (item.estado === 'programado' || item.estado === 'pausado'),
    ).length;
  }

  get conteoHistorial(): number {
    const destacadoId = this.liveDestacado?._id;
    return this.lives.filter(
      (item) =>
        item._id !== destacadoId && (item.estado === 'finalizado' || item.estado === 'cancelado'),
    ).length;
  }

  ngOnInit() {
    this.listarLives();
  }

  abrirFormularioNuevo() {
    this.editando = false;
    this.liveEditandoId = '';
    this.limpiarFormulario();
    this.formularioAbierto = !this.formularioAbierto;
    this.mensaje = '';
    this.error = '';
  }

  cerrarFormulario() {
    this.formularioAbierto = false;
    this.editando = false;
    this.liveEditandoId = '';
    this.limpiarFormulario();
  }

  cerrarPopover(popoverId: string) {
    const el = typeof document !== 'undefined' ? document.getElementById(popoverId) : null;
    if (el && typeof (el as any).hidePopover === 'function') {
      try {
        (el as any).hidePopover();
      } catch {
        // Ignorar si el popover ya estaba cerrado
      }
    }
  }

  listarLives() {
    this.cargando = true;
    this.error = '';

    this.liveService.listarLives().subscribe({
      next: (respuesta: any) => {
        this.lives = Array.isArray(respuesta) ? respuesta : [];
        if (this.lives.length === 0) {
          this.formularioAbierto = true;
        }
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

    if (!this.live.nombre?.trim()) {
      this.error = 'El nombre del evento es obligatorio';
      return;
    }

    this.cargando = true;

    if (this.editando) {
      this.liveService.actualizarLive(this.liveEditandoId, this.live).subscribe({
        next: (liveActualizado: any) => {
          const index = this.lives.findIndex(
            (liveItem) => liveItem._id === this.liveEditandoId,
          );

          if (index !== -1) {
            this.lives[index] = liveActualizado;
            this.lives = [...this.lives];
          }

          this.cerrarFormulario();
          this.mensaje = 'Evento Live actualizado correctamente';
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
          this.lives = [liveCreado, ...this.lives];
          this.cerrarFormulario();
          this.mensaje = 'Evento Live programado correctamente';
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

  editarLive(live: any, popoverId?: string) {
    if (popoverId) {
      this.cerrarPopover(popoverId);
    }
    this.editando = true;
    this.formularioAbierto = true;
    this.liveEditandoId = live._id;
    this.live = {
      nombre: live.nombre,
      descripcion: live.descripcion || '',
      fecha: this.formatearFechaParaInput(live.fecha),
      estado: live.estado,
    };
    this.mensaje = '';
    this.error = '';
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  cancelarEdicion() {
    this.cerrarFormulario();
  }

  solicitarConfirmacion(
    id: string,
    tipo: 'cancelado' | 'finalizado' | 'eliminar',
    popoverId?: string,
  ) {
    if (popoverId) {
      this.cerrarPopover(popoverId);
    }
    this.confirmandoAccion = { id, tipo };
  }

  cancelarConfirmacion() {
    this.confirmandoAccion = null;
  }

  esConfirmando(id: string, tipo: 'cancelado' | 'finalizado' | 'eliminar'): boolean {
    return this.confirmandoAccion?.id === id && this.confirmandoAccion?.tipo === tipo;
  }

  tieneConfirmacionEnItem(id: string): boolean {
    return this.confirmandoAccion?.id === id;
  }

  obtenerEtiquetaEstado(estado: string): string {
    switch (estado) {
      case 'activo':
        return 'EN VIVO';
      case 'pausado':
        return 'Pausado';
      case 'programado':
        return 'Programado';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado || 'Sin estado';
    }
  }

  obtenerTonoEstado(estado: string): BadgeTone {
    switch (estado) {
      case 'activo':
        return 'live';
      case 'pausado':
        return 'warning';
      case 'programado':
        return 'brand';
      case 'finalizado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  eliminarLive(id: string) {
    this.confirmandoAccion = null;
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.eliminarLive(id).subscribe({
      next: () => {
        this.lives = this.lives.filter((liveItem) => liveItem._id !== id);
        this.mensaje = 'Evento Live eliminado correctamente';
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

  cambiarEstado(live: any, estado: string, popoverId?: string) {
    if (popoverId) {
      this.cerrarPopover(popoverId);
    }
    this.confirmandoAccion = null;
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.liveService.cambiarEstado(live._id, estado).subscribe({
      next: (liveActualizado: any) => {
        const index = this.lives.findIndex((liveItem) => liveItem._id === live._id);

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
      fechaObjeto.getTime() - fechaObjeto.getTimezoneOffset() * 60000,
    );

    return fechaLocal.toISOString().slice(0, 16);
  }

  mostrarFecha(fecha: any) {
    if (!fecha) {
      return 'Sin fecha definida';
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return 'Sin fecha definida';
    }

    return fechaObjeto.toLocaleString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
