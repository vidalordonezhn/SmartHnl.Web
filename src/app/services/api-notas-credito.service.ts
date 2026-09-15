import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotaCredito {
  id: string;
  creditNoteNumber: string;
  caiId: string;
  caiCode: string;
  date: string;
  clientId: string;
  clientName?: string;
  invoiceId: string;
  invoiceNumber: string;
  noteType: string;
  comments?: string;
  subtotalGravado: number;
  subtotalExento: number;
  subtotalExonerado: number;
  isvTotal: number;
  totalGeneral: number;
  status: string;
}

export interface CaiNotaCredito {
  id: string;
  cai: string;
  rangoInicial: string;
  rangoFinal: string;
  correlativoActual: string;
  fechaLimite: string;
  activo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiNotasCreditoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCreditNotes(): Observable<NotaCredito[]> {
    return this.http.get<NotaCredito[]>(`${this.apiUrl}/credit-notes`);
  }

  createCreditNote(payload: Partial<NotaCredito>): Observable<NotaCredito> {
    return this.http.post<NotaCredito>(`${this.apiUrl}/credit-notes`, payload);
  }

  getCais(): Observable<CaiNotaCredito[]> {
    return this.http.get<CaiNotaCredito[]>(`${this.apiUrl}/credit-note-cai`);
  }

  createCai(payload: Partial<CaiNotaCredito>): Observable<CaiNotaCredito> {
    return this.http.post<CaiNotaCredito>(`${this.apiUrl}/credit-note-cai`, payload);
  }
}
