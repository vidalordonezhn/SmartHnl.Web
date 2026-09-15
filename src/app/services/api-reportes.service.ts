import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiReportesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  getUtilityReport(establishment: string = 'ALL', startDate?: string, endDate?: string): Observable<any> {
    let params = new HttpParams().set('establishment', establishment);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<any>(`${this.apiUrl}/utility-consolidated`, { params });
  }

  getDailyCashAudit(date: string, establishment: string = 'ALL'): Observable<any> {
    const params = new HttpParams().set('date', date).set('establishment', establishment);
    return this.http.get<any>(`${this.apiUrl}/daily-cash-audit`, { params });
  }
}
