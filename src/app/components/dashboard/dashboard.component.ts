import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { CustomersModalComponent } from '../customers-modal/customers-modal.component';
import { GuarantorsModalComponent } from '../guarantors-modal/guarantors-modal.component';
import { ProductsModalComponent } from '../products-modal/products-modal.component';
import { InvestorsModalComponent } from '../investors-modal/investors-modal.component';
import { ProductCategoriesModalComponent } from '../product-categories-modal/product-categories-modal.component';

interface DashboardCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  count: number;
  loading: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CustomersModalComponent,
    GuarantorsModalComponent,
    ProductsModalComponent,
    InvestorsModalComponent,
    ProductCategoriesModalComponent
  ],
  template: `
    <div class="dashboard">
      <h1 class="dashboard-heading">Welcome to Installment Management System!</h1>

      <div class="cards-grid">
        <div
          *ngFor="let card of cards"
          class="dash-card"
          [style.--card-accent]="card.color"
          (click)="openModal(card.id)"
          tabindex="0"
          (keydown.enter)="openModal(card.id)"
          role="button"
          [attr.aria-label]="'Open ' + card.title"
        >
          <div class="dash-card-icon">
            <span class="material-icons">{{ card.icon }}</span>
          </div>
          <div class="dash-card-title">{{ card.title }}</div>
          <div class="dash-card-count">
            <div class="spinner sm" *ngIf="card.loading"></div>
            <span *ngIf="!card.loading">{{ card.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <app-customers-modal
      *ngIf="activeModal === 'customers'"
      (close)="activeModal = null"
    />
    <app-guarantors-modal
      *ngIf="activeModal === 'guarantors'"
      (close)="activeModal = null"
    />
    <app-products-modal
      *ngIf="activeModal === 'products'"
      (close)="activeModal = null"
    />
    <app-investors-modal
      *ngIf="activeModal === 'investors'"
      (close)="activeModal = null"
    />
    <app-product-categories-modal
      *ngIf="activeModal === 'categories'"
      (close)="activeModal = null"
    />
  `,
  styles: [`
    .dashboard { max-width: 1200px; margin: 0 auto; }
    .dashboard-heading {
      text-align: center;
      font-size: var(--font-2xl);
      font-weight: 600;
      color: var(--neutral-800);
      margin-bottom: var(--space-10);
      padding-top: var(--space-4);
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--space-6);
    }
    .dash-card {
      background: #fff;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
      padding: var(--space-6) var(--space-6) var(--space-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      border-top: 4px solid var(--card-accent);
      min-height: 160px;
      position: relative;
      outline: none;
    }
    .dash-card:hover, .dash-card:focus {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .dash-card-icon {
      width: 56px; height: 56px;
      border-radius: var(--radius-xl);
      background: var(--card-accent);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-4);
    }
    .dash-card-icon .material-icons { color: #fff; font-size: 28px; }
    .dash-card-title {
      font-size: var(--font-lg);
      font-weight: 600;
      color: var(--neutral-800);
      text-align: center;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .dash-card-count {
      position: absolute;
      bottom: var(--space-3);
      right: var(--space-4);
      font-size: var(--font-xl);
      font-weight: 600;
      color: var(--card-accent);
      min-width: 32px;
      text-align: right;
    }
    .spinner.sm { width: 18px; height: 18px; border-width: 2px; }
    @media (max-width: 640px) {
      .cards-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
      .dashboard-heading { font-size: var(--font-xl); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  activeModal: string | null = null;

  cards: DashboardCard[] = [
    { id: 'customers',   title: 'Customers',          icon: 'people',        color: '#00897b', count: 0, loading: true },
    { id: 'guarantors',  title: 'Guarantors',         icon: 'verified_user', color: '#1976d2', count: 0, loading: true },
    { id: 'products',    title: 'Products',           icon: 'inventory_2',   color: '#f57c00', count: 0, loading: true },
    { id: 'investors',   title: 'Investors',          icon: 'trending_up',   color: '#7b1fa2', count: 0, loading: true },
    { id: 'categories',  title: 'Product Categories', icon: 'category',      color: '#388e3c', count: 0, loading: true },
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCounts();
  }

  private loadCounts(): void {
    this.api.getCustomers().subscribe({
      next: d => this.setCount('customers', d.length),
      error: () => this.setCount('customers', 0)
    });
    this.api.getGuarantors().subscribe({
      next: d => this.setCount('guarantors', d.length),
      error: () => this.setCount('guarantors', 0)
    });
    this.api.getProducts().subscribe({
      next: d => this.setCount('products', d.length),
      error: () => this.setCount('products', 0)
    });
    this.api.getInvestors().subscribe({
      next: d => this.setCount('investors', d.length),
      error: () => this.setCount('investors', 0)
    });
    this.api.getProductCategories().subscribe({
      next: d => this.setCount('categories', d.length),
      error: () => this.setCount('categories', 0)
    });
  }

  private setCount(id: string, count: number): void {
    const card = this.cards.find(c => c.id === id);
    if (card) { card.count = count; card.loading = false; }
  }

  openModal(id: string): void {
    this.activeModal = id;
  }
}
