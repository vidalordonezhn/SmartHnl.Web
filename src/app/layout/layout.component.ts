import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ApiAuthService } from '../services/api-auth.service';
import { ApiFacturacionService, EstablishmentFilter } from '../services/api-facturacion.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-slate-50 font-sans text-slate-800">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div class="flex-1 flex flex-col min-h-0">
          <!-- Logo & Header -->
          <div class="h-16 flex items-center px-6 border-b border-slate-800 gap-3 shrink-0">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-lg">
              S
            </div>
            <div>
              <h1 class="font-bold text-sm tracking-wide text-white">Smart HNL POS</h1>
              <p class="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">ERP & Fiscal SAR</p>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="p-3 space-y-1 overflow-y-auto flex-1">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1">General</div>
            <a routerLink="/dashboard" routerLinkActive="bg-blue-600 text-white" [routerLinkActiveOptions]="{exact: true}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>📊 Dashboard</span>
            </a>

            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1">Ventas & Fiscal SAR</div>
            <a routerLink="/facturacion" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🧾 Facturación SAR</span>
            </a>
            <a routerLink="/cotizaciones" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>📝 Cotizaciones</span>
            </a>
            <a routerLink="/notas-credito" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🔴 Notas de Crédito SAR</span>
            </a>

            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1">Compras & Proveedores</div>
            <a routerLink="/compras" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🛒 Compras Proveedor</span>
            </a>
            <a routerLink="/boletas-compra" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🏷️ Boletas de Compra SAR</span>
            </a>
            <a routerLink="/proveedores" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🚚 Catálogo Proveedores</span>
            </a>

            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-3 pb-1">Proyectos & Operaciones</div>
            <a routerLink="/costeo-obras" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>🏗️ Costeo de Obras</span>
            </a>
            <a routerLink="/inventario" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>📦 Inventario & Kardex</span>
            </a>
            <a routerLink="/clientes" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>👥 Clientes</span>
            </a>
            <a routerLink="/caja-chica" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>💼 Caja Chica & Gastos</span>
            </a>
            <a routerLink="/reportes" routerLinkActive="bg-blue-600 text-white"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition">
              <span>📑 Reportes de Utilidad</span>
            </a>
          </nav>
        </div>

        <!-- User Profile & Logout -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          <div class="truncate">
            <p class="text-xs font-bold text-white truncate">{{ authService.currentUser()?.name || 'Usuario' }}</p>
            <p class="text-[10px] text-slate-400 uppercase font-semibold">{{ authService.currentUser()?.role || 'CAJERO' }}</p>
          </div>
          <button (click)="logout()" class="text-slate-400 hover:text-rose-400 text-xs p-1.5 rounded-md hover:bg-slate-800 transition cursor-pointer" title="Cerrar sesión">
            🚪
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Topbar with Global Establishment Selector -->
        <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0">
          <!-- Establishment Selector (Matriz / Sucursal / Consolidado) -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ámbito Fiscal:</span>
            <div class="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
              <button (click)="setEstablishment('FACTURA')"
                      [class.bg-white]="facturacionService.currentEstablishment() === 'FACTURA'"
                      [class.text-blue-700]="facturacionService.currentEstablishment() === 'FACTURA'"
                      [class.shadow-xs]="facturacionService.currentEstablishment() === 'FACTURA'"
                      class="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer">
                🏢 Matriz (Facturas)
              </button>
              <button (click)="setEstablishment('RECIBO_HONORARIOS')"
                      [class.bg-white]="facturacionService.currentEstablishment() === 'RECIBO_HONORARIOS'"
                      [class.text-emerald-700]="facturacionService.currentEstablishment() === 'RECIBO_HONORARIOS'"
                      [class.shadow-xs]="facturacionService.currentEstablishment() === 'RECIBO_HONORARIOS'"
                      class="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer">
                🏬 Sucursal
              </button>
              <button (click)="setEstablishment('ALL')"
                      [class.bg-white]="facturacionService.currentEstablishment() === 'ALL'"
                      [class.text-purple-700]="facturacionService.currentEstablishment() === 'ALL'"
                      [class.shadow-xs]="facturacionService.currentEstablishment() === 'ALL'"
                      class="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer">
                🌐 Consolidado
              </button>
            </div>
          </div>

          <div class="text-xs font-bold text-slate-500">
            Honduras SAR - ISV 15% / 18%
          </div>
        </header>

        <!-- Dynamic View -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent {
  authService = inject(ApiAuthService);
  facturacionService = inject(ApiFacturacionService);
  private router = inject(Router);

  setEstablishment(type: EstablishmentFilter): void {
    this.facturacionService.currentEstablishment.set(type);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
