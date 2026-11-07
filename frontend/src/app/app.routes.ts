import { accesoRol } from './acceso-rol';
import { Recuperar } from './pages/login/recuperar';
import { Routes } from '@angular/router';

import { UsuariosAdmin } from './pages/admin/usuarios/usuarios';
import { Bienvenida } from './pages/bienvenida/bienvenida';
import { CatalogoPublico } from './pages/catalogo-publico/catalogo-publico';
import { InicioCliente } from './pages/cliente/inicio-cliente/inicio-cliente';
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
  { path: 'recuperar', component: Recuperar },
  { path: 'bienvenida', component: Bienvenida },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'register-vendedor', component: Register },
  { path: 'register-cliente', component: Register },
  { path: 'cliente/inicio', component: InicioCliente, canActivate: [accesoRol], data: { roles: ['cliente'] } },
  { path: 'dashboard', component: Dashboard, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'live-activo', component: LiveActivo, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'perfil-vendedor', component: PerfilVendedor, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'clientes', component: Clientes, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'lives', component: Lives, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'productos', component: Productos, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'pedidos', component: Pedidos, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'resumen', component: Resumen, canActivate: [accesoRol], data: { roles: ['vendedor'] } },
  { path: 'admin/usuarios', component: UsuariosAdmin, canActivate: [accesoRol], data: { roles: ['admin'] } },
  { path: 'catalogo/:vendedorId', component: CatalogoPublico },
  { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },
  { path: '**', redirectTo: 'bienvenida' },
];
