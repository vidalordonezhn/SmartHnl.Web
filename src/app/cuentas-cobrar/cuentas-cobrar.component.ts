import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCuentasCobrarService, CuentaPorCobrar, PaymentItem, RegistrarAbonoRequest } from '../services/api-cuentas-cobrar.service';
import { PrintService } from '../services/print.service';

interface DebtorSummary {
  clientId: string;
  clientName: string;
  pendingInvoicesCount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
}

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>💰</span> Cuentas por Cobrar (CXC) & Cobranzas
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Control de cartera de créditos a clientes, seguimiento de vencimientos y emisión de recibos de caja.</p>
        </div>
        
        <button (click)="loadData()" [disabled]="loading()"
                class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
          <span>🔄</span> {{ loading() ? 'Actualizando...' : 'Actualizar Cartera' }}
        </button>
      </div>

      <!-- KPI Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Cartera Total Crédito</span>
          <div class="text-lg font-black text-slate-900 mt-1">L. {{ metrics().totalAmount.toFixed(2) }}</div>
          <span class="text-[10px] text-slate-500 mt-0.5 block">{{ cxcList().length }} facturas a crédito</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-emerald-500 text-[10px] uppercase font-bold tracking-wider block">Total Cobrado / Recuperado</span>
          <div class="text-lg font-black text-emerald-600 mt-1">L. {{ metrics().totalPaid.toFixed(2) }}</div>
          <span class="text-[10px] text-emerald-600/80 mt-0.5 block">{{ metrics().recoveryPercent.toFixed(1) }}% de recuperación</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-rose-500 text-[10px] uppercase font-bold tracking-wider block">Saldo Pendiente por Cobrar</span>
          <div class="text-lg font-black text-rose-600 mt-1">L. {{ metrics().totalBalance.toFixed(2) }}</div>
          <span class="text-[10px] text-rose-500/80 mt-0.5 block">Exigible a la fecha</span>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-blue-500 text-[10px] uppercase font-bold tracking-wider block">Clientes con Deuda Activa</span>
          <div class="text-lg font-black text-blue-600 mt-1">{{ debtorSummaries().length }}</div>
          <span class="text-[10px] text-blue-500/80 mt-0.5 block">Cuentas con saldo > 0</span>
        </div>
      </div>

      <!-- Segmented Tab Bar -->
      <div class="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button (click)="activeTab.set('facturas')"
                [class.text-blue-600]="activeTab() === 'facturas'"
                [class.border-blue-600]="activeTab() === 'facturas'"
                [class.text-slate-500]="activeTab() !== 'facturas'"
                [class.border-transparent]="activeTab() !== 'facturas'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>🧾 Facturas a Crédito</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ cxcList().length }}</span>
        </button>

        <button (click)="activeTab.set('deudores')"
                [class.text-blue-600]="activeTab() === 'deudores'"
                [class.border-blue-600]="activeTab() === 'deudores'"
                [class.text-slate-500]="activeTab() !== 'deudores'"
                [class.border-transparent]="activeTab() !== 'deudores'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>👥 Resumen por Clientes</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ debtorSummaries().length }}</span>
        </button>

        <button (click)="activeTab.set('historial')"
                [class.text-blue-600]="activeTab() === 'historial'"
                [class.border-blue-600]="activeTab() === 'historial'"
                [class.text-slate-500]="activeTab() !== 'historial'"
                [class.border-transparent]="activeTab() !== 'historial'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>📜 Historial de Recibos de Caja</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ allPayments().length }}</span>
        </button>
      </div>

      <!-- TAB 1: FACTURAS A CRÉDITO -->
      @if (activeTab() === 'facturas') {
        <div class="space-y-4">
          <!-- Filters -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div class="flex flex-wrap items-center gap-2">
              <input type="text" [(ngModel)]="searchTerm"
                     placeholder="Buscar por N° Factura o Cliente..."
                     class="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 w-64" />
              
              <select [(ngModel)]="statusFilter"
                      class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500">
                <option value="ALL">Todos los Estados</option>
                <option value="PENDIENTE">Pendientes / Sin Abonos</option>
                <option value="PARCIAL">Abono Parcial</option>
                <option value="PAGADA">Totalmente Pagadas</option>
                <option value="VENCIDA">Vencidas / En Mora</option>
              </select>
            </div>

            <div class="text-xs text-slate-500 font-medium">
              Mostrando <strong class="text-slate-800">{{ filteredInvoices().length }}</strong> cuentas
            </div>
          </div>

          <!-- Invoices Table -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3 font-mono">N° Factura</th>
                  <th class="px-5 py-3">Cliente</th>
                  <th class="px-5 py-3">Vencimiento</th>
                  <th class="px-5 py-3 text-right">Total Factura</th>
                  <th class="px-5 py-3 text-right">Monto Cobrado</th>
                  <th class="px-5 py-3 text-right">Saldo Pendiente</th>
                  <th class="px-5 py-3 text-center">Estado</th>
                  <th class="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (c of filteredInvoices(); track c.id) {
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="px-5 py-3.5 font-mono font-bold text-slate-800">{{ c.invoiceNumber }}</td>
                    <td class="px-5 py-3.5 font-bold text-slate-900">{{ c.clientName || 'Cliente General' }}</td>
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
                            💰 Abonar
                          </button>
                        }
                        <button (click)="openHistoryModal(c)"
                                class="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Ver Historial de Abonos">
                          📜
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-slate-400">No se encontraron facturas a crédito registradas.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: RESUMEN POR CLIENTES / DEUDORES -->
      @if (activeTab() === 'deudores') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Cliente</th>
                <th class="px-5 py-3 text-center">Facturas Pendientes</th>
                <th class="px-5 py-3 text-right">Total Facturado</th>
                <th class="px-5 py-3 text-right">Total Abonado</th>
                <th class="px-5 py-3 text-right">Deuda Total Acumulada</th>
                <th class="px-5 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (d of debtorSummaries(); track d.clientId) {
                <tr class="hover:bg-slate-50/80 transition">
                  <td class="px-5 py-3.5 font-bold text-slate-900">{{ d.clientName }}</td>
                  <td class="px-5 py-3.5 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {{ d.pendingInvoicesCount }} facturas
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-right text-slate-600">L. {{ d.totalAmount.toFixed(2) }}</td>
                  <td class="px-5 py-3.5 text-right text-emerald-600 font-bold">L. {{ d.paidAmount.toFixed(2) }}</td>
                  <td class="px-5 py-3.5 text-right font-black text-rose-600 text-sm">L. {{ d.balance.toFixed(2) }}</td>
                  <td class="px-5 py-3.5 text-center">
                    <button (click)="filterByClient(d.clientName)"
                            class="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer">
                      Ver Facturas →
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-400">No hay clientes con deuda pendiente registrada.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 3: HISTORIAL DE RECIBOS DE CAJA -->
      @if (activeTab() === 'historial') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Fecha de Pago</th>
                <th class="px-5 py-3">Cliente</th>
                <th class="px-5 py-3 font-mono">Factura Aplicada</th>
                <th class="px-5 py-3 text-right">Monto Abonado</th>
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
                  <td class="px-5 py-3 font-bold text-slate-900">{{ p.clientName }}</td>
                  <td class="px-5 py-3 font-mono font-bold text-slate-800">{{ p.invoiceNumber }}</td>
                  <td class="px-5 py-3 text-right font-black text-emerald-600">L. {{ p.amount.toFixed(2) }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {{ p.method }}
                    </span>
                  </td>
                  <td class="px-5 py-3 font-mono text-slate-600">{{ p.reference || '-' }}</td>
                  <td class="px-5 py-3 text-slate-500 text-[11px] max-w-xs truncate" [title]="p.notes">{{ p.notes || '-' }}</td>
                  <td class="px-5 py-3 text-center">
                    <button (click)="printReceipt(p)"
                            class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Imprimir Recibo de Caja">
                      🖨️
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-400">No hay recibos de caja registrados aún.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- MODAL REGISTRAR ABONO -->
      @if (selectedForPayment) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Registrar Abono a Factura</h3>
                <p class="text-xs text-slate-500">Factura N° <strong class="font-mono text-slate-800">{{ selectedForPayment.invoiceNumber }}</strong></p>
              </div>
              <button (click)="closePaymentModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <!-- Balance Info -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Cliente:</span>
                <span class="font-bold text-slate-900">{{ selectedForPayment.clientName || 'Cliente General' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Total Factura:</span>
                <span class="font-semibold text-slate-700">L. {{ selectedForPayment.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Saldo Pendiente Actual:</span>
                <span class="font-black text-rose-600 text-sm">L. {{ selectedForPayment.balance.toFixed(2) }}</span>
              </div>
            </div>

            <form (ngSubmit)="submitPayment()" class="space-y-3.5">
              <!-- Monto con botón Pagar Total -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block text-xs font-bold text-slate-700">Monto a Abonar (L.) *</label>
                  <button type="button" (click)="payFullBalance()"
                          class="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                    Pagar Saldo Completo
                  </button>
                </div>
                <input type="number" [(ngModel)]="paymentForm.amount" name="amount" min="0.01" [max]="selectedForPayment.balance" step="0.01" required
                       class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Método de Pago -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Forma de Pago *</label>
                <select [(ngModel)]="paymentForm.paymentMethod" name="paymentMethod"
                        class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500">
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="CHEQUE">📝 Cheque</option>
                  <option value="TARJETA">💳 Tarjeta de Débito / Crédito</option>
                </select>
              </div>

              <!-- Referencia -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">N° Referencia / Transferencia / Recibo</label>
                <input type="text" [(ngModel)]="paymentForm.reference" name="reference"
                       placeholder="Ej: BAC-948291 o CHQ-4820"
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>

              <!-- Notas -->
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Observaciones / Notas</label>
                <textarea [(ngModel)]="paymentForm.notes" name="notes" rows="2"
                          placeholder="Nota o motivo de cobro..."
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <!-- Proyección de Saldo -->
              <div class="p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                <span class="text-blue-700 font-medium">Nuevo Saldo Restante:</span>
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
                  {{ savingPayment() ? 'Guardando Abono...' : '💾 Guardar e Imprimir Recibo' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL HISTORIAL DE ABONOS DE FACTURA -->
      @if (selectedForHistory) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Historial de Abonos</h3>
                <p class="text-xs text-slate-500">Factura N° <strong class="font-mono text-slate-800">{{ selectedForHistory.invoiceNumber }}</strong> - {{ selectedForHistory.clientName }}</p>
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
                      <td class="px-3 py-2 text-right font-bold text-emerald-600">L. {{ p.amount.toFixed(2) }}</td>
                      <td class="px-3 py-2 text-center text-slate-600">{{ p.method }}</td>
                      <td class="px-3 py-2 font-mono text-slate-500">{{ p.reference || '-' }}</td>
                      <td class="px-3 py-2 text-center">
                        <button (click)="printSingleReceipt(selectedForHistory, p)"
                                class="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer">
                          🖨️
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-3 py-6 text-center text-slate-400">Esta factura aún no registra abonos parciales.</td>
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
export class CuentasCobrarComponent implements OnInit {
  private service = inject(ApiCuentasCobrarService);
  private printService = inject(PrintService);
  Math = Math;

  activeTab = signal<'facturas' | 'deudores' | 'historial'>('facturas');
  cxcList = signal<CuentaPorCobrar[]>([]);
  loading = signal(false);

  searchTerm = '';
  statusFilter = 'ALL';

  // Modal Payments
  selectedForPayment: CuentaPorCobrar | null = null;
  selectedForHistory: CuentaPorCobrar | null = null;
  savingPayment = signal(false);

  paymentForm: RegistrarAbonoRequest = {
    amount: 0,
    paymentMethod: 'EFECTIVO',
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
        this.cxcList.set(data);
      },
      error: () => this.loading.set(false)
    });
  }

  metrics = computed(() => {
    const list = this.cxcList();
    const totalAmount = list.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalPaid = list.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalBalance = list.reduce((sum, item) => sum + item.balance, 0);
    const recoveryPercent = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    return { totalAmount, totalPaid, totalBalance, recoveryPercent };
  });

  debtorSummaries = computed(() => {
    const map = new Map<string, DebtorSummary>();
    for (const item of this.cxcList()) {
      if (item.balance <= 0) continue;
      const cId = item.clientId || 'GEN';
      const cName = item.clientName || 'Cliente General';
      
      const existing = map.get(cId) || {
        clientId: cId,
        clientName: cName,
        pendingInvoicesCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        balance: 0
      };

      existing.pendingInvoicesCount += 1;
      existing.totalAmount += item.totalAmount;
      existing.paidAmount += item.paidAmount;
      existing.balance += item.balance;

      map.set(cId, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
  });

  allPayments = computed(() => {
    const payments: (PaymentItem & { clientName: string; invoiceNumber: string })[] = [];
    for (const item of this.cxcList()) {
      const list = this.parsePayments(item.payments);
      for (const p of list) {
        payments.push({
          ...p,
          clientName: item.clientName || 'Cliente General',
          invoiceNumber: item.invoiceNumber
        });
      }
    }
    return payments.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });

  filteredInvoices(): CuentaPorCobrar[] {
    const q = this.searchTerm.toLowerCase().trim();
    const status = this.statusFilter;

    return this.cxcList().filter(item => {
      const matchSearch = !q ||
        item.invoiceNumber?.toLowerCase().includes(q) ||
        item.clientName?.toLowerCase().includes(q);

      let matchStatus = true;
      if (status === 'VENCIDA') {
        matchStatus = this.isOverdue(item) && item.balance > 0;
      } else if (status !== 'ALL') {
        matchStatus = item.status === status;
      }

      return matchSearch && matchStatus;
    });
  }

  isOverdue(c: CuentaPorCobrar): boolean {
    if (!c.dueDate || c.balance <= 0) return false;
    const due = new Date(c.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  filterByClient(clientName: string): void {
    this.searchTerm = clientName;
    this.statusFilter = 'ALL';
    this.activeTab.set('facturas');
  }

  parsePayments(paymentsJson?: string): PaymentItem[] {
    if (!paymentsJson) return [];
    try {
      return JSON.parse(paymentsJson) as PaymentItem[];
    } catch {
      return [];
    }
  }

  openPaymentModal(c: CuentaPorCobrar): void {
    this.selectedForPayment = c;
    this.paymentForm = {
      amount: c.balance,
      paymentMethod: 'EFECTIVO',
      reference: `REC-${Date.now().toString().slice(-6)}`,
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

  openHistoryModal(c: CuentaPorCobrar): void {
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

        // Imprimir recibo oficial de abono
        this.printService.printReciboAbonoCliente({
          receiptNumber: this.paymentForm.reference,
          clientName: c.clientName || 'Cliente General',
          invoiceNumber: c.invoiceNumber,
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
        alert(err?.error?.error || 'Error al registrar el abono.');
      }
    });
  }

  printReceipt(p: PaymentItem & { clientName: string; invoiceNumber: string }): void {
    this.printService.printReciboAbonoCliente({
      receiptNumber: p.reference || `REC-${p.id.slice(0, 6)}`,
      clientName: p.clientName,
      invoiceNumber: p.invoiceNumber,
      amount: p.amount,
      previousBalance: p.amount,
      newBalance: 0,
      paymentMethod: p.method,
      reference: p.reference,
      notes: p.notes,
      date: p.date
    });
  }

  printSingleReceipt(c: CuentaPorCobrar, p: PaymentItem): void {
    this.printService.printReciboAbonoCliente({
      receiptNumber: p.reference || `REC-${p.id.slice(0, 6)}`,
      clientName: c.clientName || 'Cliente General',
      invoiceNumber: c.invoiceNumber,
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
