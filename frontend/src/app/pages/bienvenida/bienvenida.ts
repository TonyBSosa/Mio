import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [RouterModule, StatusBadgeComponent],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
})
export class Bienvenida implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    if (this.authService.estaAutenticado()) {
      this.authService.redirigirPorRol();
    }
  }
}
