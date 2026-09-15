import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FacturacionComponent } from './facturacion/facturacion.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { NotasCreditoComponent } from './notas-credito/notas-credito.component';
import { ComprasComponent } from './compras/compras.component';
import { BoletasCompraComponent } from './boletas-compra/boletas-compra.component';
import { CosteoObrasComponent } from './costeo-obras/costeo-obras.component';
import { InventarioComponent } from './inventario/inventario.component';
import { ClientesComponent } from './clientes/clientes.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { CajaChicaComponent } from './caja-chica/caja-chica.component';
import { ReportesComponent } from './reportes/reportes.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'facturacion', component: FacturacionComponent },
      { path: 'cotizaciones', component: CotizacionesComponent },
      { path: 'notas-credito', component: NotasCreditoComponent },
      { path: 'compras', component: ComprasComponent },
      { path: 'boletas-compra', component: BoletasCompraComponent },
      { path: 'costeo-obras', component: CosteoObrasComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'caja-chica', component: CajaChicaComponent },
      { path: 'reportes', component: ReportesComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
