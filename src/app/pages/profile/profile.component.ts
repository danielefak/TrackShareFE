import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, Profile } from '../../services/api.auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  profile: Profile | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      notify: [false],
    });
    this.passwordForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', Validators.required],
      confirm_password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.authService.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.profileForm.patchValue({ first_name: p.first_name, email: p.email, notify: p.notify });
      },
      error: () => this.snackbar.open('Failed to load profile', 'Close', { verticalPosition: 'top' }),
    });
  }

  updateProfile() {
    if (this.profileForm.invalid) return;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (p) => {
        this.profile = p;
        this.snackbar.open('Profile updated', 'Close', { verticalPosition: 'top' });
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Update failed', 'Close', { verticalPosition: 'top' });
      },
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) return;
    const { old_password, new_password, confirm_password } = this.passwordForm.value;
    if (new_password !== confirm_password) {
      this.snackbar.open('Passwords do not match', 'Close', { verticalPosition: 'top' });
      return;
    }
    this.authService.changePassword(old_password, new_password).subscribe({
      next: () => {
        this.snackbar.open('Password updated', 'Close', { verticalPosition: 'top' });
        this.passwordForm.reset();
      },
      error: (err) => {
        this.snackbar.open(err.error?.detail || 'Failed to change password', 'Close', { verticalPosition: 'top' });
      },
    });
  }

  copyKey() {
    const key = this.profile?.friend_key;
    if (!key) return;
    navigator.clipboard.writeText(key).then(() => {
      this.snackbar.open('Friend key copied', 'Close', { verticalPosition: 'top', duration: 2000 });
    });
  }

  refreshKey() {
    this.authService.refreshFriendKey().subscribe({
      next: (p) => {
        this.profile = p;
        this.snackbar.open('New friend key generated', 'Close', { verticalPosition: 'top' });
      },
      error: () => this.snackbar.open('Failed to refresh key', 'Close', { verticalPosition: 'top' }),
    });
  }
}
