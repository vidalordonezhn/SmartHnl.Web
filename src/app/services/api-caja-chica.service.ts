import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CajaChica {
  id: string;
  name: string;
  baseAmount: number;
  minLimit: number;
  responsible: string;
  status: string;
  currentBalance: number;
}

export interface CajaChicaGasto {
  id: string;
  pettyCashId: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  creditorName?: string;
  expenseDate: string;
  description: string;
  receiptNumber?: string;
  amount: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiCajaChicaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/petty-cash`;

  getCajas(): Observable<CajaChica[]> {
    return this.http.get<CajaChica[]>(this.apiUrl);
  }

  getGastos(pettyCashId?: string): Observable<CajaChicaGasto[]> {
    let params = new HttpParams();
    if (pettyCashId) params = params.set('pettyCashId', pettyCashId);
    return this.http.get<CajaChicaGasto[]>(`${this.apiUrl}/expenses`, { params });
  }

  createGasto(payload: Partial<CajaChicaGasto>): Observable<CajaChicaGasto> {
    return this.http.post<CajaChicaGasto>(`${this.apiUrl}/expenses`, payload);
  }
}
