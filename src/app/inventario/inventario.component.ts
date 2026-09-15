import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiProductosService, Producto } from '../services/api-productos.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Inventario de Productos & Servicios</h2>
          <p class="text-xs text-slate-500 mt-0.5">Control de existencias, precios de venta, costos y margen comercial.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Nuevo Producto</span>
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-6 py-3.5">Código</th>
              <th class="px-6 py-3.5">Nombre / Descripción</th>
              <th class="px-6 py-3.5">Categoría</th>
              <th class="px-6 py-3.5 text-right">Costo (L.)</th>
              <th class="px-6 py-3.5 text-right">Precio Venta (L.)</th>
              <th class="px-6 py-3.5 text-center">Impuesto</th>
              <th class="px-6 py-3.5 text-right">Stock</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (p of productos(); track p.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-3.5 font-mono text-slate-500">{{ p.productCode || p.barcode || 'S/C' }}</td>
                <td class="px-6 py-3.5 font-bold text-slate-900">{{ p.name }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ p.categoryName || 'General' }}</td>
                <td class="px-6 py-3.5 text-right text-slate-600">L. {{ p.purchasePrice.toFixed(2) }}</td>
                <td class="px-6 py-3.5 text-right font-black text-emerald-600">L. {{ p.sellPrice.toFixed(2) }}</td>
                <td class="px-6 py-3.5 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [ngClass]="p.taxType === 'GRAVADO' ? 'bg-blue-50 text-blue-700' : p.taxType === 'GRAVADO_18' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'">
                    {{ p.taxType }}
                  </span>
                </td>
                <td class="px-6 py-3.5 text-right font-black" [ngClass]="p.stock <= p.stockMin ? 'text-rose-600' : 'text-slate-800'">
                  {{ p.stock }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-slate-400">No hay productos registrados en el inventario.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Nuevo Producto -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Nuevo Producto</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form (ngSubmit)="saveProducto()" class="space-y-3.5">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Código de Producto</label>
                  <input type="text" [(ngModel)]="newProd.productCode" name="productCode"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="PROD-001" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Tipo de Impuesto SAR</label>
                  <select [(ngModel)]="newProd.taxType" name="taxType"
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500">
                    <option value="GRAVADO">Gravado 15% (ISV)</option>
                    <option value="GRAVADO_18">Gravado 18% (Licores/Boletos)</option>
                    <option value="EXENTO">Exento 0%</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre del Producto / Servicio *</label>
                <input type="text" [(ngModel)]="newProd.name" name="name" required
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                       placeholder="Ej: Memoria RAM DDR4 16GB" />
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Costo de Compra (L.)</label>
                  <input type="number" [(ngModel)]="newProd.purchasePrice" name="purchasePrice" min="0" step="0.01" required
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Precio Venta (L.) *</label>
                  <input type="number" [(ngModel)]="newProd.sellPrice" name="sellPrice" min="0" step="0.01" required
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Stock Inicial</label>
                  <input type="number" [(ngModel)]="newProd.stock" name="stock" min="0" step="1" required
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" (click)="closeModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving()"
                        class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50">
                  {{ saving() ? 'Guardando...' : 'Guardar Producto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class InventarioComponent implements OnInit {
  private service = inject(ApiProductosService);
  productos = signal<Producto[]>([]);
  showModal = signal(false);
  saving = signal(false);

  newProd: Partial<Producto> = {
    productCode: '',
    name: '',
    purchasePrice: 0,
    sellPrice: 0,
    taxType: 'GRAVADO',
    stock: 10,
    stockMin: 5,
    isService: 0
  };

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.service.getProductos().subscribe(data => this.productos.set(data));
  }

  openModal(): void {
    this.newProd = { productCode: '', name: '', purchasePrice: 0, sellPrice: 0, taxType: 'GRAVADO', stock: 10, stockMin: 5, isService: 0 };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveProducto(): void {
    if (!this.newProd.name || !this.newProd.sellPrice) {
      alert('Nombre y Precio de venta son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.service.createProducto(this.newProd).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadProductos();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.error || 'Error al guardar producto');
      }
    });
  }
}
