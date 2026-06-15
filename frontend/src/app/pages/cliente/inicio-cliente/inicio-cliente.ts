import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { ExplorarPublicoService } from '../../../services/explorar-publico.service';

@Component({
  selector: 'app-inicio-cliente',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './inicio-cliente.html',
  styleUrl: './inicio-cliente.css',
})
export class InicioCliente implements OnInit {
  vendedores: any[] = [];
  eventos: any[] = [];
  eventosActivos: any[] = [];
  eventosProgramados: any[] = [];
  usuario: any = null;
  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private explorarPublicoService: ExplorarPublicoService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.error = '';
    this.listarVendedores();
    this.listarEventos();
  }

  listarVendedores() {
    this.explorarPublicoService.listarVendedores().subscribe({
      next: (respuesta: any) => {
        this.vendedores = respuesta;
        this.finalizarCarga();
      },
      error: (error) => {
        console.error('Error al listar vendedores', error);
        this.error = error.error?.mensaje || 'Error al listar vendedores';
        this.finalizarCarga();
      },
    });
  }

  listarEventos() {
    this.explorarPublicoService.listarEventos().subscribe({
      next: (respuesta: any) => {
        this.eventos = respuesta;
        this.eventosActivos = this.eventos.filter((evento) => evento.estado === 'activo');
        this.eventosProgramados = this.eventos.filter(
          (evento) => evento.estado === 'programado'
        );
        this.finalizarCarga();
      },
      error: (error) => {
        console.error('Error al listar eventos', error);
        this.error = error.error?.mensaje || 'Error al listar eventos';
        this.finalizarCarga();
      },
    });
  }

  finalizarCarga() {
    this.cargando = false;
    this.detectorCambios.detectChanges();
  }

  mostrarMensajeFaseSiguiente() {
    this.mensaje = 'Esta funcion estara disponible en la siguiente fase.';
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

  cerrarSesion() {
    this.authService.logout();
  }
}
