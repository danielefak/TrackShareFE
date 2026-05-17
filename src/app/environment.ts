import { InjectionToken } from '@angular/core';
import { environment } from '../environments/environment';

export const ENVIRONMENT = new InjectionToken<{ apiUrl: string }>('environment', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: environment.apiUrl
  })
});