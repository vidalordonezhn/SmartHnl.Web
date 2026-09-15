import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCajaChicaService, CajaChica, CajaChicaGasto } from '../services/api-caja-chica.service';

@Component({
  selector: 'app-caja-chica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Caja Chica & Liquidaciones</h2>
          <p class="text-xs text-slate-500 mt-0.5">Control de gastos menores, comprobantes y saldos disponibles.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Registrar Gasto</span>
        </button>
      </div>

      <!-- Cajas Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (c of cajas(); track c.id) {
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="font-bold text-sm text-slate-900">{{ c.name }}</h3>
            <p class="text-xs text-slate-400 mt-0.5">Responsable: {{ c.responsible }}</p>
            <div class="mt-4 flex items-baseline justify-between">
              <span class="text-xs font-semibold text-slate-500">Saldo Disponible:</span>
              <span class="text-xl font-black text-emerald-600">L. {{ c.currentBalance.toFixed(2) }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Gastos Recientes -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100">
          <h3 class="font-bold text-sm text-slate-900">Comprobantes de Gastos Registrados</h3>
        </div>
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-6 py-3.5">Fecha</th>
              <th class="px-6 py-3.5">Cuenta Contable</th>
              <th class="px-6 py-3.5">Beneficiario / Acreedor</th>
              <th class="px-6 py-3.5">Descripción</th>
              <th class="px-6 py-3.5">N° Recibo</th>
              <th class="px-6 py-3.5 text-right">Monto (L.)</th>
              <th class="px-6 py-3.5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (g of gastos(); track g.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-3.5 text-slate-500">{{ g.expenseDate }}</td>
                <td class="px-6 py-3.5 font-bold text-slate-700">{{ g.accountCode || '5101' }} - {{ g.accountName || 'Gastos' }}</td>
                <td class="px-6 py-3.5 text-slate-800">{{ g.creditorName || 'Varios' }}</td>
                <td class="px-6 py-3.5 text-slate-600">{{ g.description }}</td>
                <td class="px-6 py-3.5 font-mono text-slate-500">{{ g.receiptNumber || 'S/N' }}</td>
                <td class="px-6 py-3.5 text-right font-black text-slate-900">L. {{ g.amount.toFixed(2) }}</td>
                <td class="px-6 py-3.5 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                    {{ g.status }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-slate-400">No hay comprobantes de gasto registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Registrar Gasto -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Comprobante de Gasto</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form (ngSubmit)="saveGasto()" class="space-y-3.5">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Caja Chica *</label>
                  <select [(ngModel)]="newGasto.pettyCashId" name="pettyCashId" required
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500">
                    @for (c of cajas(); track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Cuenta Contable *</label>
                  <select [(ngModel)]="newGasto.accountId" name="accountId" required
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500">
                    <option value="pca-5101">5101 - Gastos de Oficina</option>
                    <option value="pca-5102">5102 - Transporte</option>
                    <option value="pca-5103">5103 - Alimentación</option>
                    <option value="pca-5104">5104 - Combustible</option>
                    <option value="pca-5105">5105 - Reparaciones</option>
                    <option value="pca-1105">1105 - Anticipo de Salario</option>
                    <option value="pca-5199">5199 - Otros Gastos</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Descripción del Gasto *</label>
                <input type="text" [(ngModel)]="newGasto.description" name="description" required
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                       placeholder="Ej: Compra de café y azúcar para oficina" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">N° de Factura / Recibo</label>
                  <input type="text" [(ngModel)]="newGasto.receiptNumber" name="receiptNumber"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="000-001-01-00012345" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Monto Pagado (L.) *</label>
                  <input type="number" [(ngModel)]="newGasto.amount" name="amount" min="0.01" step="0.01" required
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" (click)="closeModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving()"
                        class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50">
                  {{ saving() ? 'Guardando...' : 'Registrar Gasto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class CajaChicaComponent implements OnInit {
  private service = inject(ApiCajaChicaService);
  cajas = signal<CajaChica[]>([]);
  gastos = signal<CajaChicaGasto[]>([]);
  showModal = signal(false);
  saving = signal(false);

  newGasto: Partial<CajaChicaGasto> = {
    pettyCashId: 'pc-main',
    accountId: 'pca-5101',
    description: '',
    receiptNumber: '',
    amount: 0
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.service.getCajas().subscribe(data => {
      this.cajas.set(data);
      if (data.length > 0 && !this.newGasto.pettyCashId) {
        this.newGasto.pettyCashId = data[0].id;
      }
    });
    this.service.getGastos().subscribe(data => this.gastos.set(data));
  }

  openModal(): void {
    this.newGasto = {
      pettyCashId: this.cajas().length > 0 ? this.cajas()[0].id : 'pc-main',
      accountId: 'pca-5101',
      description: '',
      receiptNumber: '',
      amount: 0
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveGasto(): void {
    if (!this.newGasto.description || !this.newGasto.amount || this.newGasto.amount <= 0) {
      alert('Descripción y Monto válido son requeridos.');
      return;
    }

    this.saving.set(true);
    this.service.createGasto(this.newGasto).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.error || 'Error al registrar el gasto');
      }
    });
  }
}
