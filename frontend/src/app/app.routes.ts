import { Routes } from '@angular/router';

import { UsuariosAdmin } from './pages/admin/usuarios/usuarios';
import { CatalogoPublico } from './pages/catalogo-publico/catalogo-publico';
import { Clientes } from './pages/clientes/clientes';
import { Dashboard } from './pages/dashboard/dashboard';
import { LiveActivo } from './pages/live-activo/live-activo';
import { Lives } from './pages/lives/lives';
import { Login } from './pages/login/login';
import { Pedidos } from './pages/pedidos/pedidos';
import { PerfilVendedor } from './pages/perfil-vendedor/perfil-vendedor';
import { Productos } from './pages/productos/productos';
import { Register } from './pages/register/register';
import { Resumen } from './pages/resumen/resumen';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'dashboard', component: Dashboard },
  { path: 'live-activo', component: LiveActivo },
  { path: 'perfil-vendedor', component: PerfilVendedor },
  { path: 'clientes', component: Clientes },
  { path: 'lives', component: Lives },
  { path: 'productos', component: Productos },
  { path: 'pedidos', component: Pedidos },
  { path: 'resumen', component: Resumen },
  { path: 'admin/usuarios', component: UsuariosAdmin },
  { path: 'catalogo/:vendedorId', component: CatalogoPublico },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
