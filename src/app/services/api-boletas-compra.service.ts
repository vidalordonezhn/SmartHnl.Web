import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BoletaCompraDetalle {
  id?: string;
  description: string;
  quantity: number;
  priceUnit: number;
  totalItem: number;
}

export interface BoletaCompra {
  id: string;
  boletaNumber: string;
  caiId: string;
  caiCode: string;
  date: string;
  providerId: string;
  providerName: string;
  providerRtn: string;
  providerPhone?: string;
  providerAddress?: string;
  paymentType: string;
  comments?: string;
  subtotal: number;
  totalGeneral: number;
  isExonerated: number;
  status: string;
  details: BoletaCompraDetalle[];
}

export interface CaiBoletaCompra {
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
export class ApiBoletasCompraService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getBoletasCompra(): Observable<BoletaCompra[]> {
    return this.http.get<BoletaCompra[]>(`${this.apiUrl}/boletas-compra`);
  }

  createBoletaCompra(payload: Partial<BoletaCompra>): Observable<BoletaCompra> {
    return this.http.post<BoletaCompra>(`${this.apiUrl}/boletas-compra`, payload);
  }

  getCais(): Observable<CaiBoletaCompra[]> {
    return this.http.get<CaiBoletaCompra[]>(`${this.apiUrl}/boleta-compra-cai`);
  }

  createCai(payload: Partial<CaiBoletaCompra>): Observable<CaiBoletaCompra> {
    return this.http.post<CaiBoletaCompra>(`${this.apiUrl}/boleta-compra-cai`, payload);
  }
}
