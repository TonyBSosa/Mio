import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../ui/modal/modal';

@Component({
  selector: 'mio-entrega-dialog',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './entrega-dialog.html',
  styleUrl: './entrega-dialog.css',
})
export class EntregaDialog {
  @Input() open = false;
  @Input() confirmando = false;
  @Input() subtitle = '';
  @Input() error = '';
  @Input() guardando = false;
  @Input() plan = { tipo: 'local', lugar: '', fecha: '' };
  @Output() closed = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();

  fechaEntrega(fecha: string): string {
    const [ano, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
