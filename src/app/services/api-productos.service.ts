import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  id: string;
  productCode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  purchasePrice: number;
  sellPrice: number;
  marginPercent: number;
  taxType: string;
  stock: number;
  isService: number;
  barcode?: string;
  brand?: string;
  unitOfMeasure?: string;
  stockMin: number;
  manageSeries: number;
  // Aliases
  price?: number;
  cost?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiProductosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getProducts(): Observable<Producto[]> {
    return this.getProductos();
  }

  getProductoById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  createProducto(p: Partial<Producto>): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, p);
  }

  updateProducto(id: string, p: Partial<Producto>): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, p);
  }

  deleteProducto(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
