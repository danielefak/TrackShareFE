import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../environment';
import { Observable } from 'rxjs';
import { Category, CategoryCreate, CategoryUpdate, SubCategory, SubCategoryCreate, SubCategoryUpdate } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;

  constructor(private http: HttpClient) {}

  list(type?: 'expense' | 'income' | 'all'): Observable<Category[]> {
    const params = type ? `?type=${type}` : '';
    return this.http.get<Category[]>(`${this.apiUrl}/v1/categories${params}`);
  }

  create(data: CategoryCreate): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/v1/categories`, data);
  }

  update(id: number, data: CategoryUpdate): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/v1/categories/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/categories/${id}`);
  }

  reorder(id: number, previous_id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/v1/categories/${id}/reorder`, { id, previous_id });
  }

  createSubcategory(data: SubCategoryCreate): Observable<SubCategory> {
    return this.http.post<SubCategory>(`${this.apiUrl}/v1/subcategories`, data);
  }

  updateSubcategory(id: number, data: SubCategoryUpdate): Observable<SubCategory> {
    return this.http.put<SubCategory>(`${this.apiUrl}/v1/subcategories/${id}`, data);
  }

  deleteSubcategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/subcategories/${id}`);
  }
}
