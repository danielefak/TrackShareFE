import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENVIRONMENT } from '../environment';

const PALETTES = [
  'azure', 'orange', 'violet', 'green', 'red', 'blue', 'yellow',
  'cyan', 'magenta', 'chartreuse', 'spring-green', 'rose',
];

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private http = inject(HttpClient);
  private apiUrl = inject(ENVIRONMENT).apiUrl;

  theme = signal<'light' | 'dark'>('light');
  color = signal('azure');

  private applyEffect = effect(() => {
    const t = this.theme();
    const c = this.color();
    document.body.classList.toggle('darkMode', t === 'dark');
    PALETTES.forEach(p => document.body.classList.remove(p));
    document.body.classList.add(c);
  });

  init(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.http.get<any>(`${this.apiUrl}/v1/profile`).subscribe({
      next: (profile) => {
        this.theme.set(profile.theme || 'light');
        this.color.set(profile.color || 'azure');
      },
    });
  }

  toggleDarkMode(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.save();
  }

  changeColor(color: string): void {
    this.color.set(color);
    this.save();
  }

  isDarkMode(): boolean {
    return this.theme() === 'dark';
  }

  private save(): void {
    this.http.put(`${this.apiUrl}/v1/profile`, {
      theme: this.theme(),
      color: this.color(),
    }).subscribe({ error: () => {} });
  }
}
