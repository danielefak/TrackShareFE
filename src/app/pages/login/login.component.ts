import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/api.auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NoButtonDialogComponent } from '../../components/noButtonDialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  showForgot = false;
  forgotEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      password: ['']
    });
  }

  login() {
    const { username, password } = this.loginForm.value;
    this.authService.login(username, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => alert('Invalid credentials')
    });
  }

  recoverPassword() {
    if (!this.forgotEmail) {
      this.openDialog('Missing Email', 'Please enter your email address first.');
      return;
    }
    this.authService.recoverPassword(this.forgotEmail).subscribe({
      next: () => {
        this.openDialog('Email Sent', 'If this email is registered, you will receive a recovery email.');
        this.showForgot = false;
        this.forgotEmail = '';
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to send recovery email';
        this.openDialog('Error', msg);
      }
    });
  }

  openDialog(title: string, text: string): void {
    this.dialog.open(NoButtonDialogComponent, {
      data: { title, text }
    });
  }
}
