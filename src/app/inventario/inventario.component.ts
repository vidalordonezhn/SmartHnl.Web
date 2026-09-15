import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiProductosService, Producto } from '../services/api-productos.service';
import { ApiInventarioService, KardexEntry, InventoryAdjustment } from '../services/api-inventario.service';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header & Navigation Tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📦</span> Inventario, Ajustes & Kardex Físico
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Control integral de existencias, auditoría de mermas, ajustes manuales y kardex valorizado.</p>
        </div>
        
        <div class="flex items-center gap-2">
          @if (activeTab() === 'catalogo') {
            <button (click)="openProductModal()"
                    class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer">
              <span>+ Nuevo Producto</span>
            </button>
          } @else if (activeTab() === 'kardex') {
            <button (click)="recalculateKardex()" [disabled]="recalculating()"
                    class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50">
              <span>🔄</span> {{ recalculating() ? 'Recalculando...' : 'Recalcular Kardex' }}
            </button>
          }
        </div>
      </div>

      <!-- Segmented Tab Bar -->
      <div class="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button (click)="activeTab.set('catalogo')"
                [class.text-blue-600]="activeTab() === 'catalogo'"
                [class.border-blue-600]="activeTab() === 'catalogo'"
                [class.text-slate-500]="activeTab() !== 'catalogo'"
                [class.border-transparent]="activeTab() !== 'catalogo'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>📦 Catálogo & Existencias</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ productos().length }}</span>
        </button>

        <button (click)="activeTab.set('ajuste')"
                [class.text-blue-600]="activeTab() === 'ajuste'"
                [class.border-blue-600]="activeTab() === 'ajuste'"
                [class.text-slate-500]="activeTab() !== 'ajuste'"
                [class.border-transparent]="activeTab() !== 'ajuste'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>⚖️ Registrar Ajuste / Merma</span>
        </button>

        <button (click)="activeTab.set('kardex')"
                [class.text-blue-600]="activeTab() === 'kardex'"
                [class.border-blue-600]="activeTab() === 'kardex'"
                [class.text-slate-500]="activeTab() !== 'kardex'"
                [class.border-transparent]="activeTab() !== 'kardex'"
                class="pb-3 border-b-2 transition flex items-center gap-2 cursor-pointer">
          <span>📜 Movimientos de Kardex</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">{{ kardexList().length }}</span>
        </button>
      </div>

      <!-- TAB 1: CATÁLOGO DE PRODUCTOS -->
      @if (activeTab() === 'catalogo') {
        <div class="space-y-4">
          <!-- Search & Filter Bar -->
          <div class="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 max-w-md">
              <input type="text" [(ngModel)]="searchProd"
                     placeholder="Buscar por nombre, código o código de barras..."
                     class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500" />
              <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>
            <div class="text-xs text-slate-500 font-medium">
              Mostrando <strong class="text-slate-800">{{ filteredProductos().length }}</strong> productos
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Código</th>
                  <th class="px-5 py-3">Nombre / Descripción</th>
                  <th class="px-5 py-3 text-right">Costo (L.)</th>
                  <th class="px-5 py-3 text-right">Precio Venta (L.)</th>
                  <th class="px-5 py-3 text-center">Impuesto</th>
                  <th class="px-5 py-3 text-right">Stock Actual</th>
                  <th class="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (p of filteredProductos(); track p.id) {
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="px-5 py-3.5 font-mono text-slate-500">{{ p.productCode || p.barcode || 'S/C' }}</td>
                    <td class="px-5 py-3.5">
                      <div class="font-bold text-slate-900">{{ p.name }}</div>
                      @if (p.categoryName) {
                        <div class="text-[10px] text-slate-400">{{ p.categoryName }}</div>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-right text-slate-600">L. {{ p.purchasePrice.toFixed(2) }}</td>
                    <td class="px-5 py-3.5 text-right font-black text-emerald-600">L. {{ p.sellPrice.toFixed(2) }}</td>
                    <td class="px-5 py-3.5 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                            [ngClass]="p.taxType === 'GRAVADO' ? 'bg-blue-50 text-blue-700' : p.taxType === 'GRAVADO_18' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'">
                        {{ p.taxType }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-right font-black">
                      <span [ngClass]="p.stock <= p.stockMin ? 'px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-black' : 'text-slate-800'">
                        {{ p.stock }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-center">
                      <button (click)="openQuickAdjustment(p)"
                              class="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer">
                        ⚖️ Ajustar
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-slate-400">No se encontraron productos registrados.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: REGISTRAR AJUSTE MANUAL -->
      @if (activeTab() === 'ajuste') {
        <div class="max-w-3xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-base font-bold text-slate-900">Registrar Ajuste Manual de Inventario</h3>
            <p class="text-xs text-slate-500 mt-0.5">Permite asentar ingresos o mermas/salidas por auditoría física, roturas o conteos periódicos.</p>
          </div>

          @if (adjSuccess()) {
            <div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>✅ {{ adjSuccess() }}</span>
              <button (click)="adjSuccess.set(null)" class="text-emerald-600 hover:text-emerald-900 text-sm font-bold">✕</button>
            </div>
          }

          @if (adjError()) {
            <div class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>⚠️ {{ adjError() }}</span>
              <button (click)="adjError.set(null)" class="text-rose-600 hover:text-rose-900 text-sm font-bold">✕</button>
            </div>
          }

          <form (ngSubmit)="submitAdjustment()" class="space-y-4">
            <!-- Tipo de Movimiento -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">Tipo de Ajuste Físico</label>
              <div class="grid grid-cols-2 gap-3">
                <button type="button" (click)="adjForm.type = 'ENTRADA'"
                        [class.bg-emerald-600]="adjForm.type === 'ENTRADA'"
                        [class.text-white]="adjForm.type === 'ENTRADA'"
                        [class.border-emerald-600]="adjForm.type === 'ENTRADA'"
                        [class.bg-slate-50]="adjForm.type !== 'ENTRADA'"
                        [class.text-slate-700]="adjForm.type !== 'ENTRADA'"
                        class="p-3 border rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <span>📥 Entrada / Hallazgo / Devolución</span>
                </button>

                <button type="button" (click)="adjForm.type = 'SALIDA'"
                        [class.bg-rose-600]="adjForm.type === 'SALIDA'"
                        [class.text-white]="adjForm.type === 'SALIDA'"
                        [class.border-rose-600]="adjForm.type === 'SALIDA'"
                        [class.bg-slate-50]="adjForm.type !== 'SALIDA'"
                        [class.text-slate-700]="adjForm.type !== 'SALIDA'"
                        class="p-3 border rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                  <span>📤 Salida / Merma / Daño / Faltante</span>
                </button>
              </div>
            </div>

            <!-- Seleccionar Producto -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Producto a Ajustar *</label>
              <select [(ngModel)]="adjForm.productId" name="productId" (change)="onProductSelect()" required
                      class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500">
                <option value="">-- Seleccione un producto del catálogo --</option>
                @for (p of productos(); track p.id) {
                  <option [value]="p.id">
                    {{ p.name }} (Stock Actual: {{ p.stock }} | Costo: L. {{ p.purchasePrice.toFixed(2) }})
                  </option>
                }
              </select>
            </div>

            <!-- Info Preview Card -->
            @if (selectedProductForAdj) {
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-bold">Stock Actual en Bodega</span>
                  <span class="font-black text-slate-800 text-sm">{{ selectedProductForAdj.stock }} unidades</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-bold">Costo Unitario Registrado</span>
                  <span class="font-black text-slate-800 text-sm">L. {{ selectedProductForAdj.purchasePrice.toFixed(2) }}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px] uppercase font-bold">Stock Proyectado</span>
                  <span class="font-black text-sm" [ngClass]="projectedStock < 0 ? 'text-rose-600' : 'text-blue-600'">
                    {{ projectedStock }} unidades
                  </span>
                </div>
              </div>
            }

            <!-- Cantidad y Referencia Oficial -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Cantidad de Unidades *</label>
                <input type="number" [(ngModel)]="adjForm.quantity" name="quantity" min="1" step="1" required
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">N° Referencia Oficial / Acta *</label>
                <input type="text" [(ngModel)]="adjForm.reference" name="reference" required
                       placeholder="Ej: AJU-2026-001 o MERMA-04"
                       class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <!-- Justificación / Motivo -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Justificación y Motivo de Auditoría *</label>
              <textarea [(ngModel)]="adjForm.notes" name="notes" rows="3" required
                        placeholder="Describa la razón del ajuste (ej. Producto vencido / Daño en transporte / Conteo físico de inventario anual)..."
                        class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"></textarea>
            </div>

            <!-- Botones de Acción -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button type="button" (click)="resetAdjForm()"
                      class="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                Limpiar Formulario
              </button>
              <button type="submit" [disabled]="savingAdj()"
                      class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50">
                {{ savingAdj() ? 'Guardando Ajuste...' : '💾 Registrar e Imprimir Acta' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- TAB 3: HISTORIAL DE KARDEX -->
      @if (activeTab() === 'kardex') {
        <div class="space-y-4">
          <!-- Filtros de Kardex -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div class="flex flex-wrap items-center gap-2">
              <input type="text" [(ngModel)]="kardexSearch"
                     placeholder="Buscar por producto, referencia o nota..."
                     class="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500 w-64" />
              
              <select [(ngModel)]="kardexTypeFilter"
                      class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-500">
                <option value="ALL">Todos los Movimientos</option>
                <option value="ENTRADA">Entradas Manuales</option>
                <option value="SALIDA">Salidas / Mermas</option>
                <option value="COMPRA">Compras</option>
                <option value="VENTA">Ventas</option>
              </select>
            </div>

            <div class="text-xs text-slate-500 font-medium">
              Mostrando <strong class="text-slate-800">{{ filteredKardex().length }}</strong> movimientos
            </div>
          </div>

          <!-- Tabla de Kardex -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Fecha</th>
                  <th class="px-5 py-3">Producto</th>
                  <th class="px-5 py-3 text-center">Tipo</th>
                  <th class="px-5 py-3 font-mono">Referencia</th>
                  <th class="px-5 py-3 text-right">Cantidad</th>
                  <th class="px-5 py-3 text-right">Costo Unit. (L.)</th>
                  <th class="px-5 py-3 text-right">Stock Saldo</th>
                  <th class="px-5 py-3">Justificación / Motivo</th>
                  <th class="px-5 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (k of filteredKardex(); track k.id) {
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="px-5 py-3 text-slate-500 whitespace-nowrap">{{ k.date }}</td>
                    <td class="px-5 py-3 font-bold text-slate-900">{{ k.productName || 'Producto ID: ' + k.productId }}</td>
                    <td class="px-5 py-3 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-700': k.type === 'ENTRADA' || k.type === 'COMPRA',
                              'bg-rose-50 text-rose-700': k.type === 'SALIDA' || k.type === 'VENTA',
                              'bg-purple-50 text-purple-700': k.type === 'AJUSTE'
                            }">
                        {{ k.type }}
                      </span>
                    </td>
                    <td class="px-5 py-3 font-mono text-slate-600 font-bold">{{ k.reference || 'S/R' }}</td>
                    <td class="px-5 py-3 text-right font-black"
                        [ngClass]="k.type === 'SALIDA' || k.type === 'VENTA' ? 'text-rose-600' : 'text-emerald-600'">
                      {{ k.type === 'SALIDA' || k.type === 'VENTA' ? '-' : '+' }}{{ k.quantity }}
                    </td>
                    <td class="px-5 py-3 text-right text-slate-600">L. {{ (k.costUnit || 0).toFixed(2) }}</td>
                    <td class="px-5 py-3 text-right font-black text-slate-900">{{ k.stockAfter }}</td>
                    <td class="px-5 py-3 text-slate-500 text-[11px] max-w-xs truncate" [title]="k.notes">{{ k.notes || '-' }}</td>
                    <td class="px-5 py-3 text-center">
                      <button (click)="printActa(k)"
                              class="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Imprimir Acta Oficial">
                        🖨️
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-slate-400">No hay movimientos de Kardex registrados.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL NUEVO / EDITAR PRODUCTO -->
      @if (showProductModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Nuevo Producto</h3>
              <button (click)="closeProductModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
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
                       placeholder="Ej: Cable UTP Categoría 6 Bobina" />
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Costo Compra (L.)</label>
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
                <button type="button" (click)="closeProductModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" [disabled]="savingProd()"
                        class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50">
                  {{ savingProd() ? 'Guardando...' : 'Guardar Producto' }}
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
  private prodService = inject(ApiProductosService);
  private invService = inject(ApiInventarioService);
  private printService = inject(PrintService);

  activeTab = signal<'catalogo' | 'ajuste' | 'kardex'>('catalogo');

  // Products
  productos = signal<Producto[]>([]);
  searchProd = '';
  showProductModal = signal(false);
  savingProd = signal(false);

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

  // Adjustments Form
  adjForm: InventoryAdjustment = {
    productId: '',
    type: 'SALIDA',
    quantity: 1,
    reference: '',
    notes: ''
  };
  selectedProductForAdj: Producto | null = null;
  savingAdj = signal(false);
  adjSuccess = signal<string | null>(null);
  adjError = signal<string | null>(null);

  // Kardex
  kardexList = signal<KardexEntry[]>([]);
  kardexSearch = '';
  kardexTypeFilter = 'ALL';
  recalculating = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadProductos();
    this.loadKardex();
  }

  loadProductos(): void {
    this.prodService.getProductos().subscribe(data => this.productos.set(data));
  }

  loadKardex(): void {
    this.invService.getKardex().subscribe(data => this.kardexList.set(data));
  }

  filteredProductos(): Producto[] {
    const q = this.searchProd.toLowerCase().trim();
    if (!q) return this.productos();
    return this.productos().filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.productCode?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q)
    );
  }

  filteredKardex(): KardexEntry[] {
    const q = this.kardexSearch.toLowerCase().trim();
    const type = this.kardexTypeFilter;

    return this.kardexList().filter(k => {
      const matchType = type === 'ALL' || k.type === type;
      const matchSearch = !q ||
        k.productName?.toLowerCase().includes(q) ||
        k.reference?.toLowerCase().includes(q) ||
        k.notes?.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }

  get projectedStock(): number {
    if (!this.selectedProductForAdj) return 0;
    const current = this.selectedProductForAdj.stock || 0;
    const qty = this.adjForm.quantity || 0;
    return this.adjForm.type === 'ENTRADA' ? current + qty : current - qty;
  }

  onProductSelect(): void {
    this.selectedProductForAdj = this.productos().find(p => p.id === this.adjForm.productId) || null;
    if (this.selectedProductForAdj && !this.adjForm.reference) {
      const prefix = this.adjForm.type === 'ENTRADA' ? 'ENT' : 'MERMA';
      this.adjForm.reference = `${prefix}-${Date.now().toString().slice(-6)}`;
    }
  }

  openQuickAdjustment(p: Producto): void {
    this.adjForm = {
      productId: p.id,
      type: 'SALIDA',
      quantity: 1,
      reference: `MERMA-${Date.now().toString().slice(-6)}`,
      notes: 'Ajuste por verificación física de existencias'
    };
    this.selectedProductForAdj = p;
    this.activeTab.set('ajuste');
  }

  resetAdjForm(): void {
    this.adjForm = {
      productId: '',
      type: 'SALIDA',
      quantity: 1,
      reference: '',
      notes: ''
    };
    this.selectedProductForAdj = null;
    this.adjSuccess.set(null);
    this.adjError.set(null);
  }

  submitAdjustment(): void {
    this.adjSuccess.set(null);
    this.adjError.set(null);

    if (!this.adjForm.productId) {
      this.adjError.set('Por favor seleccione un producto del catálogo.');
      return;
    }

    if (!this.adjForm.quantity || this.adjForm.quantity <= 0) {
      this.adjError.set('La cantidad debe ser mayor a cero.');
      return;
    }

    if (!this.adjForm.reference?.trim()) {
      this.adjError.set('La referencia oficial o código de acta es obligatoria.');
      return;
    }

    if (!this.adjForm.notes?.trim()) {
      this.adjError.set('Debe ingresar la justificación o motivo de auditoría.');
      return;
    }

    if (this.adjForm.type === 'SALIDA' && this.selectedProductForAdj && this.selectedProductForAdj.stock < this.adjForm.quantity) {
      this.adjError.set(`Stock insuficiente. Se intentó retirar ${this.adjForm.quantity} unidades pero solo hay ${this.selectedProductForAdj.stock} en inventario.`);
      return;
    }

    this.savingAdj.set(true);
    const costUnit = this.selectedProductForAdj?.purchasePrice || 0;

    const payload: InventoryAdjustment = {
      productId: this.adjForm.productId,
      type: this.adjForm.type,
      quantity: this.adjForm.quantity,
      costUnit: costUnit,
      reference: this.adjForm.reference.trim(),
      reason: this.adjForm.notes.trim(),
      notes: this.adjForm.notes.trim()
    };

    this.invService.adjustInventory(payload).subscribe({
      next: (res) => {
        this.savingAdj.set(false);
        this.adjSuccess.set('Ajuste de inventario registrado y auditado con éxito.');

        // Imprimir acta oficial
        const logData: KardexEntry = {
          id: 'TEMP',
          productId: payload.productId,
          productName: this.selectedProductForAdj?.name,
          date: new Date().toLocaleString('es-HN'),
          type: payload.type,
          quantity: payload.quantity,
          costUnit: costUnit,
          stockAfter: this.projectedStock,
          reference: payload.reference || '',
          notes: payload.notes || ''
        };
        this.printService.printInventoryAdjustmentActa(logData);

        // Recargar datos y resetear
        this.loadProductos();
        this.loadKardex();
        this.resetAdjForm();
      },
      error: (err) => {
        this.savingAdj.set(false);
        this.adjError.set(err?.error?.error || 'Error al guardar el ajuste de inventario.');
      }
    });
  }

  printActa(k: KardexEntry): void {
    this.printService.printInventoryAdjustmentActa(k);
  }

  recalculateKardex(): void {
    this.recalculating.set(true);
    this.invService.recalculateInventory().subscribe({
      next: () => {
        this.recalculating.set(false);
        this.loadProductos();
        this.loadKardex();
        alert('Inventario y Kardex recalculados exitosamente.');
      },
      error: (err) => {
        this.recalculating.set(false);
        alert(err?.error?.error || 'Error al recalcular inventario.');
      }
    });
  }

  // Modal Crear Producto
  openProductModal(): void {
    this.newProd = {
      productCode: '',
      name: '',
      purchasePrice: 0,
      sellPrice: 0,
      taxType: 'GRAVADO',
      stock: 10,
      stockMin: 5,
      isService: 0
    };
    this.showProductModal.set(true);
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
  }

  saveProducto(): void {
    if (!this.newProd.name || !this.newProd.sellPrice) {
      alert('Nombre y Precio de venta son obligatorios.');
      return;
    }

    this.savingProd.set(true);
    this.prodService.createProducto(this.newProd).subscribe({
      next: () => {
        this.savingProd.set(false);
        this.closeProductModal();
        this.loadProductos();
      },
      error: (err) => {
        this.savingProd.set(false);
        alert(err?.error?.error || 'Error al guardar producto.');
      }
    });
  }
}
