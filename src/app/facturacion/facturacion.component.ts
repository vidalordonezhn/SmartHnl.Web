import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiFacturacionService, Factura, FacturaDetalle, EstablishmentFilter } from '../services/api-facturacion.service';
import { ApiClientesService, Cliente } from '../services/api-clientes.service';
import { ApiProductosService, Producto } from '../services/api-productos.service';
import { NumberToLettersService } from '../services/number-to-letters.service';
import { PrintService } from '../services/print.service';

interface CartLineItem {
  id: string;
  productId: string;
  productName: string;
  productCode?: string;
  customDescription?: string;
  quantity: number;
  priceUnit: number;
  discount: number;
  taxType: 'GRAVADO_15' | 'GRAVADO_18' | 'EXENTO';
  serialNumber?: string;
  costUnit: number;
  stock: number;
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      
      <!-- Top Sub-Navigation Header: Facturador vs Historial -->
      <div class="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center gap-2">
          <button (click)="activeView.set('BILLING')"
                  [ngClass]="activeView() === 'BILLING' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
                  class="px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <span>⚡ Facturación Fiscal SAR</span>
          </button>
          <button (click)="activeView.set('HISTORY')"
                  [ngClass]="activeView() === 'HISTORY' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
                  class="px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer">
            <span>📑 Historial de Comprobantes</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/10 text-slate-800 font-bold">{{ facturas().length }}</span>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
            <span class="text-slate-400">Punto:</span>
            <span class="font-bold text-slate-900" [ngClass]="documentType === 'RECIBO_HONORARIOS' ? 'text-emerald-700' : 'text-blue-700'">
              {{ documentType === 'RECIBO_HONORARIOS' ? '🏬 Sucursal' : '🏢 Casa Matriz' }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Régimen SAR Activo</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: FACTURADOR NORMALIZADO (ERGONOMÍA & ALTA VELOCIDAD) -->
      <!-- ========================================================================= -->
      @if (activeView() === 'BILLING') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          <!-- LEFT COLUMN (8 COLS): COMPACT HEADER & EXPANDED CART TABLE -->
          <div class="lg:col-span-8 space-y-3">
            
            <!-- COMPACT SMART CLIENT & FISCAL HEADER -->
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              
              <!-- Row 1: Client Quick Select, Term of Payment, Due Date -->
              <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                
                <!-- Client Box & Search Button -->
                <div class="md:col-span-6 flex items-center gap-1.5">
                  <button type="button" (click)="openClientModal()"
                          class="px-2.5 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Buscar cliente en directorio">
                    <span>👥</span>
                    <span>Buscar</span>
                  </button>

                  <div (click)="openClientModal()"
                       class="flex-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-1.5 text-xs cursor-pointer transition flex items-center justify-between min-w-0">
                    <div class="truncate">
                      <p class="font-bold text-slate-900 truncate">
                        {{ selectedClientId === 'cf-id' ? 'CONSUMIDOR FINAL' : (selectedClient()?.name || customClientName) }}
                      </p>
                      <p class="text-[10px] text-slate-500 font-mono truncate">
                        RTN: {{ customClientRtn || '00000000000000' }}
                      </p>
                    </div>
                    @if (selectedClientId !== 'cf-id') {
                      <button type="button" (click)="$event.stopPropagation(); resetToConsumidorFinal()"
                              class="text-slate-400 hover:text-rose-600 font-bold text-xs ml-1" title="Cambiar a Consumidor Final">
                        ✕
                      </button>
                    }
                  </div>
                </div>

                <!-- Term of Payment -->
                <div class="md:col-span-3">
                  <select [(ngModel)]="paymentTerm" (change)="onPaymentTermChange()"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-500 cursor-pointer">
                    <optgroup label="Contado">
                      <option value="EFECTIVO">💵 EFECTIVO</option>
                      <option value="TARJETA">💳 TARJETA</option>
                      <option value="TRANSFERENCIA BANCARIA">🏦 TRANSFERENCIA</option>
                      <option value="LINK PAGO">🔗 LINK PAGO</option>
                    </optgroup>
                    @if (selectedClientId !== 'cf-id') {
                      <optgroup label="Crédito">
                        <option value="CREDITO 15 DIAS">⏳ CRÉDITO 15 DÍAS</option>
                        <option value="CREDITO 30 DIAS">⏳ CRÉDITO 30 DÍAS</option>
                        <option value="CREDITO 60 DIAS">⏳ CRÉDITO 60 DÍAS</option>
                      </optgroup>
                    }
                  </select>
                </div>

                <!-- Issue & Due Date -->
                <div class="md:col-span-3">
                  <input type="date" [(ngModel)]="invoiceDate" (change)="onPaymentTermChange()"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-800 focus:outline-blue-500" />
                </div>
              </div>

              <!-- Row 2: Collapsible Details (Custom Client fields & Exoneration toggle) -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                
                <div class="flex items-center gap-3">
                  <!-- Exoneration Toggle -->
                  <label class="flex items-center gap-1.5 cursor-pointer font-bold select-none text-slate-700"
                         [ngClass]="isExonerated ? 'text-amber-700' : 'text-slate-600'">
                    <input type="checkbox" [(ngModel)]="isExonerated" class="w-3.5 h-3.5 text-amber-600 rounded cursor-pointer" />
                    <span>Exonerado SAR (0% ISV)</span>
                  </label>

                  @if (documentType === 'RECIBO_HONORARIOS') {
                    <label class="flex items-center gap-1.5 cursor-pointer font-bold select-none text-teal-700">
                      <input type="checkbox" [(ngModel)]="recalcular" class="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer" />
                      <span>Recalcular (Exento en Sucursal)</span>
                    </label>
                  }
                </div>

                <!-- Quick info / Custom edit toggle -->
                <button type="button" (click)="showClientDetails.set(!showClientDetails())"
                        class="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer">
                  <span>{{ showClientDetails() ? 'Ocultar Datos Fiscales ▲' : 'Modificar Datos Receptor ▼' }}</span>
                </button>
              </div>

              <!-- Expanded Client Details Drawer -->
              @if (showClientDetails()) {
                <div class="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs animate-fadeIn">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nombre / Razón</label>
                    <input type="text" [(ngModel)]="customClientName"
                           class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">RTN Fiscal</label>
                    <input type="text" [(ngModel)]="customClientRtn"
                           class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Dirección</label>
                    <input type="text" [(ngModel)]="customClientAddress"
                           class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Teléfono</label>
                    <input type="text" [(ngModel)]="customClientPhone"
                           class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-blue-500" />
                  </div>
                </div>
              }

              <!-- SAR Exoneration Fields (Appears directly if Exonerated is checked) -->
              @if (isExonerated) {
                <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-fadeIn">
                  <div class="flex items-center justify-between text-[11px] font-bold text-amber-900">
                    <span>🏛️ Requisitos Fiscales SAR para Exoneración:</span>
                    <span class="text-[10px] font-normal text-amber-700">* Ingrese al menos uno</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <input type="text" [(ngModel)]="ordenCompraExenta" placeholder="N° Orden de Compra Exenta..."
                             class="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-amber-500" />
                    </div>
                    <div>
                      <input type="text" [(ngModel)]="constanciaExoneracion" placeholder="N° Constancia Exoneración..."
                             class="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-amber-500" />
                    </div>
                    <div>
                      <input type="text" [(ngModel)]="documentoSar" placeholder="N° Registro SAG / SAR..."
                             class="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 focus:outline-amber-500" />
                    </div>
                  </div>
                </div>
              }

            </div>

            <!-- PRODUCT SEARCH & BARCODE SCANNER TOOLBAR -->
            <div class="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
              <button type="button" (click)="openCatalogModal()"
                      class="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer">
                <span>📦 Catálogo</span>
              </button>

              <div class="flex-1 relative">
                <input type="text" [(ngModel)]="quickBarcodeInput" (keyup.enter)="addByBarcodeOrCode()"
                       placeholder="Escanee código de barra o ingrese nombre/código y presione ENTER..."
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500 focus:bg-white transition" />
              </div>

              <button type="button" (click)="addEmptyItemLine()"
                      class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
                + Línea Libre
              </button>
            </div>

            <!-- EXPANDED HIGH-CAPACITY CART TABLE (8 TO 12 ITEMS VISIBLE) -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div class="overflow-x-auto max-h-[420px]">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th class="px-3 py-3 text-center w-8">#</th>
                      <th class="px-3 py-3 min-w-[200px]">Producto / Descripción</th>
                      <th class="px-2 py-3 text-center w-16">Cant.</th>
                      <th class="px-3 py-3 text-right w-24">Precio (L.)</th>
                      <th class="px-2 py-3 text-right w-20">Desc. (L.)</th>
                      <th class="px-2 py-3 text-center w-24">Impuesto</th>
                      <th class="px-3 py-3 text-right w-24">Total</th>
                      <th class="px-2 py-3 text-center w-8">✕</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    @for (item of cart; track item.id; let idx = $index) {
                      <tr class="hover:bg-blue-50/30 transition group">
                        <td class="px-3 py-2 text-center font-bold text-slate-400">{{ idx + 1 }}</td>
                        <td class="px-3 py-2">
                          <input type="text" [(ngModel)]="item.customDescription" placeholder="Descripción del artículo..."
                                 class="w-full bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-200 px-2 py-1 rounded-lg text-xs font-semibold text-slate-900 focus:outline-blue-500 focus:bg-white" />
                        </td>
                        <td class="px-2 py-2 text-center">
                          <input type="number" [(ngModel)]="item.quantity" min="1"
                                 class="w-14 bg-slate-50 group-hover:bg-white border border-slate-200 px-1 py-1 rounded-lg text-center text-xs font-bold text-slate-900 focus:outline-blue-500" />
                        </td>
                        <td class="px-3 py-2 text-right">
                          <input type="number" [(ngModel)]="item.priceUnit" min="0" step="0.01"
                                 class="w-20 bg-slate-50 group-hover:bg-white border border-slate-200 px-1.5 py-1 rounded-lg text-right text-xs font-bold text-slate-900 focus:outline-blue-500" />
                        </td>
                        <td class="px-2 py-2 text-right">
                          <input type="number" [(ngModel)]="item.discount" min="0" step="0.01"
                                 class="w-16 bg-slate-50 group-hover:bg-white border border-slate-200 px-1.5 py-1 rounded-lg text-right text-xs text-slate-600 focus:outline-blue-500" />
                        </td>
                        <td class="px-2 py-2 text-center">
                          <select [(ngModel)]="item.taxType"
                                  class="w-22 bg-slate-50 group-hover:bg-white border border-slate-200 px-1.5 py-1 rounded-lg text-[10.5px] font-bold focus:outline-blue-500">
                            <option value="GRAVADO_15">ISV 15%</option>
                            <option value="GRAVADO_18">ISV 18%</option>
                            <option value="EXENTO">Exento</option>
                          </select>
                        </td>
                        <td class="px-3 py-2 text-right font-black text-slate-900">
                          L. {{ ((item.quantity * item.priceUnit) - item.discount).toFixed(2) }}
                        </td>
                        <td class="px-2 py-2 text-center">
                          <button type="button" (click)="removeItem(idx)" class="text-slate-300 hover:text-rose-600 font-bold p-1 transition cursor-pointer">✕</button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                          <div class="space-y-1">
                            <p class="font-bold text-slate-600">Carrito de facturación vacío</p>
                            <p class="text-xs">Haga clic en <strong>📦 Catálogo</strong> o escanee un producto para empezar.</p>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN (4 COLS): STICKY CHECKOUT & TOTALS DASHBOARD -->
          <div class="lg:col-span-4 space-y-3 sticky top-4">
            
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumen Fiscal</span>
                <span class="text-xs font-black text-blue-600">{{ cart.length }} {{ cart.length === 1 ? 'Ítem' : 'Ítems' }}</span>
              </div>

              <!-- Breakdown Rows -->
              <div class="space-y-1.5 text-xs">
                <div class="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal Gravado (15%):</span>
                  <span class="font-bold text-slate-800">L. {{ calculateTotals().subtotalGravado15.toFixed(2) }}</span>
                </div>
                @if (calculateTotals().subtotalGravado18 > 0) {
                  <div class="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal Gravado (18%):</span>
                    <span class="font-bold text-slate-800">L. {{ calculateTotals().subtotalGravado18.toFixed(2) }}</span>
                  </div>
                }
                <div class="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal Exento (0%):</span>
                  <span class="font-bold text-slate-800">L. {{ calculateTotals().subtotalExento.toFixed(2) }}</span>
                </div>
                @if (calculateTotals().subtotalExonerado > 0) {
                  <div class="flex justify-between text-amber-700 font-semibold">
                    <span>Subtotal Exonerado SAR:</span>
                    <span class="font-bold">L. {{ calculateTotals().subtotalExonerado.toFixed(2) }}</span>
                  </div>
                }
                @if (calculateTotals().descuentoTotal > 0) {
                  <div class="flex justify-between text-rose-600 font-medium">
                    <span>Descuentos Otorgados:</span>
                    <span class="font-bold">- L. {{ calculateTotals().descuentoTotal.toFixed(2) }}</span>
                  </div>
                }

                <div class="flex justify-between text-blue-700 font-bold pt-2 border-t border-slate-100">
                  <span>ISV 15% Calculado:</span>
                  <span>L. {{ calculateTotals().isv15.toFixed(2) }}</span>
                </div>
                @if (calculateTotals().isv18 > 0) {
                  <div class="flex justify-between text-blue-700 font-bold">
                    <span>ISV 18% Calculado:</span>
                    <span>L. {{ calculateTotals().isv18.toFixed(2) }}</span>
                  </div>
                }
              </div>

              <!-- Giant Total Card -->
              <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl space-y-1 shadow-md">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total General (HNL)</span>
                <div class="text-2xl font-black text-emerald-400 tracking-tight">
                  L. {{ calculateTotals().totalGeneral.toFixed(2) }}
                </div>
              </div>

              <!-- Number in Letters SAR -->
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Total en Letras:</span>
                <span class="font-bold text-slate-900 text-[11px] leading-tight block">
                  {{ calculateTotals().totalLetras }}
                </span>
              </div>

              <!-- Main CTA Action Buttons -->
              <div class="space-y-2 pt-1">
                <button type="button" (click)="saveInvoice()" [disabled]="saving() || cart.length === 0"
                        class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer">
                  <span>✓</span>
                  <span>{{ saving() ? 'Emitiendo Factura...' : 'EMITIR FACTURA FISCAL SAR' }}</span>
                </button>

                <div class="flex items-center gap-2">
                  <button type="button" (click)="resetForm()"
                          class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer">
                    Limpiar
                  </button>
                  <button type="button" (click)="openCommentsModal()"
                          class="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer" title="Observaciones / Garantía">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      }

      <!-- ========================================================================= -->
      <!-- VIEW 2: HISTORIAL DE COMPROBANTES FISCALES EMITIDOS -->
      <!-- ========================================================================= -->
      @if (activeView() === 'HISTORY') {
        <div class="space-y-4">
          
          <!-- Filters Bar -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 flex-1 min-w-[240px]">
              <input type="text" [(ngModel)]="searchFilter" placeholder="Buscar por N° Factura, Cliente o RTN..."
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-blue-500" />
            </div>

            <div class="flex items-center gap-2">
              <select [(ngModel)]="statusFilter"
                      class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-500 cursor-pointer">
                <option value="ALL">Todos los Estados</option>
                <option value="EMITIDA">Solo Emitidas</option>
                <option value="ANULADA">Solo Anuladas</option>
              </select>
            </div>
          </div>

          <!-- Invoices Table -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3.5">N° Correlativo</th>
                  <th class="px-4 py-3.5">Punto</th>
                  <th class="px-4 py-3.5">Fecha</th>
                  <th class="px-5 py-3.5">Cliente / RTN</th>
                  <th class="px-4 py-3.5">Subtotal</th>
                  <th class="px-4 py-3.5">ISV Total</th>
                  <th class="px-4 py-3.5 text-right">Total General</th>
                  <th class="px-4 py-3.5 text-center">Estado</th>
                  <th class="px-5 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (f of filteredFacturas(); track f.id) {
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="px-5 py-3.5 font-bold text-blue-600">{{ f.invoiceNumber }}</td>
                    <td class="px-4 py-3.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                            [ngClass]="f.documentType === 'FACTURA' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'">
                        {{ f.documentType === 'FACTURA' ? 'Matriz' : 'Sucursal' }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5 text-slate-500">{{ f.date }}</td>
                    <td class="px-5 py-3.5 text-slate-900 font-bold">
                      {{ f.clientName || f.customClientName || 'Consumidor Final' }}
                      @if (f.clientRtn || f.customClientRtn) {
                        <span class="block text-[10px] text-slate-400 font-normal">RTN: {{ f.clientRtn || f.customClientRtn }}</span>
                      }
                    </td>
                    <td class="px-4 py-3.5 text-slate-600">L. {{ (f.subtotalGravado + f.subtotalExento + f.subtotalExonerado).toFixed(2) }}</td>
                    <td class="px-4 py-3.5 text-blue-600 font-semibold">L. {{ f.isvTotal.toFixed(2) }}</td>
                    <td class="px-4 py-3.5 text-right font-black text-slate-900">L. {{ f.totalGeneral.toFixed(2) }}</td>
                    <td class="px-4 py-3.5 text-center">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            [ngClass]="f.status === 'EMITIDA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'">
                        {{ f.status }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button (click)="printLetter(f)" title="Imprimir Formato Carta Fiscal"
                                class="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer">
                          📄 Carta
                        </button>
                        <button (click)="printTicket(f)" title="Imprimir Ticket Térmico 80mm"
                                class="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer">
                          🧾 Ticket
                        </button>
                        @if (f.status === 'EMITIDA') {
                          <button (click)="annulInvoice(f)" title="Anular Factura Fiscal"
                                  class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition cursor-pointer">
                            ✕ Anular
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-slate-400">No hay comprobantes para mostrar en este filtro.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 1: BÚSQUEDA Y SELECCIÓN DE CLIENTE -->
      <!-- ========================================================================= -->
      @if (showClientModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 class="font-bold text-slate-900 text-sm">Directorio de Clientes</h3>
              <button (click)="closeClientModal()" class="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
            </div>

            <input type="text" [(ngModel)]="clientSearchQuery" placeholder="Buscar por nombre, RTN o teléfono..."
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />

            <div class="overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1">
              <div (click)="selectClient('cf-id')"
                   class="p-2.5 hover:bg-blue-50/60 rounded-xl cursor-pointer transition flex justify-between items-center text-xs">
                <div>
                  <p class="font-bold text-slate-900">CONSUMIDOR FINAL</p>
                  <p class="text-[10px] text-slate-500">RTN: 00000000000000</p>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Genérico</span>
              </div>

              @for (c of filteredClients(); track c.id) {
                <div (click)="selectClient(c.id)"
                     class="p-2.5 hover:bg-blue-50/60 rounded-xl cursor-pointer transition flex justify-between items-center text-xs">
                  <div>
                    <p class="font-bold text-slate-900">{{ c.name }}</p>
                    <p class="text-[10px] text-slate-500">RTN: {{ c.rtn || 'S/N' }} | Tel: {{ c.phone || 'S/T' }}</p>
                  </div>
                  <span class="text-blue-600 font-bold text-xs">Seleccionar →</span>
                </div>
              }
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-100">
              <button (click)="closeClientModal()" class="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 2: CATÁLOGO DE PRODUCTOS DRAWER / MODAL -->
      <!-- ========================================================================= -->
      @if (showCatalogModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-3 max-h-[88vh] flex flex-col">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 class="font-bold text-slate-900 text-sm">Catálogo de Productos & Servicios</h3>
              <button (click)="closeCatalogModal()" class="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
            </div>

            <input type="text" [(ngModel)]="catalogSearchQuery" placeholder="Buscar por nombre, código o código de barras..."
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />

            <div class="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
              @for (p of filteredCatalog(); track p.id) {
                <div class="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-xl transition">
                  <div class="space-y-0.5">
                    <p class="font-bold text-slate-900">{{ p.name }}</p>
                    <p class="text-[10px] text-slate-500">
                      Código: {{ p.productCode || p.id.substring(0, 8) }} | 
                      Impuesto: <span class="font-bold text-blue-600">{{ p.taxType }}</span> | 
                      Stock: <span class="font-bold text-emerald-600">{{ p.stock }}</span>
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-black text-slate-900 text-sm">L. {{ p.sellPrice.toFixed(2) }}</span>
                    <button type="button" (click)="addCatalogItemToCart(p)"
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer">
                      + Agregar
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-center text-slate-400 py-8">No se encontraron productos coincidentes.</p>
              }
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-100">
              <button (click)="closeCatalogModal()" class="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 3: OBSERVACIONES Y OPCIONES AVANZADAS -->
      <!-- ========================================================================= -->
      @if (showCommentsModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 class="font-bold text-slate-900 text-sm">Opciones Adicionales</h3>
              <button (click)="closeCommentsModal()" class="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Observaciones / Comentarios de Factura</label>
                <textarea [(ngModel)]="comments" rows="3" placeholder="Instrucciones especiales, orden de despacho..."
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-blue-500"></textarea>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label class="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input type="checkbox" [(ngModel)]="generarGarantiaAuto" class="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  <span>Generar Boleta de Garantía si incluye series</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-100">
              <button (click)="closeCommentsModal()" class="px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer">Listo</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class FacturacionComponent implements OnInit {
  private service = inject(ApiFacturacionService);
  private clientesService = inject(ApiClientesService);
  private productosService = inject(ApiProductosService);
  private numberToLetters = inject(NumberToLettersService);
  private printService = inject(PrintService);

  activeView = signal<'BILLING' | 'HISTORY'>('BILLING');
  facturas = signal<Factura[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);

  // Main Billing States
  documentType: 'FACTURA' | 'RECIBO_HONORARIOS' = 'FACTURA';
  selectedClientId = 'cf-id';
  customClientName = 'Consumidor Final';
  customClientRtn = '00000000000000';
  customClientAddress = 'GENERAL';
  customClientPhone = 'N/A';
  paymentTerm = 'EFECTIVO';
  paymentType: 'CONTADO' | 'CREDITO' = 'CONTADO';
  invoiceDate = new Date().toISOString().split('T')[0];
  dueDate = new Date().toISOString().split('T')[0];
  comments = '';

  // SAR Condicional
  isExonerated = false;
  ordenCompraExenta = '';
  constanciaExoneracion = '';
  documentoSar = '';

  // Options
  generarGarantiaAuto = true;
  recalcular = false;
  showClientDetails = signal(false);

  // Cart Line Items
  cart: CartLineItem[] = [];
  quickBarcodeInput = '';

  // Modals
  showClientModal = signal(false);
  clientSearchQuery = '';

  showCatalogModal = signal(false);
  catalogSearchQuery = '';

  showCommentsModal = signal(false);

  // History Filters
  searchFilter = '';
  statusFilter = 'ALL';

  saving = signal(false);

  constructor() {
    effect(() => {
      const currentEst = this.service.currentEstablishment();
      if (currentEst === 'RECIBO_HONORARIOS') {
        this.documentType = 'RECIBO_HONORARIOS';
      } else if (currentEst === 'FACTURA') {
        this.documentType = 'FACTURA';
      }
      this.loadInvoices();
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.addEmptyItemLine();
  }

  loadData(): void {
    this.clientesService.getClientes().subscribe(res => this.clientes.set(res));
    this.productosService.getProductos().subscribe(res => this.productos.set(res));
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.service.getInvoices(this.service.currentEstablishment()).subscribe(res => this.facturas.set(res));
  }

  selectedClient = computed(() => {
    return this.clientes().find(c => c.id === this.selectedClientId) || null;
  });

  filteredClients = computed(() => {
    const q = this.clientSearchQuery.toLowerCase().trim();
    if (!q) return this.clientes();
    return this.clientes().filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.rtn && c.rtn.toLowerCase().includes(q)) || 
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  filteredCatalog = computed(() => {
    const q = this.catalogSearchQuery.toLowerCase().trim();
    if (!q) return this.productos();
    return this.productos().filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.productCode && p.productCode.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  filteredFacturas = computed(() => {
    let list = this.facturas();
    if (this.statusFilter !== 'ALL') {
      list = list.filter(f => f.status === this.statusFilter);
    }
    const q = this.searchFilter.toLowerCase().trim();
    if (q) {
      list = list.filter(f => 
        f.invoiceNumber.toLowerCase().includes(q) ||
        (f.clientName && f.clientName.toLowerCase().includes(q)) ||
        (f.customClientName && f.customClientName.toLowerCase().includes(q)) ||
        (f.clientRtn && f.clientRtn.toLowerCase().includes(q)) ||
        (f.customClientRtn && f.customClientRtn.toLowerCase().includes(q))
      );
    }
    return list;
  });

  openClientModal(): void {
    this.clientSearchQuery = '';
    this.showClientModal.set(true);
  }

  closeClientModal(): void {
    this.showClientModal.set(false);
  }

  selectClient(id: string): void {
    this.selectedClientId = id;
    if (id === 'cf-id') {
      this.resetToConsumidorFinal();
    } else {
      const cli = this.clientes().find(c => c.id === id);
      if (cli) {
        this.customClientName = cli.name;
        this.customClientRtn = cli.rtn || '00000000000000';
        this.customClientAddress = cli.address || 'GENERAL';
        this.customClientPhone = cli.phone || 'N/A';
      }
    }
    this.closeClientModal();
  }

  resetToConsumidorFinal(): void {
    this.selectedClientId = 'cf-id';
    this.customClientName = 'Consumidor Final';
    this.customClientRtn = '00000000000000';
    this.customClientAddress = 'GENERAL';
    this.customClientPhone = 'N/A';
  }

  openCatalogModal(): void {
    this.catalogSearchQuery = '';
    this.showCatalogModal.set(true);
  }

  closeCatalogModal(): void {
    this.showCatalogModal.set(false);
  }

  openCommentsModal(): void {
    this.showCommentsModal.set(true);
  }

  closeCommentsModal(): void {
    this.showCommentsModal.set(false);
  }

  addCatalogItemToCart(p: Producto): void {
    const existing = this.cart.find(c => c.productId === p.id && !c.serialNumber);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        productId: p.id,
        productName: p.name,
        productCode: p.productCode,
        customDescription: p.name,
        quantity: 1,
        priceUnit: p.sellPrice,
        discount: 0,
        taxType: (p.taxType === 'GRAVADO_18' ? 'GRAVADO_18' : p.taxType === 'EXENTO' ? 'EXENTO' : 'GRAVADO_15'),
        costUnit: p.purchasePrice,
        stock: p.stock
      });
    }
  }

  addEmptyItemLine(): void {
    this.cart.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      productId: 'manual_line',
      productName: '',
      customDescription: '',
      quantity: 1,
      priceUnit: 0,
      discount: 0,
      taxType: 'GRAVADO_15',
      costUnit: 0,
      stock: 0
    });
  }

  addByBarcodeOrCode(): void {
    const val = this.quickBarcodeInput.trim().toLowerCase();
    if (!val) return;
    const found = this.productos().find(p => 
      (p.barcode && p.barcode.toLowerCase() === val) || 
      (p.productCode && p.productCode.toLowerCase() === val) ||
      p.name.toLowerCase().includes(val)
    );
    if (found) {
      this.addCatalogItemToCart(found);
      this.quickBarcodeInput = '';
    } else {
      alert('Producto no encontrado con el código ingresado.');
    }
  }

  removeItem(idx: number): void {
    this.cart.splice(idx, 1);
  }

  onPaymentTermChange(): void {
    const term = this.paymentTerm.toUpperCase();
    if (term.includes('CREDITO') || term.includes('CRÉDITO') || term.includes('DIAS')) {
      this.paymentType = 'CREDITO';
      const match = term.match(/(\d+)/);
      const days = match ? parseInt(match[1], 10) : 30;
      const d = new Date(this.invoiceDate);
      d.setDate(d.getDate() + days);
      this.dueDate = d.toISOString().split('T')[0];
    } else {
      this.paymentType = 'CONTADO';
      this.dueDate = this.invoiceDate;
    }
  }

  calculateTotals(): {
    subtotalGravado15: number;
    subtotalGravado18: number;
    subtotalExento: number;
    subtotalExonerado: number;
    descuentoTotal: number;
    isv15: number;
    isv18: number;
    isvTotal: number;
    totalGeneral: number;
    totalLetras: string;
  } {
    let subtotalGravado15 = 0;
    let subtotalGravado18 = 0;
    let subtotalExento = 0;
    let subtotalExonerado = 0;
    let descuentoTotal = 0;
    let isv15 = 0;
    let isv18 = 0;

    const isRecalc = this.documentType === 'RECIBO_HONORARIOS' && this.recalcular;

    for (const item of this.cart) {
      const gross = (item.quantity * item.priceUnit) - (item.discount || 0);
      descuentoTotal += (item.discount || 0);

      if (this.isExonerated) {
        subtotalExonerado += gross;
      } else if (isRecalc || item.taxType === 'EXENTO') {
        subtotalExento += gross;
      } else if (item.taxType === 'GRAVADO_18') {
        subtotalGravado18 += gross;
        isv18 += gross * 0.18;
      } else {
        subtotalGravado15 += gross;
        isv15 += gross * 0.15;
      }
    }

    const isvTotal = isv15 + isv18;
    const totalGeneral = subtotalGravado15 + subtotalGravado18 + subtotalExento + subtotalExonerado + isvTotal;
    const totalLetras = this.numberToLetters.convertir(totalGeneral);

    return {
      subtotalGravado15,
      subtotalGravado18,
      subtotalExento,
      subtotalExonerado,
      descuentoTotal,
      isv15,
      isv18,
      isvTotal,
      totalGeneral,
      totalLetras
    };
  }

  saveInvoice(): void {
    const validLines = this.cart.filter(c => (c.customDescription?.trim() || c.productName) && c.quantity > 0 && c.priceUnit > 0);
    if (validLines.length === 0) {
      alert('Debe agregar al menos un artículo válido con cantidad y precio.');
      return;
    }

    if (this.isExonerated) {
      if (!this.ordenCompraExenta.trim() && !this.constanciaExoneracion.trim() && !this.documentoSar.trim()) {
        alert('Para clientes exonerados, el SAR exige al menos uno de los números: Orden de Compra Exenta, Constancia de Exoneración o Registro SAG.');
        this.showClientDetails.set(true);
        return;
      }
    }

    this.saving.set(true);

    const payload = {
      documentType: this.documentType,
      date: this.invoiceDate + ' ' + new Date().toTimeString().split(' ')[0],
      clientId: this.selectedClientId,
      paymentType: this.paymentType,
      paymentTerm: this.paymentTerm,
      dueDate: this.dueDate,
      isExonerated: this.isExonerated ? 1 : 0,
      ordenCompraExenta: this.isExonerated ? this.ordenCompraExenta.trim() : undefined,
      constanciaExoneracion: this.isExonerated ? this.constanciaExoneracion.trim() : undefined,
      documentoSar: this.isExonerated ? this.documentoSar.trim() : undefined,
      comments: this.comments,
      customClientName: this.customClientName.trim(),
      customClientRtn: this.customClientRtn.trim(),
      customClientAddress: this.customClientAddress.trim(),
      customClientPhone: this.customClientPhone.trim(),
      recalcular: this.documentType === 'RECIBO_HONORARIOS' && this.recalcular,
      details: validLines.map(line => ({
        productId: line.productId === 'manual_line' ? (this.productos()[0]?.id || 'prod-manual') : line.productId,
        quantity: line.quantity,
        priceUnit: line.priceUnit,
        taxType: line.taxType,
        customDescription: line.customDescription || line.productName,
        discount: line.discount || 0,
        serialNumber: line.serialNumber || undefined,
        costUnit: line.costUnit || 0
      }))
    };

    this.service.createInvoice(payload).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.resetForm();
        this.loadInvoices();
        this.activeView.set('HISTORY');
        if (confirm('¡Factura ' + created.invoiceNumber + ' emitida con éxito!\n¿Desea imprimir el formato Carta Fiscal SAR?')) {
          this.printService.printInvoiceLetter(created);
        }
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error al emitir factura: ' + (err.error?.error || err.message));
      }
    });
  }

  resetForm(): void {
    this.resetToConsumidorFinal();
    this.paymentTerm = 'EFECTIVO';
    this.paymentType = 'CONTADO';
    this.isExonerated = false;
    this.ordenCompraExenta = '';
    this.constanciaExoneracion = '';
    this.documentoSar = '';
    this.comments = '';
    this.recalcular = false;
    this.cart = [];
    this.addEmptyItemLine();
  }

  annulInvoice(f: Factura): void {
    if (confirm('¿Está seguro de anular la factura ' + f.invoiceNumber + '?\nSe revertirá el inventario a existencias.')) {
      this.service.annulInvoice(f.id).subscribe({
        next: () => this.loadInvoices(),
        error: (err) => alert('Error al anular factura: ' + (err.error?.error || err.message))
      });
    }
  }

  printLetter(f: Factura): void {
    this.printService.printInvoiceLetter(f);
  }

  printTicket(f: Factura): void {
    this.printService.printInvoiceTicket(f);
  }
}
