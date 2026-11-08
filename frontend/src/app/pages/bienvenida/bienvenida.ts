import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

export type DemoVista = 'catalogo' | 'pedidos' | 'vitrina';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [RouterModule, StatusBadgeComponent],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
})
export class Bienvenida implements OnInit, AfterViewInit, OnDestroy {
  readonly vistasDemo: readonly { id: DemoVista; etiqueta: string; resumen: string }[] = [
    {
      id: 'catalogo',
      etiqueta: 'Catálogo',
      resumen: 'Inventario con códigos SKU y estados en tiempo real',
    },
    {
      id: 'pedidos',
      etiqueta: 'Pedidos Live',
      resumen: 'Asignación rápida en vivo con control de cobro y entrega',
    },
    {
      id: 'vitrina',
      etiqueta: 'Vitrina pública',
      resumen: 'Enlace compartible con canales de contacto directo',
    },
  ];

  vistaActiva: DemoVista = 'catalogo';
  pausadoManual = false;
  pausadoInteraccion = false;

  private hoverActivo = false;
  private focoActivo = false;

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private revealObserver: IntersectionObserver | null = null;

  constructor(
    private detector: ChangeDetectorRef,
    private authService: AuthService,
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  get indiceVistaActiva(): number {
    return this.vistasDemo.findIndex((v) => v.id === this.vistaActiva);
  }

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      this.authService.redirigirPorRol();
      return;
    }
    this.iniciarAutoplay();
  }

  ngAfterViewInit(): void {
    this.configurarAparicionSecciones();
  }

  ngOnDestroy(): void {
    this.detenerAutoplay();
    this.revealObserver?.disconnect();
  }

  seleccionarVista(vista: DemoVista): void {
    this.vistaActiva = vista;
    this.reiniciarAutoplay();
  }

  avanzarVista(): void {
    const siguiente = (this.indiceVistaActiva + 1) % this.vistasDemo.length;
    this.vistaActiva = this.vistasDemo[siguiente].id;
  }

  retrocederVista(): void {
    const anterior =
      (this.indiceVistaActiva - 1 + this.vistasDemo.length) % this.vistasDemo.length;
    this.vistaActiva = this.vistasDemo[anterior].id;
  }

  manejarTecladoTabs(event: KeyboardEvent): void {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.avanzarVista();
      this.reiniciarAutoplay();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.retrocederVista();
      this.reiniciarAutoplay();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.seleccionarVista(this.vistasDemo[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.seleccionarVista(this.vistasDemo[this.vistasDemo.length - 1].id);
    }
    this.hostRef.nativeElement.querySelector<HTMLButtonElement>('#demo-tab-' + this.vistaActiva)?.focus();
  }

  pausarPorInteraccion(tipo: 'hover' | 'foco' = 'hover'): void {
    if (tipo === 'hover') this.hoverActivo = true;
    else this.focoActivo = true;
    this.pausadoInteraccion = this.hoverActivo || this.focoActivo;
  }

  reanudarPorInteraccion(tipo: 'hover' | 'foco' = 'hover', event?: FocusEvent): void {
    if (tipo === 'foco' && event?.relatedTarget instanceof Node &&
        this.hostRef.nativeElement.querySelector('.hero-demo')?.contains(event.relatedTarget)) return;
    if (tipo === 'hover') this.hoverActivo = false;
    else this.focoActivo = false;
    this.pausadoInteraccion = this.hoverActivo || this.focoActivo;
    this.reiniciarAutoplay();
  }

  alternarAutoplayManual(): void {
    if (this.prefiereMovimientoReducido()) return;
    this.pausadoManual = !this.pausadoManual;
  }

  private prefiereMovimientoReducido(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  private iniciarAutoplay(): void {
    this.detenerAutoplay();
    if (this.prefiereMovimientoReducido()) {
      this.pausadoManual = true;
      return;
    }
    this.autoplayTimer = setInterval(() => {
      if (!this.pausadoManual && !this.pausadoInteraccion && !document.hidden && !this.prefiereMovimientoReducido()) {
        this.avanzarVista();
        this.detector.detectChanges();
      }
    }, 6000);
  }

  private detenerAutoplay(): void {
    if (this.autoplayTimer !== null) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  private reiniciarAutoplay(): void {
    if (!this.pausadoManual && !this.prefiereMovimientoReducido()) {
      this.iniciarAutoplay();
    }
  }

  private configurarAparicionSecciones(): void {
    const host = this.hostRef.nativeElement;
    const elementos = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!elementos.length) {
      return;
    }

    if (this.prefiereMovimientoReducido() || typeof IntersectionObserver === 'undefined') {
      elementos.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.revealObserver?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -24px 0px' },
    );

    elementos.forEach((el) => {
      el.classList.add('reveal-ready');
      this.revealObserver?.observe(el);
    });
  }
}
