import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="material-icons logo-icon">account_balance</span>
        </div>
        <h1 class="login-title">Al-Wahab</h1>
        <p class="login-subtitle">Installment Management System</p>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input
              id="username"
              type="text"
              class="form-control"
              [class.is-invalid]="usernameInput.invalid && usernameInput.touched"
              name="username"
              [(ngModel)]="username"
              #usernameInput="ngModel"
              required
              minlength="3"
              placeholder="Enter username"
              autocomplete="username"
            />
            <div class="invalid-feedback" *ngIf="usernameInput.invalid && usernameInput.touched">
              <span *ngIf="usernameInput.errors?.['required']">Username is required.</span>
              <span *ngIf="usernameInput.errors?.['minlength']">Username must be at least 3 characters.</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-wrapper">
              <input
                id="password"
                [type]="showPassword ? 'text' : 'password'"
                class="form-control"
                [class.is-invalid]="passwordInput.invalid && passwordInput.touched"
                name="password"
                [(ngModel)]="password"
                #passwordInput="ngModel"
                required
                minlength="4"
                placeholder="Enter password"
                autocomplete="current-password"
              />
              <button type="button" class="pw-toggle" (click)="showPassword = !showPassword">
                <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <div class="invalid-feedback" *ngIf="passwordInput.invalid && passwordInput.touched">
              <span *ngIf="passwordInput.errors?.['required']">Password is required.</span>
              <span *ngIf="passwordInput.errors?.['minlength']">Password must be at least 4 characters.</span>
            </div>
          </div>

          <div class="alert alert-error" *ngIf="errorMsg">{{ errorMsg }}</div>

          <button type="submit" class="btn btn-primary login-btn" [disabled]="loading">
            <span class="material-icons" *ngIf="!loading">login</span>
            <div class="spinner sm" *ngIf="loading"></div>
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-800) 0%, var(--primary-600) 50%, var(--accent-600) 100%);
      padding: var(--space-4);
    }
    .login-card {
      background: #fff;
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-xl);
      padding: var(--space-10) var(--space-8);
      width: 100%;
      max-width: 400px;
      animation: slideUp var(--transition-slow) ease;
    }
    .login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      border-radius: var(--radius-2xl);
      margin: 0 auto var(--space-4);
      box-shadow: var(--shadow-md);
    }
    .logo-icon {
      color: #fff;
      font-size: 36px;
    }
    .login-title {
      text-align: center;
      font-size: var(--font-2xl);
      font-weight: 600;
      color: var(--neutral-900);
      margin-bottom: var(--space-1);
    }
    .login-subtitle {
      text-align: center;
      font-size: var(--font-base);
      color: var(--neutral-500);
      margin-bottom: var(--space-8);
    }
    .password-wrapper {
      position: relative;
    }
    .password-wrapper .form-control {
      padding-right: 40px;
    }
    .pw-toggle {
      position: absolute;
      right: var(--space-2);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--neutral-500);
      display: flex;
      align-items: center;
      padding: var(--space-1);
      border-radius: var(--radius-sm);
      transition: color var(--transition-fast);
    }
    .pw-toggle:hover { color: var(--neutral-800); }
    .pw-toggle .material-icons { font-size: 18px; }
    .login-btn {
      width: 100%;
      justify-content: center;
      padding: var(--space-3);
      font-size: var(--font-md);
      border-radius: var(--radius-lg);
      margin-top: var(--space-2);
    }
    .spinner.sm {
      width: 18px; height: 18px;
      border-width: 2px;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.username || !this.password) return;
    this.loading = true;
    this.errorMsg = '';
    setTimeout(() => {
      const success = this.auth.login(this.username, this.password);
      this.loading = false;
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMsg = 'Invalid username or password. Please try again.';
      }
    }, 500);
  }
}
