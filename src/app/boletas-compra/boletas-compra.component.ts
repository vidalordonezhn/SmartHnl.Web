import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiBoletasCompraService, BoletaCompra, BoletaCompraDetalle, CaiBoletaCompra } from '../services/api-boletas-compra.service';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-boletas-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Boletas de Compra SAR</h2>
          <p class="text-xs text-slate-500 mt-0.5">Comprobantes fiscales de compras realizadas a personas no obligadas a emitir factura.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openCaiModal()"
                  class="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
            <span>⚙️ Rango CAI</span>
          </button>
          <button (click)="openModal()"
                  class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer">
            <span>+ Emitir Boleta de Compra</span>
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-5 py-3.5">N° Boleta</th>
              <th class="px-4 py-3.5">Fecha</th>
              <th class="px-5 py-3.5">Vendedor / Proveedor</th>
              <th class="px-4 py-3.5">Identidad / RTN</th>
              <th class="px-4 py-3.5 text-right">Total General</th>
              <th class="px-4 py-3.5 text-center">Estado</th>
              <th class="px-5 py-3.5 text-center">Imprimir</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (b of boletas(); track b.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-5 py-3.5 font-bold text-emerald-600">{{ b.boletaNumber }}</td>
                <td class="px-4 py-3.5 text-slate-500">{{ b.date }}</td>
                <td class="px-5 py-3.5 text-slate-900 font-bold">{{ b.providerName }}</td>
                <td class="px-4 py-3.5 text-slate-600">{{ b.providerRtn }}</td>
                <td class="px-4 py-3.5 text-right font-black text-slate-900">L. {{ b.totalGeneral.toFixed(2) }}</td>
                <td class="px-4 py-3.5 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ b.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <button (click)="printBoleta(b)" title="Imprimir Boleta SAR"
                          class="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer">
                    📄 Imprimir SAR
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-slate-400">No hay boletas de compra emitidas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Emitir Boleta de Compra -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Emitir Boleta de Compra Fiscal SAR</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-4 overflow-y-auto flex-1 pr-1">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre del Vendedor / Suplidor</label>
                  <input type="text" [(ngModel)]="providerName" placeholder="Juan Pérez..."
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-emerald-500" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">DNI / RTN del Vendedor</label>
                  <input type="text" [(ngModel)]="providerRtn" placeholder="0801199012345"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-emerald-500" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dirección del Vendedor</label>
                  <input type="text" [(ngModel)]="providerAddress" placeholder="Col. Kennedy, Tegucigalpa"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-emerald-500" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
                  <input type="text" [(ngModel)]="providerPhone" placeholder="+504 9988-7766"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-emerald-500" />
                </div>
              </div>

              <!-- Selector de Items -->
              <div class="border-t border-slate-100 pt-3">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Conceptos / Bienes Adquiridos</h4>
                  <button (click)="addItem()" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">+ Agregar Bien</button>
                </div>

                <div class="space-y-2">
                  @for (item of items; track $index; let idx = $index) {
                    <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <input type="text" [(ngModel)]="item.description" placeholder="Descripción del bien o servicio..."
                             class="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900" />
                      <input type="number" [(ngModel)]="item.quantity" min="1" placeholder="Cant"
                             class="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center" />
                      <input type="number" [(ngModel)]="item.priceUnit" min="0" placeholder="Precio Unit"
                             class="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" />
                      <span class="w-24 text-right font-bold text-slate-700">L. {{ (item.quantity * item.priceUnit).toFixed(2) }}</span>
                      <button (click)="removeItem(idx)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 cursor-pointer">✕</button>
                    </div>
                  }
                </div>
              </div>

              <!-- Observaciones -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observaciones</label>
                <input type="text" [(ngModel)]="comments" placeholder="Notas de compra..."
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-emerald-500" />
              </div>

              <!-- Total Preview -->
              <div class="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total de Boleta de Compra:</span>
                <span class="text-emerald-700 font-black text-sm">L. {{ calculateTotal().toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="saveBoleta()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer">Emitir Boleta SAR</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal CAI Boletas Compra -->
      @if (showCaiModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Régimen CAI Boletas de Compra SAR</h3>
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
export class BoletasCompraComponent implements OnInit {
  private api = inject(ApiBoletasCompraService);
  private printService = inject(PrintService);

  boletas = signal<BoletaCompra[]>([]);
  cais = signal<CaiBoletaCompra[]>([]);

  showModal = signal(false);
  showCaiModal = signal(false);

  providerName = '';
  providerRtn = '';
  providerAddress = '';
  providerPhone = '';
  comments = '';

  items: BoletaCompraDetalle[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getBoletasCompra().subscribe(res => this.boletas.set(res));
    this.api.getCais().subscribe(res => this.cais.set(res));
  }

  openModal(): void {
    this.providerName = '';
    this.providerRtn = '';
    this.providerAddress = '';
    this.providerPhone = '';
    this.comments = '';
    this.items = [{ description: '', quantity: 1, priceUnit: 0, totalItem: 0 }];
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

  addItem(): void {
    this.items.push({ description: '', quantity: 1, priceUnit: 0, totalItem: 0 });
  }

  removeItem(idx: number): void {
    if (this.items.length > 1) {
      this.items.splice(idx, 1);
    }
  }

  calculateTotal(): number {
    return this.items.reduce((acc, it) => acc + (it.quantity * it.priceUnit), 0);
  }

  saveBoleta(): void {
    if (!this.providerName.trim()) {
      alert('Debe ingresar el nombre del vendedor/suplidor.');
      return;
    }
    if (!this.providerRtn.trim()) {
      alert('Debe ingresar el DNI o RTN del vendedor.');
      return;
    }

    const validItems = this.items.filter(i => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Debe agregar al menos un ítem o concepto.');
      return;
    }

    const payload: Partial<BoletaCompra> = {
      providerId: 'PROV_EVENTUAL',
      providerName: this.providerName.trim(),
      providerRtn: this.providerRtn.trim(),
      providerAddress: this.providerAddress.trim(),
      providerPhone: this.providerPhone.trim(),
      paymentType: 'CONTADO',
      comments: this.comments,
      details: validItems
    };

    this.api.createBoletaCompra(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: err => alert('Error al emitir Boleta de Compra: ' + (err.error?.error || err.message))
    });
  }

  printBoleta(b: BoletaCompra): void {
    this.printService.printBoletaCompra(b);
  }
}
