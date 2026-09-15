import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiComprasService, Compra, CompraDetalle } from '../services/api-compras.service';
import { ApiProveedoresService, Proveedor } from '../services/api-proveedores.service';
import { ApiProductosService, Producto } from '../services/api-productos.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Compras & Recepción a Proveedores</h2>
          <p class="text-xs text-slate-500 mt-0.5">Ingreso de facturas de proveedores con actualización directa de Kardex e Inventario.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Registrar Compra</span>
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-5 py-3.5">N° Factura Proveedor</th>
              <th class="px-4 py-3.5">Fecha</th>
              <th class="px-5 py-3.5">Proveedor / RTN</th>
              <th class="px-4 py-3.5">Condición</th>
              <th class="px-4 py-3.5 text-right">Total Compra</th>
              <th class="px-4 py-3.5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (c of compras(); track c.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-5 py-3.5 font-bold text-blue-600">{{ c.purchaseNumber }}</td>
                <td class="px-4 py-3.5 text-slate-500">{{ c.date }}</td>
                <td class="px-5 py-3.5 text-slate-900 font-bold">
                  {{ c.providerName || 'Proveedor General' }}
                  @if (c.providerRtn) {
                    <span class="block text-[10px] text-slate-400 font-normal">RTN: {{ c.providerRtn }}</span>
                  }
                </td>
                <td class="px-4 py-3.5 text-slate-600">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [ngClass]="c.paymentType === 'CONTADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                    {{ c.paymentType }}
                  </span>
                </td>
                <td class="px-4 py-3.5 text-right font-black text-slate-900">L. {{ c.totalGeneral.toFixed(2) }}</td>
                <td class="px-4 py-3.5 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {{ c.status }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">No hay compras registradas en el sistema.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Registrar Compra -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Compra a Proveedor</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-4 overflow-y-auto flex-1 pr-1">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proveedor</label>
                  <select [(ngModel)]="providerId"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500">
                    <option value="">-- Seleccionar Proveedor --</option>
                    @for (prov of proveedores(); track prov.id) {
                      <option [value]="prov.id">{{ prov.name }} ({{ prov.rtn || 'S/N' }})</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">N° Factura Proveedor</label>
                  <input type="text" [(ngModel)]="purchaseNumber" placeholder="001-001-01-00012345"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Condición de Pago</label>
                  <select [(ngModel)]="paymentType"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500">
                    <option value="CONTADO">Contado</option>
                    <option value="CREDITO">Crédito (Registra en Cuentas por Pagar)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Observaciones</label>
                  <input type="text" [(ngModel)]="comments" placeholder="Guía de remisión, lote..."
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <!-- Selector de Items -->
              <div class="border-t border-slate-100 pt-3">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Líneas de Compra (Actualiza Stock)</h4>
                  <button (click)="addItem()" class="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">+ Agregar Ítem</button>
                </div>

                <div class="space-y-2">
                  @for (item of items; track $index; let idx = $index) {
                    <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <select [(ngModel)]="item.productId" (change)="onProductSelect(item)"
                              class="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900">
                        <option value="">Seleccionar Producto...</option>
                        @for (p of productos(); track p.id) {
                          <option [value]="p.id">{{ p.name }} (Stock actual: {{ p.stock }})</option>
                        }
                      </select>
                      <input type="number" [(ngModel)]="item.quantity" min="1" placeholder="Cantidad"
                             class="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center" />
                      <input type="number" [(ngModel)]="item.costUnit" min="0" placeholder="Costo Unit."
                             class="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" />
                      <span class="w-24 text-right font-bold text-slate-700">L. {{ (item.quantity * item.costUnit).toFixed(2) }}</span>
                      <button (click)="removeItem(idx)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 cursor-pointer">✕</button>
                    </div>
                  }
                </div>
              </div>

              <!-- Total Preview -->
              <div class="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total de Compra:</span>
                <span class="text-blue-600 font-black text-sm">L. {{ calculateTotal().toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="savePurchase()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer">Registrar y Actualizar Stock</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ComprasComponent implements OnInit {
  private api = inject(ApiComprasService);
  private apiProveedores = inject(ApiProveedoresService);
  private apiProductos = inject(ApiProductosService);

  compras = signal<Compra[]>([]);
  proveedores = signal<Proveedor[]>([]);
  productos = signal<Producto[]>([]);

  showModal = signal(false);

  providerId = '';
  purchaseNumber = '';
  paymentType = 'CONTADO';
  comments = '';

  items: CompraDetalle[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getPurchases().subscribe((res: Compra[]) => this.compras.set(res));
    this.apiProveedores.getProveedores().subscribe((res: Proveedor[]) => this.proveedores.set(res));
    this.apiProductos.getProductos().subscribe((res: Producto[]) => this.productos.set(res));
  }

  openModal(): void {
    this.providerId = '';
    this.purchaseNumber = '';
    this.paymentType = 'CONTADO';
    this.comments = '';
    this.items = [{ productId: '', quantity: 1, costUnit: 0, total: 0 }];
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  addItem(): void {
    this.items.push({ productId: '', quantity: 1, costUnit: 0, total: 0 });
  }

  removeItem(idx: number): void {
    if (this.items.length > 1) {
      this.items.splice(idx, 1);
    }
  }

  onProductSelect(item: CompraDetalle): void {
    const p = this.productos().find(prod => prod.id === item.productId);
    if (p) {
      item.costUnit = p.purchasePrice;
      item.productName = p.name;
    }
  }

  calculateTotal(): number {
    return this.items.reduce((acc, it) => acc + (it.quantity * it.costUnit), 0);
  }

  savePurchase(): void {
    if (!this.providerId) {
      alert('Debe seleccionar un proveedor.');
      return;
    }
    if (!this.purchaseNumber.trim()) {
      alert('Debe ingresar el número de factura de compra.');
      return;
    }

    const validItems = this.items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Debe agregar al menos un producto a comprar.');
      return;
    }

    const payload = {
      purchaseNumber: this.purchaseNumber.trim(),
      providerId: this.providerId,
      paymentType: this.paymentType,
      comments: this.comments,
      details: validItems
    };

    this.api.createPurchase(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: err => alert('Error al registrar compra: ' + (err.error?.error || err.message))
    });
  }
}
