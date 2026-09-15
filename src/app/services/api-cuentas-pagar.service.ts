import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentItem {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
}

export interface CuentaPorPagar {
  id: string;
  purchaseId: string;
  purchaseNumber: string;
  providerId: string;
  providerName?: string;
  providerRtn?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string; // PENDIENTE, PARCIAL, PAGADA, VENCIDA
  dueDate: string;
  payments: string; // JSON array of PaymentItem
}

export interface RegistrarPagoProveedorRequest {
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiCuentasPagarService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts-payable`;

  getAll(): Observable<CuentaPorPagar[]> {
    return this.http.get<CuentaPorPagar[]>(this.apiUrl);
  }

  addPayment(id: string, req: RegistrarPagoProveedorRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/payment`, req);
  }
}
