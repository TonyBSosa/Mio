import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface PaginacionResultado<T> {
  paginaSegura: number;
  totalPaginas: number;
  itemsPagina: T[];
}

export function paginarLista<T>(
  items: readonly T[],
  pagina: number,
  porPagina: number,
): PaginacionResultado<T> {
  const tamano = Math.max(1, Math.floor(porPagina || 10));
  const totalPaginas = Math.max(1, Math.ceil(items.length / tamano));
  const paginaSegura = Math.min(Math.max(1, Math.floor(pagina || 1)), totalPaginas);
  const inicio = (paginaSegura - 1) * tamano;
  return {
    paginaSegura,
    totalPaginas,
    itemsPagina: items.slice(inicio, inicio + tamano),
  };
}

@Component({
  selector: 'mio-pagination',
  standalone: true,
  template: `
    @if (totalItems > 0 && (totalPaginas > 1 || totalItems > opcionesTamano[0])) {
      <nav class="mio-pagination" aria-label="Paginación">
        <div class="mio-pagination__summary">
          Mostrando <strong>{{ inicio }}–{{ fin }}</strong> de <strong>{{ totalItems }}</strong>
          {{ itemLabel }}
        </div>

        <div class="mio-pagination__controls">
          <label class="mio-pagination__size">
            <span class="mio-pagination__size-label">Por página</span>
            <select
              class="mio-pagination__select"
              [value]="pageSize"
              (change)="cambiarTamano($event)"
              aria-label="Elementos por página"
            >
              @for (opt of opcionesTamano; track opt) {
                <option [value]="opt" [selected]="opt === pageSize">{{ opt }}</option>
              }
            </select>
          </label>

          @if (totalPaginas > 1) {
            <div class="mio-pagination__pages" role="group" aria-label="Cambiar de página">
              <button
                type="button"
                class="seg-btn mio-page-btn"
                [disabled]="paginaSegura <= 1"
                (click)="irA(paginaSegura - 1)"
                aria-label="Página anterior"
              >
                ←
              </button>

              @for (p of paginasVisibles; track $index) {
                @if (p === '...') {
                  <span class="mio-page-ellipsis" aria-hidden="true">…</span>
                } @else {
                  <button
                    type="button"
                    class="seg-btn mio-page-btn"
                    [class.mio-page-btn--active]="p === paginaSegura"
                    [attr.aria-current]="p === paginaSegura ? 'page' : null"
                    (click)="irA(p)"
                  >
                    {{ p }}
                  </button>
                }
              }

              <button
                type="button"
                class="seg-btn mio-page-btn"
                [disabled]="paginaSegura >= totalPaginas"
                (click)="irA(paginaSegura + 1)"
                aria-label="Página siguiente"
              >
                →
              </button>
            </div>
          }
        </div>
      </nav>
    }
  `,
  styles: [`
    .mio-pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      margin-block-start: var(--space-3);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      color: var(--ink-secondary);
    }

    .mio-pagination__summary {
      font-variant-numeric: tabular-nums;
    }

    .mio-pagination__summary strong {
      color: var(--ink);
      font-weight: 700;
    }

    .mio-pagination__controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .mio-pagination__size {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--muted);
    }

    .mio-pagination__select {
      min-block-size: 32px !important;
      inline-size: auto !important;
      padding: 0.2rem 1.5rem 0.2rem 0.55rem !important;
      font-size: var(--text-xs) !important;
      font-weight: 700;
      border-radius: var(--radius-xs) !important;
    }

    .mio-pagination__pages {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .mio-page-btn {
      min-block-size: 32px !important;
      min-inline-size: 32px;
      padding: 0 0.5rem !important;
      border-radius: var(--radius-xs) !important;
      border: 1px solid var(--border) !important;
      background: var(--surface) !important;
      color: var(--ink-secondary) !important;
      font-size: var(--text-xs) !important;
      font-weight: 650 !important;
      font-variant-numeric: tabular-nums;
    }

    .mio-page-btn:hover:not(:disabled) {
      border-color: var(--border-strong) !important;
      background: var(--surface-subtle) !important;
      color: var(--ink) !important;
    }

    .mio-page-btn--active {
      background: var(--brand) !important;
      border-color: var(--brand) !important;
      color: #ffffff !important;
    }

    .mio-page-btn--active:hover:not(:disabled) {
      background: var(--brand-hover) !important;
      border-color: var(--brand-hover) !important;
      color: #ffffff !important;
    }

    .mio-page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .mio-page-ellipsis {
      padding-inline: 4px;
      color: var(--muted);
      user-select: none;
    }

    @media (max-width: 640px) {
      .mio-pagination {
        padding: var(--space-3);
        justify-content: center;
      }

      .mio-pagination__controls {
        inline-size: 100%;
        justify-content: space-between;
      }
    }
  `],
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() opcionesTamano: readonly number[] = [10, 20, 50];
  @Input() itemLabel = 'registros';

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.pageSize)));
  }

  get paginaSegura(): number {
    return Math.min(Math.max(1, this.page), this.totalPaginas);
  }

  get inicio(): number {
    if (this.totalItems === 0) return 0;
    return (this.paginaSegura - 1) * this.pageSize + 1;
  }

  get fin(): number {
    return Math.min(this.totalItems, this.paginaSegura * this.pageSize);
  }

  get paginasVisibles(): (number | '...')[] {
    const total = this.totalPaginas;
    const actual = this.paginaSegura;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const lista: (number | '...')[] = [1];
    const desde = Math.max(2, actual - 1);
    const hasta = Math.min(total - 1, actual + 1);

    if (desde > 2) lista.push('...');
    for (let i = desde; i <= hasta; i++) {
      lista.push(i);
    }
    if (hasta < total - 1) lista.push('...');
    lista.push(total);
    return lista;
  }

  irA(nuevaPagina: number): void {
    const segura = Math.min(Math.max(1, nuevaPagina), this.totalPaginas);
    if (segura !== this.paginaSegura) {
      this.pageChange.emit(segura);
    }
  }

  cambiarTamano(event: Event): void {
    const valor = Number((event.target as HTMLSelectElement)?.value || 10);
    if (!Number.isNaN(valor) && valor > 0 && valor !== this.pageSize) {
      this.pageSizeChange.emit(valor);
      this.pageChange.emit(1);
    }
  }
}
