import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiComprasService, Compra, CompraDetalle } from '../services/api-compras.service';
import { ApiProveedoresService, Proveedor } from '../services/api-proveedores.service';
import { ApiProductosService, Producto } from '../services/api-productos.service';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🛒</span> Compras a Proveedores & Inventario
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Ingreso de compras, actualización automática de costos/stock y cuentas por pagar.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Registrar Compra</span>
        </button>
      </div>

      <!-- Table Compras -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-6 py-3.5">N° Factura Compra</th>
              <th class="px-6 py-3.5">Fecha</th>
              <th class="px-6 py-3.5">Proveedor</th>
              <th class="px-6 py-3.5 text-center">Condición</th>
              <th class="px-6 py-3.5 text-right">Total (L.)</th>
              <th class="px-6 py-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (c of compras(); track c.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-3.5 font-mono font-bold text-slate-900">{{ c.purchaseNumber }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ c.date }}</td>
                <td class="px-6 py-3.5 font-bold text-slate-800">{{ c.providerName || 'Proveedor General' }}</td>
                <td class="px-6 py-3.5 text-center">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                        [ngClass]="c.paymentType === 'CREDITO' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">
                    {{ c.paymentType }}
                  </span>
                </td>
                <td class="px-6 py-3.5 text-right font-black text-slate-900 text-sm">
                  L. {{ (c.totalGeneral || 0).toFixed(2) }}
                </td>
                <td class="px-6 py-3.5 text-center">
                  <button (click)="printCompra(c)"
                          class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Imprimir Detalle de Compra">
                    🖨️
                  </button>
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

      <!-- Modal Registrar Compra Amplio y Espacioso -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 flex flex-col max-h-[92vh]">
            <!-- Header Modal -->
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Registrar Compra a Proveedor</h3>
                <p class="text-xs text-slate-500">Ingresa la factura del proveedor para actualizar stock y generar cuenta por pagar si aplica.</p>
              </div>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer">✕</button>
            </div>

            <!-- Body Scrollable -->
            <div class="space-y-4 overflow-y-auto flex-1 pr-1">
              <!-- Grid Datos de Factura -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">Proveedor *</label>
                  <select [(ngModel)]="providerId"
                          class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-blue-500 font-medium shadow-2xs">
                    <option value="">-- Seleccionar Proveedor --</option>
                    @for (prov of proveedores(); track prov.id) {
                      <option [value]="prov.id">{{ prov.name }} {{ prov.rtn ? '(RTN: ' + prov.rtn + ')' : '' }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">N° Factura Proveedor *</label>
                  <input type="text" [(ngModel)]="purchaseNumber" placeholder="Ej: 001-001-01-00012345"
                         class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-blue-500 shadow-2xs" />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">Condición de Pago *</label>
                  <select [(ngModel)]="paymentType"
                          class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-blue-500 font-bold shadow-2xs">
                    <option value="CONTADO">💵 Contado (Efectivo / Transferencia Inmediata)</option>
                    <option value="CREDITO">💳 Crédito (Registra en Cuentas por Pagar CXP)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1.5">Observaciones / Nota</label>
                  <input type="text" [(ngModel)]="comments" placeholder="Guía de remisión, lote, bodega..."
                         class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-blue-500 shadow-2xs" />
                </div>
              </div>

              <!-- Tabla de Items de Compra -->
              <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div class="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Líneas de Compra</h4>
                    <p class="text-[11px] text-slate-500">Actualiza automáticamente existencias en bodega y costo de compra</p>
                  </div>
                  <button type="button" (click)="addItem()"
                          class="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition cursor-pointer">
                    <span>+ Agregar Ítem</span>
                  </button>
                </div>

                <div class="p-3 space-y-2">
                  <div class="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                    <div class="col-span-5">Producto / Servicio</div>
                    <div class="col-span-2 text-center">Stock Actual</div>
                    <div class="col-span-2 text-center">Cantidad</div>
                    <div class="col-span-2 text-right">Costo Unit. (L.)</div>
                    <div class="col-span-1 text-center">Quitar</div>
                  </div>

                  @for (item of items; track $index; let idx = $index) {
                    <div class="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2 rounded-xl border border-slate-100 text-xs">
                      <!-- Selector Producto -->
                      <div class="col-span-5">
                        <select [(ngModel)]="item.productId" (change)="onProductSelect(item)"
                                class="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900 font-medium">
                          <option value="">Seleccionar Producto...</option>
                          @for (p of productos(); track p.id) {
                            <option [value]="p.id">{{ p.name }}</option>
                          }
                        </select>
                      </div>

                      <!-- Stock Actual -->
                      <div class="col-span-2 text-center text-slate-500 font-bold">
                        {{ getProductStock(item.productId) }} unid.
                      </div>

                      <!-- Cantidad -->
                      <div class="col-span-2">
                        <input type="number" [(ngModel)]="item.quantity" min="1" step="1"
                               class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-900" />
                      </div>

                      <!-- Costo Unitario -->
                      <div class="col-span-2">
                        <input type="number" [(ngModel)]="item.costUnit" min="0" step="0.01"
                               class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right font-mono font-bold text-slate-900" />
                      </div>

                      <!-- Eliminar -->
                      <div class="col-span-1 text-center">
                        <button type="button" (click)="removeItem(idx)"
                                class="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition font-bold cursor-pointer"
                                title="Eliminar línea">
                          ✕
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <!-- Total Footer -->
                <div class="bg-blue-50/70 p-4 border-t border-blue-100 flex justify-between items-center text-xs">
                  <div>
                    <span class="text-slate-500 block font-medium">Total de Artículos: <strong>{{ items.length }}</strong></span>
                    <span class="text-[11px] text-blue-700 font-semibold" *ngIf="paymentType === 'CREDITO'">
                      ⚠️ Esta compra se registrará como pasivo pendiente en Cuentas por Pagar.
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-500 block text-[11px] uppercase font-bold">Total a Facturar</span>
                    <span class="text-blue-600 font-black text-lg">L. {{ calculateTotal().toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Buttons -->
            <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-3 shrink-0">
              <button type="button" (click)="closeModal()"
                      class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
                Cancelar
              </button>
              <button type="button" (click)="savePurchase()" [disabled]="saving()"
                      class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50">
                {{ saving() ? 'Guardando...' : '💾 Registrar y Actualizar Stock' }}
              </button>
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
  private printService = inject(PrintService);

  compras = signal<Compra[]>([]);
  proveedores = signal<Proveedor[]>([]);
  productos = signal<Producto[]>([]);

  showModal = signal(false);
  saving = signal(false);

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

  getProductStock(productId: string): number {
    const p = this.productos().find(prod => prod.id === productId);
    return p ? p.stock : 0;
  }

  calculateTotal(): number {
    return this.items.reduce((acc, it) => acc + ((it.quantity || 0) * (it.costUnit || 0)), 0);
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

    this.saving.set(true);
    const payload = {
      purchaseNumber: this.purchaseNumber.trim(),
      providerId: this.providerId,
      paymentType: this.paymentType,
      comments: this.comments,
      details: validItems
    };

    this.api.createPurchase(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadData();
      },
      error: err => {
        this.saving.set(false);
        alert('Error al registrar compra: ' + (err.error?.error || err.message));
      }
    });
  }

  printCompra(c: Compra): void {
    this.printService.printCompra(c);
  }
}
