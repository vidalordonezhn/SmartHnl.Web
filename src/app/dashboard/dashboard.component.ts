import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiFacturacionService, Factura } from '../services/api-facturacion.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Panel de Control & Resumen</h2>
          <p class="text-xs text-slate-500 mt-0.5">Métricas financieras y estado de ventas en tiempo real.</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Facturado</p>
          <p class="text-2xl font-black text-slate-900 mt-2">L. {{ totalVentas().toFixed(2) }}</p>
          <span class="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
            {{ facturas().length }} Comprobantes
          </span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">ISV 15% / 18% Total</p>
          <p class="text-2xl font-black text-blue-600 mt-2">L. {{ totalIsv().toFixed(2) }}</p>
          <span class="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
            Impuesto Fiscal
          </span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Gravadas</p>
          <p class="text-2xl font-black text-slate-800 mt-2">L. {{ totalGravado().toFixed(2) }}</p>
          <span class="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
            Base imponible
          </span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Exentas / Exoneradas</p>
          <p class="text-2xl font-black text-purple-600 mt-2">L. {{ (totalExento() + totalExonerado()).toFixed(2) }}</p>
          <span class="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
            Régimen Especial
          </span>
        </div>
      </div>

      <!-- Recent Invoices Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-sm text-slate-900">Últimas Facturas Emitidas</h3>
        </div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-6 py-3">N° Factura</th>
              <th class="px-6 py-3">Tipo / Punto</th>
              <th class="px-6 py-3">Cliente</th>
              <th class="px-6 py-3">Fecha</th>
              <th class="px-6 py-3">Término</th>
              <th class="px-6 py-3 text-right">Total (HNL)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (f of facturas().slice(0, 8); track f.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-3.5 font-bold text-blue-600">{{ f.invoiceNumber }}</td>
                <td class="px-6 py-3.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [ngClass]="f.documentType === 'FACTURA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'">
                    {{ f.documentType === 'FACTURA' ? 'Matriz' : 'Sucursal' }}
                  </span>
                </td>
                <td class="px-6 py-3.5 text-slate-900 font-bold">{{ f.clientName || 'Consumidor Final' }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ f.date }}</td>
                <td class="px-6 py-3.5 text-slate-600 font-semibold">{{ f.paymentTerm || f.paymentType }}</td>
                <td class="px-6 py-3.5 text-right font-black text-slate-900">L. {{ f.totalGeneral.toFixed(2) }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-slate-400">No hay facturas registradas en este ámbito.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private facturacionService = inject(ApiFacturacionService);

  facturas = signal<Factura[]>([]);
  totalVentas = signal(0);
  totalIsv = signal(0);
  totalGravado = signal(0);
  totalExento = signal(0);
  totalExonerado = signal(0);

  constructor() {
    effect(() => {
      const establishment = this.facturacionService.currentEstablishment();
      this.loadData(establishment);
    });
  }

  ngOnInit(): void {
    this.loadData(this.facturacionService.currentEstablishment());
  }

  loadData(establishment: any): void {
    this.facturacionService.getInvoices(establishment).subscribe({
      next: (data) => {
        this.facturas.set(data);
        this.totalVentas.set(data.reduce((acc, f) => acc + f.totalGeneral, 0));
        this.totalIsv.set(data.reduce((acc, f) => acc + f.isvTotal, 0));
        this.totalGravado.set(data.reduce((acc, f) => acc + f.subtotalGravado, 0));
        this.totalExento.set(data.reduce((acc, f) => acc + f.subtotalExento, 0));
        this.totalExonerado.set(data.reduce((acc, f) => acc + f.subtotalExonerado, 0));
      }
    });
  }
}
