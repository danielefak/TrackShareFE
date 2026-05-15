import { SummaryResponse, TransactionFilters, ChartResponse, MultiTransactionDetail, AttentionItem } from 'src/app/models/transaction-summary.model';
import { ENVIRONMENT } from '../environment';
import { Injectable, inject } from '@angular/core';
import { AuthService } from './api.auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;

  constructor(private authService: AuthService) {}

  private buildFilterParams(filters?: TransactionFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('start_date', filters.startDate);
    if (filters?.endDate) params.set('end_date', filters.endDate);
    if (filters?.categoryIds?.length) {
      for (const id of filters.categoryIds) params.append('category_ids', String(id));
    }
    if (filters?.subcategoryIds?.length) {
      for (const id of filters.subcategoryIds) params.append('subcategory_ids', String(id));
    }
    if (filters?.accountIds?.length) {
      for (const id of filters.accountIds) params.append('account_ids', String(id));
    }
    if (filters?.search) params.set('search', filters.search);
    if (filters?.isExpense != null) params.set('is_expense', String(filters.isExpense));
    return params;
  }

  private async authFetch(url: string): Promise<Response> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.authService.logout();
      throw new Error('No authentication token found');
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.status === 401) {
      this.authService.logout();
      throw new Error('Unauthorized: Token expired or invalid. Logging out...');
    }
    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }
    return response;
  }

  async getSummary(
    filters?: TransactionFilters,
    page: number = 0,
    perPage: number = 50
  ): Promise<SummaryResponse> {
    const params = this.buildFilterParams(filters);
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    const response = await this.authFetch(`${this.apiUrl}/v1/home?${params.toString()}`);
    return response.json();
  }

  async getChartData(filters?: TransactionFilters): Promise<ChartResponse> {
    const params = this.buildFilterParams(filters);
    const response = await this.authFetch(`${this.apiUrl}/v1/home/charts?${params.toString()}`);
    return response.json();
  }

  async getMultiTransactionDetail(mtId: number): Promise<MultiTransactionDetail> {
    const response = await this.authFetch(`${this.apiUrl}/v1/home/multitransaction/${mtId}`);
    return response.json();
  }

  async getAttention(): Promise<AttentionItem[]> {
    const response = await this.authFetch(`${this.apiUrl}/v1/attention`);
    return response.json();
  }
}
