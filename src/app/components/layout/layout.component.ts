import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-shell">
      <nav class="navbar">
        <div class="navbar-brand">
          <span class="material-icons brand-icon">account_balance</span>
          <span class="brand-text">Al-Wahab Installment Management System</span>
        </div>
        <div class="navbar-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <span class="material-icons">home</span>
            <span class="nav-label">Home</span>
          </a>
          <button class="nav-logout" (click)="logout()">
            <span class="material-icons">logout</span>
            <span class="nav-label">Logout</span>
          </button>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--primary-700);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-6);
      height: 60px;
      box-shadow: var(--shadow-md);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .brand-icon {
      font-size: 26px;
      color: var(--secondary-400);
    }
    .brand-text {
      font-size: var(--font-lg);
      font-weight: 600;
      letter-spacing: .01em;
      white-space: nowrap;
    }
    .navbar-links {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .nav-link, .nav-logout {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: rgba(255,255,255,.85);
      text-decoration: none;
      font-size: var(--font-base);
      font-weight: 600;
      transition: background var(--transition-fast), color var(--transition-fast);
      background: none;
      border: none;
      cursor: pointer;
      font-family: var(--font-family);
    }
    .nav-link:hover, .nav-logout:hover { background: rgba(255,255,255,.15); color: #fff; }
    .nav-link.active { background: rgba(255,255,255,.2); color: #fff; }
    .nav-link .material-icons,
    .nav-logout .material-icons { font-size: 20px; }
    .main-content {
      flex: 1;
      padding: var(--space-6);
    }
    @media (max-width: 600px) {
      .brand-text { font-size: var(--font-base); }
      .navbar { padding: 0 var(--space-4); }
      .nav-label { display: none; }
    }
  `]
})
export class LayoutComponent {
  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
