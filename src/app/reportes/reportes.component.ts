import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiReportesService } from '../services/api-reportes.service';
import { ApiFacturacionService } from '../services/api-facturacion.service';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Reporte Consolidado de Rentabilidad</h2>
          <p class="text-xs text-slate-500 mt-0.5">Auditoría cruzada de ventas vs costo de adquisición y cálculo de margen.</p>
        </div>
        <button (click)="printReport()" [disabled]="!reporte() || (reporte()?.items?.length === 0)"
                class="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer">
          <span>🖨️ Imprimir Reporte</span>
        </button>
      </div>

      <!-- Totales Consolidados -->
      @if (reporte()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Totales</p>
            <p class="text-2xl font-black text-slate-900 mt-2">L. {{ reporte()?.totalGeneral?.toFixed(2) }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo de Ventas</p>
            <p class="text-2xl font-black text-rose-600 mt-2">L. {{ reporte()?.totalCost?.toFixed(2) }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilidad Neta</p>
            <p class="text-2xl font-black text-emerald-600 mt-2">L. {{ reporte()?.totalProfit?.toFixed(2) }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Margen Global</p>
            <p class="text-2xl font-black text-blue-600 mt-2">{{ reporte()?.globalMarginPercent?.toFixed(1) }}%</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="px-6 py-3.5">N° Factura</th>
                <th class="px-6 py-3.5">Punto</th>
                <th class="px-6 py-3.5">Fecha</th>
                <th class="px-6 py-3.5">Cliente</th>
                <th class="px-6 py-3.5 text-right">Costo (L.)</th>
                <th class="px-6 py-3.5 text-right">Venta (L.)</th>
                <th class="px-6 py-3.5 text-right">Utilidad (L.)</th>
                <th class="px-6 py-3.5 text-right">Margen (%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (item of reporte()?.items; track item.invoiceNumber) {
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="px-6 py-3.5 font-bold text-blue-600">{{ item.invoiceNumber }}</td>
                  <td class="px-6 py-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [ngClass]="item.documentType === 'FACTURA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'">
                      {{ item.documentType === 'FACTURA' ? 'Matriz' : 'Sucursal' }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-slate-500">{{ item.date }}</td>
                  <td class="px-6 py-3.5 font-bold text-slate-800">{{ item.clientName }}</td>
                  <td class="px-6 py-3.5 text-right text-rose-600">L. {{ item.totalCost.toFixed(2) }}</td>
                  <td class="px-6 py-3.5 text-right text-slate-900">L. {{ item.total.toFixed(2) }}</td>
                  <td class="px-6 py-3.5 text-right font-black text-emerald-600">L. {{ item.netProfit.toFixed(2) }}</td>
                  <td class="px-6 py-3.5 text-right font-black text-blue-600">{{ item.marginPercent.toFixed(1) }}%</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-400">No hay movimientos registrados para este período.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class ReportesComponent implements OnInit {
  private reportesService = inject(ApiReportesService);
  private facturacionService = inject(ApiFacturacionService);
  private printService = inject(PrintService);

  reporte = signal<any>(null);

  constructor() {
    effect(() => {
      const establishment = this.facturacionService.currentEstablishment();
      this.load(establishment);
    });
  }

  ngOnInit(): void {
    this.load(this.facturacionService.currentEstablishment());
  }

  load(establishment: any): void {
    this.reportesService.getUtilityReport(establishment).subscribe(data => this.reporte.set(data));
  }

  printReport(): void {
    const est = this.facturacionService.currentEstablishment();
    const label = est === 'FACTURA' ? 'CASA MATRIZ (FACTURAS)' : est === 'RECIBO_HONORARIOS' ? 'SUCURSAL' : 'CONSOLIDADO (MATRIZ + SUCURSAL)';
    this.printService.printUtilityReport(this.reporte(), label);
  }
}
