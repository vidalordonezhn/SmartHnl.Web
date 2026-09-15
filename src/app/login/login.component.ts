import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiAuthService } from '../services/api-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
          <div class="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center font-black text-white text-2xl mb-3 shadow-lg shadow-blue-500/30">
            S
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Smart HNL POS</h2>
          <p class="text-xs text-slate-400 mt-1">Facturación Fiscal SAR & ERP Honduras</p>
        </div>

        <form (ngSubmit)="onLogin()" class="space-y-4">
          @if (errorMessage()) {
            <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
              {{ errorMessage() }}
            </div>
          }

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Usuario</label>
            <input type="text" [(ngModel)]="username" name="username" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition"
                   placeholder="admin o cajero" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition"
                   placeholder="••••••••" />
          </div>

          <button type="submit" [disabled]="loading()"
                  class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 disabled:opacity-50 mt-2">
            {{ loading() ? 'Iniciando sesión...' : 'Ingresar al Sistema' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(ApiAuthService);
  private router = inject(Router);

  username = 'admin';
  password = 'admin';
  loading = signal(false);
  errorMessage = signal('');

  onLogin(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'Usuario o contraseña incorrectos.');
      }
    });
  }
}
