import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { PerfilVendedorService } from '../../services/perfil-vendedor.service';

@Component({
  selector: 'app-perfil-vendedor',
  imports: [FormsModule, RouterModule],
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

  cerrarSesion() {
    this.authService.logout();
  }
}
