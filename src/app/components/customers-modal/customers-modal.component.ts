import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Customer, Guarantor, InstallmentPlan, InstallmentPayment, Product } from '../../models/models';
import jsPDF from 'jspdf';

type MainView = 'list' | 'add' | 'edit' | 'view';
type SubView = 'addGuarantor' | 'addPlan' | 'payment' | null;

const COMPANY_NAME = 'Al Wahab Installment Services';
const COMPANY_TAGLINE = 'Installment Sales & Financing';

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
                <div class="form-group">
                  <label class="form-label">Occupation</label>
                  <input class="form-control" [(ngModel)]="g.occupation" [name]="'gocc_'+gi" placeholder="Occupation" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Address</label>
                  <input class="form-control" [(ngModel)]="g.address" [name]="'gaddr_'+gi" placeholder="Full address" />
                </div>
                <div class="form-group">
                  <label class="form-label">Monthly Income</label>
                  <input class="form-control" type="number" [(ngModel)]="g.monthlyIncome" [name]="'ginc_'+gi" min="0" placeholder="0.00" />
                </div>
              </div>
              <div class="form-row" style="justify-content:flex-end">
                <button class="btn btn-danger" style="font-size:12px;padding:4px 10px" (click)="removeInlineGuarantor(gi)">
                  <span class="material-icons" style="font-size:14px">delete</span> Remove Guarantor
                </button>
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
                  <select class="form-control" [(ngModel)]="planForm.productID" name="inlineProductID" (ngModelChange)="onProductChange()">
                    <option [ngValue]="0" disabled>Select Product</option>
                    <option *ngFor="let p of products" [ngValue]="p.productID">{{ p.productName }} — {{ p.salePrice | number:'1.2-2' }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Sale Price *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.productSalePrice" name="inlineSalePrice" min="0" (ngModelChange)="recalcInline()" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Cost Price</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.productCostPrice" name="inlineCostPrice" min="0" (ngModelChange)="recalcInline()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Profit (Sale − Cost)</label>
                  <input class="form-control" type="number" [value]="inlineProfit()" readonly disabled />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Down Payment *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.downPayment" name="inlineDP" min="0" (ngModelChange)="recalcInline()" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tenure (months) *</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.tenureMonths" name="inlineTenure" min="6" max="30" (ngModelChange)="recalcInline()" />
                </div>
              </div>
              <div class="form-row cols-2">
                <div class="form-group">
                  <label class="form-label">Monthly Installment (auto)</label>
                  <input class="form-control" type="number" [(ngModel)]="planForm.monthlyInstallment" name="inlineMI" min="0" />
                  <span class="text-muted text-sm">Loan Amount: {{ inlineLoanAmount() | number:'1.2-2' }} • Total Payable: {{ inlineTotalPayable() | number:'1.2-2' }}</span>
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

          <h3 class="section-heading">Guarantors</h3>
          <div class="table-wrapper" *ngIf="selectedGuarantors.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>Relation</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of selectedGuarantors">
                  <td class="font-bold">{{ g.firstName }} {{ g.lastName }}</td>
                  <td>{{ g.cnic }}</td>
                  <td>{{ g.phone }}</td>
                  <td>{{ g.relation || '—' }}</td>
                  <td>{{ g.address || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-muted text-sm" *ngIf="selectedGuarantors.length === 0">No guarantors on file.</p>

          <h3 class="section-heading">Installment Plans</h3>
          <div class="loading-center" *ngIf="plansLoading"><div class="spinner"></div></div>
          <div class="table-wrapper" *ngIf="!plansLoading">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sale Price</th>
                  <th>Cost Price</th>
                  <th>Profit</th>
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
                  <td colspan="10" class="text-center text-muted" style="padding:var(--space-6)">No installment plans found.</td>
                </tr>
                <tr *ngFor="let plan of selectedPlans" (click)="$event.stopPropagation()">
                  <td class="font-bold">{{ getProductName(plan.productID) }}</td>
                  <td>{{ plan.productSalePrice | number:'1.2-2' }}</td>
                  <td>{{ getProductCostPrice(plan.productID) | number:'1.2-2' }}</td>
                  <td>{{ (plan.productSalePrice - getProductCostPrice(plan.productID)) | number:'1.2-2' }}</td>
                  <td>{{ plan.downPayment | number:'1.2-2' }}</td>
                  <td>{{ plan.monthlyInstallment | number:'1.2-2' }}</td>
                  <td>{{ plan.tenureMonths }} mo.</td>
                  <td>{{ plan.startDate }}</td>
                  <td><span class="badge" [ngClass]="planStatusClass(plan.status)">{{ plan.status }}</span></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-success" style="padding:4px 8px;font-size:11px" (click)="openPayment(plan)">
                        <span class="material-icons" style="font-size:13px">payments</span> Payment
                      </button>
                      <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" title="Print Plan" (click)="printPlanPdf(plan)">
                        <span class="material-icons" style="font-size:13px">print</span> Print
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
              <select class="form-control" [(ngModel)]="planForm.productID" name="productID" required (ngModelChange)="onProductChange()"
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
                  #spField="ngModel" [class.is-invalid]="spField.invalid && spField.touched" placeholder="0.00" (ngModelChange)="recalcPlan()" />
                <div class="invalid-feedback" *ngIf="spField.invalid && spField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Cost Price</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.productCostPrice" name="productCostPrice" min="0"
                  placeholder="0.00" (ngModelChange)="recalcPlan()" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Profit (Sale − Cost)</label>
                <input class="form-control" type="number" [value]="planProfit()" readonly disabled />
              </div>
              <div class="form-group">
                <label class="form-label">Down Payment *</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.downPayment" name="downPayment" required min="0"
                  #dpField="ngModel" [class.is-invalid]="dpField.invalid && dpField.touched" placeholder="0.00" (ngModelChange)="recalcPlan()" />
                <div class="invalid-feedback" *ngIf="dpField.invalid && dpField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Tenure (months, 6–30) *</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.tenureMonths" name="tenureMonths" required min="6" max="30"
                  #tmField="ngModel" [class.is-invalid]="tmField.invalid && tmField.touched" placeholder="12" (ngModelChange)="recalcPlan()" />
                <div class="invalid-feedback" *ngIf="tmField.invalid && tmField.touched">6–30 months required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Monthly Installment (auto)</label>
                <input class="form-control" type="number" [(ngModel)]="planForm.monthlyInstallment" name="monthlyInstallment" required min="0"
                  #miField="ngModel" [class.is-invalid]="miField.invalid && miField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="miField.invalid && miField.touched">Required.</div>
              </div>
            </div>
            <p class="text-muted text-sm">Loan Amount: <strong>{{ planLoanAmount() | number:'1.2-2' }}</strong> • Total Payable: <strong>{{ planTotalPayable() | number:'1.2-2' }}</strong></p>
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
          <button class="btn btn-secondary" (click)="printPlanPreviewPdf()">
            <span class="material-icons" style="font-size:14px">print</span> Print Plan
          </button>
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
  guarantors: Guarantor[] = [];
  selected: Customer | null = null;
  selectedPlans: InstallmentPlan[] = [];
  selectedGuarantors: Guarantor[] = [];
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
    this.api.getGuarantors().subscribe({ next: d => this.guarantors = d, error: () => {} });
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

  getProductCostPrice(id?: number): number {
    if (!id) return 0;
    const p = this.products.find(x => x.productID === id);
    return p ? p.costPrice : 0;
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
    this.selectedGuarantors = this.guarantors.filter(g => g.customerId === c.customerId);
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
    this.inlineGuarantors.push({ firstName: '', lastName: '', cnic: '', phone: '', relation: '', address: '', occupation: '', monthlyIncome: undefined });
  }

  removeInlineGuarantor(i: number): void {
    this.inlineGuarantors.splice(i, 1);
  }

  onProductChange(): void {
    const p = this.products.find(x => x.productID === this.planForm.productID);
    if (p) {
      this.planForm.productSalePrice = p.salePrice;
      this.planForm.productCostPrice = p.costPrice;
    }
    this.recalcPlan();
  }

  // ---- Calculation helpers (Add Plan sub-form) ----
  planLoanAmount(): number {
    const sale = this.planForm.productSalePrice || 0;
    const dp = this.planForm.downPayment || 0;
    return Math.max(0, sale - dp);
  }

  planTotalPayable(): number {
    const dp = this.planForm.downPayment || 0;
    const mi = this.planForm.monthlyInstallment || 0;
    const tenure = this.planForm.tenureMonths || 0;
    return dp + (mi * tenure);
  }

  planProfit(): number {
    const sale = this.planForm.productSalePrice || 0;
    const cost = this.planForm.productCostPrice || 0;
    return sale - cost;
  }

  recalcPlan(): void {
    const tenure = this.planForm.tenureMonths || 0;
    if (tenure > 0) {
      const loanAmount = this.planLoanAmount();
      this.planForm.monthlyInstallment = Math.round((loanAmount / tenure) * 100) / 100;
    }
    this.planForm.loanAmount = this.planLoanAmount();
  }

  // ---- Calculation helpers (Inline plan in Add Customer modal) ----
  inlineLoanAmount(): number {
    const sale = this.planForm.productSalePrice || 0;
    const dp = this.planForm.downPayment || 0;
    return Math.max(0, sale - dp);
  }

  inlineTotalPayable(): number {
    const dp = this.planForm.downPayment || 0;
    const mi = this.planForm.monthlyInstallment || 0;
    const tenure = this.planForm.tenureMonths || 0;
    return dp + (mi * tenure);
  }

  inlineProfit(): number {
    const sale = this.planForm.productSalePrice || 0;
    const cost = this.planForm.productCostPrice || 0;
    return sale - cost;
  }

  recalcInline(): void {
    const tenure = this.planForm.tenureMonths || 0;
    if (tenure > 0) {
      const loanAmount = this.inlineLoanAmount();
      this.planForm.monthlyInstallment = Math.round((loanAmount / tenure) * 100) / 100;
    }
    this.planForm.loanAmount = this.inlineLoanAmount();
  }

  saveAdd(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    const dup = this.customers.find(c => c.cnic === this.custForm.cnic);
    if (dup) { this.formError = 'A customer with this CNIC already exists.'; return; }
    this.saving = true;
    this.api.createCustomer(this.custForm as Customer).subscribe({
      next: newCust => {
        for (const g of this.inlineGuarantors) {
          if (g.firstName && g.cnic && g.phone) {
            this.api.createGuarantor({ ...g, customerId: newCust.customerId! } as Guarantor).subscribe({
              next: created => this.guarantors.push(created)
            });
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

  // ================= PDF GENERATION =================

  /** Print button used in the "New Installment Plan" sub-form (before saving). */
  printPlanPreviewPdf(): void {
    const planData: Partial<InstallmentPlan> = {
      ...this.planForm,
      customerId: this.selected?.customerId
    };
    this.generatePlanPdf(planData, this.selected || undefined);
  }

  /** Print button used on an already-saved plan row in the customer detail view. */
  printPlanPdf(plan: InstallmentPlan): void {
    const customer = this.customers.find(c => c.customerId === plan.customerId) || this.selected || undefined;
    this.generatePlanPdf(plan, customer);
  }

  private generatePlanPdf(plan: Partial<InstallmentPlan>, customer?: Customer): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 50;

    // ---- Header: Company Name ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(COMPANY_NAME, pageWidth / 2, y, { align: 'center' });
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(COMPANY_TAGLINE, pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 25;

    // ---- Title ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Installment Plan Agreement', pageWidth / 2, y, { align: 'center' });
    y += 30;

    // ---- Customer Info ----
    const product = this.products.find(p => p.productID === plan.productID);
    const guarantors = this.selectedGuarantors.length
      ? this.selectedGuarantors
      : this.guarantors.filter(g => g.customerId === (customer?.customerId ?? plan.customerId));

    const salePrice = plan.productSalePrice || 0;
    const downPayment = plan.downPayment || 0;
    const tenure = plan.tenureMonths || 0;
    const monthly = plan.monthlyInstallment || 0;
    const loanAmount = plan.loanAmount ?? Math.max(0, salePrice - downPayment);
    const totalPayable = plan.totalPayable ?? (downPayment + monthly * tenure);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Customer Details', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const custName = customer ? `${customer.firstName} ${customer.lastName}` : '—';
    y = this.printRow(doc, margin, y, 'Customer Name:', custName);
    y = this.printRow(doc, margin, y, 'CNIC:', customer?.cnic || '—');
    y = this.printRow(doc, margin, y, 'Phone:', customer?.phone || '—');
    y = this.printRow(doc, margin, y, 'Address:', customer?.address || '—');
    y += 12;

    // ---- Guarantor Info ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Guarantor Details', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (guarantors.length === 0) {
      doc.text('No guarantor on record.', margin, y);
      y += 18;
    } else {
      for (const g of guarantors) {
        y = this.printRow(doc, margin, y, 'Guarantor Name:', `${g.firstName} ${g.lastName}`);
        y = this.printRow(doc, margin, y, 'CNIC:', g.cnic || '—');
        y = this.printRow(doc, margin, y, 'Phone:', g.phone || '—');
        y = this.printRow(doc, margin, y, 'Relation:', g.relation || '—');
        y = this.printRow(doc, margin, y, 'Address:', g.address || '—');
        y += 8;
      }
    }
    y += 6;

    // ---- Product / Plan Info ----
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Product & Plan Details', margin, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const productLabel = (product?.productName || this.getProductName(plan.productID) || '—')
      + (product?.brand ? ` (${product.brand}${product.model ? ' ' + product.model : ''})` : '');
    y = this.printRow(doc, margin, y, 'Product:', productLabel);
    y = this.printRow(doc, margin, y, 'Sale Price:', this.formatCurrency(salePrice));
    y = this.printRow(doc, margin, y, 'Down Payment:', this.formatCurrency(downPayment));
    y = this.printRow(doc, margin, y, 'Loan Amount (Sale - Down Payment):', this.formatCurrency(loanAmount));
    y = this.printRow(doc, margin, y, 'Tenure:', `${tenure} months`);
    y = this.printRow(doc, margin, y, 'Monthly Installment:', this.formatCurrency(monthly));
    y = this.printRow(doc, margin, y, 'Total Payable (Down Payment + Installments):', this.formatCurrency(totalPayable));
    y = this.printRow(doc, margin, y, 'Start Date:', this.formatDateDisplay(plan.startDate));
    if (plan.endDate) y = this.printRow(doc, margin, y, 'End Date:', this.formatDateDisplay(plan.endDate));
    y = this.printRow(doc, margin, y, 'Status:', plan.status || 'Active');
    y = this.printRow(doc, margin, y, 'Approved By:', plan.approvedBy || '—');
    if (plan.notes) y = this.printRow(doc, margin, y, 'Notes:', plan.notes);
    y += 14;

    // ---- Payment Schedule Table ----
    if (y > 680) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Payment Schedule', margin, y);
    y += 18;

    const colX = [margin, margin + 50, margin + 150, margin + 280, margin + 380];
    const colHeaders = ['#', 'Due Date', 'Amount', 'Type', 'Status'];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    colHeaders.forEach((h, i) => doc.text(h, colX[i], y));
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    // Row 0: Down Payment
    const startDateObj = plan.startDate ? new Date(plan.startDate) : new Date();
    doc.text('—', colX[0], y);
    doc.text(this.formatDateDDMMYYYY(startDateObj), colX[1], y);
    doc.text(this.formatCurrency(downPayment), colX[2], y);
    doc.text('Down Payment', colX[3], y);
    doc.text('Pending', colX[4], y);
    y += 16;

    for (let i = 1; i <= tenure; i++) {
      if (y > 760) { doc.addPage(); y = 50; }
      const dueDate = new Date(startDateObj);
      dueDate.setMonth(dueDate.getMonth() + i);
      doc.text(String(i), colX[0], y);
      doc.text(this.formatDateDDMMYYYY(dueDate), colX[1], y);
      doc.text(this.formatCurrency(monthly), colX[2], y);
      doc.text('Installment', colX[3], y);
      doc.text('Pending', colX[4], y);
      y += 16;
    }

    y += 10;
    if (y > 750) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Payable: ${this.formatCurrency(totalPayable)}`, margin, y);
    y += 30;

    // ---- Signatures ----
    if (y > 720) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.line(margin, y, margin + 150, y);
    doc.line(pageWidth - margin - 150, y, pageWidth - margin, y);
    y += 14;
    doc.text('Customer Signature', margin, y);
    doc.text('Authorized Signature', pageWidth - margin - 150, y);

    // ---- Footer ----
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Generated on ${this.formatDateDDMMYYYY(new Date())}`, margin, doc.internal.pageSize.getHeight() - 20);

    const fileName = `InstallmentPlan_${(custName || 'Customer').replace(/\s+/g, '_')}_${(product?.productName || 'Product').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  }

  private printRow(doc: jsPDF, x: number, y: number, label: string, value: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const valueX = pageWidth / 2 + 10;
    const maxWidth = pageWidth - 40 - valueX;
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, maxWidth);
    doc.text(lines, valueX, y);
    return y + (16 * Math.max(1, lines.length));
  }

  private formatCurrency(n: number): string {
    return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** dd-mm-yyyy from a Date object */
  private formatDateDDMMYYYY(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  /** dd-mm-yyyy from a date string (e.g. '2026-06-13') or '—' if empty */
  private formatDateDisplay(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return this.formatDateDDMMYYYY(d);
  }

  private blankCustomer(): Partial<Customer> {
    return { firstName: '', lastName: '', cnic: '', phone: '', alternatePhone: '', email: '', address: '', city: '', occupation: '', employerName: '', monthlyIncome: undefined, status: 'Active', notes: '' };
  }

  private blankPlan(): Partial<InstallmentPlan> {
    const today = new Date().toISOString().split('T')[0];
    return { productID: 0, productSalePrice: 0, productCostPrice: 0, downPayment: 0, tenureMonths: 12, monthlyInstallment: 0, startDate: today, approvedBy: '', notes: '' };
  }

  private blankPayment(): Partial<InstallmentPayment> {
    const today = new Date().toISOString().split('T')[0];
    return { installmentNumber: 1, amountDue: 0, amountPaid: 0, dueDate: today, paidDate: today, penaltyAmount: 0, paymentMethod: 'Cash', status: 'Paid', receivedBy: '', notes: '' };
  }
}