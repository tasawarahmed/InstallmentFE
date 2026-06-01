import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Customer, Guarantor, InstallmentPlan, InstallmentPayment, Product } from '../../models/models';

type MainView = 'list' | 'add' | 'edit' | 'view';
type SubView = 'addGuarantor' | 'addPlan' | 'payment' | null;

@Component({
  selector: 'app-customers-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- LIST -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'list' && !subView">
      <div class="modal-box xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Customers</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" [(ngModel)]="search" placeholder="Search customers…" />
            </div>
            <button class="btn btn-primary" (click)="openAdd()">
              <span class="material-icons">add</span> Add Customer
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
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Active Plans</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filtered.length === 0">
                  <td colspan="8"><div class="empty-state"><span class="material-icons">people</span><p>No customers found.</p></div></td>
                </tr>
                <tr *ngFor="let c of filtered; let i = index" (click)="openView(c)">
                  <td>{{ i + 1 }}</td>
                  <td class="font-bold">{{ c.firstName }} {{ c.lastName }}</td>
                  <td>{{ c.cnic }}</td>
                  <td>{{ c.phone }}</td>
                  <td>{{ c.city }}</td>
                  <td><span class="badge" [ngClass]="customerStatusClass(c.status)">{{ c.status }}</span></td>
                  <td>
                    <span class="badge badge-info" *ngIf="getActivePlans(c.customerId!).length > 0">{{ getActivePlans(c.customerId!).length }} plan(s)</span>
                    <span class="text-muted text-sm" *ngIf="getActivePlans(c.customerId!).length === 0">None</span>
                  </td>
                  <td>
                    <div class="actions" (click)="$event.stopPropagation()">
                      <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" (click)="openEdit(c)">
                        <span class="material-icons" style="font-size:13px">edit</span>
                      </button>
                      <button class="btn btn-primary" style="padding:4px 8px;font-size:11px" title="New Plan" (click)="startNewPlan(c)">
                        <span class="material-icons" style="font-size:13px">add_circle</span> Plan
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

    <!-- ADD CUSTOMER -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'add' && !subView">
      <div class="modal-box lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add New Customer</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #addForm="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input class="form-control" [(ngModel)]="custForm.firstName" name="firstName" required
                  #fnField="ngModel" [class.is-invalid]="fnField.invalid && fnField.touched" placeholder="First name" />
                <div class="invalid-feedback" *ngIf="fnField.invalid && fnField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input class="form-control" [(ngModel)]="custForm.lastName" name="lastName" required
                  #lnField="ngModel" [class.is-invalid]="lnField.invalid && lnField.touched" placeholder="Last name" />
                <div class="invalid-feedback" *ngIf="lnField.invalid && lnField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">CNIC *</label>
                <input class="form-control" [(ngModel)]="custForm.cnic" name="cnic" required pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                  #cnicField="ngModel" [class.is-invalid]="cnicField.invalid && cnicField.touched" placeholder="35202-1234567-1" />
                <div class="invalid-feedback" *ngIf="cnicField.invalid && cnicField.touched">
                  <span *ngIf="cnicField.errors?.['required']">Required.</span>
                  <span *ngIf="cnicField.errors?.['pattern']">Format: 35202-1234567-1</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input class="form-control" [(ngModel)]="custForm.phone" name="phone" required
                  #phoneField="ngModel" [class.is-invalid]="phoneField.invalid && phoneField.touched" placeholder="0300-1234567" />
                <div class="invalid-feedback" *ngIf="phoneField.invalid && phoneField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Alternate Phone</label>
                <input class="form-control" [(ngModel)]="custForm.alternatePhone" name="alternatePhone" placeholder="Alternate phone" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" type="email" [(ngModel)]="custForm.email" name="email"
                  #emailField="ngModel" [class.is-invalid]="emailField.invalid && emailField.touched" placeholder="email@example.com" />
                <div class="invalid-feedback" *ngIf="emailField.invalid && emailField.touched">Enter a valid email.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Address *</label>
              <input class="form-control" [(ngModel)]="custForm.address" name="address" required
                #addrField="ngModel" [class.is-invalid]="addrField.invalid && addrField.touched" placeholder="Full address" />
              <div class="invalid-feedback" *ngIf="addrField.invalid && addrField.touched">Required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">City *</label>
                <input class="form-control" [(ngModel)]="custForm.city" name="city" required
                  #cityField="ngModel" [class.is-invalid]="cityField.invalid && cityField.touched" placeholder="City" />
                <div class="invalid-feedback" *ngIf="cityField.invalid && cityField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input class="form-control" type="date" [(ngModel)]="custForm.dateOfBirth" name="dateOfBirth" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input class="form-control" [(ngModel)]="custForm.occupation" name="occupation" placeholder="Occupation" />
              </div>
              <div class="form-group">
                <label class="form-label">Employer Name</label>
                <input class="form-control" [(ngModel)]="custForm.employerName" name="employerName" placeholder="Employer" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Monthly Income</label>
                <input class="form-control" type="number" [(ngModel)]="custForm.monthlyIncome" name="monthlyIncome" min="0" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="custForm.status" name="status" required>
                  <option value="Active">Active</option>
                  <option value="Blacklisted">Blacklisted</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="custForm.notes" name="notes" rows="2" placeholder="Optional notes"></textarea>
            </div>
          </form>

          <!-- Inline Guarantor section -->
          <div class="inline-section">
            <div class="inline-section-header">
              <h3>Guarantors</h3>
              <button class="btn btn-secondary" style="font-size:12px;padding:4px 10px" (click)="addInlineGuarantor()">
                <span class="material-icons" style="font-size:14px">add</span> Add Guarantor
              </button>
            </div>
            <div *ngFor="let g of inlineGuarantors; let gi = index" class="inline-guarantor-row">
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input class="form-control" [(ngModel)]="g.firstName" [name]="'gfn_'+gi" required placeholder="First name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name *</label>
                  <input class="form-control" [(ngModel)]="g.lastName" [name]="'gln_'+gi" required placeholder="Last name" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">CNIC *</label>
                  <input class="form-control" [(ngModel)]="g.cnic" [name]="'gcnic_'+gi" required placeholder="35202-1234567-1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone *</label>
                  <input class="form-control" [(ngModel)]="g.phone" [name]="'gphone_'+gi" required placeholder="0300-1234567" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Relation</label>
                  <input class="form-control" [(ngModel)]="g.relation" [name]="'grel_'+gi" placeholder="Relation" />
                </div>
                <div class="form-group" style="justify-content:flex-end;flex-direction:row;align-items:flex-end">
                  <button class="btn btn-danger" style="font-size:12px;padding:4px 10px" (click)="removeInlineGuarantor(gi)">
                    <span class="material-icons" style="font-size:14px">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Inline Installment Plan -->
          <div class="inline-section">
            <div class="inline-section-header">
              <h3>Installment Plan</h3>
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="addPlanInline" name="addPlanInline" />
                Add Plan
              </label>
            </div>
            <div *ngIf="addPlanInline">
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Product *</label>
                  <select class="form-control" [(ngModel)]="planForm.productID" name="inlineProductID" (change)="onProductChange()">
                    <option [ngValue]="0" disabled>Select Product</option>
                    <option *ngFor="let p of products" [ngValue]="p.productID">{{ p.productName }} — {{ p.salePrice | number:'1.2-2' }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Sale Price *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.productSalePrice" name="inlineSalePrice" min="0" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Down Payment *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.downPayment" name="inlineDP" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tenure (months) *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.tenureMonths" name="inlineTenure" min="6" max="30" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Monthly Installment *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.monthlyInstallment" name="inlineMI" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Start Date *</label>
                  <input class="form-control" type="date" [(ngModel)]="planForm.startDate" name="inlineSD" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Approved By</label>
                <input class="form-control" [(ngModel)]="planForm.approvedBy" name="inlineApprovedBy" placeholder="Staff name" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="view = 'list'">Cancel</button>
          <button class="btn btn-primary" (click)="saveAdd(addForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Add Customer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT CUSTOMER -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'edit' && !subView">
      <div class="modal-box lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Edit Customer</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #editForm="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input class="form-control" [(ngModel)]="custForm.firstName" name="firstName" required
                  #fnEField="ngModel" [class.is-invalid]="fnEField.invalid && fnEField.touched" />
                <div class="invalid-feedback" *ngIf="fnEField.invalid && fnEField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input class="form-control" [(ngModel)]="custForm.lastName" name="lastName" required
                  #lnEField="ngModel" [class.is-invalid]="lnEField.invalid && lnEField.touched" />
                <div class="invalid-feedback" *ngIf="lnEField.invalid && lnEField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">CNIC *</label>
                <input class="form-control" [(ngModel)]="custForm.cnic" name="cnic" required pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                  #cnicEField="ngModel" [class.is-invalid]="cnicEField.invalid && cnicEField.touched" />
                <div class="invalid-feedback" *ngIf="cnicEField.invalid && cnicEField.touched">
                  <span *ngIf="cnicEField.errors?.['required']">Required.</span>
                  <span *ngIf="cnicEField.errors?.['pattern']">Format: 35202-1234567-1</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input class="form-control" [(ngModel)]="custForm.phone" name="phone" required
                  #phoneEField="ngModel" [class.is-invalid]="phoneEField.invalid && phoneEField.touched" />
                <div class="invalid-feedback" *ngIf="phoneEField.invalid && phoneEField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Alternate Phone</label>
                <input class="form-control" [(ngModel)]="custForm.alternatePhone" name="alternatePhone" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" type="email" [(ngModel)]="custForm.email" name="email"
                  #emailEField="ngModel" [class.is-invalid]="emailEField.invalid && emailEField.touched" />
                <div class="invalid-feedback" *ngIf="emailEField.invalid && emailEField.touched">Enter a valid email.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Address *</label>
              <input class="form-control" [(ngModel)]="custForm.address" name="address" required
                #addrEField="ngModel" [class.is-invalid]="addrEField.invalid && addrEField.touched" />
              <div class="invalid-feedback" *ngIf="addrEField.invalid && addrEField.touched">Required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">City *</label>
                <input class="form-control" [(ngModel)]="custForm.city" name="city" required
                  #cityEField="ngModel" [class.is-invalid]="cityEField.invalid && cityEField.touched" />
                <div class="invalid-feedback" *ngIf="cityEField.invalid && cityEField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input class="form-control" type="date" [(ngModel)]="custForm.dateOfBirth" name="dateOfBirth" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input class="form-control" [(ngModel)]="custForm.occupation" name="occupation" />
              </div>
              <div class="form-group">
                <label class="form-label">Employer Name</label>
                <input class="form-control" [(ngModel)]="custForm.employerName" name="employerName" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Monthly Income</label>
                <input class="form-control" type="number" [(ngModel)]="custForm.monthlyIncome" name="monthlyIncome" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="custForm.status" name="status" required>
                  <option value="Active">Active</option>
                  <option value="Blacklisted">Blacklisted</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="custForm.notes" name="notes" rows="2"></textarea>
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

    <!-- VIEW CUSTOMER DETAIL -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'view' && !subView">
      <div class="modal-box xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Customer Details</h2>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="openEdit(selected!)">
              <span class="material-icons">edit</span> Edit
            </button>
            <button class="btn btn-primary" (click)="startNewPlan(selected!)">
              <span class="material-icons">add_circle</span> New Plan
            </button>
            <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="modal-body" *ngIf="selected">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value font-bold">{{ selected.firstName }} {{ selected.lastName }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value"><span class="badge" [ngClass]="customerStatusClass(selected.status)">{{ selected.status }}</span></span></div>
            <div class="detail-item"><span class="detail-label">CNIC</span><span class="detail-value">{{ selected.cnic }}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">{{ selected.phone }}</span></div>
            <div class="detail-item"><span class="detail-label">Alternate Phone</span><span class="detail-value">{{ selected.alternatePhone || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">{{ selected.email || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">City</span><span class="detail-value">{{ selected.city }}</span></div>
            <div class="detail-item"><span class="detail-label">DOB</span><span class="detail-value">{{ selected.dateOfBirth || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Occupation</span><span class="detail-value">{{ selected.occupation || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Employer</span><span class="detail-value">{{ selected.employerName || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Monthly Income</span><span class="detail-value">{{ selected.monthlyIncome ? (selected.monthlyIncome | number:'1.2-2') : '—' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Address</span><span class="detail-value">{{ selected.address }}</span></div>
            <div class="detail-item full"><span class="detail-label">Notes</span><span class="detail-value">{{ selected.notes || '—' }}</span></div>
          </div>

          <h3 class="section-heading">Active Installment Plans</h3>
          <div class="loading-center" *ngIf="plansLoading"><div class="spinner"></div></div>
          <div class="table-wrapper" *ngIf="!plansLoading">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sale Price</th>
                  <th>Down Payment</th>
                  <th>Monthly</th>
                  <th>Tenure</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="selectedPlans.length === 0">
                  <td colspan="8" class="text-center text-muted" style="padding:var(--space-6)">No installment plans found.</td>
                </tr>
                <tr *ngFor="let plan of selectedPlans" (click)="$event.stopPropagation()">
                  <td class="font-bold">{{ getProductName(plan.productID) }}</td>
                  <td>{{ plan.productSalePrice | number:'1.2-2' }}</td>
                  <td>{{ plan.downPayment | number:'1.2-2' }}</td>
                  <td>{{ plan.monthlyInstallment | number:'1.2-2' }}</td>
                  <td>{{ plan.tenureMonths }} mo.</td>
                  <td>{{ plan.startDate }}</td>
                  <td><span class="badge" [ngClass]="planStatusClass(plan.status)">{{ plan.status }}</span></td>
                  <td>
                    <button class="btn btn-success" style="padding:4px 8px;font-size:11px" (click)="openPayment(plan)">
                      <span class="material-icons" style="font-size:13px">payments</span> Payment
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- SUB: ADD PLAN -->
    <div class="modal-overlay" *ngIf="subView === 'addPlan'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>New Installment Plan</h2>
          <button class="modal-close" (click)="subView = null"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="subFormError">{{ subFormError }}</div>
          <p class="text-muted text-sm mb-4">Customer: <strong>{{ selected?.firstName }} {{ selected?.lastName }}</strong></p>
          <form #planF="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Product *</label>
              <select class="form-control" [(ngModel)]="planForm.productID" name="productID" required (change)="onProductChange()"
                #pdField="ngModel" [class.is-invalid]="pdField.invalid && pdField.touched">
                <option [ngValue]="0" disabled>Select Product</option>
                <option *ngFor="let p of products" [ngValue]="p.productID">{{ p.productName }} — {{ p.salePrice | number:'1.2-2' }}</option>
              </select>
              <div class="invalid-feedback" *ngIf="pdField.invalid && pdField.touched">Required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Sale Price *</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.productSalePrice" name="productSalePrice" required min="0"
                  #spField="ngModel" [class.is-invalid]="spField.invalid && spField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="spField.invalid && spField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Down Payment *</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.downPayment" name="downPayment" required min="0"
                  #dpField="ngModel" [class.is-invalid]="dpField.invalid && dpField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="dpField.invalid && dpField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Tenure (months, 6–30) *</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.tenureMonths" name="tenureMonths" required min="6" max="30"
                  #tmField="ngModel" [class.is-invalid]="tmField.invalid && tmField.touched" placeholder="12" />
                <div class="invalid-feedback" *ngIf="tmField.invalid && tmField.touched">6–30 months required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Monthly Installment *</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.monthlyInstallment" name="monthlyInstallment" required min="0"
                  #miField="ngModel" [class.is-invalid]="miField.invalid && miField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="miField.invalid && miField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Start Date *</label>
                <input class="form-control" type="date" [(ngModel)]="planForm.startDate" name="startDate" required
                  #sdField="ngModel" [class.is-invalid]="sdField.invalid && sdField.touched" />
                <div class="invalid-feedback" *ngIf="sdField.invalid && sdField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Approved By</label>
                <input class="form-control" [(ngModel)]="planForm.approvedBy" name="approvedBy" placeholder="Staff name" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="planForm.notes" name="notes" rows="2"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="subView = null">Cancel</button>
          <button class="btn btn-primary" (click)="savePlan(planF)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Create Plan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- SUB: INSTALLMENT PAYMENT -->
    <div class="modal-overlay" *ngIf="subView === 'payment'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Installment Payment</h2>
          <button class="modal-close" (click)="subView = null"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="subFormError">{{ subFormError }}</div>
          <p class="text-muted text-sm mb-4">Plan for: <strong>{{ getProductName(selectedPlan?.productID) }}</strong></p>
          <form #payF="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Installment # *</label>
                <input class="form-control" type="number" [(ngModel)]="paymentForm.installmentNumber" name="installmentNumber" required min="1"
                  #inField="ngModel" [class.is-invalid]="inField.invalid && inField.touched" placeholder="1" />
                <div class="invalid-feedback" *ngIf="inField.invalid && inField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Due Date *</label>
                <input class="form-control" type="date" [(ngModel)]="paymentForm.dueDate" name="dueDate" required
                  #ddField="ngModel" [class.is-invalid]="ddField.invalid && ddField.touched" />
                <div class="invalid-feedback" *ngIf="ddField.invalid && ddField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Amount Due *</label>
                <input class="form-control" type="number" [(ngModel)]="paymentForm.amountDue" name="amountDue" required min="0"
                  #adField="ngModel" [class.is-invalid]="adField.invalid && adField.touched" />
                <div class="invalid-feedback" *ngIf="adField.invalid && adField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Amount Paid *</label>
                <input class="form-control" type="number" [(ngModel)]="paymentForm.amountPaid" name="amountPaid" required min="0"
                  #apField="ngModel" [class.is-invalid]="apField.invalid && apField.touched" />
                <div class="invalid-feedback" *ngIf="apField.invalid && apField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Paid Date</label>
                <input class="form-control" type="date" [(ngModel)]="paymentForm.paidDate" name="paidDate" />
              </div>
              <div class="form-group">
                <label class="form-label">Penalty Amount</label>
                <input class="form-control" type="number" [(ngModel)]="paymentForm.penaltyAmount" name="penaltyAmount" min="0" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select class="form-control" [(ngModel)]="paymentForm.paymentMethod" name="paymentMethod">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="paymentForm.status" name="status" required>
                  <option value="Paid">Paid</option>
                  <option value="PartiallyPaid">Partially Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Waived">Waived</option>
                </select>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Reference No</label>
                <input class="form-control" [(ngModel)]="paymentForm.referenceNo" name="referenceNo" placeholder="Cheque/Transaction ref" />
              </div>
              <div class="form-group">
                <label class="form-label">Received By</label>
                <input class="form-control" [(ngModel)]="paymentForm.receivedBy" name="receivedBy" placeholder="Staff name" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="paymentForm.notes" name="notes" rows="2"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="subView = null">Cancel</button>
          <button class="btn btn-success" (click)="savePayment(payF)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Record Payment' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spinner.sm { width: 16px; height: 16px; border-width: 2px; display: inline-block; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-6); }
    .detail-item { display: flex; flex-direction: column; gap: var(--space-1); }
    .detail-item.full { grid-column: 1 / -1; }
    .detail-label { font-size: var(--font-sm); font-weight: 600; color: var(--neutral-500); text-transform: uppercase; letter-spacing: .04em; }
    .detail-value { font-size: var(--font-base); color: var(--neutral-900); }
    .section-heading { font-size: var(--font-md); font-weight: 600; color: var(--neutral-700); margin: var(--space-4) 0 var(--space-3); }
    .inline-section { border: 1px solid var(--neutral-200); border-radius: var(--radius-md); padding: var(--space-4); margin-top: var(--space-4); }
    .inline-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
    .inline-section-header h3 { font-size: var(--font-md); font-weight: 600; color: var(--neutral-700); }
    .inline-guarantor-row { border-top: 1px dashed var(--neutral-300); padding-top: var(--space-3); margin-top: var(--space-3); }
    .toggle-label { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-sm); cursor: pointer; font-weight: 600; color: var(--neutral-700); }
  `]
})
export class CustomersModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  view: MainView = 'list';
  subView: SubView = null;
  customers: Customer[] = [];
  plans: InstallmentPlan[] = [];
  products: Product[] = [];
  selected: Customer | null = null;
  selectedPlans: InstallmentPlan[] = [];
  selectedPlan: InstallmentPlan | null = null;
  loading = true;
  plansLoading = false;
  saving = false;
  error = '';
  formError = '';
  subFormError = '';
  search = '';
  addPlanInline = false;
  inlineGuarantors: Partial<Guarantor>[] = [];

  custForm: Partial<Customer> = this.blankCustomer();
  planForm: Partial<InstallmentPlan> = this.blankPlan();
  paymentForm: Partial<InstallmentPayment> = this.blankPayment();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getProducts().subscribe({ next: d => this.products = d, error: () => {} });
    this.api.getInstallmentPlans().subscribe({ next: d => { this.plans = d; this.cdr.detectChanges() } , error: () => {} });
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.loading = true;
    this.api.getCustomers().subscribe({
      next: d => { this.customers = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Failed to load customers.'; this.loading = false; }
    });
  }

  get filtered(): Customer[] {
    const q = this.search.toLowerCase();
    if (!q) return this.customers;
    return this.customers.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.cnic.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  }

  getActivePlans(customerId: number): InstallmentPlan[] {
    return this.plans.filter(p => p.customerId === customerId && p.status === 'Active');
  }

  getProductName(id?: number): string {
    if (!id) return '—';
    const p = this.products.find(x => x.productID === id);
    return p ? p.productName : `#${id}`;
  }

  customerStatusClass(s: string): Record<string, boolean> {
    return { 'badge-success': s === 'Active', 'badge-danger': s === 'Blacklisted', 'badge-neutral': s === 'Inactive' };
  }

  planStatusClass(s: string): Record<string, boolean> {
    return { 'badge-success': s === 'Active', 'badge-info': s === 'Completed', 'badge-danger': s === 'Defaulted', 'badge-neutral': s === 'Cancelled' };
  }

  openAdd(): void {
    this.custForm = this.blankCustomer();
    this.planForm = this.blankPlan();
    this.inlineGuarantors = [];
    this.addPlanInline = false;
    this.formError = '';
    this.view = 'add';
  }

  openEdit(c: Customer): void {
    this.custForm = { ...c };
    this.formError = '';
    this.view = 'edit';
  }

  openView(c: Customer): void {
    this.selected = c;
    this.view = 'view';
    this.plansLoading = true;
    this.api.getInstallmentPlansByCustomer(c.customerId!).subscribe({
      next: d => { this.selectedPlans = d; this.plansLoading = false; this.cdr.detectChanges() },
      error: () => { this.selectedPlans = []; this.plansLoading = false; }
    });
  }

  startNewPlan(c: Customer): void {
    this.selected = c;
    this.planForm = this.blankPlan();
    this.subFormError = '';
    this.subView = 'addPlan';
  }

  openPayment(plan: InstallmentPlan): void {
    this.selectedPlan = plan;
    this.paymentForm = { ...this.blankPayment(), planID: plan.planID, amountDue: plan.monthlyInstallment };
    this.subFormError = '';
    this.subView = 'payment';
  }

  addInlineGuarantor(): void {
    this.inlineGuarantors.push({ firstName: '', lastName: '', cnic: '', phone: '', relation: '' });
  }

  removeInlineGuarantor(i: number): void {
    this.inlineGuarantors.splice(i, 1);
  }

  onProductChange(): void {
    const p = this.products.find(x => x.productID === this.planForm.productID);
    if (p) this.planForm.productSalePrice = p.salePrice;
  }

  saveAdd(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    const dup = this.customers.find(c => c.cnic === this.custForm.cnic);
    if (dup) { this.formError = 'A customer with this CNIC already exists.'; return; }
    this.saving = true;
    this.api.createCustomer(this.custForm as Customer).subscribe({
      next: newCust => {
        const promises: Array<() => void> = [];
        for (const g of this.inlineGuarantors) {
          if (g.firstName && g.cnic && g.phone) {
            this.api.createGuarantor({ ...g, customerId: newCust.customerId! } as Guarantor).subscribe();
          }
        }
        if (this.addPlanInline && this.planForm.productID) {
          this.api.createInstallmentPlan({ ...this.planForm, customerId: newCust.customerId!, status: 'Active' } as InstallmentPlan).subscribe({
            next: p => this.plans.push(p)
          });
        }
        this.saving = false;
        this.loadCustomers();
        this.view = 'list';
      },
      error: () => { this.saving = false; this.formError = 'Failed to save customer.'; }
    });
  }

  saveEdit(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.updateCustomer(this.custForm.customerId!, this.custForm as Customer).subscribe({
      next: () => { this.saving = false; this.loadCustomers(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  savePlan(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: InstallmentPlan = { ...this.planForm, customerId: this.selected!.customerId!, status: 'Active' } as InstallmentPlan;
    this.api.createInstallmentPlan(payload).subscribe({
      next: p => { this.plans.push(p); this.saving = false; this.subView = null; },
      error: () => { this.saving = false; this.subFormError = 'Failed to create plan.'; }
    });
  }

  savePayment(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.createInstallmentPayment(this.paymentForm as InstallmentPayment).subscribe({
      next: () => { this.saving = false; this.subView = null; },
      error: () => { this.saving = false; this.subFormError = 'Failed to record payment.'; }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }

  private blankCustomer(): Partial<Customer> {
    return { firstName: '', lastName: '', cnic: '', phone: '', alternatePhone: '', email: '', address: '', city: '', occupation: '', employerName: '', monthlyIncome: undefined, status: 'Active', notes: '' };
  }

  private blankPlan(): Partial<InstallmentPlan> {
    const today = new Date().toISOString().split('T')[0];
    return { productID: 0, productSalePrice: 0, downPayment: 0, tenureMonths: 12, monthlyInstallment: 0, startDate: today, approvedBy: '', notes: '' };
  }

  private blankPayment(): Partial<InstallmentPayment> {
    const today = new Date().toISOString().split('T')[0];
    return { installmentNumber: 1, amountDue: 0, amountPaid: 0, dueDate: today, paidDate: today, penaltyAmount: 0, paymentMethod: 'Cash', status: 'Paid', receivedBy: '', notes: '' };
  }
}
