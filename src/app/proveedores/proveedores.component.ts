import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiProveedoresService, Proveedor } from '../services/api-proveedores.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Directorio de Proveedores</h2>
          <p class="text-xs text-slate-500 mt-0.5">Control de casas comerciales, distribuidores y contactos directos.</p>
        </div>
        <button (click)="openModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer">
          <span>+ Nuevo Proveedor</span>
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th class="px-6 py-3.5">Empresa / Distribuidora</th>
              <th class="px-6 py-3.5">RTN</th>
              <th class="px-6 py-3.5">Contacto Principal</th>
              <th class="px-6 py-3.5">Teléfono</th>
              <th class="px-6 py-3.5">Correo Electrónico</th>
              <th class="px-6 py-3.5">Dirección</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            @for (p of proveedores(); track p.id) {
              <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-3.5 font-bold text-slate-900">{{ p.name }}</td>
                <td class="px-6 py-3.5 font-mono text-slate-600">{{ p.rtn }}</td>
                <td class="px-6 py-3.5 text-slate-700 font-semibold">{{ p.contactName || 'N/D' }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ p.phone || 'N/D' }}</td>
                <td class="px-6 py-3.5 text-slate-500">{{ p.email || 'N/D' }}</td>
                <td class="px-6 py-3.5 text-slate-600 truncate max-w-xs">{{ p.address || 'N/D' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">No hay proveedores registrados.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal Nuevo Proveedor -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="font-bold text-slate-900 text-base">Registrar Nuevo Proveedor</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form (ngSubmit)="saveProveedor()" class="space-y-3.5">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre Comercial o Razón Social *</label>
                <input type="text" [(ngModel)]="newProv.name" name="name" required
                       class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                       placeholder="Ej: Distribuidora Central S.A." />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">RTN (14 Dígitos) *</label>
                  <input type="text" [(ngModel)]="newProv.rtn" name="rtn" required maxlength="14"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="08011985123456" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Persona de Contacto</label>
                  <input type="text" [(ngModel)]="newProv.contactName" name="contactName"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="Ing. Carlos Mendoza" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                  <input type="text" [(ngModel)]="newProv.phone" name="phone"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="+504 2550-1234" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input type="email" [(ngModel)]="newProv.email" name="email"
                         class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                         placeholder="ventas@proveedor.hn" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Dirección</label>
                <textarea [(ngModel)]="newProv.address" name="address" rows="2"
                          class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                          placeholder="Ciudad, Calle, Local..."></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" (click)="closeModal()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit" [disabled]="saving()"
                        class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50">
                  {{ saving() ? 'Guardando...' : 'Guardar Proveedor' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ProveedoresComponent implements OnInit {
  private service = inject(ApiProveedoresService);
  proveedores = signal<Proveedor[]>([]);
  showModal = signal(false);
  saving = signal(false);

  newProv: Partial<Proveedor> = {
    name: '',
    rtn: '',
    contactName: '',
    phone: '',
    email: '',
    address: ''
  };

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.service.getProveedores().subscribe(data => this.proveedores.set(data));
  }

  openModal(): void {
    this.newProv = { name: '', rtn: '', contactName: '', phone: '', email: '', address: '' };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveProveedor(): void {
    if (!this.newProv.name || !this.newProv.rtn) {
      alert('Nombre y RTN del proveedor son obligatorios.');
      return;
    }

    this.saving.set(true);
    this.service.createProveedor(this.newProv).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadProveedores();
      },
      error: (err) => {
        this.saving.set(false);
        alert(err?.error?.error || 'Error al registrar proveedor');
      }
    });
  }
}
