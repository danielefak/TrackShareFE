import { InjectionToken } from '@angular/core';

export const ENVIRONMENT = new InjectionToken<{ apiUrl: string }>('environment', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'http://127.0.0.1:8000' // Change as needed
  })
});