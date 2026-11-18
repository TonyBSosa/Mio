import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  effect,
  inject,
} from '@angular/core';

import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'mio-toast-host',
  standalone: true,
  template: `
    <p class="sr-only">Notificaciones del sistema</p>
    <div class="sr-only" aria-live="polite" aria-atomic="true">
      {{ toastService.anuncioLive() }}
    </div>

    <div
      #popoverHost
      popover="manual"
      role="region"
      aria-label="Notificaciones"
      class="mio-toast-region"
      [class.mio-toast-region--seller]="conSidebar"
    >
      @for (toast of toastService.toasts(); track toast.id; let idx = $index) {
        <div
          class="mio-toast"
          [attr.data-tipo]="toast.tipo"
          [class.mio-toast--saliendo]="toast.saliendo"
          (mouseenter)="toastService.pausar(toast.id)"
          (mouseleave)="toastService.reanudar(toast.id)"
          (focusin)="toastService.pausar(toast.id)"
          (focusout)="alSalirFoco($event, toast.id)"
        >
          <span class="mio-toast__icon" aria-hidden="true">
            @if (toast.tipo === 'error') {
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="10" cy="10" r="7.5" />
                <path d="M10 6.5v4M10 13.5h.01" />
              </svg>
            } @else {
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 10.5l3.5 3.5 7.5-7.5" />
              </svg>
            }
          </span>

          <span class="mio-toast__text">{{ toast.texto }}</span>

          <button
            type="button"
            class="mio-toast__close"
            (click)="cerrarConFoco($event, toast.id, idx)"
            aria-label="Cerrar notificación"
            title="Cerrar"
          >
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .mio-toast-region {
      position: fixed;
      inset: auto 1.25rem 1.25rem auto;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      inline-size: min(370px, calc(100vw - 2rem));
      max-inline-size: calc(100vw - 2rem);
      pointer-events: none;
      z-index: 120;
    }

    .mio-toast-region:is(:popover-open, .\\:popover-open) {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    @media (max-width: 1023px) {
      .mio-toast-region--seller {
        inset-block-end: calc(var(--bottom-nav-height, 66px) + 0.85rem);
      }
    }

    .mio-toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.78rem 0.85rem 0.78rem 0.95rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-inverse);
      background: var(--surface-inverse);
      color: var(--ink-on-inverse);
      box-shadow: var(--shadow-lg);
      font-size: var(--text-sm);
      line-height: 1.4;
      overflow-wrap: anywhere;
      animation: mio-toast-in 240ms var(--ease-out) both;
      transition: transform 200ms var(--ease-out), opacity 200ms var(--ease-out);
      transition-behavior: allow-discrete;
    }

    .mio-toast--saliendo {
      opacity: 0;
      transform: translateX(22px);
    }

    .mio-toast[data-tipo='error'] {
      border-color: var(--danger-border);
      background: var(--surface);
      color: var(--ink);
    }

    .mio-toast__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 24px;
      block-size: 24px;
      border-radius: var(--radius-pill);
      background: rgba(52, 211, 153, 0.16);
      color: #6ee7b7;
      flex-shrink: 0;
      margin-block-start: 1px;
    }

    .mio-toast[data-tipo='info'] .mio-toast__icon {
      background: rgba(255, 255, 255, 0.12);
      color: #e2ebe7;
    }

    .mio-toast[data-tipo='error'] .mio-toast__icon {
      background: var(--danger-soft);
      color: var(--danger);
    }

    .mio-toast__text {
      flex: 1 1 auto;
      min-inline-size: 0;
      font-weight: 550;
      padding-block-start: 2px;
    }

    .mio-toast__close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 26px;
      block-size: 26px;
      min-block-size: 26px;
      padding: 0;
      margin: 0;
      border: 0;
      border-radius: var(--radius-xs);
      background: transparent;
      color: var(--muted-on-inverse);
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color var(--duration-fast) var(--ease-out),
                  color var(--duration-fast) var(--ease-out);
    }

    .mio-toast__close:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .mio-toast[data-tipo='error'] .mio-toast__close {
      color: var(--muted);
    }

    .mio-toast[data-tipo='error'] .mio-toast__close:hover {
      background: var(--surface-subtle);
      color: var(--ink);
    }

    @keyframes mio-toast-in {
      from {
        opacity: 0;
        transform: translateX(24px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .mio-toast {
        animation: none;
        transition: none;
      }
    }
  `],
})
export class ToastHostComponent {
  @Input() conSidebar = false;

  @ViewChild('popoverHost') private popoverRef?: ElementRef<HTMLElement>;

  readonly toastService = inject(ToastService);

  constructor() {
    effect(() => {
      const cantidad = this.toastService.toasts().length;
      queueMicrotask(() => this.sincronizarPopover(cantidad > 0));
    });
  }

  alSalirFoco(event: FocusEvent, id: number) {
    const contenedor = event.currentTarget as HTMLElement | null;
    const destino = event.relatedTarget as Node | null;
    if (contenedor && destino && contenedor.contains(destino)) {
      return;
    }
    this.toastService.reanudar(id);
  }

  cerrarConFoco(event: Event, id: number, idx: number) {
    const botonActual = event.currentTarget as HTMLElement | null;
    const host = this.popoverRef?.nativeElement;
    if (host && botonActual && document.activeElement === botonActual) {
      const botones = Array.from(host.querySelectorAll<HTMLButtonElement>('.mio-toast__close'));
      const siguiente = botones[idx + 1] || botones[idx - 1];
      if (siguiente) {
        siguiente.focus();
      }
    }
    this.toastService.cerrar(id);
  }

  private sincronizarPopover(visible: boolean) {
    const el = this.popoverRef?.nativeElement as (HTMLElement & {
      showPopover?: () => void;
      hidePopover?: () => void;
    }) | null;
    if (!el) return;

    if (visible) {
      if (typeof el.showPopover === 'function') {
        try {
          if (!el.matches(':popover-open')) {
            el.showPopover();
          }
        } catch {
          el.classList.add(':popover-open');
        }
      } else {
        el.classList.add(':popover-open');
      }
    } else {
      if (typeof el.hidePopover === 'function') {
        try {
          if (el.matches(':popover-open')) {
            el.hidePopover();
          }
        } catch {
          el.classList.remove(':popover-open');
        }
      } else {
        el.classList.remove(':popover-open');
      }
    }
  }
}
