import { Routes } from '@angular/router';

import { Clientes } from './pages/clientes/clientes';
import { Lives } from './pages/lives/lives';
import { Login } from './pages/login/login';
import { Pedidos } from './pages/pedidos/pedidos';
import { Productos } from './pages/productos/productos';
import { Register } from './pages/register/register';
import { Resumen } from './pages/resumen/resumen';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'clientes', component: Clientes },
  { path: 'lives', component: Lives },
  { path: 'productos', component: Productos },
  { path: 'pedidos', component: Pedidos },
  { path: 'resumen', component: Resumen },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
