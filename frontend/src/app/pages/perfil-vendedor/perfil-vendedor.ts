import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PerfilVendedorService } from '../../services/perfil-vendedor.service';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-perfil-vendedor',
  imports: [FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './perfil-vendedor.html',
  styleUrl: './perfil-vendedor.css',
})
export class PerfilVendedor implements OnInit {
  perfil = {
    nombrePublico: '',
    descripcion: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    whatsapp: '',
    enlaceLive: '',
  };

  mensaje = '';
  error = '';
  cargando = false;
  usuario: any = null;
  enlaceCatalogo = '';
  enlaceCopiado = false;
  redesAbiertas = true;

  constructor(
    private authService: AuthService,
    private perfilVendedorService: PerfilVendedorService,
    private router: Router,
    private detectorCambios: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.enlaceCatalogo = `/catalogo/${this.usuario?._id || this.usuario?.id || ''}`;
    this.cargarPerfil();
  }

  cargarPerfil() {
    this.cargando = true;
    this.error = '';

    this.perfilVendedorService.obtenerMiPerfil().subscribe({
      next: (respuesta: any) => {
        this.perfil = {
          nombrePublico: respuesta.nombrePublico || '',
          descripcion: respuesta.descripcion || '',
          facebook: respuesta.facebook || '',
          instagram: respuesta.instagram || '',
          tiktok: respuesta.tiktok || '',
          whatsapp: respuesta.whatsapp || '',
          enlaceLive: respuesta.enlaceLive || '',
        };
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar perfil publico', error);
        this.error = error.error?.mensaje || 'Error al cargar perfil publico';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  guardarPerfil() {
    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.perfilVendedorService.guardarMiPerfil(this.perfil).subscribe({
      next: (respuesta: any) => {
        this.perfil = {
          nombrePublico: respuesta.nombrePublico || '',
          descripcion: respuesta.descripcion || '',
          facebook: respuesta.facebook || '',
          instagram: respuesta.instagram || '',
          tiktok: respuesta.tiktok || '',
          whatsapp: respuesta.whatsapp || '',
          enlaceLive: respuesta.enlaceLive || '',
        };
        this.mensaje = 'Perfil publico guardado correctamente';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
      error: (error) => {
        console.error('Error al guardar perfil publico', error);
        this.error = error.error?.mensaje || 'Error al guardar perfil publico';
        this.cargando = false;
        this.detectorCambios.detectChanges();
      },
    });
  }

  obtenerInicialesTienda(): string {
    const base = (this.perfil.nombrePublico || this.usuario?.nombre || 'Tienda').trim();
    const partes = base.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return base.slice(0, 2).toUpperCase();
  }

  contarCanalesActivos(): number {
    return [
      this.perfil.whatsapp,
      this.perfil.enlaceLive,
      this.perfil.instagram,
      this.perfil.facebook,
      this.perfil.tiktok,
    ].filter((valor) => Boolean(valor && valor.trim())).length;
  }

  contarRedesSociales(): number {
    return [this.perfil.instagram, this.perfil.facebook, this.perfil.tiktok].filter((valor) =>
      Boolean(valor && valor.trim()),
    ).length;
  }

  copiarEnlaceCatalogo() {
    const origen = typeof window !== 'undefined' ? window.location.origin : '';
    const urlCompleta = `${origen}${this.enlaceCatalogo}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(urlCompleta).then(() => {
        this.enlaceCopiado = true;
        this.detectorCambios.detectChanges();
        setTimeout(() => {
          this.enlaceCopiado = false;
          this.detectorCambios.detectChanges();
        }, 2500);
      });
    } else {
      this.enlaceCopiado = true;
    }
  }

  cerrarSesion() {
    this.authService.logout();
  }
}
