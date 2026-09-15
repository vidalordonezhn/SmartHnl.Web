import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProyectoCostoItem {
  id?: string;
  projectCostId?: string;
  date: string;
  category: 'MATERIALES' | 'MANO_DE_OBRA' | 'TRANSPORTE_FLETE' | 'SUBCONTRATOS' | 'EQUIPO_HERRAMIENTAS' | 'CONSUMIBLES' | 'VIATICOS_ALIMENTACION' | 'VARIOS';
  description: string;
  supplierOrResponsible?: string;
  voucherType: string;
  receiptNumber?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export interface ProyectoCosto {
  id: string;
  code: string;
  projectName: string;
  quotationId?: string;
  quotationNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  clientId?: string;
  clientName: string;
  clientRtn?: string;
  clientPhone?: string;
  clientAddress?: string;
  responsible?: string;
  startDate: string;
  estimatedEndDate?: string;
  closedDate?: string;
  closedBy?: string;
  closingNotes?: string;
  status: 'ABIERTO' | 'EN_PROCESO' | 'CERRADO' | 'FACTURADO' | 'FINALIZADO' | 'CANCELADO';
  quotedAmount: number;
  invoicedAmount: number;
  totalCost: number;
  netProfit: number;
  marginPercent: number;
  items: ProyectoCostoItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiCosteoObrasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/project-costs`;

  getProjectCosts(): Observable<ProyectoCosto[]> {
    return this.http.get<ProyectoCosto[]>(this.apiUrl);
  }

  getProjectCostById(id: string): Observable<ProyectoCosto> {
    return this.http.get<ProyectoCosto>(`${this.apiUrl}/${id}`);
  }

  createProjectCost(dto: Partial<ProyectoCosto>): Observable<ProyectoCosto> {
    return this.http.post<ProyectoCosto>(this.apiUrl, dto);
  }

  updateProjectCost(id: string, dto: Partial<ProyectoCosto>): Observable<ProyectoCosto> {
    return this.http.put<ProyectoCosto>(`${this.apiUrl}/${id}`, dto);
  }

  addItem(projectCostId: string, item: Partial<ProyectoCostoItem>): Observable<ProyectoCostoItem> {
    return this.http.post<ProyectoCostoItem>(`${this.apiUrl}/${projectCostId}/items`, item);
  }

  deleteItem(projectCostId: string, itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${projectCostId}/items/${itemId}`);
  }

  closeProject(id: string, notes: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/close`, { notes });
  }

  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
