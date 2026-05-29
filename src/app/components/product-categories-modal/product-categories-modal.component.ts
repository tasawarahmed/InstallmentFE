import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ProductCategory } from '../../models/models';

type ModalView = 'list' | 'add' | 'edit' | 'view';

@Component({
  selector: 'app-product-categories-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- LIST -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'list'">
      <div class="modal-box lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Product Categories</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" [(ngModel)]="search" placeholder="Search categories…" />
            </div>
            <button class="btn btn-primary" (click)="openAdd()">
              <span class="material-icons">add</span> Add Category
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
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filtered.length === 0">
                  <td colspan="4"><div class="empty-state"><span class="material-icons">category</span><p>No categories found.</p></div></td>
                </tr>
                <tr *ngFor="let c of filtered; let i = index" (click)="openView(c)">
                  <td>{{ i + 1 }}</td>
                  <td class="font-bold">{{ c.categoryName }}</td>
                  <td>{{ c.description || '—' }}</td>
                  <td>
                    <div class="actions" (click)="$event.stopPropagation()">
                      <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" (click)="openEdit(c)">
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
      <div class="modal-box sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add Category</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #addForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Category Name *</label>
              <input class="form-control" [(ngModel)]="form.categoryName" name="categoryName" required
                #cnField="ngModel" [class.is-invalid]="cnField.invalid && cnField.touched" placeholder="Category name" />
              <div class="invalid-feedback" *ngIf="cnField.invalid && cnField.touched">Category name is required.</div>
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
            {{ saving ? 'Saving…' : 'Add Category' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'edit'">
      <div class="modal-box sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Edit Category</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #editForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Category Name *</label>
              <input class="form-control" [(ngModel)]="form.categoryName" name="categoryName" required
                #cnEditField="ngModel" [class.is-invalid]="cnEditField.invalid && cnEditField.touched" />
              <div class="invalid-feedback" *ngIf="cnEditField.invalid && cnEditField.touched">Required.</div>
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

    <!-- VIEW -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'view'">
      <div class="modal-box sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Category Details</h2>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="openEdit(selected!)">
              <span class="material-icons">edit</span> Edit
            </button>
            <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="modal-body" *ngIf="selected">
          <div class="detail-grid">
            <div class="detail-item full"><span class="detail-label">Category Name</span><span class="detail-value font-bold">{{ selected.categoryName }}</span></div>
            <div class="detail-item full"><span class="detail-label">Description</span><span class="detail-value">{{ selected.description || '—' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spinner.sm { width: 16px; height: 16px; border-width: 2px; display: inline-block; }
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
    .detail-item { display: flex; flex-direction: column; gap: var(--space-1); }
    .detail-item.full { grid-column: 1 / -1; }
    .detail-label { font-size: var(--font-sm); font-weight: 600; color: var(--neutral-500); text-transform: uppercase; letter-spacing: .04em; }
    .detail-value { font-size: var(--font-base); color: var(--neutral-900); }
  `]
})
export class ProductCategoriesModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  view: ModalView = 'list';
  categories: ProductCategory[] = [];
  selected: ProductCategory | null = null;
  loading = true;
  saving = false;
  error = '';
  formError = '';
  search = '';
  form: Partial<ProductCategory> = { categoryName: '', description: '' };

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadCategories(); }

  private loadCategories(): void {
    this.loading = true;
    this.api.getProductCategories().subscribe({
      next: d => { this.categories = d; this.loading = false; },
      error: () => { this.error = 'Failed to load categories.'; this.loading = false; }
    });
  }

  get filtered(): ProductCategory[] {
    const q = this.search.toLowerCase();
    if (!q) return this.categories;
    return this.categories.filter(c => c.categoryName.toLowerCase().includes(q));
  }

  openAdd(): void { this.form = { categoryName: '', description: '' }; this.formError = ''; this.view = 'add'; }
  openEdit(c: ProductCategory): void { this.form = { ...c }; this.formError = ''; this.view = 'edit'; }
  openView(c: ProductCategory): void { this.selected = c; this.view = 'view'; }

  saveAdd(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    const dup = this.categories.find(c => c.categoryName.toLowerCase() === (this.form.categoryName ?? '').toLowerCase());
    if (dup) { this.formError = 'A category with this name already exists.'; return; }
    this.saving = true;
    this.api.createProductCategory(this.form as ProductCategory).subscribe({
      next: () => { this.saving = false; this.loadCategories(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  saveEdit(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.updateProductCategory(this.form.categoryID!, this.form as ProductCategory).subscribe({
      next: () => { this.saving = false; this.loadCategories(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }
}
