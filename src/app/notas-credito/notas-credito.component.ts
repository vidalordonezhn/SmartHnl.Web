import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiNotasCreditoService, NotaCredito, CaiNotaCredito } from '../services/api-notas-credito.service';
import { ApiFacturacionService, Factura } from '../services/api-facturacion.service';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-notas-credito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Notas de Crédito SAR</h2>
          <p class="text-xs text-slate-500 mt-0.5">Emisión y control de notas de crédito fiscales para anulación y devolución de facturas.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openCaiModal()"
                  class="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
            <span>⚙️ Rango CAI</span>
          </button>
          <button (click)="openModal()"
                  class="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition cursor-pointer">
            <span>+ Emitir Nota de Crédito</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-5 py-3.5">N° Nota Crédito</th>
              <th class="px-4 py-3.5">Fecha</th>
              <th class="px-4 py-3.5">Factura Afectada</th>
              <th class="px-5 py-3.5">Cliente</th>
              <th class="px-4 py-3.5">Motivo</th>
              <th class="px-4 py-3.5 text-right">Total Acreditado</th>
              <th class="px-4 py-3.5 text-center">Estado</th>
              <th class="px-5 py-3.5 text-center">Imprimir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (nc of creditNotes(); track nc.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-5 py-3.5 font-bold text-rose-600">{{ nc.creditNoteNumber }}</td>
                <td class="px-4 py-3.5 text-slate-500">{{ nc.date }}</td>
                <td class="px-4 py-3.5 font-semibold text-blue-600">{{ nc.invoiceNumber }}</td>
                <td class="px-5 py-3.5 text-slate-900 font-bold">{{ nc.clientName || 'Consumidor Final' }}</td>
                <td class="px-4 py-3.5 text-slate-600">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {{ nc.noteType }}
                  </span>
                </td>
                <td class="px-4 py-3.5 text-right font-black text-rose-600">L. {{ nc.totalGeneral.toFixed(2) }}</td>
                <td class="px-4 py-3.5 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ nc.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <button (click)="printNC(nc)" title="Imprimir Nota de Crédito SAR"
                          class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer">
                    📄 Imprimir SAR
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="px-6 py-12 text-center text-slate-400">No hay notas de crédito emitidas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Emitir Nota de Crédito -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Emitir Nota de Crédito Fiscal</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Seleccionar Factura SAR a Anular / Modificar</label>
                <select [(ngModel)]="selectedInvoiceId" (change)="onInvoiceSelect()"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-rose-500">
                  <option value="">-- Seleccione una Factura Activa --</option>
                  @for (inv of facturas(); track inv.id) {
                    @if (inv.status !== 'ANULADA') {
                      <option [value]="inv.id">
                        {{ inv.invoiceNumber }} - {{ inv.clientName || 'Consumidor Final' }} (L. {{ inv.totalGeneral.toFixed(2) }})
                      </option>
                    }
                  }
                </select>
              </div>

              @if (selectedInvoice) {
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div class="flex justify-between text-slate-600">
                    <span>Cliente:</span>
                    <span class="font-bold text-slate-900">{{ selectedInvoice.clientName || 'Consumidor Final' }}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>L. {{ (selectedInvoice.subtotalGravado + selectedInvoice.subtotalExento).toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>ISV 15%:</span>
                    <span>L. {{ selectedInvoice.isvTotal.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between text-rose-600 font-black border-t border-slate-200 pt-1">
                    <span>Monto Total a Acreditar:</span>
                    <span>L. {{ selectedInvoice.totalGeneral.toFixed(2) }}</span>
                  </div>
                </div>
              }

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo de Nota</label>
                  <select [(ngModel)]="noteType"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-rose-500">
                    <option value="ANULACION">Anulación Total de Factura</option>
                    <option value="DEVOLUCION">Devolución / Descuento</option>
                    <option value="CORRECCION">Corrección Fiscal</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Emisión</label>
                  <input type="date" [(ngModel)]="date"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-rose-500" />
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Motivo / Justificación Legal SAR</label>
                <textarea [(ngModel)]="comments" rows="2" placeholder="Motivo de la emisión de la nota de crédito..."
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-rose-500"></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="saveNC()" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 cursor-pointer">Emitir Nota de Crédito</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal CAI Notas Crédito -->
      @if (showCaiModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Régimen CAI para Notas de Crédito</h3>
              <button (click)="closeCaiModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              @for (c of cais(); track c.id) {
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div class="flex justify-between items-center">
                    <span class="font-mono font-bold text-slate-900">{{ c.cai }}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ACTIVO</span>
                  </div>
                  <div class="text-slate-500">Rango: {{ c.rangoInicial }} al {{ c.rangoFinal }}</div>
                  <div class="text-slate-500">Correlativo Actual: <span class="font-bold text-blue-600">{{ c.correlativoActual }}</span></div>
                  <div class="text-slate-500">Fecha Límite: {{ c.fechaLimite }}</div>
                </div>
              } @empty {
                <p class="text-slate-400 text-center py-4">No hay rango CAI registrado.</p>
              }
            </div>

            <div class="flex justify-end border-t border-slate-100 pt-3">
              <button (click)="closeCaiModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class NotasCreditoComponent implements OnInit {
  private api = inject(ApiNotasCreditoService);
  private apiFacturacion = inject(ApiFacturacionService);
  private printService = inject(PrintService);

  creditNotes = signal<NotaCredito[]>([]);
  facturas = signal<Factura[]>([]);
  cais = signal<CaiNotaCredito[]>([]);

  showModal = signal(false);
  showCaiModal = signal(false);

  selectedInvoiceId = '';
  selectedInvoice: Factura | null = null;
  noteType = 'ANULACION';
  date = new Date().toISOString().split('T')[0];
  comments = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getCreditNotes().subscribe(res => this.creditNotes.set(res));
    this.apiFacturacion.getInvoices('ALL').subscribe(res => this.facturas.set(res));
    this.api.getCais().subscribe(res => this.cais.set(res));
  }

  openModal(): void {
    this.selectedInvoiceId = '';
    this.selectedInvoice = null;
    this.noteType = 'ANULACION';
    this.date = new Date().toISOString().split('T')[0];
    this.comments = '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  openCaiModal(): void {
    this.showCaiModal.set(true);
  }

  closeCaiModal(): void {
    this.showCaiModal.set(false);
  }

  onInvoiceSelect(): void {
    this.selectedInvoice = this.facturas().find(f => f.id === this.selectedInvoiceId) || null;
  }

  saveNC(): void {
    if (!this.selectedInvoice) {
      alert('Debe seleccionar una factura válida.');
      return;
    }

    const payload: Partial<NotaCredito> = {
      invoiceId: this.selectedInvoice.id,
      invoiceNumber: this.selectedInvoice.invoiceNumber,
      clientId: this.selectedInvoice.clientId,
      clientName: this.selectedInvoice.clientName,
      date: this.date,
      noteType: this.noteType,
      comments: this.comments,
      subtotalGravado: this.selectedInvoice.subtotalGravado,
      subtotalExento: this.selectedInvoice.subtotalExento,
      subtotalExonerado: this.selectedInvoice.subtotalExonerado,
      isvTotal: this.selectedInvoice.isvTotal,
      totalGeneral: this.selectedInvoice.totalGeneral
    };

    this.api.createCreditNote(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: err => alert('Error al emitir Nota de Crédito: ' + (err.error?.error || err.message))
    });
  }

  printNC(nc: NotaCredito): void {
    this.printService.printNotaCredito(nc);
  }
}
