import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'info' | 'error';

export interface ToastItem {
  id: number;
  tipo: TipoToast;
  texto: string;
  duracionMs: number;
  saliendo: boolean;
}

const DURACION_SALIDA_MS = 220;
const MAX_TOASTS_VISIBLES = 4;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private siguienteId = 0;
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly pausados = new Set<number>();

  readonly toasts = signal<ToastItem[]>([]);
  readonly anuncioLive = signal('');

  exito(texto: string, duracionMs = 3800) {
    this.mostrar('exito', texto, duracionMs);
  }

  info(texto: string, duracionMs = 3800) {
    this.mostrar('info', texto, duracionMs);
  }

  error(texto: string, duracionMs = 5500) {
    this.mostrar('error', texto, duracionMs);
  }

  mostrar(tipo: TipoToast, texto: string, duracionMs = 3800) {
    const limpio = String(texto || '').trim();
    if (!limpio) return;

    // Evitar duplicados exactos seguidos
    const existente = this.toasts().find((t) => !t.saliendo && t.texto === limpio && t.tipo === tipo);
    if (existente) {
      this.programarAutoCierre(existente.id, duracionMs);
      this.anunciar(limpio);
      return;
    }

    const id = ++this.siguienteId;
    const nuevo: ToastItem = {
      id,
      tipo,
      texto: limpio,
      duracionMs,
      saliendo: false,
    };

    this.toasts.update((actuales) => {
      const siguiente = [...actuales, nuevo];
      if (siguiente.length > MAX_TOASTS_VISIBLES) {
        const descartado = siguiente.shift();
        if (descartado) {
          this.limpiarTemporizador(descartado.id);
        }
      }
      return siguiente;
    });

    this.anunciar(limpio);
    if (duracionMs > 0) {
      this.programarAutoCierre(id, duracionMs);
    }
  }

  pausar(id: number) {
    this.pausados.add(id);
    this.limpiarTemporizador(id);
  }

  reanudar(id: number) {
    if (!this.pausados.has(id)) return;
    this.pausados.delete(id);
    const item = this.toasts().find((t) => t.id === id && !t.saliendo);
    if (item && item.duracionMs > 0) {
      this.programarAutoCierre(id, Math.min(item.duracionMs, 2400));
    }
  }

  cerrar(id: number) {
    this.pausados.delete(id);
    this.limpiarTemporizador(id);

    const existe = this.toasts().some((t) => t.id === id);
    if (!existe) return;

    this.toasts.update((lista) =>
      lista.map((t) => (t.id === id ? { ...t, saliendo: true } : t)),
    );

    setTimeout(() => {
      this.toasts.update((lista) => lista.filter((t) => t.id !== id));
    }, DURACION_SALIDA_MS);
  }

  private programarAutoCierre(id: number, duracionMs: number) {
    this.limpiarTemporizador(id);
    if (this.pausados.has(id)) return;

    const timer = setTimeout(() => {
      if (!this.pausados.has(id)) {
        this.cerrar(id);
      }
    }, duracionMs);

    this.temporizadores.set(id, timer);
  }

  private limpiarTemporizador(id: number) {
    const timer = this.temporizadores.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.temporizadores.delete(id);
    }
  }

  private anunciar(texto: string) {
    if (typeof document !== 'undefined') {
      const doc = document as Document & { ariaNotify?: (msg: string) => void };
      if (typeof doc.ariaNotify === 'function') {
        try {
          doc.ariaNotify(texto);
          return;
        } catch {
          // Usa la región live de respaldo
        }
      }
    }

    // Fallback: región live pre-renderizada
    this.anuncioLive.set('');
    queueMicrotask(() => this.anuncioLive.set(texto));
  }
}
