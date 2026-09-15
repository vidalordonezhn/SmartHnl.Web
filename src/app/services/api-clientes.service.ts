import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  id: string;
  name: string;
  rtn: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  creditDays: number;
  status: string;
  tipoPersona: string;
  categoryId: string;
  categoryName?: string;
  descuentoMaximo: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiClientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clients`;

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  getClients(): Observable<Cliente[]> {
    return this.getClientes();
  }

  getClienteById(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  createCliente(c: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, c);
  }

  updateCliente(id: string, c: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, c);
  }

  deleteCliente(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
