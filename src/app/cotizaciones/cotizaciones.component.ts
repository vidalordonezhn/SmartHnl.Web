import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCotizacionesService, Cotizacion, CotizacionDetalle } from '../services/api-cotizaciones.service';
import { ApiClientesService, Cliente } from '../services/api-clientes.service';
import { ApiProductosService, Producto } from '../services/api-productos.service';
import { PrintService } from '../services/print.service';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Cotizaciones Comerciales</h2>
          <p class="text-xs text-slate-500 mt-0.5">Gestión de presupuestos y cotizaciones formales para clientes.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Nueva Cotización</span>
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-5 py-3.5">N° Cotización</th>
              <th class="px-4 py-3.5">Fecha</th>
              <th class="px-5 py-3.5">Cliente / RTN</th>
              <th class="px-4 py-3.5">Vigencia</th>
              <th class="px-4 py-3.5">Condición</th>
              <th class="px-4 py-3.5 text-right">Total General</th>
              <th class="px-4 py-3.5 text-center">Estado</th>
              <th class="px-5 py-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (c of cotizaciones(); track c.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-5 py-3.5 font-bold text-blue-600">{{ c.quotationNumber }}</td>
                <td class="px-4 py-3.5 text-slate-500">{{ c.date }}</td>
                <td class="px-5 py-3.5 text-slate-900 font-bold">
                  {{ c.clientName || c.customClientName || 'Cliente General' }}
                  @if (c.clientRtn || c.customClientRtn) {
                    <span class="block text-[10px] text-slate-400 font-normal">RTN: {{ c.clientRtn || c.customClientRtn }}</span>
                  }
                </td>
                <td class="px-4 py-3.5 text-slate-600">{{ c.validityDays }} Días</td>
                <td class="px-4 py-3.5 text-slate-600">{{ c.paymentTerm || c.paymentType }}</td>
                <td class="px-4 py-3.5 text-right font-black text-slate-900">L. {{ c.totalGeneral.toFixed(2) }}</td>
                <td class="px-4 py-3.5 text-center">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        [ngClass]="{
                          'bg-amber-50 text-amber-700 border border-amber-200': c.status === 'PENDIENTE',
                          'bg-emerald-50 text-emerald-700 border border-emerald-200': c.status === 'APROBADA',
                          'bg-rose-50 text-rose-700 border border-rose-200': c.status === 'RECHAZADA',
                          'bg-blue-50 text-blue-700 border border-blue-200': c.status === 'FACTURADA'
                        }">
                    {{ c.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button (click)="printCotizacion(c)" title="Imprimir Cotización"
                            class="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer">
                      📄 Imprimir
                    </button>
                    @if (c.status === 'PENDIENTE') {
                      <button (click)="approve(c.id)" title="Aprobar"
                              class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition cursor-pointer">
                        ✓ Aprobar
                      </button>
                      <button (click)="reject(c.id)" title="Rechazar"
                              class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200 transition cursor-pointer">
                        ✕ Rechazar
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="px-6 py-12 text-center text-slate-400">No hay cotizaciones registradas actualmente.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Nueva Cotización -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Crear Nueva Cotización</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div class="space-y-4 overflow-y-auto flex-1 pr-1">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cliente</label>
                  <select [(ngModel)]="selectedClientId" (change)="onClientChange()"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500">
                    <option value="">-- Cliente Eventual / Personalizado --</option>
                    @for (cli of clientes(); track cli.id) {
                      <option [value]="cli.id">{{ cli.name }} ({{ cli.rtn || 'S/N' }})</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Personalizado</label>
                  <input type="text" [(ngModel)]="customClientName" placeholder="Nombre del prospecto o cliente..."
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">RTN</label>
                  <input type="text" [(ngModel)]="customClientRtn" placeholder="00000000000000"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Días de Validez</label>
                  <input type="number" [(ngModel)]="validityDays" min="1" max="90"
                         class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Condición Pago</label>
                  <select [(ngModel)]="paymentType"
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500">
                    <option value="CONTADO">Contado</option>
                    <option value="CREDITO">Crédito</option>
                  </select>
                </div>
              </div>

              <!-- Selector de Items -->
              <div class="border-t border-slate-100 pt-3">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Productos / Servicios Cotizados</h4>
                  <button (click)="addItem()" class="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">+ Agregar Línea</button>
                </div>

                <div class="space-y-2">
                  @for (item of items; track $index; let idx = $index) {
                    <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <select [(ngModel)]="item.productId" (change)="onProductSelect(item)"
                              class="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900">
                        <option value="">Seleccionar Producto...</option>
                        @for (p of productos(); track p.id) {
                          <option [value]="p.id">{{ p.name }} - L. {{ p.sellPrice }}</option>
                        }
                      </select>
                      <input type="number" [(ngModel)]="item.quantity" min="1" placeholder="Cant"
                             class="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center" />
                      <input type="number" [(ngModel)]="item.priceUnit" min="0" placeholder="Precio"
                             class="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" />
                      <select [(ngModel)]="item.taxType"
                              class="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                        <option value="GRAVADO_15">ISV 15%</option>
                        <option value="GRAVADO_18">ISV 18%</option>
                        <option value="EXENTO">Exento</option>
                      </select>
                      <button (click)="removeItem(idx)" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 cursor-pointer">✕</button>
                    </div>
                  }
                </div>
              </div>

              <!-- Observaciones -->
              <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notas / Observaciones</label>
                <textarea [(ngModel)]="comments" rows="2" placeholder="Términos de entrega, validez especial..."
                          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500"></textarea>
              </div>

              <!-- Totales preview -->
              <div class="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Total Estimado:</span>
                <span class="text-blue-600 font-black text-sm">L. {{ calculateTotal().toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button (click)="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button (click)="saveQuotation()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer">Guardar Cotización</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CotizacionesComponent implements OnInit {
  private api = inject(ApiCotizacionesService);
  private apiClientes = inject(ApiClientesService);
  private apiProductos = inject(ApiProductosService);
  private printService = inject(PrintService);

  cotizaciones = signal<Cotizacion[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);

  showModal = signal(false);

  selectedClientId = '';
  customClientName = '';
  customClientRtn = '';
  validityDays = 15;
  paymentType = 'CONTADO';
  comments = '';

  items: CotizacionDetalle[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getQuotations().subscribe((res: Cotizacion[]) => this.cotizaciones.set(res));
    this.apiClientes.getClientes().subscribe((res: Cliente[]) => this.clientes.set(res));
    this.apiProductos.getProductos().subscribe((res: Producto[]) => this.productos.set(res));
  }

  openModal(): void {
    this.selectedClientId = '';
    this.customClientName = '';
    this.customClientRtn = '';
    this.validityDays = 15;
    this.paymentType = 'CONTADO';
    this.comments = '';
    this.items = [{ productId: '', quantity: 1, priceUnit: 0, taxType: 'GRAVADO_15', montoGravado: 0, montoExento: 0, montoExonerado: 0, isvCalculated: 0, discount: 0 }];
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onClientChange(): void {
    const cli = this.clientes().find(c => c.id === this.selectedClientId);
    if (cli) {
      this.customClientName = cli.name;
      this.customClientRtn = cli.rtn || '';
    }
  }

  addItem(): void {
    this.items.push({ productId: '', quantity: 1, priceUnit: 0, taxType: 'GRAVADO_15', montoGravado: 0, montoExento: 0, montoExonerado: 0, isvCalculated: 0, discount: 0 });
  }

  removeItem(idx: number): void {
    if (this.items.length > 1) {
      this.items.splice(idx, 1);
    }
  }

  onProductSelect(item: CotizacionDetalle): void {
    const p = this.productos().find(prod => prod.id === item.productId);
    if (p) {
      item.priceUnit = p.sellPrice;
      item.taxType = p.taxType || 'GRAVADO_15';
      item.customDescription = p.name;
    }
  }

  calculateTotal(): number {
    return this.items.reduce((acc, it) => {
      const gross = it.quantity * it.priceUnit;
      const isv = it.taxType === 'GRAVADO_18' ? gross * 0.18 : it.taxType === 'GRAVADO_15' ? gross * 0.15 : 0;
      return acc + gross + isv;
    }, 0);
  }

  saveQuotation(): void {
    const validItems = this.items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Debe agregar al menos un producto válido.');
      return;
    }

    const payload: Partial<Cotizacion> = {
      clientId: this.selectedClientId || 'CONSUMIDOR_FINAL',
      customClientName: this.customClientName,
      customClientRtn: this.customClientRtn,
      validityDays: this.validityDays,
      paymentType: this.paymentType,
      comments: this.comments,
      documentType: 'FACTURA',
      details: validItems
    };

    this.api.createQuotation(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadData();
      },
      error: err => alert('Error al crear cotización: ' + (err.error?.error || err.message))
    });
  }

  approve(id: string): void {
    if (confirm('¿Desea aprobar esta cotización?')) {
      this.api.approveQuotation(id).subscribe(() => this.loadData());
    }
  }

  reject(id: string): void {
    const reason = prompt('Motivo del rechazo:');
    if (reason !== null) {
      this.api.rejectQuotation(id, reason).subscribe(() => this.loadData());
    }
  }

  printCotizacion(c: Cotizacion): void {
    this.printService.printCotizacion(c);
  }
}
