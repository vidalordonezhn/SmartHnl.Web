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
      <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center gap-2">
          <button (click)="activeView.set('BILLING')"
                  [ngClass]="activeView() === 'BILLING' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
                  class="px-4 py-2 rounded-lg text-xs transition flex items-center gap-2 cursor-pointer">
            <span>⚡ Facturación SAP / SAR (Nueva Emisión)</span>
          </button>
          <button (click)="activeView.set('HISTORY')"
                  [ngClass]="activeView() === 'HISTORY' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold'"
                  class="px-4 py-2 rounded-lg text-xs transition flex items-center gap-2 cursor-pointer">
            <span>📑 Historial de Comprobantes Fiscales</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/20 text-white font-bold">{{ facturas().length }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span>Régimen Fiscal SAR Honduras</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: SAP ERP FACTURADOR POS (EMISIÓN FISCAL SAR) -->
      <!-- ========================================================================= -->
      @if (activeView() === 'BILLING') {
        <div class="bg-[#dbe1e8] p-2.5 sm:p-3.5 rounded-xl border border-slate-400 font-sans shadow-lg text-slate-800 text-[11px]">
          
          <!-- SAP Title Bar -->
          <div class="text-white px-3 py-2 rounded-t flex items-center justify-between shadow-sm border-b-2"
               [ngClass]="documentType === 'RECIBO_HONORARIOS' ? 'bg-gradient-to-r from-[#3d5a5b] to-[#2c4041] border-[#10b981]' : 'bg-gradient-to-r from-[#596677] to-[#485465] border-[#eab308]'">
            <div class="flex items-center gap-2">
              <span class="text-base">{{ documentType === 'RECIBO_HONORARIOS' ? '🏬' : '🏢' }}</span>
              <h2 class="font-bold text-xs tracking-wide">
                {{ documentType === 'RECIBO_HONORARIOS' ? 'Factura Comercial (Sucursal)' : 'Factura Comercial Fiscal (Casa Matriz)' }}
              </h2>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] bg-black/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                SAR HONDURAS
              </span>
            </div>
          </div>

          <!-- Main Window Content -->
          <div class="bg-[#edf0f5] p-3 rounded-b border border-slate-300 space-y-3">
            
            <!-- TOP DOCUMENT FORM HEADER -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-[#f4f6f9] p-3 rounded border border-slate-300 text-[11px]">
              
              <!-- Left Column: Cliente, Nombre, RTN, Dirección, Teléfono -->
              <div class="lg:col-span-7 space-y-1.5">
                
                <!-- Cliente -->
                <div class="flex items-center gap-1.5">
                  <label class="w-20 shrink-0 font-bold text-slate-700 text-[10.5px]">Cliente</label>
                  <button type="button" (click)="openClientModal()"
                          class="px-2 py-1 bg-blue-100 border border-blue-300 text-blue-900 font-bold rounded text-[9.5px] hover:bg-blue-200 transition shrink-0 flex items-center gap-1 cursor-pointer"
                          title="Buscar Cliente en Directorio">
                    <span>⇒</span>
                    <span>Buscar</span>
                  </button>
                  <div (click)="openClientModal()"
                       class="flex-1 border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-[10.5px] font-bold text-slate-800 rounded-sm truncate cursor-pointer flex items-center justify-between">
                    <span class="truncate">
                      {{ selectedClientId === 'cf-id' ? 'CONSUMIDOR FINAL' : (selectedClient()?.name ? selectedClient()!.name.toUpperCase() : 'CONSUMIDOR FINAL') }}
                    </span>
                    @if (selectedClientId !== 'cf-id') {
                      <button type="button" (click)="$event.stopPropagation(); resetToConsumidorFinal()"
                              class="text-slate-400 hover:text-rose-600 font-bold text-xs" title="Restablecer a Consumidor Final">
                        ✕
                      </button>
                    }
                  </div>
                </div>

                <!-- Razón Social / Nombre -->
                <div class="flex items-center gap-1.5">
                  <label class="w-20 shrink-0 font-medium text-slate-700 text-[10.5px]">Nombre</label>
                  <input type="text" [(ngModel)]="customClientName" placeholder="Nombre o razón social..."
                         class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] text-slate-800 font-medium rounded-sm focus:outline-blue-500" />
                </div>

                <!-- RTN Fiscal -->
                <div class="flex items-center gap-1.5">
                  <label class="w-20 shrink-0 font-medium text-slate-700 text-[10.5px]">RTN Fiscal</label>
                  <input type="text" [(ngModel)]="customClientRtn" placeholder="00000000000000"
                         class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] font-mono text-slate-800 font-medium rounded-sm focus:outline-blue-500" />
                </div>

                <!-- Dirección -->
                <div class="flex items-center gap-1.5">
                  <label class="w-20 shrink-0 font-medium text-slate-700 text-[10.5px]">Dirección</label>
                  <input type="text" [(ngModel)]="customClientAddress" placeholder="Dirección del cliente..."
                         class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] text-slate-800 rounded-sm focus:outline-blue-500" />
                </div>

                <!-- Teléfono -->
                <div class="flex items-center gap-1.5">
                  <label class="w-20 shrink-0 font-medium text-slate-700 text-[10.5px]">Teléfono</label>
                  <input type="text" [(ngModel)]="customClientPhone" placeholder="Teléfono de contacto..."
                         class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] text-slate-800 rounded-sm focus:outline-blue-500" />
                </div>
              </div>

              <!-- Right Column: Punto Emisión, Correlativo, Término, Fechas -->
              <div class="lg:col-span-5 space-y-1.5">
                
                <!-- Tipo de Comprobante / Establecimiento -->
                <div class="flex items-center gap-1.5">
                  <label class="w-28 shrink-0 font-medium text-slate-700 text-[10.5px]">Comprobante</label>
                  <select [(ngModel)]="documentType" (change)="onDocumentTypeChange()"
                          class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] font-bold text-slate-800 rounded-sm focus:outline-blue-500 cursor-pointer">
                    <option value="FACTURA">🏢 Factura Comercial (Casa Matriz)</option>
                    <option value="RECIBO_HONORARIOS">🏬 Factura Comercial (Sucursal)</option>
                  </select>
                </div>

                <!-- Término de Pago -->
                <div class="flex items-center gap-1.5">
                  <label class="w-28 shrink-0 font-medium text-slate-700 text-[10.5px]">Término de Pago</label>
                  <select [(ngModel)]="paymentTerm" (change)="onPaymentTermChange()"
                          class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] font-medium text-slate-800 rounded-sm focus:outline-blue-500 cursor-pointer">
                    <optgroup label="Contado">
                      <option value="EFECTIVO">EFECTIVO</option>
                      <option value="TARJETA">TARJETA</option>
                      <option value="TRANSFERENCIA BANCARIA">TRANSFERENCIA BANCARIA</option>
                      <option value="LINK PAGO">LINK PAGO</option>
                    </optgroup>
                    @if (selectedClientId !== 'cf-id') {
                      <optgroup label="Crédito">
                        <option value="CREDITO 15 DIAS">CRÉDITO 15 DÍAS</option>
                        <option value="CREDITO 30 DIAS">CRÉDITO 30 DÍAS</option>
                        <option value="CREDITO 60 DIAS">CRÉDITO 60 DÍAS</option>
                      </optgroup>
                    }
                  </select>
                </div>

                <!-- Fecha de Emisión -->
                <div class="flex items-center gap-1.5">
                  <label class="w-28 shrink-0 font-medium text-slate-700 text-[10.5px]">Fecha Emisión</label>
                  <input type="date" [(ngModel)]="invoiceDate"
                         class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] font-mono text-slate-800 rounded-sm focus:outline-blue-500" />
                </div>

                <!-- Fecha Vencimiento -->
                <div class="flex items-center gap-1.5">
                  <label class="w-28 shrink-0 font-medium text-slate-700 text-[10.5px]">Fecha Vence</label>
                  <input type="date" [(ngModel)]="dueDate"
                         class="flex-1 border border-slate-300 bg-white px-2 py-1 text-[10.5px] font-mono text-slate-800 rounded-sm focus:outline-blue-500" />
                </div>

                <!-- Moneda Local -->
                <div class="flex items-center gap-1.5">
                  <label class="w-28 shrink-0 font-medium text-slate-700 text-[10.5px]">Moneda</label>
                  <span class="flex-1 border border-slate-300 bg-slate-100 px-2 py-1 text-[10.5px] font-bold text-slate-700 rounded-sm">
                    HNL - Lempiras Hondureños (L.)
                  </span>
                </div>
              </div>
            </div>

            <!-- SAP ERP SUB-TABS NAVIGATION -->
            <div class="border-b border-slate-300 flex items-center gap-1 text-[11px] pt-1">
              <button type="button" (click)="erpTab = 'CONTENIDO'"
                      [ngClass]="erpTab === 'CONTENIDO' ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-300 font-bold text-blue-900 -mb-px pb-1.5' : 'bg-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'"
                      class="px-3 py-1.5 rounded-t cursor-pointer flex items-center gap-1.5">
                <span>📋 Contenido & Artículos</span>
              </button>

              <button type="button" (click)="erpTab = 'SAR'"
                      [ngClass]="erpTab === 'SAR' ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-300 font-bold text-blue-900 -mb-px pb-1.5' : 'bg-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'"
                      class="px-3 py-1.5 rounded-t cursor-pointer flex items-center gap-1.5">
                <span>🏛️ Documento Electrónico (SAR)</span>
                @if (isExonerated) {
                  <span class="w-2 h-2 rounded-full bg-amber-500" title="Exoneración Activa"></span>
                }
              </button>

              <button type="button" (click)="erpTab = 'LOGISTICA'"
                      [ngClass]="erpTab === 'LOGISTICA' ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-300 font-bold text-blue-900 -mb-px pb-1.5' : 'bg-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'"
                      class="px-3 py-1.5 rounded-t cursor-pointer flex items-center gap-1.5">
                <span>🚚 Logística</span>
              </button>

              <button type="button" (click)="erpTab = 'FINANZAS'"
                      [ngClass]="erpTab === 'FINANZAS' ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-300 font-bold text-blue-900 -mb-px pb-1.5' : 'bg-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'"
                      class="px-3 py-1.5 rounded-t cursor-pointer flex items-center gap-1.5">
                <span>💳 Finanzas & Crédito</span>
              </button>

              <button type="button" (click)="erpTab = 'ANEXOS'"
                      [ngClass]="erpTab === 'ANEXOS' ? 'bg-white border-t-2 border-t-blue-600 border-x border-slate-300 font-bold text-blue-900 -mb-px pb-1.5' : 'bg-slate-200 text-slate-600 hover:bg-slate-100 font-semibold'"
                      class="px-3 py-1.5 rounded-t cursor-pointer flex items-center gap-1.5">
                <span>📑 Opciones / Sucursal</span>
              </button>
            </div>

            <!-- TAB 1: CONTENIDO (LÍNEAS DE ARTÍCULOS) -->
            @if (erpTab === 'CONTENIDO') {
              <div class="bg-white p-2.5 rounded border border-slate-300 space-y-2.5">
                
                <!-- Search / Quick Add Bar -->
                <div class="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <div class="flex items-center gap-2 flex-1">
                    <button type="button" (click)="openCatalogModal()"
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer">
                      <span>📦 Buscar en Catálogo</span>
                    </button>
                    <input type="text" [(ngModel)]="quickBarcodeInput" (keyup.enter)="addByBarcodeOrCode()"
                           placeholder="Escanee código de barra o ingrese código rápido y presione ENTER..."
                           class="flex-1 border border-slate-300 bg-white px-2.5 py-1 text-xs rounded focus:outline-blue-500" />
                  </div>
                  <button type="button" (click)="addEmptyItemLine()"
                          class="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded transition cursor-pointer">
                    + Agregar Línea Manual
                  </button>
                </div>

                <!-- Table of Lines -->
                <div class="border border-slate-300 rounded overflow-x-auto min-h-[140px]">
                  <table class="w-full text-left text-[11px] border-collapse">
                    <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                      <tr>
                        <th class="px-2 py-1.5 text-center w-8">#</th>
                        <th class="px-2 py-1.5 w-48">Producto / Descripción</th>
                        <th class="px-2 py-1.5 text-center w-16">Cant.</th>
                        <th class="px-2 py-1.5 text-right w-24">Precio Unit. (L.)</th>
                        <th class="px-2 py-1.5 text-right w-20">Desc. (L.)</th>
                        <th class="px-2 py-1.5 text-center w-28">Impuesto</th>
                        <th class="px-2 py-1.5 w-28">N° Serie / Garantía</th>
                        <th class="px-2 py-1.5 text-right w-24">Total Línea</th>
                        <th class="px-2 py-1.5 text-center w-10">✕</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 font-medium">
                      @for (item of cart; track item.id; let idx = $index) {
                        <tr class="hover:bg-blue-50/40">
                          <td class="px-2 py-1 text-center font-bold text-slate-400">{{ idx + 1 }}</td>
                          <td class="px-2 py-1">
                            <input type="text" [(ngModel)]="item.customDescription" placeholder="Descripción del artículo..."
                                   class="w-full bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10.5px] font-medium text-slate-800 focus:outline-blue-500" />
                          </td>
                          <td class="px-2 py-1 text-center">
                            <input type="number" [(ngModel)]="item.quantity" min="1"
                                   class="w-14 bg-white border border-slate-200 px-1 py-0.5 rounded text-center text-[10.5px] font-bold text-slate-900 focus:outline-blue-500" />
                          </td>
                          <td class="px-2 py-1 text-right">
                            <input type="number" [(ngModel)]="item.priceUnit" min="0" step="0.01"
                                   class="w-20 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-right text-[10.5px] font-bold text-slate-900 focus:outline-blue-500" />
                          </td>
                          <td class="px-2 py-1 text-right">
                            <input type="number" [(ngModel)]="item.discount" min="0" step="0.01"
                                   class="w-16 bg-white border border-slate-200 px-1 py-0.5 rounded text-right text-[10.5px] text-slate-600 focus:outline-blue-500" />
                          </td>
                          <td class="px-2 py-1 text-center">
                            <select [(ngModel)]="item.taxType"
                                    class="w-24 bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px] font-bold focus:outline-blue-500">
                              <option value="GRAVADO_15">ISV 15%</option>
                              <option value="GRAVADO_18">ISV 18%</option>
                              <option value="EXENTO">Exento</option>
                            </select>
                          </td>
                          <td class="px-2 py-1">
                            <input type="text" [(ngModel)]="item.serialNumber" placeholder="S/N..."
                                   class="w-full bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-700" />
                          </td>
                          <td class="px-2 py-1 text-right font-black text-slate-900">
                            L. {{ ((item.quantity * item.priceUnit) - item.discount).toFixed(2) }}
                          </td>
                          <td class="px-2 py-1 text-center">
                            <button type="button" (click)="removeItem(idx)" class="text-rose-500 hover:text-rose-700 font-bold cursor-pointer">✕</button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="9" class="px-4 py-8 text-center text-slate-400">
                            Ningún producto agregado al carrito. Haga clic en <strong>Buscar en Catálogo</strong> o escanee un código.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- TAB 2: SAR (DOCUMENTO ELECTRÓNICO CONDICIONAL) -->
            @if (erpTab === 'SAR') {
              <div class="bg-white p-3 rounded border border-slate-300 space-y-3">
                <div class="flex items-center gap-2 p-2.5 bg-amber-50 rounded border border-amber-200">
                  <input type="checkbox" id="exoCheck" [(ngModel)]="isExonerated" class="w-4 h-4 text-amber-600 rounded cursor-pointer" />
                  <label for="exoCheck" class="font-bold text-amber-900 cursor-pointer text-xs">
                    Cliente / Operación Exonerada de Impuestos (ISV 0%)
                  </label>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">N° Orden de Compra Exenta</label>
                    <input type="text" [(ngModel)]="ordenCompraExenta" placeholder="OC-EXENTA-12345"
                           class="w-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs rounded font-mono focus:outline-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">N° Constancia Registro Exoneración</label>
                    <input type="text" [(ngModel)]="constanciaExoneracion" placeholder="CONST-EXON-67890"
                           class="w-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs rounded font-mono focus:outline-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">N° Registro SAG / Documento SAR</label>
                    <input type="text" [(ngModel)]="documentoSar" placeholder="SAG-REG-9999"
                           class="w-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs rounded font-mono focus:outline-blue-500" />
                  </div>
                </div>
                <p class="text-[10px] text-slate-500 italic">
                  * Según la normativa del Régimen de Facturación SAR de Honduras, toda factura exonerada debe contener al menos uno de estos números fiscales emitidos por la Secretaría de Finanzas / SAR.
                </p>
              </div>
            }

            <!-- TAB 3: LOGÍSTICA -->
            @if (erpTab === 'LOGISTICA') {
              <div class="bg-white p-3 rounded border border-slate-300 space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">Dirección de Despacho / Entrega</label>
                    <textarea [(ngModel)]="customClientAddress" rows="3"
                              class="w-full border border-slate-300 bg-white p-2 text-xs rounded focus:outline-blue-500"></textarea>
                  </div>
                  <div>
                    <label class="block text-[11px] font-bold text-slate-700 mb-1">Observaciones Logísticas</label>
                    <textarea [(ngModel)]="comments" rows="3" placeholder="Instrucciones especiales de entrega..."
                              class="w-full border border-slate-300 bg-white p-2 text-xs rounded focus:outline-blue-500"></textarea>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 4: FINANZAS & CRÉDITO -->
            @if (erpTab === 'FINANZAS') {
              <div class="bg-white p-3 rounded border border-slate-300 space-y-3">
                <div class="grid grid-cols-3 gap-3 text-xs">
                  <div class="p-3 bg-slate-50 rounded border border-slate-200">
                    <span class="text-slate-500 block">Límite de Crédito Autorizado:</span>
                    <span class="font-bold text-slate-900 text-sm">L. {{ (selectedClient()?.creditLimit || 0).toFixed(2) }}</span>
                  </div>
                  <div class="p-3 bg-slate-50 rounded border border-slate-200">
                    <span class="text-slate-500 block">Días de Crédito:</span>
                    <span class="font-bold text-slate-900 text-sm">{{ selectedClient()?.creditDays || 0 }} Días</span>
                  </div>
                  <div class="p-3 bg-slate-50 rounded border border-slate-200">
                    <span class="text-slate-500 block">Descuento Máximo Permitido:</span>
                    <span class="font-bold text-blue-600 text-sm">{{ selectedClient()?.descuentoMaximo || 0 }}%</span>
                  </div>
                </div>
              </div>
            }

            <!-- TAB 5: ANEXOS & SUCURSAL -->
            @if (erpTab === 'ANEXOS') {
              <div class="bg-white p-3 rounded border border-slate-300 space-y-3">
                <div class="flex items-center gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
                  <input type="checkbox" id="garCheck" [(ngModel)]="generarGarantiaAuto" class="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                  <label for="garCheck" class="font-bold text-slate-800 cursor-pointer text-xs">
                    Generar Boleta de Garantía Automática si contiene artículos con Serie
                  </label>
                </div>

                @if (documentType === 'RECIBO_HONORARIOS') {
                  <div class="flex items-center gap-2 p-2.5 bg-teal-50 rounded border border-teal-200">
                    <input type="checkbox" id="recalcCheck" [(ngModel)]="recalcular" class="w-4 h-4 text-teal-600 rounded cursor-pointer" />
                    <label for="recalcCheck" class="font-bold text-teal-900 cursor-pointer text-xs">
                      Modalidad Recalcular ISV (Tratar productos gravados como exentos en Sucursal)
                    </label>
                  </div>
                }
              </div>
            }

            <!-- FINANCIAL TOTALS SUMMARY DASHBOARD (FOOTER) -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#e4e8ef] p-3 rounded border border-slate-300">
              
              <!-- Left: Totales en Letras & Observaciones -->
              <div class="md:col-span-7 flex flex-col justify-between space-y-2">
                <div class="p-2.5 bg-white rounded border border-slate-300 text-xs">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total en Letras (SAR):</span>
                  <span class="font-black text-slate-900 text-xs tracking-wide">
                    {{ calculateTotals().totalLetras }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button type="button" (click)="resetForm()"
                          class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded transition cursor-pointer">
                    Limpiar Todo
                  </button>
                  <button type="button" (click)="saveInvoice()" [disabled]="saving() || cart.length === 0"
                          class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                    <span>✓ {{ saving() ? 'Emitiendo Comprobante...' : 'EMITIR FACTURA FISCAL SAR' }}</span>
                  </button>
                </div>
              </div>

              <!-- Right: Breakdown of Taxes & Amounts -->
              <div class="md:col-span-5 bg-white p-2.5 rounded border border-slate-300 space-y-1 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Gravado (15%):</span>
                  <span class="font-semibold">L. {{ calculateTotals().subtotalGravado15.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Gravado (18%):</span>
                  <span class="font-semibold">L. {{ calculateTotals().subtotalGravado18.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Exento (0%):</span>
                  <span class="font-semibold">L. {{ calculateTotals().subtotalExento.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Subtotal Exonerado:</span>
                  <span class="font-semibold">L. {{ calculateTotals().subtotalExonerado.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-slate-600">
                  <span>Descuentos Otorgados:</span>
                  <span class="font-semibold text-rose-600">L. {{ calculateTotals().descuentoTotal.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-blue-700 font-bold border-t border-slate-100 pt-1">
                  <span>Impuesto ISV 15%:</span>
                  <span>L. {{ calculateTotals().isv15.toFixed(2) }}</span>
                </div>
                @if (calculateTotals().isv18 > 0) {
                  <div class="flex justify-between text-blue-700 font-bold">
                    <span>Impuesto ISV 18%:</span>
                    <span>L. {{ calculateTotals().isv18.toFixed(2) }}</span>
                  </div>
                }
                <div class="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-800 pt-1.5">
                  <span>TOTAL A PAGAR:</span>
                  <span class="text-emerald-700 text-base">L. {{ calculateTotals().totalGeneral.toFixed(2) }}</span>
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
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
            </div>

            <div class="flex items-center gap-2">
              <select [(ngModel)]="statusFilter"
                      class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-500">
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
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer">
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

  // Active SAP ERP Tab
  erpTab: 'CONTENIDO' | 'SAR' | 'LOGISTICA' | 'FINANZAS' | 'ANEXOS' = 'CONTENIDO';

  // Cart Line Items
  cart: CartLineItem[] = [];
  quickBarcodeInput = '';

  // Modals
  showClientModal = signal(false);
  clientSearchQuery = '';

  showCatalogModal = signal(false);
  catalogSearchQuery = '';

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
        (f.clientRtn && f.clientRtn.toLowerCase().includes(q))
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

  onDocumentTypeChange(): void {
    if (this.documentType !== 'RECIBO_HONORARIOS') {
      this.recalcular = false;
    }
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
        this.erpTab = 'SAR';
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
