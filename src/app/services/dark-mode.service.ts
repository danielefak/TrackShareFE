import { Injectable } from '@angular/core';
import { signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  // Initialize darkMode signal based on localStorage value
  private darkMode = signal(localStorage.getItem('darkMode') === 'true'); 

  // Effect to apply dark mode class and save state to localStorage
  applyDarkModeEffect = effect(() => {
    const darkMode = this.darkMode();
    document.body.classList.toggle('darkMode', darkMode);
    localStorage.setItem('darkMode', darkMode.toString()); // Save state to localStorage
  });

  // Toggle dark mode and update the signal value
  toggleDarkMode() {
    this.darkMode.set(!this.darkMode());
  }

  // Check if dark mode is enabled
  isDarkMode() {
    return this.darkMode();
  }
}