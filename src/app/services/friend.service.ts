import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../environment';
import { Observable } from 'rxjs';
import { FriendAccount, FriendAddRequest } from '../models/friend.model';

@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private env = inject(ENVIRONMENT);
  private apiUrl = this.env.apiUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<FriendAccount[]> {
    return this.http.get<FriendAccount[]>(`${this.apiUrl}/v1/friends`);
  }

  add(data: FriendAddRequest): Observable<FriendAccount> {
    return this.http.post<FriendAccount>(`${this.apiUrl}/v1/friends`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/v1/friends/${id}`);
  }

  reorder(id: number, previous_id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/v1/friends/${id}/reorder`, { id, previous_id });
  }
}
