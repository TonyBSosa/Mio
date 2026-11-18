import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

let siguienteModalId = 0;

@Component({
  selector: 'mio-modal',
  standalone: true,
  template: `
    <dialog
      #dialogEl
      class="mio-modal"
      [attr.data-size]="size"
      [attr.closedby]="closeDisabled ? 'none' : 'any'"
      [attr.aria-labelledby]="titleId"
      (cancel)="onCancel($event)"
      (close)="onNativeClose()"
      (pointerdown)="onPointerDown($event)"
      (pointerup)="onPointerUp($event)"
    >
      <div class="mio-modal__surface">
        <header class="mio-modal__header">
          <div class="mio-modal__heading">
            <h2 [id]="titleId" class="mio-modal__title">{{ title }}</h2>
            @if (subtitle) {
              <p class="mio-modal__subtitle">{{ subtitle }}</p>
            }
          </div>

          <div class="mio-modal__header-end">
            <ng-content select="[modalHeaderExtra]"></ng-content>
            <button
              type="button"
              class="mio-modal__close"
              (click)="solicitarCierre()"
              [disabled]="closeDisabled"
              aria-label="Cerrar ventana"
              title="Cerrar (Esc)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div class="mio-modal__body">
          @if (error) {
            <p class="mio-modal__error" role="alert">{{ error }}</p>
          }
          <ng-content></ng-content>
        </div>
      </div>
    </dialog>
  `,
  styles: [`
    dialog.mio-modal {
      margin: auto;
      padding: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow-lg);
      inline-size: min(680px, calc(100vw - 2rem));
      max-inline-size: calc(100vw - 2rem);
      max-block-size: min(88dvh, 920px);
      overflow: hidden;
    }

    dialog.mio-modal[data-size='sm'] {
      inline-size: min(540px, calc(100vw - 2rem));
    }

    dialog.mio-modal[data-size='lg'] {
      inline-size: min(840px, calc(100vw - 2rem));
    }

    dialog.mio-modal[open] {
      display: flex;
      flex-direction: column;
    }

    dialog.mio-modal:modal {
      overscroll-behavior: contain;
    }

    dialog.mio-modal::backdrop {
      background: rgba(17, 28, 24, 0.5);
      backdrop-filter: blur(2px);
      overflow: hidden;
      overscroll-behavior: contain;
    }

    .mio-modal__surface {
      display: flex;
      flex-direction: column;
      min-block-size: 0;
      max-block-size: inherit;
    }

    .mio-modal__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-5) var(--space-6) var(--space-4);
      border-bottom: 1px solid var(--border-subtle);
      background: var(--surface);
      flex-shrink: 0;
    }

    .mio-modal__heading {
      min-inline-size: 0;
      flex: 1;
    }

    .mio-modal__title {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 750;
      color: var(--ink);
      line-height: 1.25;
      letter-spacing: -0.015em;
    }

    .mio-modal__subtitle {
      margin: 0.25rem 0 0;
      font-size: var(--text-xs);
      color: var(--muted);
      line-height: 1.45;
    }

    .mio-modal__header-end {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
    }

    .mio-modal__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 34px;
      block-size: 34px;
      min-block-size: 34px;
      padding: 0;
      margin: 0;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--ink-secondary);
      cursor: pointer;
      transition: background-color var(--duration-fast) var(--ease-out),
                  border-color var(--duration-fast) var(--ease-out),
                  color var(--duration-fast) var(--ease-out);
    }

    .mio-modal__close:hover:not(:disabled) {
      background: var(--surface-subtle);
      border-color: var(--border-strong);
      color: var(--ink);
    }

    .mio-modal__close:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .mio-modal__body {
      padding: var(--space-5) var(--space-6) var(--space-6);
      overflow-y: auto;
      overscroll-behavior: contain;
      flex: 1 1 auto;
      min-block-size: 0;
    }

    .mio-modal__error {
      margin: 0 0 var(--space-4);
      padding: 0.7rem 0.9rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--danger-border);
      background: var(--danger-soft);
      color: var(--danger);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    @media (max-width: 640px) {
      dialog.mio-modal,
      dialog.mio-modal[data-size='sm'],
      dialog.mio-modal[data-size='lg'] {
        inline-size: calc(100vw - 1.25rem);
        max-inline-size: calc(100vw - 1.25rem);
        max-block-size: 92dvh;
        border-radius: var(--radius-md);
      }

      .mio-modal__header {
        padding: var(--space-4) var(--space-4) var(--space-3);
      }

      .mio-modal__body {
        padding: var(--space-4);
      }
    }
  `],
})
export class ModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() error = '';
  @Input() closeDisabled = false;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('dialogEl') private dialogRef?: ElementRef<HTMLDialogElement>;

  readonly titleId = `mio-modal-title-${++siguienteModalId}`;

  private vistaLista = false;
  private cerrandoDesdeEstado = false;
  private presionadoFuera = false;

  ngAfterViewInit() {
    this.vistaLista = true;
    this.sincronizarEstado();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.vistaLista && changes['open']) {
      this.sincronizarEstado();
    }
  }

  ngOnDestroy() {
    const el = this.dialogRef?.nativeElement;
    if (el?.open) {
      this.cerrandoDesdeEstado = true;
      this.cerrarNativo(el);
    }
  }

  solicitarCierre() {
    if (this.closeDisabled) return;
    const el = this.dialogRef?.nativeElement;
    if (el?.open) {
      this.cerrarNativo(el);
    } else {
      this.closed.emit();
    }
  }

  onCancel(event: Event) {
    if (this.closeDisabled) {
      event.preventDefault();
    }
  }

  onNativeClose() {
    const el = this.dialogRef?.nativeElement;
    if (el) {
      el.returnValue = '';
    }
    this.presionadoFuera = false;

    if (this.cerrandoDesdeEstado) {
      this.cerrandoDesdeEstado = false;
      return;
    }

    this.closed.emit();
  }

  onPointerDown(event: PointerEvent) {
    if (this.soportaClosedBy() || this.closeDisabled) {
      this.presionadoFuera = false;
      return;
    }
    const el = this.dialogRef?.nativeElement;
    this.presionadoFuera = !!el && el.open && this.estaFuera(event, el);
  }

  onPointerUp(event: PointerEvent) {
    if (this.soportaClosedBy() || this.closeDisabled) {
      this.presionadoFuera = false;
      return;
    }
    const el = this.dialogRef?.nativeElement;
    if (this.presionadoFuera && el?.open && this.estaFuera(event, el)) {
      this.cerrarNativo(el);
    }
    this.presionadoFuera = false;
  }

  private sincronizarEstado() {
    const el = this.dialogRef?.nativeElement;
    if (!el) return;

    if (this.open) {
      queueMicrotask(() => {
        if (!this.open || el.open) return;
        if (typeof el.showModal === 'function') {
          el.showModal();
        } else {
          el.setAttribute('open', '');
        }
      });
    } else if (el.open) {
      this.cerrandoDesdeEstado = true;
      this.cerrarNativo(el);
    }
  }

  private cerrarNativo(el: HTMLDialogElement) {
    if (typeof el.close === 'function') {
      el.close();
    } else {
      el.removeAttribute('open');
      this.onNativeClose();
    }
  }

  private soportaClosedBy(): boolean {
    return typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;
  }

  private estaFuera(event: PointerEvent, el: HTMLDialogElement): boolean {
    const r = el.getBoundingClientRect();
    return (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    );
  }
}
