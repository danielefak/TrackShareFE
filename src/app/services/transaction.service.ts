import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../environment';
import { Observable } from 'rxjs';
import { MultiTransactionCreate, MultiTransactionCreated, TransactionItemCreate, MultiTransactionUpdate, MultiTransactionDetailResponse } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;

  constructor(private http: HttpClient) {}

  create(body: MultiTransactionCreate): Observable<MultiTransactionCreated> {
    return this.http.post<MultiTransactionCreated>(`${this.apiUrl}/v1/transactions`, body);
  }

  addItem(mtId: number, body: TransactionItemCreate): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/v1/transactions/${mtId}/items`, body);
  }

  getDetail(mtId: number): Observable<MultiTransactionDetailResponse> {
    return this.http.get<MultiTransactionDetailResponse>(`${this.apiUrl}/v1/home/multitransaction/${mtId}`);
  }

  update(mtId: number, body: MultiTransactionUpdate): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(`${this.apiUrl}/v1/transactions/${mtId}`, body);
  }

  delete(mtId: number): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.apiUrl}/v1/transactions/${mtId}`);
  }
}
