import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type EstablishmentFilter = 'ALL' | 'FACTURA' | 'RECIBO_HONORARIOS';

export interface FacturaDetalle {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  priceUnit: number;
  taxType: string;
  montoGravado?: number;
  montoExento?: number;
  montoExonerado?: number;
  isvCalculated?: number;
  serialNumber?: string;
  costUnit?: number;
  customDescription?: string;
  discount: number;
}

export interface Factura {
  id: string;
  invoiceNumber: string;
  documentType: string;
  date: string;
  clientId: string;
  clientName?: string;
  clientRtn?: string;
  customClientName?: string;
  customClientRtn?: string;
  customClientAddress?: string;
  customClientPhone?: string;
  status: string;
  paymentType: string;
  paymentTerm?: string;
  dueDate?: string;
  isExonerated?: number;
  ordenCompraExenta?: string;
  constanciaExoneracion?: string;
  documentoSar?: string;
  subtotalGravado: number;
  subtotalExento: number;
  subtotalExonerado: number;
  isvTotal: number;
  totalGeneral: number;
  comments?: string;
  recalcular: boolean;
  details: FacturaDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiFacturacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invoices`;

  currentEstablishment = signal<EstablishmentFilter>('ALL');

  getInvoices(establishment: EstablishmentFilter = this.currentEstablishment()): Observable<Factura[]> {
    const params = new HttpParams().set('establishment', establishment);
    return this.http.get<Factura[]>(this.apiUrl, { params });
  }

  getInvoiceById(id: string): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/${id}`);
  }

  createInvoice(payload: any): Observable<Factura> {
    return this.http.post<Factura>(this.apiUrl, payload);
  }

  annulInvoice(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/annul`, {});
  }
}
