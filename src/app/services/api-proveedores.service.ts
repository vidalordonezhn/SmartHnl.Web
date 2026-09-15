import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Proveedor {
  id: string;
  name: string;
  rtn: string;
  email: string;
  phone: string;
  address: string;
  contactName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiProveedoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/providers`;

  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  getProviders(): Observable<Proveedor[]> {
    return this.getProveedores();
  }

  createProveedor(p: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, p);
  }

  updateProveedor(id: string, p: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, p);
  }

  deleteProveedor(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
