import { Component, DestroyRef, ElementRef, Input, OnDestroy, OnInit, Output, EventEmitter, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Comprobante, ComprobanteService, HistorialComprobantes } from '../../services/comprobante.service';

@Component({
  selector: 'mio-comprobantes-reserva',
  imports: [DatePipe, FormsModule],
  templateUrl: './comprobantes-reserva.html',
  styleUrl: './comprobantes-reserva.css',
})
export class ComprobantesReserva implements OnInit, OnDestroy {
  @Input({ required: true }) reservaId = '';
  @Input() vista: 'cliente' | 'vendedor' = 'cliente';
  @Output() actualizado = new EventEmitter<void>();
  @ViewChild('archivoInput') archivoInput?: ElementRef<HTMLInputElement>;
  private readonly service = inject(ComprobanteService);
  private readonly destroyRef = inject(DestroyRef);
  readonly historial = signal<HistorialComprobantes | null>(null);
  readonly cargando = signal(false);
  readonly ocupada = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly previa = signal('');
  readonly imagen = signal('');
  readonly decision = signal<{ id: string; accion: 'aprobar' | 'rechazar' } | null>(null);
  archivo: File | null = null;
  motivo = '';

  ngOnInit() { this.cargar(); }
  ngOnDestroy() { this.limpiarSeleccion(); }
  cargar() {
    this.cargando.set(true);
    this.service.historial(this.reservaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: historial => { this.historial.set(historial); this.cargando.set(false); },
      error: e => { this.error.set(e.error?.mensaje || 'No pudimos consultar los comprobantes.'); this.cargando.set(false); },
    });
  }
  seleccionar(evento: Event) {
    this.limpiarSeleccion(false);
    this.error.set('');
    this.mensaje.set('');
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 5242880 || archivo.size === 0) {
      this.error.set('Elegí una imagen JPG, PNG o WebP de hasta 5 MB.');
      input.value = '';
      return;
    }
    this.archivo = archivo;
    this.previa.set(URL.createObjectURL(archivo));
  }
  limpiarSeleccion(limpiarEntrada = true) {
    if (this.previa()) URL.revokeObjectURL(this.previa());
    this.previa.set('');
    this.archivo = null;
    if (limpiarEntrada && this.archivoInput) this.archivoInput.nativeElement.value = '';
  }
  enviar() {
    if (!this.archivo || this.ocupada() || !this.historial()?.cargaHabilitada) return;
    this.ocupada.set(true);
    this.error.set('');
    this.service.subir(this.reservaId, this.archivo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.limpiarSeleccion(); this.ocupada.set(false);
        this.mensaje.set('Comprobante recibido. El pago queda pendiente de revisión del vendedor.');
        this.cargar(); this.actualizado.emit();
      },
      error: e => {
        this.ocupada.set(false);
        this.error.set(e.error?.mensaje || 'No pudimos confirmar el envío. Revisá el historial antes de reintentar.');
        this.cargar();
      },
    });
  }
  ver(id: string) {
    if (this.ocupada()) return;
    this.ocupada.set(true); this.error.set(''); this.imagen.set('');
    this.service.acceso(this.reservaId, id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: acceso => { this.imagen.set(acceso.url); this.ocupada.set(false); },
      error: e => { this.error.set(e.error?.mensaje || 'No pudimos abrir la imagen. Intentá de nuevo.'); this.ocupada.set(false); },
    });
  }
  preparar(id: string, accion: 'aprobar' | 'rechazar') {
    this.decision.set({ id, accion }); this.motivo = ''; this.error.set(''); this.mensaje.set('');
  }
  revisar() {
    const decision = this.decision();
    if (!decision || this.ocupada() || this.vista !== 'vendedor') return;
    if (decision.accion === 'rechazar' && !this.motivo.trim()) { this.error.set('Escribí el motivo del rechazo.'); return; }
    this.ocupada.set(true); this.error.set('');
    this.service.revisar(this.reservaId, decision.id, decision.accion, this.motivo.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.ocupada.set(false); this.decision.set(null); this.imagen.set('');
        this.mensaje.set(decision.accion === 'aprobar' ? 'Pago aprobado y registrado.' : 'Comprobante rechazado. El motivo queda en el historial.');
        this.cargar(); this.actualizado.emit();
      },
      error: e => { this.ocupada.set(false); this.error.set(e.error?.mensaje || 'No pudimos confirmar la revisión. Actualizá antes de reintentar.'); },
    });
  }
  estadoTexto(estado: Comprobante['estado']) {
    return { preparando: 'Carga en curso', en_revision: 'Pendiente de revisión', aprobado: 'Pago aprobado', rechazado: 'Rechazado', fallido: 'Carga no completada' }[estado];
  }
}
