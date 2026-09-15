import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCuentasPagarService, CuentaPorPagar, PaymentItem, RegistrarPagoProveedorRequest } from '../services/api-cuentas-pagar.service';
import { PrintService } from '../services/print.service';

interface ProviderSummary {
  providerId: string;
  providerName: string;
  providerRtn?: string;
  pendingPurchasesCount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
}

@Component({
  selector: 'app-cuentas-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>💳</span> Cuentas por Pagar (CXP) & Proveedores
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Control de pasivos comerciales, pagos a proveedores y emisión de comprobantes de egreso.</p>
        </div>
        
        <button (click)="loadData()" [disabled]="loading()"
                class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
          <span>🔄</span> {{ loading() ? 'Actualizando...' : 'Actualizar Pasivos' }}
        </button>
      </div>

      <!-- KPI Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total Compras Crédito</span>
          <div class="text-lg font-black text-slate-900 mt-1">L. {{ metrics().totalAmount.toFixed(2) }}</div>
          <span class="text-[10px] text-slate-500 mt-0.5 block">{{ cxpList().length }} facturas de compra</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-emerald-500 text-[10px] uppercase font-bold tracking-wider block">Total Pagado a Proveedores</span>
          <div class="text-lg font-black text-emerald-600 mt-1">L. {{ metrics().totalPaid.toFixed(2) }}</div>
          <span class="text-[10px] text-emerald-600/80 mt-0.5 block">{{ metrics().paidPercent.toFixed(1) }}% de pasivos saldados</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-rose-500 text-[10px] uppercase font-bold tracking-wider block">Deuda Pendiente con Proveedores</span>
          <div class="text-lg font-black text-rose-600 mt-1">L. {{ metrics().totalBalance.toFixed(2) }}</div>
          <span class="text-[10px] text-rose-500/80 mt-0.5 block">Obligaciones por liquidar</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-purple-500 text-[10px] uppercase font-bold tracking-wider block">Proveedores Acreedores</span>
          <div class="text-lg font-black text-purple-600 mt-1">{{ providerSummaries().length }}</div>
          <span class="text-[10px] text-purple-500/80 mt-0.5 block">Cuentas con saldo pendiente</span>
        </div>
      </div>

      <!-- Segmented Tab Bar -->
      <div class="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button (click)="activeTab.set('compras')"
                [class.text-blue-600]="activeTab() === 'compras'"
                [class.border-blue-600]="activeTab() === 'compras'"
                [class.text-slate-500]="activeTab() !== 'compras'"
                [class.border-transparent]="activeTab() !== 'compras'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>🛒 Facturas de Compra a Crédito</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ cxpList().length }}</span>
        </button>

        <button (click)="activeTab.set('proveedores')"
                [class.text-blue-600]="activeTab() === 'proveedores'"
                [class.border-blue-600]="activeTab() === 'proveedores'"
                [class.text-slate-500]="activeTab() !== 'proveedores'"
                [class.border-transparent]="activeTab() !== 'proveedores'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>🚚 Resumen por Proveedores</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ providerSummaries().length }}</span>
        </button>

        <button (click)="activeTab.set('historial')"
                [class.text-blue-600]="activeTab() === 'historial'"
                [class.border-blue-600]="activeTab() === 'historial'"
                [class.text-slate-500]="activeTab() !== 'historial'"
                [class.border-transparent]="activeTab() !== 'historial'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>📜 Historial de Comprobantes de Egreso</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ allPayments().length }}</span>
        </button>
      </div>

      <!-- TAB 1: COMPRAS A CRÉDITO -->
      @if (activeTab() === 'compras') {
        <div class="space-y-4">
          <!-- Filters -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div class="flex flex-wrap items-center gap-2">
              <input type="text" [(ngModel)]="searchTerm"
                     placeholder="Buscar por Factura Compra o Proveedor..."
                     class="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 w-64" />
              
              <select [(ngModel)]="statusFilter"
                      class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500">
                <option value="ALL">Todos los Estados</option>
                <option value="PENDIENTE">Pendientes / Sin Pagos</option>
                <option value="PARCIAL">Pago Parcial</option>
                <option value="PAGADA">Totalmente Pagadas</option>
                <option value="VENCIDA">Vencidas / En Mora</option>
              </select>
            </div>

            <div class="text-xs text-slate-500 font-medium">
              Mostrando <strong class="text-slate-800">{{ filteredPurchases().length }}</strong> compras
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3 font-mono">Factura Compra</th>
                  <th class="px-5 py-3">Proveedor</th>
                  <th class="px-5 py-3">Vencimiento</th>
                  <th class="px-5 py-3 text-right">Total Compra</th>
                  <th class="px-5 py-3 text-right">Monto Pagado</th>
                  <th class="px-5 py-3 text-right">Saldo Pendiente</th>
                  <th class="px-5 py-3 text-center">Estado</th>
                  <th class="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (c of filteredPurchases(); track c.id) {
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="px-5 py-3.5 font-mono font-bold text-slate-800">{{ c.purchaseNumber }}</td>
                    <td class="px-5 py-3.5 font-bold text-slate-900">{{ c.providerName || 'Proveedor General' }}</td>
                    <td class="px-5 py-3.5">
                      <div>{{ c.dueDate }}</div>
                      @if (isOverdue(c)) {
                        <span class="text-[10px] font-black text-rose-600 uppercase tracking-tight">⚠️ Vencida</span>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-right text-slate-600 font-semibold">L. {{ c.totalAmount.toFixed(2) }}</td>
                    <td class="px-5 py-3.5 text-right text-emerald-600 font-bold">L. {{ c.paidAmount.toFixed(2) }}</td>
                    <td class="px-5 py-3.5 text-right font-black" [ngClass]="c.balance > 0 ? 'text-rose-600' : 'text-slate-400'">
                      L. {{ c.balance.toFixed(2) }}
                    </td>
                    <td class="px-5 py-3.5 text-center">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-700': c.status === 'PAGADA',
                              'bg-amber-50 text-amber-700': c.status === 'PARCIAL' && !isOverdue(c),
                              'bg-blue-50 text-blue-700': c.status === 'PENDIENTE' && !isOverdue(c),
                              'bg-rose-50 text-rose-700': isOverdue(c) && c.balance > 0
                            }">
                        {{ isOverdue(c) && c.balance > 0 ? 'VENCIDA' : c.status }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        @if (c.balance > 0) {
                          <button (click)="openPaymentModal(c)"
                                  class="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition cursor-pointer">
                            💳 Pagar
                          </button>
                        }
                        <button (click)="openHistoryModal(c)"
                                class="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Ver Historial de Pagos">
                          📜
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-slate-400">No se encontraron facturas de compras a crédito registradas.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: RESUMEN POR PROVEEDORES -->
      @if (activeTab() === 'proveedores') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Proveedor</th>
                <th class="px-5 py-3 text-center">Facturas Pendientes</th>
                <th class="px-5 py-3 text-right">Total Compras</th>
                <th class="px-5 py-3 text-right">Total Pagado</th>
                <th class="px-5 py-3 text-right">Deuda Total Pendiente</th>
                <th class="px-5 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (p of providerSummaries(); track p.providerId) {
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="px-5 py-3.5 font-bold text-slate-900">{{ p.providerName }}</td>
                  <td class="px-5 py-3.5 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {{ p.pendingPurchasesCount }} compras
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-right text-slate-600">L. {{ p.totalAmount.toFixed(2) }}</td>
                  <td class="px-5 py-3.5 text-right text-emerald-600 font-bold">L. {{ p.paidAmount.toFixed(2) }}</td>
                  <td class="px-5 py-3.5 text-right font-black text-rose-600 text-sm">L. {{ p.balance.toFixed(2) }}</td>
                  <td class="px-5 py-3.5 text-center">
                    <button (click)="filterByProvider(p.providerName)"
                            class="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer">
                      Ver Compras →
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">No hay deudas pendientes con proveedores.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 3: HISTORIAL DE COMPROBANTES DE EGRESO -->
      @if (activeTab() === 'historial') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Fecha de Pago</th>
                <th class="px-5 py-3">Proveedor</th>
                <th class="px-5 py-3 font-mono">Factura Compra</th>
                <th class="px-5 py-3 text-right">Monto Pagado</th>
                <th class="px-5 py-3 text-center">Método de Pago</th>
                <th class="px-5 py-3">Referencia / Banco</th>
                <th class="px-5 py-3">Observaciones</th>
                <th class="px-5 py-3 text-center">Imprimir</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (p of allPayments(); track p.id) {
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="px-5 py-3 text-slate-500 whitespace-nowrap">{{ p.date }}</td>
                  <td class="px-5 py-3 font-bold text-slate-900">{{ p.providerName }}</td>
                  <td class="px-5 py-3 font-mono font-bold text-slate-800">{{ p.purchaseNumber }}</td>
                  <td class="px-5 py-3 text-right font-black text-rose-600">L. {{ p.amount.toFixed(2) }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {{ p.method }}
                    </span>
                  </td>
                  <td class="px-5 py-3 font-mono text-slate-600">{{ p.reference || '-' }}</td>
                  <td class="px-5 py-3 text-slate-500 text-[11px] max-w-xs truncate" [title]="p.notes">{{ p.notes || '-' }}</td>
                  <td class="px-5 py-3 text-center">
                    <button (click)="printVoucher(p)"
                            class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Imprimir Comprobante de Egreso">
                      🖨️
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-400">No hay pagos a proveedores registrados aún.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- MODAL REGISTRAR PAGO A PROVEEDOR -->
      @if (selectedForPayment) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Registrar Pago a Proveedor</h3>
                <p class="text-xs text-slate-500">Factura Compra N° <strong class="font-mono text-slate-800">{{ selectedForPayment.purchaseNumber }}</strong></p>
              </div>
              <button (click)="closePaymentModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <!-- Balance Info -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Proveedor:</span>
                <span class="font-bold text-slate-900">{{ selectedForPayment.providerName || 'Proveedor General' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Total Factura Compra:</span>
                <span class="font-semibold text-slate-700">L. {{ selectedForPayment.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Saldo Pendiente de Pago:</span>
                <span class="font-black text-rose-600 text-sm">L. {{ selectedForPayment.balance.toFixed(2) }}</span>
              </div>
            </div>

            <form (ngSubmit)="submitPayment()" class="space-y-3.5">
              <!-- Monto con botón Pagar Total -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block text-xs font-bold text-slate-700">Monto a Pagar (L.) *</label>
                  <button type="button" (click)="payFullBalance()"
                          class="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                    Liquidar Saldo Total
                  </button>
                </div>
                <input type="number" [(ngModel)]="paymentForm.amount" name="amount" min="0.01" [max]="selectedForPayment.balance" step="0.01" required
                       class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Método de Pago -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Método de Pago *</label>
                <select [(ngModel)]="paymentForm.paymentMethod" name="paymentMethod"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500">
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="CHEQUE">📝 Cheque</option>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA">💳 Tarjeta Corporativa</option>
                </select>
              </div>

              <!-- Referencia -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">N° Referencia Bancaria / N° Cheque / Voucher</label>
                <input type="text" [(ngModel)]="paymentForm.reference" name="reference"
                       placeholder="Ej: TRANSF-83921 o CHQ-9281"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Notas -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones / Notas</label>
                <textarea [(ngModel)]="paymentForm.notes" name="notes" rows="2"
                          placeholder="Detalle o nota de egreso..."
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <!-- Proyección de Saldo -->
              <div class="p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                <span class="text-blue-700 font-medium">Nuevo Saldo Pendiente:</span>
                <span class="font-black text-blue-900 text-sm">
                  L. {{ Math.max(0, selectedForPayment.balance - (paymentForm.amount || 0)).toFixed(2) }}
                </span>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" (click)="closePaymentModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" [disabled]="savingPayment() || !paymentForm.amount || paymentForm.amount <= 0"
                        class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50">
                  {{ savingPayment() ? 'Guardando Pago...' : '💾 Guardar e Imprimir Voucher' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL HISTORIAL DE PAGOS DE LA COMPRA -->
      @if (selectedForHistory) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Historial de Pagos</h3>
                <p class="text-xs text-slate-500">Factura Compra N° <strong class="font-mono text-slate-800">{{ selectedForHistory.purchaseNumber }}</strong> - {{ selectedForHistory.providerName }}</p>
              </div>
              <button (click)="selectedForHistory = null" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <div class="space-y-2">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th class="px-3 py-2">Fecha</th>
                    <th class="px-3 py-2 text-right">Monto</th>
                    <th class="px-3 py-2 text-center">Método</th>
                    <th class="px-3 py-2">Referencia</th>
                    <th class="px-3 py-2 text-center">Imprimir</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  @for (p of parsePayments(selectedForHistory.payments); track p.id) {
                    <tr class="hover:bg-slate-50">
                      <td class="px-3 py-2 text-slate-500">{{ p.date }}</td>
                      <td class="px-3 py-2 text-right font-bold text-rose-600">L. {{ p.amount.toFixed(2) }}</td>
                      <td class="px-3 py-2 text-center text-slate-600">{{ p.method }}</td>
                      <td class="px-3 py-2 font-mono text-slate-500">{{ p.reference || '-' }}</td>
                      <td class="px-3 py-2 text-center">
                        <button (click)="printSingleVoucher(selectedForHistory, p)"
                                class="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer">
                          🖨️
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-3 py-6 text-center text-slate-400">Esta compra aún no registra pagos a cuenta.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="flex justify-end pt-3 border-t border-slate-100">
              <button (click)="selectedForHistory = null" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl transition cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CuentasPagarComponent implements OnInit {
  private service = inject(ApiCuentasPagarService);
  private printService = inject(PrintService);
  Math = Math;

  activeTab = signal<'compras' | 'proveedores' | 'historial'>('compras');
  cxpList = signal<CuentaPorPagar[]>([]);
  loading = signal(false);

  searchTerm = '';
  statusFilter = 'ALL';

  // Modal Payments
  selectedForPayment: CuentaPorPagar | null = null;
  selectedForHistory: CuentaPorPagar | null = null;
  savingPayment = signal(false);

  paymentForm: RegistrarPagoProveedorRequest = {
    amount: 0,
    paymentMethod: 'TRANSFERENCIA',
    reference: '',
    notes: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => {
        this.loading.set(false);
        this.cxpList.set(data);
      },
      error: () => this.loading.set(false)
    });
  }

  metrics = computed(() => {
    const list = this.cxpList();
    const totalAmount = list.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalPaid = list.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalBalance = list.reduce((sum, item) => sum + item.balance, 0);
    const paidPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    return { totalAmount, totalPaid, totalBalance, paidPercent };
  });

  providerSummaries = computed(() => {
    const map = new Map<string, ProviderSummary>();
    for (const item of this.cxpList()) {
      if (item.balance <= 0) continue;
      const pId = item.providerId || 'GEN';
      const pName = item.providerName || 'Proveedor General';
      
      const existing = map.get(pId) || {
        providerId: pId,
        providerName: pName,
        providerRtn: item.providerRtn,
        pendingPurchasesCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        balance: 0
      };

      existing.pendingPurchasesCount += 1;
      existing.totalAmount += item.totalAmount;
      existing.paidAmount += item.paidAmount;
      existing.balance += item.balance;

      map.set(pId, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
  });

  allPayments = computed(() => {
    const payments: (PaymentItem & { providerName: string; purchaseNumber: string })[] = [];
    for (const item of this.cxpList()) {
      const list = this.parsePayments(item.payments);
      for (const p of list) {
        payments.push({
          ...p,
          providerName: item.providerName || 'Proveedor General',
          purchaseNumber: item.purchaseNumber
        });
      }
    }
    return payments.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });

  filteredPurchases(): CuentaPorPagar[] {
    const q = this.searchTerm.toLowerCase().trim();
    const status = this.statusFilter;

    return this.cxpList().filter(item => {
      const matchSearch = !q ||
        item.purchaseNumber?.toLowerCase().includes(q) ||
        item.providerName?.toLowerCase().includes(q);

      let matchStatus = true;
      if (status === 'VENCIDA') {
        matchStatus = this.isOverdue(item) && item.balance > 0;
      } else if (status !== 'ALL') {
        matchStatus = item.status === status;
      }

      return matchSearch && matchStatus;
    });
  }

  isOverdue(c: CuentaPorPagar): boolean {
    if (!c.dueDate || c.balance <= 0) return false;
    const due = new Date(c.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  filterByProvider(providerName: string): void {
    this.searchTerm = providerName;
    this.statusFilter = 'ALL';
    this.activeTab.set('compras');
  }

  parsePayments(paymentsJson?: string): PaymentItem[] {
    if (!paymentsJson) return [];
    try {
      return JSON.parse(paymentsJson) as PaymentItem[];
    } catch {
      return [];
    }
  }

  openPaymentModal(c: CuentaPorPagar): void {
    this.selectedForPayment = c;
    this.paymentForm = {
      amount: c.balance,
      paymentMethod: 'TRANSFERENCIA',
      reference: `TRANSF-${Date.now().toString().slice(-6)}`,
      notes: ''
    };
  }

  closePaymentModal(): void {
    this.selectedForPayment = null;
  }

  payFullBalance(): void {
    if (this.selectedForPayment) {
      this.paymentForm.amount = this.selectedForPayment.balance;
    }
  }

  openHistoryModal(c: CuentaPorPagar): void {
    this.selectedForHistory = c;
  }

  submitPayment(): void {
    if (!this.selectedForPayment || !this.paymentForm.amount || this.paymentForm.amount <= 0) return;

    this.savingPayment.set(true);
    const c = this.selectedForPayment;
    const amt = Number(this.paymentForm.amount);
    const prevBalance = c.balance;
    const newBal = Math.max(0, prevBalance - amt);

    this.service.addPayment(c.id, this.paymentForm).subscribe({
      next: () => {
        this.savingPayment.set(false);
        this.closePaymentModal();
        this.loadData();

        // Imprimir voucher oficial de egreso / pago
        this.printService.printComprobantePagoProveedor({
          voucherNumber: this.paymentForm.reference,
          providerName: c.providerName || 'Proveedor General',
          providerRtn: c.providerRtn,
          purchaseNumber: c.purchaseNumber,
          amount: amt,
          previousBalance: prevBalance,
          newBalance: newBal,
          paymentMethod: this.paymentForm.paymentMethod,
          reference: this.paymentForm.reference,
          notes: this.paymentForm.notes
        });
      },
      error: (err) => {
        this.savingPayment.set(false);
        alert(err?.error?.error || 'Error al registrar el pago a proveedor.');
      }
    });
  }

  printVoucher(p: PaymentItem & { providerName: string; purchaseNumber: string }): void {
    this.printService.printComprobantePagoProveedor({
      voucherNumber: p.reference || `EGR-${p.id.slice(0, 6)}`,
      providerName: p.providerName,
      purchaseNumber: p.purchaseNumber,
      amount: p.amount,
      previousBalance: p.amount,
      newBalance: 0,
      paymentMethod: p.method,
      reference: p.reference,
      notes: p.notes,
      date: p.date
    });
  }

  printSingleVoucher(c: CuentaPorPagar, p: PaymentItem): void {
    this.printService.printComprobantePagoProveedor({
      voucherNumber: p.reference || `EGR-${p.id.slice(0, 6)}`,
      providerName: c.providerName || 'Proveedor General',
      providerRtn: c.providerRtn,
      purchaseNumber: c.purchaseNumber,
      amount: p.amount,
      previousBalance: p.amount,
      newBalance: 0,
      paymentMethod: p.method,
      reference: p.reference,
      notes: p.notes,
      date: p.date
    });
  }
}
