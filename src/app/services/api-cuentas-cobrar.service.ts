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

export interface CuentaPorCobrar {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string; // PENDIENTE, PARCIAL, PAGADA, VENCIDA
  dueDate: string;
  payments: string; // JSON array of PaymentItem
}

export interface RegistrarAbonoRequest {
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiCuentasCobrarService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts-receivable`;

  getAll(): Observable<CuentaPorCobrar[]> {
    return this.http.get<CuentaPorCobrar[]>(this.apiUrl);
  }

  addPayment(id: string, req: RegistrarAbonoRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/payment`, req);
  }
}
