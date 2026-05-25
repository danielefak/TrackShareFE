import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ENVIRONMENT } from '../environment';
import { Observable } from 'rxjs';
import { Account, AccountCreate, AccountUpdate, AccountReorder } from '../models/account.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/v1/accounts`);
  }

  get(id: number, filters?: { start_date?: string; end_date?: string; page?: number; per_page?: number }): Observable<Account> {
    let params = new HttpParams();
    if (filters) {
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
      if (filters.page !== undefined) params = params.set('page', String(filters.page));
      if (filters.per_page !== undefined) params = params.set('per_page', String(filters.per_page));
    }
    return this.http.get<Account>(`${this.apiUrl}/v1/accounts/${id}`, { params });
  }

  create(data: AccountCreate): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/v1/accounts`, data);
  }

  update(id: number, data: AccountUpdate): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/v1/accounts/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/accounts/${id}`);
  }

  getDeleted(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/v1/accounts/deleted`);
  }

  restore(id: number): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/v1/accounts/${id}/restore`, {});
  }

  reorder(id: number, previous_id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/v1/accounts/${id}/reorder`, { id, previous_id });
  }
}
