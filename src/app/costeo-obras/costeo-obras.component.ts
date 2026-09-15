import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCosteoObrasService, ProyectoCosto, ProyectoCostoItem } from '../services/api-costeo-obras.service';
import { ApiClientesService, Cliente } from '../services/api-clientes.service';
import { ApiCotizacionesService, Cotizacion } from '../services/api-cotizaciones.service';

@Component({
  selector: 'app-costeo-obras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Title & Main Action -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Costeo de Obras & Proyectos</h2>
          <p class="text-xs text-slate-500 mt-0.5">Control de partidas, compras de materiales, mano de obra, equipos y margen de rentabilidad.</p>
        </div>

        <div class="flex items-center gap-2">
          @if (selectedProject()) {
            <button (click)="backToList()"
                    class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5">
              <span>← Volver al Listado</span>
            </button>
          } @else {
            <button (click)="openNewProjectModal()"
                    class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center gap-2">
              <span>+ Nuevo Proyecto / Obra</span>
            </button>
          }
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: DASHBOARD & LISTADO DE PROYECTOS -->
      <!-- ========================================================================= -->
      @if (!selectedProject()) {
        
        <!-- KPI METRICS SUMMARY -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Obras Registradas</span>
            <p class="text-2xl font-black text-slate-900">{{ projects().length }}</p>
            <p class="text-[11px] text-emerald-600 font-semibold">{{ activeProjectsCount() }} en ejecución activa</p>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presupuesto / Cotizado Total</span>
            <p class="text-2xl font-black text-blue-600">L. {{ totalQuoted().toFixed(2) }}</p>
            <p class="text-[11px] text-slate-500">Monto total contratado</p>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo Real Ejecutado</span>
            <p class="text-2xl font-black text-rose-600">L. {{ totalCost().toFixed(2) }}</p>
            <p class="text-[11px] text-slate-500">Materiales + Mano Obra + Gastos</p>
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilidad Neta Proyectada</span>
            <p class="text-2xl font-black text-emerald-600">L. {{ totalNetProfit().toFixed(2) }}</p>
            <p class="text-[11px] font-bold text-emerald-700">Margen Promedio: {{ averageMargin().toFixed(1) }}%</p>
          </div>
        </div>

        <!-- Filters & Search -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 flex-1 min-w-[240px]">
            <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar por código (OBRA-...), nombre de obra o cliente..."
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-blue-500" />
          </div>

          <div class="flex items-center gap-2">
            <select [(ngModel)]="statusFilter"
                    class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-blue-500 cursor-pointer">
              <option value="ALL">Todos los Estados</option>
              <option value="ABIERTO">Abierto / En Ejecución</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="CERRADO">Cerrado / Liquidado</option>
            </select>
          </div>
        </div>

        <!-- Projects Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="px-5 py-3.5">Código</th>
                <th class="px-5 py-3.5">Nombre de Obra / Proyecto</th>
                <th class="px-4 py-3.5">Cliente</th>
                <th class="px-4 py-3.5">Inicio / Fin</th>
                <th class="px-4 py-3.5 text-right">Cotizado (L.)</th>
                <th class="px-4 py-3.5 text-right">Costo Real (L.)</th>
                <th class="px-4 py-3.5 text-right">Utilidad (L.)</th>
                <th class="px-4 py-3.5 text-center">Margen</th>
                <th class="px-4 py-3.5 text-center">Estado</th>
                <th class="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              @for (p of filteredProjects(); track p.id) {
                <tr class="hover:bg-slate-50/80 transition cursor-pointer" (click)="selectProject(p)">
                  <td class="px-5 py-3.5 font-bold text-blue-600">{{ p.code }}</td>
                  <td class="px-5 py-3.5 font-bold text-slate-900">
                    {{ p.projectName }}
                    @if (p.quotationNumber) {
                      <span class="block text-[10px] text-slate-400 font-normal">Cotización: {{ p.quotationNumber }}</span>
                    }
                  </td>
                  <td class="px-4 py-3.5 text-slate-700">
                    {{ p.clientName || 'General' }}
                    @if (p.clientRtn) {
                      <span class="block text-[10px] text-slate-400">RTN: {{ p.clientRtn }}</span>
                    }
                  </td>
                  <td class="px-4 py-3.5 text-slate-500">
                    {{ p.startDate }}
                    @if (p.estimatedEndDate) {
                      <span class="block text-[10px] text-slate-400">Fin: {{ p.estimatedEndDate }}</span>
                    }
                  </td>
                  <td class="px-4 py-3.5 text-right font-semibold text-slate-900">L. {{ p.quotedAmount.toFixed(2) }}</td>
                  <td class="px-4 py-3.5 text-right font-semibold text-rose-600">L. {{ p.totalCost.toFixed(2) }}</td>
                  <td class="px-4 py-3.5 text-right font-black" [ngClass]="p.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                    L. {{ p.netProfit.toFixed(2) }}
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                          [ngClass]="p.marginPercent >= 20 ? 'bg-emerald-50 text-emerald-700' : p.marginPercent > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'">
                      {{ p.marginPercent.toFixed(1) }}%
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border border-emerald-200': p.status === 'ABIERTO',
                            'bg-blue-50 text-blue-700 border border-blue-200': p.status === 'EN_PROCESO',
                            'bg-slate-100 text-slate-700 border border-slate-200': p.status === 'CERRADO',
                            'bg-purple-50 text-purple-700 border border-purple-200': p.status === 'FINALIZADO'
                          }">
                      {{ p.status }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5 text-center" (click)="$event.stopPropagation()">
                    <button (click)="selectProject(p)"
                            class="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer">
                      🔍 Ver Partidas
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="10" class="px-6 py-12 text-center text-slate-400">
                    No se encontraron proyectos de costeo registrados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- VIEW 2: DETALLE DEL PROYECTO & REGISTRO DE PARTIDAS -->
      <!-- ========================================================================= -->
      @if (selectedProject()) {
        @let proj = selectedProject()!;
        <div class="space-y-4">
          
          <!-- Project Header Card -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-xs rounded-md">{{ proj.code }}</span>
                  <h3 class="font-black text-slate-900 text-lg">{{ proj.projectName }}</h3>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">Cliente: <strong class="text-slate-800">{{ proj.clientName }}</strong> | Responsable: <strong class="text-slate-800">{{ proj.responsible || 'No asignado' }}</strong></p>
              </div>

              <div class="flex items-center gap-2">
                @if (proj.status === 'ABIERTO' || proj.status === 'EN_PROCESO') {
                  <button (click)="openCloseModal()"
                          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer">
                    🔒 Cerrar / Liquidar Obra
                  </button>
                }
                <button (click)="printProjectReport()"
                        class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5">
                  <span>🖨️ Imprimir Liquidación</span>
                </button>
              </div>
            </div>

            <!-- Financial Comparison Row -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span class="text-blue-700 block font-semibold">Presupuesto / Cotizado:</span>
                <span class="text-lg font-black text-blue-900">L. {{ proj.quotedAmount.toFixed(2) }}</span>
              </div>
              <div class="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <span class="text-rose-700 block font-semibold">Costo Real Acumulado:</span>
                <span class="text-lg font-black text-rose-900">L. {{ proj.totalCost.toFixed(2) }}</span>
              </div>
              <div class="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span class="text-emerald-700 block font-semibold">Utilidad Neta:</span>
                <span class="text-lg font-black text-emerald-900">L. {{ proj.netProfit.toFixed(2) }}</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-slate-600 block font-semibold">Margen Real:</span>
                <span class="text-lg font-black text-slate-900">{{ proj.marginPercent.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- Items Table & Add Button -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-slate-900 text-sm">Partidas & Gastos de la Obra</h4>
                <p class="text-xs text-slate-500">Registro detallado de compras de materiales, jornales, subcontratos y viáticos.</p>
              </div>

              @if (proj.status !== 'CERRADO') {
                <button (click)="openAddItemModal()"
                        class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5">
                  <span>+ Registrar Gasto / Partida</span>
                </button>
              }
            </div>

            <!-- Items Table -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th class="px-4 py-3">Fecha</th>
                    <th class="px-4 py-3">Categoría</th>
                    <th class="px-4 py-3">Descripción del Gasto</th>
                    <th class="px-4 py-3">Proveedor / Responsable</th>
                    <th class="px-3 py-3">Comprobante</th>
                    <th class="px-3 py-3 text-center">Cant.</th>
                    <th class="px-3 py-3 text-right">Precio Unit.</th>
                    <th class="px-4 py-3 text-right">Total (L.)</th>
                    @if (proj.status !== 'CERRADO') {
                      <th class="px-3 py-3 text-center w-10">✕</th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  @for (item of proj.items; track item.id) {
                    <tr class="hover:bg-slate-50/60 transition">
                      <td class="px-4 py-2.5 text-slate-500">{{ item.date }}</td>
                      <td class="px-4 py-2.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                              [ngClass]="{
                                'bg-blue-50 text-blue-700': item.category === 'MATERIALES',
                                'bg-amber-50 text-amber-700': item.category === 'MANO_DE_OBRA',
                                'bg-purple-50 text-purple-700': item.category === 'SUBCONTRATOS',
                                'bg-emerald-50 text-emerald-700': item.category === 'TRANSPORTE_FLETE',
                                'bg-indigo-50 text-indigo-700': item.category === 'EQUIPO_HERRAMIENTAS',
                                'bg-rose-50 text-rose-700': item.category === 'CONSUMIBLES',
                                'bg-orange-50 text-orange-700': item.category === 'VIATICOS_ALIMENTACION',
                                'bg-slate-100 text-slate-700': item.category === 'VARIOS'
                              }">
                          {{ getCategoryLabel(item.category) }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5 font-bold text-slate-900">{{ item.description }}</td>
                      <td class="px-4 py-2.5 text-slate-600">{{ item.supplierOrResponsible || 'N/A' }}</td>
                      <td class="px-3 py-2.5 text-slate-500">
                        {{ item.voucherType }} {{ item.receiptNumber ? '#' + item.receiptNumber : '' }}
                      </td>
                      <td class="px-3 py-2.5 text-center text-slate-700">{{ item.quantity }}</td>
                      <td class="px-3 py-2.5 text-right text-slate-700">L. {{ item.unitPrice.toFixed(2) }}</td>
                      <td class="px-4 py-2.5 text-right font-black text-rose-600">L. {{ item.amount.toFixed(2) }}</td>
                      @if (proj.status !== 'CERRADO') {
                        <td class="px-3 py-2.5 text-center">
                          <button (click)="deleteItem(item.id!)" class="text-slate-300 hover:text-rose-600 font-bold cursor-pointer">✕</button>
                        </td>
                      }
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="px-6 py-8 text-center text-slate-400">
                        No hay partidas ni gastos registrados en esta obra aún.
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td colspan="7" class="px-4 py-3 text-right text-slate-700">TOTAL COSTO EJECUTADO:</td>
                    <td class="px-4 py-3 text-right font-black text-rose-600 text-sm">L. {{ proj.totalCost.toFixed(2) }}</td>
                    @if (proj.status !== 'CERRADO') {
                      <td></td>
                    }
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 1: CREAR NUEVA OBRA / PROYECTO -->
      <!-- ========================================================================= -->
      @if (showNewModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Crear Nuevo Proyecto / Obra</h3>
              <button (click)="closeNewModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nombre de la Obra o Proyecto *</label>
                <input type="text" [(ngModel)]="newProjectName" placeholder="Ej: Estructura Metálica Bodega Norte..."
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Cliente</label>
                  <select [(ngModel)]="newClientId" (change)="onNewClientChange()"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500">
                    <option value="">-- Cliente Eventual / General --</option>
                    @for (c of clients(); track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Nombre / Razón Cliente</label>
                  <input type="text" [(ngModel)]="newClientName" placeholder="Nombre cliente..."
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Monto Presupuestado / Cotizado (L.) *</label>
                  <input type="number" [(ngModel)]="newQuotedAmount" min="0" step="0.01" placeholder="0.00"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Responsable de Obra</label>
                  <input type="text" [(ngModel)]="newResponsible" placeholder="Ing. o Maestro de obra..."
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Fecha Inicio</label>
                  <input type="date" [(ngModel)]="newStartDate"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Fecha Estimada Fin</label>
                  <input type="date" [(ngModel)]="newEstimatedEndDate"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeNewModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="saveNewProject()" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer">Crear Proyecto</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 2: REGISTRAR PARTIDA / GASTO -->
      <!-- ========================================================================= -->
      @if (showItemModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Gasto de Obra</h3>
              <button (click)="closeItemModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Categoría del Gasto *</label>
                  <select [(ngModel)]="itemCategory"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-blue-500">
                    <option value="MATERIALES">📦 Materiales y Acero</option>
                    <option value="MANO_DE_OBRA">👷 Mano de Obra y Armado</option>
                    <option value="TRANSPORTE_FLETE">🚚 Transporte y Fletes</option>
                    <option value="SUBCONTRATOS">📑 Subcontratos y Maquilas</option>
                    <option value="EQUIPO_HERRAMIENTAS">🔧 Equipo y Herramientas</option>
                    <option value="CONSUMIBLES">🧯 Consumibles y Soldadura</option>
                    <option value="VIATICOS_ALIMENTACION">🍱 Viáticos y Alimentación</option>
                    <option value="VARIOS">📎 Otros Gastos Varios</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input type="date" [(ngModel)]="itemDate"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Descripción del Concepto / Gasto *</label>
                <input type="text" [(ngModel)]="itemDescription" placeholder="Ej: 50 Quintales de Varilla 3/8..."
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Proveedor / Suplidor / Operario</label>
                  <input type="text" [(ngModel)]="itemSupplier" placeholder="Nombre suplidor o trabajador..."
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">N° Comprobante / Factura</label>
                  <input type="text" [(ngModel)]="itemReceiptNumber" placeholder="001-001-01-000123"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Cantidad</label>
                  <input type="number" [(ngModel)]="itemQuantity" min="1"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-center text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Precio Unitario (L.)</label>
                  <input type="number" [(ngModel)]="itemUnitPrice" min="0" step="0.01"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-right text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Total Monto (L.)</label>
                  <div class="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-right font-black text-rose-600">
                    L. {{ (itemQuantity * itemUnitPrice).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeItemModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="saveItem()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer">Guardar Partida</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 3: CERRAR / LIQUIDAR OBRA -->
      <!-- ========================================================================= -->
      @if (showCloseModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Liquidar y Cerrar Obra</h3>
              <button (click)="closeCloseModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              <p class="text-slate-600">Al cerrar la obra, quedará formalmente liquidada con los costos acumulados y no se podrán agregar más partidas.</p>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Notas de Cierre / Liquidación</label>
                <textarea [(ngModel)]="closeNotes" rows="3" placeholder="Observaciones finales de entrega de obra..."
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-blue-500"></textarea>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeCloseModal()" class="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="confirmCloseProject()" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer">Confirmar Cierre</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class CosteoObrasComponent implements OnInit {
  private api = inject(ApiCosteoObrasService);
  private apiClientes = inject(ApiClientesService);
  private apiCotizaciones = inject(ApiCotizacionesService);

  projects = signal<ProyectoCosto[]>([]);
  clients = signal<Cliente[]>([]);
  quotations = signal<Cotizacion[]>([]);

  selectedProject = signal<ProyectoCosto | null>(null);

  searchQuery = '';
  statusFilter = 'ALL';

  // New Project Modal State
  showNewModal = signal(false);
  newProjectName = '';
  newClientId = '';
  newClientName = '';
  newQuotedAmount = 0;
  newResponsible = '';
  newStartDate = new Date().toISOString().split('T')[0];
  newEstimatedEndDate = '';

  // Add Item Modal State
  showItemModal = signal(false);
  itemCategory: ProyectoCostoItem['category'] = 'MATERIALES';
  itemDate = new Date().toISOString().split('T')[0];
  itemDescription = '';
  itemSupplier = '';
  itemReceiptNumber = '';
  itemQuantity = 1;
  itemUnitPrice = 0;

  // Close Project Modal State
  showCloseModal = signal(false);
  closeNotes = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getProjectCosts().subscribe(res => {
      this.projects.set(res);
      if (this.selectedProject()) {
        const updated = res.find(p => p.id === this.selectedProject()!.id);
        if (updated) this.selectedProject.set(updated);
      }
    });
    this.apiClientes.getClientes().subscribe(res => this.clients.set(res));
    this.apiCotizaciones.getQuotations().subscribe(res => this.quotations.set(res));
  }

  filteredProjects = computed(() => {
    let list = this.projects();
    if (this.statusFilter !== 'ALL') {
      list = list.filter(p => p.status === this.statusFilter);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p => 
        p.code.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
      );
    }
    return list;
  });

  activeProjectsCount = computed(() => {
    return this.projects().filter(p => p.status === 'ABIERTO' || p.status === 'EN_PROCESO').length;
  });

  totalQuoted = computed(() => {
    return this.projects().reduce((acc, p) => acc + p.quotedAmount, 0);
  });

  totalCost = computed(() => {
    return this.projects().reduce((acc, p) => acc + p.totalCost, 0);
  });

  totalNetProfit = computed(() => {
    return this.projects().reduce((acc, p) => acc + p.netProfit, 0);
  });

  averageMargin = computed(() => {
    const q = this.totalQuoted();
    return q > 0 ? (this.totalNetProfit() / q) * 100 : 0;
  });

  selectProject(p: ProyectoCosto): void {
    this.selectedProject.set(p);
  }

  backToList(): void {
    this.selectedProject.set(null);
  }

  getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      'MATERIALES': 'Materiales',
      'MANO_DE_OBRA': 'Mano de Obra',
      'TRANSPORTE_FLETE': 'Transporte',
      'SUBCONTRATOS': 'Subcontrato',
      'EQUIPO_HERRAMIENTAS': 'Herramientas',
      'CONSUMIBLES': 'Consumibles',
      'VIATICOS_ALIMENTACION': 'Viáticos',
      'VARIOS': 'Varios'
    };
    return map[cat] || cat;
  }

  // Modals actions
  openNewProjectModal(): void {
    this.newProjectName = '';
    this.newClientId = '';
    this.newClientName = '';
    this.newQuotedAmount = 0;
    this.newResponsible = '';
    this.newStartDate = new Date().toISOString().split('T')[0];
    this.newEstimatedEndDate = '';
    this.showNewModal.set(true);
  }

  closeNewModal(): void {
    this.showNewModal.set(false);
  }

  onNewClientChange(): void {
    const cli = this.clients().find(c => c.id === this.newClientId);
    if (cli) {
      this.newClientName = cli.name;
    }
  }

  saveNewProject(): void {
    if (!this.newProjectName.trim()) {
      alert('Debe ingresar el nombre del proyecto u obra.');
      return;
    }
    if (this.newQuotedAmount <= 0) {
      alert('Debe ingresar un monto presupuestado o cotizado mayor a 0.');
      return;
    }

    const payload: Partial<ProyectoCosto> = {
      projectName: this.newProjectName.trim(),
      clientId: this.newClientId || undefined,
      clientName: this.newClientName.trim() || 'Cliente General',
      quotedAmount: this.newQuotedAmount,
      responsible: this.newResponsible.trim(),
      startDate: this.newStartDate,
      estimatedEndDate: this.newEstimatedEndDate || undefined,
      status: 'ABIERTO',
      items: []
    };

    this.api.createProjectCost(payload).subscribe({
      next: (created) => {
        this.closeNewModal();
        this.loadData();
        this.selectedProject.set(created);
      },
      error: err => alert('Error al crear proyecto: ' + (err.error?.error || err.message))
    });
  }

  openAddItemModal(): void {
    this.itemCategory = 'MATERIALES';
    this.itemDate = new Date().toISOString().split('T')[0];
    this.itemDescription = '';
    this.itemSupplier = '';
    this.itemReceiptNumber = '';
    this.itemQuantity = 1;
    this.itemUnitPrice = 0;
    this.showItemModal.set(true);
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
  }

  saveItem(): void {
    if (!this.itemDescription.trim()) {
      alert('Debe ingresar la descripción de la partida.');
      return;
    }
    if (this.itemQuantity <= 0 || this.itemUnitPrice <= 0) {
      alert('La cantidad y el precio unitario deben ser mayores a 0.');
      return;
    }

    const payload: Partial<ProyectoCostoItem> = {
      category: this.itemCategory,
      date: this.itemDate,
      description: this.itemDescription.trim(),
      supplierOrResponsible: this.itemSupplier.trim(),
      receiptNumber: this.itemReceiptNumber.trim(),
      voucherType: 'FACTURA',
      quantity: this.itemQuantity,
      unitPrice: this.itemUnitPrice,
      amount: this.itemQuantity * this.itemUnitPrice,
      paymentMethod: 'EFECTIVO'
    };

    this.api.addItem(this.selectedProject()!.id, payload).subscribe({
      next: () => {
        this.closeItemModal();
        this.loadData();
      },
      error: err => alert('Error al registrar partida: ' + (err.error?.error || err.message))
    });
  }

  deleteItem(itemId: string): void {
    if (confirm('¿Desea eliminar esta partida del proyecto?')) {
      this.api.deleteItem(this.selectedProject()!.id, itemId).subscribe({
        next: () => this.loadData(),
        error: err => alert('Error al eliminar partida: ' + (err.error?.error || err.message))
      });
    }
  }

  openCloseModal(): void {
    this.closeNotes = '';
    this.showCloseModal.set(true);
  }

  closeCloseModal(): void {
    this.showCloseModal.set(false);
  }

  confirmCloseProject(): void {
    this.api.closeProject(this.selectedProject()!.id, this.closeNotes).subscribe({
      next: () => {
        this.closeCloseModal();
        this.loadData();
      },
      error: err => alert('Error al cerrar proyecto: ' + (err.error?.error || err.message))
    });
  }

  printProjectReport(): void {
    const proj = this.selectedProject();
    if (!proj) return;

    const rows = proj.items.map(it => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
        <td style="padding: 6px;">${it.date}</td>
        <td style="padding: 6px; font-weight: bold;">${this.getCategoryLabel(it.category)}</td>
        <td style="padding: 6px;">${it.description}</td>
        <td style="padding: 6px;">${it.supplierOrResponsible || 'N/A'}</td>
        <td style="padding: 6px; text-align: center;">${it.quantity}</td>
        <td style="padding: 6px; text-align: right;">L. ${it.unitPrice.toFixed(2)}</td>
        <td style="padding: 6px; text-align: right; font-weight: bold;">L. ${it.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Liquidación de Costos de Obra - ${proj.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; padding: 25px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0f172a; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
  </style>
</head>
<body>
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 15px;">
    <div>
      <h1 style="margin: 0; font-size: 18px; font-weight: 900; color: #1e3a8a;">EMPRESA HONDURAS S.A.</h1>
      <p style="margin: 2px 0; color: #64748b;">RTN: 05019654135885 | Control de Costos de Proyectos</p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 15px; font-weight: 900; color: #2563eb;">LIQUIDACIÓN DE COSTOS DE OBRA</div>
      <div style="font-size: 13px; font-weight: 800;">${proj.code}</div>
      <div style="font-size: 10px; color: #64748b;">Fecha Informe: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="box">
    <table style="width: 100%; font-size: 11px;">
      <tr>
        <td style="width: 50%;"><strong>PROYECTO:</strong> ${proj.projectName}</td>
        <td style="width: 50%;"><strong>ESTADO:</strong> ${proj.status}</td>
      </tr>
      <tr>
        <td><strong>CLIENTE:</strong> ${proj.clientName}</td>
        <td><strong>RESPONSABLE:</strong> ${proj.responsible || 'N/A'}</td>
      </tr>
      <tr>
        <td><strong>FECHA INICIO:</strong> ${proj.startDate}</td>
        <td><strong>FECHA FINAL:</strong> ${proj.closedDate || proj.estimatedEndDate || 'En ejecución'}</td>
      </tr>
    </table>
  </div>

  <div style="display: flex; gap: 10px; margin-bottom: 15px;">
    <div style="flex: 1; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
      <span style="font-size: 10px; color: #1e40af; display: block;">Presupuesto Cotizado:</span>
      <span style="font-size: 14px; font-weight: 900; color: #1e3a8a;">L. ${proj.quotedAmount.toFixed(2)}</span>
    </div>
    <div style="flex: 1; padding: 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px;">
      <span style="font-size: 10px; color: #9f1239; display: block;">Costo Real Acumulado:</span>
      <span style="font-size: 14px; font-weight: 900; color: #881337;">L. ${proj.totalCost.toFixed(2)}</span>
    </div>
    <div style="flex: 1; padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
      <span style="font-size: 10px; color: #065f46; display: block;">Utilidad Neta:</span>
      <span style="font-size: 14px; font-weight: 900; color: #064e3b;">L. ${proj.netProfit.toFixed(2)}</span>
    </div>
    <div style="flex: 1; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
      <span style="font-size: 10px; color: #475569; display: block;">Margen de Utilidad:</span>
      <span style="font-size: 14px; font-weight: 900; color: #0f172a;">${proj.marginPercent.toFixed(1)}%</span>
    </div>
  </div>

  <h3 style="font-size: 12px; font-weight: 900; margin: 15px 0 5px 0;">Detalle de Partidas y Gastos Ejecutados</h3>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Categoría</th>
        <th>Descripción</th>
        <th>Proveedor / Suplidor</th>
        <th style="text-align: center;">Cant.</th>
        <th style="text-align: right;">P. Unit.</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="background: #f1f5f9; font-weight: bold;">
        <td colspan="6" style="padding: 8px; text-align: right;">TOTAL COSTO DE OBRA:</td>
        <td style="padding: 8px; text-align: right; color: #e11d48; font-size: 12px;">L. ${proj.totalCost.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => printWin.print(), 350);
    }
  }
}
