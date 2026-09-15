import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiClientesService, Cliente } from '../services/api-clientes.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Directorio de Clientes</h2>
          <p class="text-xs text-slate-500 mt-0.5">Catálogo de clientes, RTN, información de contacto y límites de crédito.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-6 py-3.5">Nombre / Razón Social</th>
              <th class="px-6 py-3.5">RTN</th>
              <th class="px-6 py-3.5">Teléfono</th>
              <th class="px-6 py-3.5">Correo Electrónico</th>
              <th class="px-6 py-3.5">Categoría</th>
              <th class="px-6 py-3.5 text-right">Límite Crédito</th>
              <th class="px-6 py-3.5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (c of clientes(); track c.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-3.5 font-bold text-slate-900">{{ c.name }}</td>
                <td class="px-6 py-3.5 font-mono text-slate-600">{{ c.rtn }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ c.phone || 'N/D' }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ c.email || 'N/D' }}</td>
                <td class="px-6 py-3.5 text-slate-600 font-semibold">{{ c.categoryName || 'General' }}</td>
                <td class="px-6 py-3.5 text-right font-black text-slate-800">L. {{ c.creditLimit.toFixed(2) }}</td>
                <td class="px-6 py-3.5 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                        [ngClass]="c.status === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                    {{ c.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Nuevo Cliente -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Nuevo Cliente</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form (ngSubmit)="saveCliente()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre o Razón Social *</label>
                <input type="text" [(ngModel)]="newClient.name" name="name" required
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                       placeholder="Ej: Distribuidora Morazán S. de R.L." />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">RTN (14 Dígitos) *</label>
                  <input type="text" [(ngModel)]="newClient.rtn" name="rtn" required maxlength="14"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="08011990123456" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                  <input type="text" [(ngModel)]="newClient.phone" name="phone"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="+504 9999-9999" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input type="email" [(ngModel)]="newClient.email" name="email"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="cliente@dominio.com" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Límite de Crédito (L.)</label>
                  <input type="number" [(ngModel)]="newClient.creditLimit" name="creditLimit" min="0" step="0.01"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Dirección Completa</label>
                <textarea [(ngModel)]="newClient.address" name="address" rows="2"
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                          placeholder="Colonia, Calle, Ciudad..."></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" (click)="closeModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving()"
                        class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50">
                  {{ saving() ? 'Guardando...' : 'Guardar Cliente' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ClientesComponent implements OnInit {
  private service = inject(ApiClientesService);
  clientes = signal<Cliente[]>([]);
  showModal = signal(false);
  saving = signal(false);

  newClient: Partial<Cliente> = {
    name: '',
    rtn: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    status: 'ACTIVO'
  };

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.service.getClientes().subscribe(data => this.clientes.set(data));
  }

  openModal(): void {
    this.newClient = { name: '', rtn: '', phone: '', email: '', address: '', creditLimit: 0, status: 'ACTIVO' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCliente(): void {
    if (!this.newClient.name || !this.newClient.rtn) {
      alert('Nombre y RTN son requeridos.');
      return;
    }

    this.saving.set(true);
    this.service.createCliente(this.newClient).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadClientes();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.error || 'Error al registrar cliente');
      }
    });
  }
}
