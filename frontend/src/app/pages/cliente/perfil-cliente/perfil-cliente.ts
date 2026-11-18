import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { timeout } from 'rxjs';
import { AuthService, PerfilUsuario } from '../../../services/auth.service';
import { SolicitudesApartado } from '../../../shared/solicitudes-apartado/solicitudes-apartado';

@Component({
  selector: 'app-perfil-cliente',
  imports: [RouterLink, SolicitudesApartado],
  templateUrl: './perfil-cliente.html',
  styleUrl: './perfil-cliente.css',
})
export class PerfilCliente {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly usuario = signal<PerfilUsuario | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly accesoDenegado = signal(false);
  readonly apartadosAbiertos = signal(false);
  readonly iniciales = computed(() => {
    const partes = this.usuario()?.nombre.trim().split(/\s+/).filter(Boolean) ?? [];
    return partes.slice(0, 2).map(parte => parte[0]).join('').toUpperCase() || 'M';
  });

  constructor() { this.cargarPerfil(); }

  cargarPerfil() {
    this.cargando.set(true);
    this.error.set('');
    this.usuario.set(null);
    this.accesoDenegado.set(false);
    this.auth.obtenerPerfil().pipe(timeout(15000), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: usuario => {
        if (usuario.rol !== 'cliente') {
          this.accesoDenegado.set(true);
          this.error.set('Este perfil está disponible solo para cuentas de comprador.');
        } else {
          this.usuario.set(usuario);
        }
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        if (error.status === 401) {
          this.error.set('Tu sesión venció. Iniciá sesión de nuevo para ver tu perfil.');
          this.auth.descartarSesionVencida();
        } else if (error.status === 403) {
          this.accesoDenegado.set(true);
          this.error.set('No tenés acceso a este perfil. Revisá el estado de tu cuenta.');
        } else {
          this.error.set('No pudimos cargar tu perfil. Revisá tu conexión e intentá de nuevo.');
        }
      },
    });
  }

  cerrarSesion() { this.auth.logout(); }
}
