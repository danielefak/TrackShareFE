import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  get(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/v1/accounts/${id}`);
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

  reorder(id: number, previous_id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/v1/accounts/${id}/reorder`, { id, previous_id });
  }
}
