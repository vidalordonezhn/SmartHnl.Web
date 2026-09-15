import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CotizacionDetalle {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  priceUnit: number;
  taxType: string;
  montoGravado: number;
  montoExento: number;
  montoExonerado: number;
  isvCalculated: number;
  customDescription?: string;
  discount: number;
}

export interface Cotizacion {
  id: string;
  quotationNumber: string;
  documentType: string;
  date: string;
  clientId: string;
  clientName?: string;
  clientRtn?: string;
  status: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'FACTURADA';
  validityDays: number;
  paymentType: string;
  paymentTerm?: string;
  isExonerated: number;
  subtotalGravado: number;
  subtotalExento: number;
  subtotalExonerado: number;
  isvTotal: number;
  totalGeneral: number;
  comments?: string;
  userId: string;
  invoiceId?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  customClientName?: string;
  customClientRtn?: string;
  customClientAddress?: string;
  customClientPhone?: string;
  customClientEmail?: string;
  details: CotizacionDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiCotizacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/quotations`;

  getQuotations(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.apiUrl);
  }

  createQuotation(payload: Partial<Cotizacion>): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.apiUrl, payload);
  }

  approveQuotation(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectQuotation(id: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/reject`, { reason });
  }
}
