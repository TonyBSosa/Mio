import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfiguracionReserva, SolicitudApartado, SolicitudApartadoService } from '../../services/solicitud-apartado.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ComprobantesReserva } from '../comprobantes-reserva/comprobantes-reserva';

@Component({
  selector: 'mio-solicitudes-apartado',
  imports: [DatePipe, DecimalPipe, ComprobantesReserva],
  templateUrl: './solicitudes-apartado.html',
  styleUrl: './solicitudes-apartado.css',
})
export class SolicitudesApartado implements OnInit {
  @Input() vista: 'cliente' | 'vendedor' = 'cliente';
  private readonly service = inject(SolicitudApartadoService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly solicitudes = signal<SolicitudApartado[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly configuracion = signal<ConfiguracionReserva | null>(null);
  readonly gestionError = signal('');
  readonly mensaje = signal('');
  readonly guardando = signal(false);
  readonly decision = signal<{ id: string; accion: 'confirmar' | 'rechazar' } | null>(null);
  readonly comprobantesAbiertos = signal<string[]>([]);
  readonly cancelacion = signal<string | null>(null);

  constructor() { this.cargar(); }

  ngOnInit() {
    this.cargarConfiguracion();
  }

  cargarConfiguracion() {
    if (this.vista === 'vendedor') {
      this.service.configuracion().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: config => { this.configuracion.set(config); this.gestionError.set(''); },
        error: () => this.gestionError.set('No pudimos consultar la configuración. La confirmación permanece deshabilitada. Podés actualizar las solicitudes para reintentar.'),
      });
    }
  }

  cambiarPlazo(valor: string, selector?: HTMLSelectElement) {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.gestionError.set('');
    this.mensaje.set('');
    this.service.guardarPlazo(Number(valor)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: config => {
        this.configuracion.set(config);
        this.guardando.set(false);
        const msg = 'Plazo guardado para futuras reservas.';
        this.mensaje.set(msg);
        this.toast.exito(msg);
      },
      error: () => {
        this.guardando.set(false);
        if (selector) selector.value = String(this.configuracion()?.plazoReservaDias || 3);
        this.gestionError.set('No se guardó el plazo. Intentá de nuevo.');
      },
    });
  }

  preparar(id: string, accion: 'confirmar' | 'rechazar') {
    if (this.guardando() || this.vista !== 'vendedor' || (accion === 'confirmar' && !this.configuracion()?.confirmacionPruebaHabilitada)) return;
    this.gestionError.set('');
    this.mensaje.set('');
    this.decision.set({ id, accion });
  }

  resolver() {
    const decision = this.decision();
    if (!decision || this.guardando()) return;
    if (decision.accion === 'confirmar' && !this.configuracion()?.confirmacionPruebaHabilitada) return;
    this.guardando.set(true);
    this.service.resolver(decision.id, decision.accion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: actualizada => {
        this.solicitudes.update(lista => actualizada.estado === 'rechazada'
          ? lista.filter(s => s._id !== actualizada._id)
          : lista.map(s => s._id === actualizada._id ? actualizada : s));
        this.guardando.set(false);
        this.decision.set(null);
        const msg = actualizada.estado === 'rechazada' ? 'Solicitud rechazada y eliminada.' : 'Reserva de prueba confirmada. El artículo quedó bloqueado.';
        this.mensaje.set(msg);
        this.toast.exito(msg);
      },
      error: error => {
        this.guardando.set(false);
        this.gestionError.set(error.error?.mensaje || 'No pudimos confirmar el resultado. Actualizá las solicitudes antes de intentar de nuevo.');
        if (error.status === 401) this.auth.descartarSesionVencida();
      },
    });
  }

  estadoTexto(estado: SolicitudApartado['estado']) {
    return { pendiente: 'Pendiente de revisión', confirmada: 'Reserva confirmada', rechazada: 'Rechazada', expirada: 'Reserva expirada', comprobante_en_revision: 'Comprobante en revisión', comprobante_rechazado: 'Comprobante rechazado: corrección pendiente', pagada: 'Pagada', cancelada: 'Cancelada' }[estado];
  }
  prepararCancelacion(solicitud: SolicitudApartado) {
    if (this.vista !== 'cliente' || this.guardando() || !['pendiente', 'confirmada'].includes(solicitud.estado)) return;
    this.gestionError.set(''); this.mensaje.set(''); this.cancelacion.set(solicitud._id);
  }
  cancelarApartado() {
    const id = this.cancelacion();
    if (!id || this.guardando() || this.vista !== 'cliente') return;
    this.guardando.set(true);
    this.service.cancelar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.solicitudes.update(lista => lista.filter(s => s._id !== id));
        this.cancelacion.set(null); this.guardando.set(false);
        this.mensaje.set('Apartado cancelado.');
        this.toast.exito('Apartado cancelado.');
      },
      error: error => {
        this.guardando.set(false);
        this.gestionError.set(error.error?.mensaje || 'No pudimos confirmar la cancelación. Actualizá antes de reintentar.');
        if (error.status === 401) this.auth.descartarSesionVencida();
      },
    });
  }
  alternarComprobantes(id: string, evento: Event) {
    const abierto = (evento.target as HTMLDetailsElement).open;
    this.comprobantesAbiertos.update(ids => abierto ? [...new Set([...ids, id])] : ids.filter(valor => valor !== id));
  }

  tiempoRestante(segundos: number) {
    // Solo presenta la medición del servidor. No controla estados ni libera stock.
    if (segundos <= 0) return 'Plazo cumplido. Actualizá para consultar el estado.';
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    if (dias) return `${dias} ${dias === 1 ? 'día' : 'días'} y ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    if (horas) return `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    return `${Math.max(1, Math.ceil(segundos / 60))} min`;
  }

  cargar() {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set('');
    this.decision.set(null);
    this.cancelacion.set(null);
    this.service.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: solicitudes => { this.solicitudes.set(solicitudes); this.cargando.set(false); },
      error: error => {
        this.cargando.set(false);
        this.error.set('No pudimos cargar las solicitudes. Intentá de nuevo.');
        if (error.status === 401) this.auth.descartarSesionVencida();
      },
    });
  }
}
