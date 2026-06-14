import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CatalogoPublicoService } from '../../services/catalogo-publico.service';

@Component({
  selector: 'app-catalogo-publico',
  templateUrl: './catalogo-publico.html',
  styleUrl: './catalogo-publico.css',
})
export class CatalogoPublico implements OnInit {
  perfil: any = null;
  productos: any[] = [];
  lives: any[] = [];
  liveActivo: any = null;
  livesProgramados: any[] = [];
  mensaje = '';
  error = '';
  cargando = false;
  vendedorId = '';

  constructor(
    private route: ActivatedRoute,
    private catalogoPublicoService: CatalogoPublicoService,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.vendedorId = this.route.snapshot.paramMap.get('vendedorId') || '';
    this.cargarCatalogo();
  }

  cargarCatalogo() {
    this.mensaje = '';
    this.error = '';

    if (!this.vendedorId) {
      this.error = 'Catalogo no encontrado';
      this.cargando = false;
      this.detectorCambios.detectChanges();
      return;
    }

    this.cargando = true;

    this.catalogoPublicoService.obtenerCatalogo(this.vendedorId).subscribe({
      next: (respuesta: any) => {
        this.perfil = respuesta.perfil;
        this.productos = respuesta.productos || [];
        this.lives = respuesta.lives || [];
        this.liveActivo = this.lives.find((live) => live.estado === 'activo') || null;
        this.livesProgramados = this.lives.filter(
          (live) => live.estado === 'programado'
        );
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar catalogo publico', error);
        this.error = error.error?.mensaje || 'Error al cargar catalogo publico';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  mostrarMensajeSeguimiento() {
    this.mensaje = 'Funcion disponible en una proxima version.';
    this.detectorCambios.detectChanges();
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
}
