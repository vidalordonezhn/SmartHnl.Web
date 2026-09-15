import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CompraDetalle {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  costUnit: number;
  total: number;
}

export interface Compra {
  id: string;
  purchaseNumber: string;
  date: string;
  providerId: string;
  providerName?: string;
  providerRtn?: string;
  paymentType: string;
  paymentTerm?: string;
  totalGeneral: number;
  comments?: string;
  status: string;
  details: CompraDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiComprasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/purchases`;

  getPurchases(): Observable<Compra[]> {
    return this.http.get<Compra[]>(this.apiUrl);
  }

  createPurchase(payload: any): Observable<Compra> {
    return this.http.post<Compra>(this.apiUrl, payload);
  }
}
