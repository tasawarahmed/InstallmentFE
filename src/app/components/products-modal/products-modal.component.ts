import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, ProductCategory } from '../../models/models';

type ModalView = 'list' | 'add' | 'edit' | 'view';

@Component({
  selector: 'app-products-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- LIST -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'list'">
      <div class="modal-box xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Products</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" [(ngModel)]="search" placeholder="Search products…" />
            </div>
            <button class="btn btn-primary" (click)="openAdd()">
              <span class="material-icons">add</span> Add Product
            </button>
            <button class="modal-close" (click)="close.emit()"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="modal-body">
          <div class="loading-center" *ngIf="loading"><div class="spinner"></div></div>
          <div class="alert alert-error" *ngIf="error">{{ error }}</div>
          <div class="table-wrapper" *ngIf="!loading">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Category</th>
                  <th>Cost Price</th>
                  <th>Sale Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filtered.length === 0">
                  <td colspan="9"><div class="empty-state"><span class="material-icons">inventory_2</span><p>No products found.</p></div></td>
                </tr>
                <tr *ngFor="let p of filtered; let i = index" (click)="openView(p)">
                  <td>{{ i + 1 }}</td>
                  <td class="font-bold">{{ p.productName }}</td>
                  <td>{{ p.brand || '—' }}</td>
                  <td>{{ p.model || '—' }}</td>
                  <td>{{ getCategoryName(p.categoryID) }}</td>
                  <td>{{ p.costPrice | number:'1.2-2' }}</td>
                  <td>{{ p.salePrice | number:'1.2-2' }}</td>
                  <td><span class="badge" [ngClass]="statusClass(p.status)">{{ p.status }}</span></td>
                  <td>
                    <div class="actions" (click)="$event.stopPropagation()">
                      <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" (click)="openEdit(p)">
                        <span class="material-icons" style="font-size:14px">edit</span> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'add'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add New Product</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #addForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Product Name *</label>
              <input class="form-control" [(ngModel)]="form.productName" name="productName" required
                #pnField="ngModel" [class.is-invalid]="pnField.invalid && pnField.touched" placeholder="Product name" />
              <div class="invalid-feedback" *ngIf="pnField.invalid && pnField.touched">Product name is required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Brand</label>
                <input class="form-control" [(ngModel)]="form.brand" name="brand" placeholder="Brand" />
              </div>
              <div class="form-group">
                <label class="form-label">Model</label>
                <input class="form-control" [(ngModel)]="form.model" name="model" placeholder="Model" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-control" [(ngModel)]="form.categoryID" name="categoryID">
                  <option [ngValue]="undefined">— Select Category —</option>
                  <option *ngFor="let c of categories" [ngValue]="c.categoryID">{{ c.categoryName }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="form.status" name="status" required>
                  <option value="Available">Available</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="OutOfStock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Cost Price *</label>
                <input class="form-control" type="number" [(ngModel)]="form.costPrice" name="costPrice" required min="0"
                  #cpField="ngModel" [class.is-invalid]="cpField.invalid && cpField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="cpField.invalid && cpField.touched">Cost price is required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Sale Price *</label>
                <input class="form-control" type="number" [(ngModel)]="form.salePrice" name="salePrice" required min="0"
                  #spField="ngModel" [class.is-invalid]="spField.invalid && spField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="spField.invalid && spField.touched">Sale price is required.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" [(ngModel)]="form.description" name="description" rows="3" placeholder="Optional description"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="view = 'list'">Cancel</button>
          <button class="btn btn-primary" (click)="saveAdd(addForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Add Product' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'edit'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Edit Product</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #editForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Product Name *</label>
              <input class="form-control" [(ngModel)]="form.productName" name="productName" required
                #pnEditField="ngModel" [class.is-invalid]="pnEditField.invalid && pnEditField.touched" />
              <div class="invalid-feedback" *ngIf="pnEditField.invalid && pnEditField.touched">Required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Brand</label>
                <input class="form-control" [(ngModel)]="form.brand" name="brand" />
              </div>
              <div class="form-group">
                <label class="form-label">Model</label>
                <input class="form-control" [(ngModel)]="form.model" name="model" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-control" [(ngModel)]="form.categoryID" name="categoryID">
                  <option [ngValue]="undefined">— Select Category —</option>
                  <option *ngFor="let c of categories" [ngValue]="c.categoryID">{{ c.categoryName }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="form.status" name="status" required>
                  <option value="Available">Available</option>
                  <option value="Discontinued">Discontinued</option>
                  <option value="OutOfStock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Cost Price *</label>
                <input class="form-control" type="number" [(ngModel)]="form.costPrice" name="costPrice" required min="0"
                  #cpEditField="ngModel" [class.is-invalid]="cpEditField.invalid && cpEditField.touched" />
                <div class="invalid-feedback" *ngIf="cpEditField.invalid && cpEditField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Sale Price *</label>
                <input class="form-control" type="number" [(ngModel)]="form.salePrice" name="salePrice" required min="0"
                  #spEditField="ngModel" [class.is-invalid]="spEditField.invalid && spEditField.touched" />
                <div class="invalid-feedback" *ngIf="spEditField.invalid && spEditField.touched">Required.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" [(ngModel)]="form.description" name="description" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="view = 'list'">Cancel</button>
          <button class="btn btn-primary" (click)="saveEdit(editForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- VIEW DETAIL -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'view'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Product Details</h2>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="openEdit(selected!)">
              <span class="material-icons">edit</span> Edit
            </button>
            <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="modal-body" *ngIf="selected">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Product Name</span><span class="detail-value font-bold">{{ selected.productName }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value"><span class="badge" [ngClass]="statusClass(selected.status)">{{ selected.status }}</span></span></div>
            <div class="detail-item"><span class="detail-label">Brand</span><span class="detail-value">{{ selected.brand || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Model</span><span class="detail-value">{{ selected.model || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Category</span><span class="detail-value">{{ getCategoryName(selected.categoryID) }}</span></div>
            <div class="detail-item"><span class="detail-label">Cost Price</span><span class="detail-value">{{ selected.costPrice | number:'1.2-2' }}</span></div>
            <div class="detail-item"><span class="detail-label">Sale Price</span><span class="detail-value">{{ selected.salePrice | number:'1.2-2' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Description</span><span class="detail-value">{{ selected.description || '—' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spinner.sm { width: 16px; height: 16px; border-width: 2px; display: inline-block; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .detail-item { display: flex; flex-direction: column; gap: var(--space-1); }
    .detail-item.full { grid-column: 1 / -1; }
    .detail-label { font-size: var(--font-sm); font-weight: 600; color: var(--neutral-500); text-transform: uppercase; letter-spacing: .04em; }
    .detail-value { font-size: var(--font-base); color: var(--neutral-900); }
  `]
})
export class ProductsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  view: ModalView = 'list';
  products: Product[] = [];
  categories: ProductCategory[] = [];
  selected: Product | null = null;
  loading = true;
  saving = false;
  error = '';
  formError = '';
  search = '';
  form: Partial<Product> = this.blankForm();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getProductCategories().subscribe({ next: d => this.categories = d, error: () => {} });
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading = true;
    this.api.getProducts().subscribe({
      next: d => { this.products = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Failed to load products.'; this.loading = false; }
    });
  }

  get filtered(): Product[] {
    const q = this.search.toLowerCase();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.productName.toLowerCase().includes(q) ||
      (p.brand ?? '').toLowerCase().includes(q) ||
      (p.model ?? '').toLowerCase().includes(q)
    );
  }

  getCategoryName(id?: number): string {
    if (!id) return '—';
    const c = this.categories.find(x => x.categoryID === id);
    return c ? c.categoryName : `#${id}`;
  }

  statusClass(s: string): Record<string, boolean> {
    return { 'badge-success': s === 'Available', 'badge-warning': s === 'OutOfStock', 'badge-danger': s === 'Discontinued' };
  }

  openAdd(): void { this.form = this.blankForm(); this.formError = ''; this.view = 'add'; }
  openEdit(p: Product): void { this.form = { ...p }; this.formError = ''; this.view = 'edit'; }
  openView(p: Product): void { this.selected = p; this.view = 'view'; }

  saveAdd(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.createProduct(this.form as Product).subscribe({
      next: () => { this.saving = false; this.loadProducts(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  saveEdit(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.updateProduct(this.form.productID!, this.form as Product).subscribe({
      next: () => { this.saving = false; this.loadProducts(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }

  private blankForm(): Partial<Product> {
    return { productName: '', brand: '', model: '', categoryID: undefined, costPrice: 0, salePrice: 0, status: 'Available', description: '' };
  }
}
