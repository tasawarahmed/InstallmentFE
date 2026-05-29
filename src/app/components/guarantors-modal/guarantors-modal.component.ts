import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Guarantor, Customer } from '../../models/models';

type ModalView = 'list' | 'add' | 'edit' | 'view';

@Component({
  selector: 'app-guarantors-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- LIST VIEW -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'list'">
      <div class="modal-box xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Guarantors</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" [(ngModel)]="search" placeholder="Search guarantors…" />
            </div>
            <button class="btn btn-primary" (click)="openAdd()">
              <span class="material-icons">add</span> Add Guarantor
            </button>
            <button class="modal-close" (click)="close.emit()">
              <span class="material-icons">close</span>
            </button>
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
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>Relation</th>
                  <th>Occupation</th>
                  <th>Customer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filtered.length === 0">
                  <td colspan="8">
                    <div class="empty-state">
                      <span class="material-icons">verified_user</span>
                      <p>No guarantors found.</p>
                    </div>
                  </td>
                </tr>
                <tr *ngFor="let g of filtered; let i = index" (click)="openView(g)">
                  <td>{{ i + 1 }}</td>
                  <td class="font-bold">{{ g.firstName }} {{ g.lastName }}</td>
                  <td>{{ g.cnic }}</td>
                  <td>{{ g.phone }}</td>
                  <td>{{ g.relation || '—' }}</td>
                  <td>{{ g.occupation || '—' }}</td>
                  <td>{{ getCustomerName(g.customerID) }}</td>
                  <td>
                    <div class="actions" (click)="$event.stopPropagation()">
                      <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" (click)="openEdit(g)">
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

    <!-- ADD VIEW -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'add'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add New Guarantor</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #addForm="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Customer *</label>
                <select class="form-control" [(ngModel)]="form.customerID" name="customerID"
                  required #custField="ngModel" [class.is-invalid]="custField.invalid && custField.touched">
                  <option [ngValue]="0" disabled>Select Customer</option>
                  <option *ngFor="let c of customers" [ngValue]="c.customerID">{{ c.firstName }} {{ c.lastName }}</option>
                </select>
                <div class="invalid-feedback" *ngIf="custField.invalid && custField.touched">Customer is required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Relation</label>
                <input class="form-control" [(ngModel)]="form.relation" name="relation" placeholder="e.g. Father, Brother" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input class="form-control" [(ngModel)]="form.firstName" name="firstName" required
                  #fnField="ngModel" [class.is-invalid]="fnField.invalid && fnField.touched" placeholder="First name" />
                <div class="invalid-feedback" *ngIf="fnField.invalid && fnField.touched">First name is required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input class="form-control" [(ngModel)]="form.lastName" name="lastName" required
                  #lnField="ngModel" [class.is-invalid]="lnField.invalid && lnField.touched" placeholder="Last name" />
                <div class="invalid-feedback" *ngIf="lnField.invalid && lnField.touched">Last name is required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">CNIC *</label>
                <input class="form-control" [(ngModel)]="form.cnic" name="cnic" required pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                  #cnicField="ngModel" [class.is-invalid]="cnicField.invalid && cnicField.touched" placeholder="35202-1234567-1" />
                <div class="invalid-feedback" *ngIf="cnicField.invalid && cnicField.touched">
                  <span *ngIf="cnicField.errors?.['required']">CNIC is required.</span>
                  <span *ngIf="cnicField.errors?.['pattern']">Format: 35202-1234567-1</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input class="form-control" [(ngModel)]="form.phone" name="phone" required
                  #phoneField="ngModel" [class.is-invalid]="phoneField.invalid && phoneField.touched" placeholder="0300-1234567" />
                <div class="invalid-feedback" *ngIf="phoneField.invalid && phoneField.touched">Phone is required.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <input class="form-control" [(ngModel)]="form.address" name="address" placeholder="Full address" />
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input class="form-control" [(ngModel)]="form.occupation" name="occupation" placeholder="Occupation" />
              </div>
              <div class="form-group">
                <label class="form-label">Monthly Income</label>
                <input class="form-control" type="number" [(ngModel)]="form.monthlyIncome" name="monthlyIncome" placeholder="0.00" min="0" />
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="view = 'list'">Cancel</button>
          <button class="btn btn-primary" (click)="saveAdd(addForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Add Guarantor' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT VIEW -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'edit'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Edit Guarantor</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #editForm="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Customer *</label>
                <select class="form-control" [(ngModel)]="form.customerID" name="customerID" required
                  #custEditField="ngModel" [class.is-invalid]="custEditField.invalid && custEditField.touched">
                  <option [ngValue]="0" disabled>Select Customer</option>
                  <option *ngFor="let c of customers" [ngValue]="c.customerID">{{ c.firstName }} {{ c.lastName }}</option>
                </select>
                <div class="invalid-feedback" *ngIf="custEditField.invalid && custEditField.touched">Customer is required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Relation</label>
                <input class="form-control" [(ngModel)]="form.relation" name="relation" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input class="form-control" [(ngModel)]="form.firstName" name="firstName" required
                  #fnEditField="ngModel" [class.is-invalid]="fnEditField.invalid && fnEditField.touched" />
                <div class="invalid-feedback" *ngIf="fnEditField.invalid && fnEditField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input class="form-control" [(ngModel)]="form.lastName" name="lastName" required
                  #lnEditField="ngModel" [class.is-invalid]="lnEditField.invalid && lnEditField.touched" />
                <div class="invalid-feedback" *ngIf="lnEditField.invalid && lnEditField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">CNIC *</label>
                <input class="form-control" [(ngModel)]="form.cnic" name="cnic" required pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                  #cnicEditField="ngModel" [class.is-invalid]="cnicEditField.invalid && cnicEditField.touched" />
                <div class="invalid-feedback" *ngIf="cnicEditField.invalid && cnicEditField.touched">
                  <span *ngIf="cnicEditField.errors?.['required']">Required.</span>
                  <span *ngIf="cnicEditField.errors?.['pattern']">Format: 35202-1234567-1</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input class="form-control" [(ngModel)]="form.phone" name="phone" required
                  #phoneEditField="ngModel" [class.is-invalid]="phoneEditField.invalid && phoneEditField.touched" />
                <div class="invalid-feedback" *ngIf="phoneEditField.invalid && phoneEditField.touched">Required.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <input class="form-control" [(ngModel)]="form.address" name="address" />
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input class="form-control" [(ngModel)]="form.occupation" name="occupation" />
              </div>
              <div class="form-group">
                <label class="form-label">Monthly Income</label>
                <input class="form-control" type="number" [(ngModel)]="form.monthlyIncome" name="monthlyIncome" min="0" />
              </div>
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
          <h2>Guarantor Details</h2>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="openEdit(selected!)">
              <span class="material-icons">edit</span> Edit
            </button>
            <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="modal-body" *ngIf="selected">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">{{ selected.firstName }} {{ selected.lastName }}</span></div>
            <div class="detail-item"><span class="detail-label">CNIC</span><span class="detail-value">{{ selected.cnic }}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">{{ selected.phone }}</span></div>
            <div class="detail-item"><span class="detail-label">Relation</span><span class="detail-value">{{ selected.relation || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Customer</span><span class="detail-value">{{ getCustomerName(selected.customerID) }}</span></div>
            <div class="detail-item"><span class="detail-label">Occupation</span><span class="detail-value">{{ selected.occupation || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Monthly Income</span><span class="detail-value">{{ selected.monthlyIncome ? (selected.monthlyIncome | number:'1.2-2') : '—' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Address</span><span class="detail-value">{{ selected.address || '—' }}</span></div>
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
export class GuarantorsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  view: ModalView = 'list';
  guarantors: Guarantor[] = [];
  customers: Customer[] = [];
  selected: Guarantor | null = null;
  loading = true;
  saving = false;
  error = '';
  formError = '';
  search = '';

  form: Partial<Guarantor> = this.blankForm();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCustomers().subscribe({ next: d => this.customers = d, error: () => {} });
    this.loadGuarantors();
  }

  private loadGuarantors(): void {
    this.loading = true;
    this.api.getGuarantors().subscribe({
      next: d => { this.guarantors = d; this.loading = false; },
      error: () => { this.error = 'Failed to load guarantors.'; this.loading = false; }
    });
  }

  get filtered(): Guarantor[] {
    const q = this.search.toLowerCase();
    if (!q) return this.guarantors;
    return this.guarantors.filter(g =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
      g.cnic.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q) ||
      (g.relation ?? '').toLowerCase().includes(q)
    );
  }

  getCustomerName(id: number): string {
    const c = this.customers.find(x => x.customerID === id);
    return c ? `${c.firstName} ${c.lastName}` : `#${id}`;
  }

  openAdd(): void {
    this.form = this.blankForm();
    this.formError = '';
    this.view = 'add';
  }

  openEdit(g: Guarantor): void {
    this.form = { ...g };
    this.formError = '';
    this.view = 'edit';
  }

  openView(g: Guarantor): void {
    this.selected = g;
    this.view = 'view';
  }

  saveAdd(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    const dup = this.guarantors.find(g => g.cnic === this.form.cnic);
    if (dup) { this.formError = 'A guarantor with this CNIC already exists.'; return; }
    this.saving = true;
    this.api.createGuarantor(this.form as Guarantor).subscribe({
      next: () => { this.saving = false; this.loadGuarantors(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save. Please try again.'; }
    });
  }

  saveEdit(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.updateGuarantor(this.form.guarantorID!, this.form as Guarantor).subscribe({
      next: () => { this.saving = false; this.loadGuarantors(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save. Please try again.'; }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }

  private blankForm(): Partial<Guarantor> {
    return { customerID: 0, firstName: '', lastName: '', cnic: '', phone: '', relation: '', address: '', occupation: '', monthlyIncome: undefined };
  }
}
