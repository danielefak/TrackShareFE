import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/api.auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoButtonDialogComponent } from '../../components/noButtonDialog.component';

@Component({
  selector: 'app-signin',
  standalone: true,
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
})
export class SigninComponent {
  signinForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.signinForm = this.fb.group({
      first_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirm_password: ['', Validators.required],
    });
  }

  signin() {
    if (this.signinForm.invalid) return;
    const { first_name, email, password, confirm_password } = this.signinForm.value;
    if (password !== confirm_password) {
      this.openDialog('Passwords do not match', 'Please make sure your passwords match.');
      return;
    }
    this.authService.register(email, password, first_name).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        const msg = err.error?.detail || 'Registration failed. Please try again.';
        this.openDialog('Registration Failed', msg);
      }
    });
  }

  openDialog(title: string, text: string): void {
    this.dialog.open(NoButtonDialogComponent, {
      data: { title, text }
    });
  }
}
