import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface KardexEntry {
  id: string;
  productId: string;
  productName?: string;
  date: string;
  type: string; // ENTRADA, SALIDA, VENTA, COMPRA, AJUSTE, RECALCULADO
  quantity: number;
  costUnit: number;
  stockAfter: number;
  reference: string;
  notes: string;
}

export interface InventoryAdjustment {
  productId: string;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  costUnit?: number;
  reference?: string;
  reason?: string;
  notes?: string;
}

export interface Serie {
  id: string;
  productId: string;
  productName?: string;
  numeroSerie: string;
  estado: string;
  invoiceId?: string;
  clientId?: string;
  purchaseId?: string;
  providerId?: string;
  costoCompra: number;
  fechaIngreso?: string;
  fechaVenta?: string;
  usuarioVenta?: string;
  notas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiInventarioService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getKardex(productId?: string): Observable<KardexEntry[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('productId', productId);
    }
    return this.http.get<KardexEntry[]>(`${this.apiUrl}/kardex`, { params });
  }

  adjustInventory(adj: InventoryAdjustment): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/inventory/adjustment`, adj);
  }

  recalculateInventory(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/inventory/recalculate`, {});
  }

  getSeries(productId?: string): Observable<Serie[]> {
    let params = new HttpParams();
    if (productId) {
      params = params.set('productId', productId);
    }
    return this.http.get<Serie[]>(`${this.apiUrl}/series`, { params });
  }

  createSerie(serie: Partial<Serie>): Observable<Serie> {
    return this.http.post<Serie>(`${this.apiUrl}/series`, serie);
  }
}
