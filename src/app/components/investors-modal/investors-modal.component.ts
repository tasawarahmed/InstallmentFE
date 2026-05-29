import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Investor, Investment, ProfitPayment } from '../../models/models';

type MainView = 'list' | 'add' | 'edit' | 'view';
type SubView = 'addInvestment' | 'withdrawInvestment' | 'payProfit' | null;

@Component({
  selector: 'app-investors-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- LIST -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'list' && !subView">
      <div class="modal-box xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Investors</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input type="text" [(ngModel)]="search" placeholder="Search investors…" />
            </div>
            <button class="btn btn-primary" (click)="openAdd()">
              <span class="material-icons">add</span> Add Investor
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
                  <th>Profit Rate %</th>
                  <th>Total Investment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filtered.length === 0">
                  <td colspan="9"><div class="empty-state"><span class="material-icons">trending_up</span><p>No investors found.</p></div></td>
                </tr>
                <tr *ngFor="let inv of filtered; let i = index" (click)="openView(inv)">
                  <td>{{ i + 1 }}</td>
                  <td class="font-bold">{{ inv.firstName }} {{ inv.lastName }}</td>
                  <td>{{ inv.cnic }}</td>
                  <td>{{ inv.phone }}</td>
                  <td>{{ inv.city || '—' }}</td>
                  <td>{{ inv.profitRatePercent }}%</td>
                  <td class="font-bold">{{ getTotalInvestment(inv.investorID!) | number:'1.2-2' }}</td>
                  <td><span class="badge" [ngClass]="{'badge-success': inv.status==='Active','badge-neutral': inv.status==='Inactive'}">{{ inv.status }}</span></td>
                  <td>
                    <div class="actions" (click)="$event.stopPropagation()">
                      <button class="btn btn-secondary" style="padding:4px 8px;font-size:11px" (click)="openEdit(inv)">
                        <span class="material-icons" style="font-size:13px">edit</span>
                      </button>
                      <button class="btn btn-primary" style="padding:4px 8px;font-size:11px" title="Add Investment" (click)="openSubModal(inv, 'addInvestment')">
                        <span class="material-icons" style="font-size:13px">add_circle</span>
                      </button>
                      <button class="btn btn-warning" style="padding:4px 8px;font-size:11px" title="Withdraw Investment" (click)="openSubModal(inv, 'withdrawInvestment')">
                        <span class="material-icons" style="font-size:13px">remove_circle</span>
                      </button>
                      <button class="btn btn-success" style="padding:4px 8px;font-size:11px" title="Pay Profit" (click)="openSubModal(inv, 'payProfit')">
                        <span class="material-icons" style="font-size:13px">payments</span>
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

    <!-- ADD INVESTOR -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'add'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add New Investor</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #addForm="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input class="form-control" [(ngModel)]="form.firstName" name="firstName" required
                  #fnField="ngModel" [class.is-invalid]="fnField.invalid && fnField.touched" placeholder="First name" />
                <div class="invalid-feedback" *ngIf="fnField.invalid && fnField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input class="form-control" [(ngModel)]="form.lastName" name="lastName" required
                  #lnField="ngModel" [class.is-invalid]="lnField.invalid && lnField.touched" placeholder="Last name" />
                <div class="invalid-feedback" *ngIf="lnField.invalid && lnField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">CNIC *</label>
                <input class="form-control" [(ngModel)]="form.cnic" name="cnic" required pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                  #cnicField="ngModel" [class.is-invalid]="cnicField.invalid && cnicField.touched" placeholder="35202-1234567-1" />
                <div class="invalid-feedback" *ngIf="cnicField.invalid && cnicField.touched">
                  <span *ngIf="cnicField.errors?.['required']">Required.</span>
                  <span *ngIf="cnicField.errors?.['pattern']">Format: 35202-1234567-1</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input class="form-control" [(ngModel)]="form.phone" name="phone" required
                  #phoneField="ngModel" [class.is-invalid]="phoneField.invalid && phoneField.touched" placeholder="0300-1234567" />
                <div class="invalid-feedback" *ngIf="phoneField.invalid && phoneField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Alternate Phone</label>
                <input class="form-control" [(ngModel)]="form.alternatePhone" name="alternatePhone" placeholder="Alternate phone" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" type="email" [(ngModel)]="form.email" name="email"
                  #emailField="ngModel" [class.is-invalid]="emailField.invalid && emailField.touched" placeholder="email@example.com" />
                <div class="invalid-feedback" *ngIf="emailField.invalid && emailField.touched">Enter a valid email.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Address *</label>
              <input class="form-control" [(ngModel)]="form.address" name="address" required
                #addrField="ngModel" [class.is-invalid]="addrField.invalid && addrField.touched" placeholder="Full address" />
              <div class="invalid-feedback" *ngIf="addrField.invalid && addrField.touched">Required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">City</label>
                <input class="form-control" [(ngModel)]="form.city" name="city" placeholder="City" />
              </div>
              <div class="form-group">
                <label class="form-label">Profit Rate % *</label>
                <input class="form-control" type="number" [(ngModel)]="form.profitRatePercent" name="profitRatePercent" required min="0" max="100"
                  #prField="ngModel" [class.is-invalid]="prField.invalid && prField.touched" placeholder="0.00" />
                <div class="invalid-feedback" *ngIf="prField.invalid && prField.touched">Required (0–100).</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="form.status" name="status" required>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="form.notes" name="notes" rows="2" placeholder="Optional notes"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="view = 'list'">Cancel</button>
          <button class="btn btn-primary" (click)="saveAdd(addForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Add Investor' }}
          </button>
        </div>
      </div>
    </div>

    <!-- EDIT INVESTOR -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'edit'">
      <div class="modal-box md" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Edit Investor</h2>
          <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="formError">{{ formError }}</div>
          <form #editForm="ngForm" novalidate>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">First Name *</label>
                <input class="form-control" [(ngModel)]="form.firstName" name="firstName" required
                  #fnEField="ngModel" [class.is-invalid]="fnEField.invalid && fnEField.touched" />
                <div class="invalid-feedback" *ngIf="fnEField.invalid && fnEField.touched">Required.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Last Name *</label>
                <input class="form-control" [(ngModel)]="form.lastName" name="lastName" required
                  #lnEField="ngModel" [class.is-invalid]="lnEField.invalid && lnEField.touched" />
                <div class="invalid-feedback" *ngIf="lnEField.invalid && lnEField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">CNIC *</label>
                <input class="form-control" [(ngModel)]="form.cnic" name="cnic" required pattern="[0-9]{5}-[0-9]{7}-[0-9]"
                  #cnicEField="ngModel" [class.is-invalid]="cnicEField.invalid && cnicEField.touched" />
                <div class="invalid-feedback" *ngIf="cnicEField.invalid && cnicEField.touched">
                  <span *ngIf="cnicEField.errors?.['required']">Required.</span>
                  <span *ngIf="cnicEField.errors?.['pattern']">Format: 35202-1234567-1</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Phone *</label>
                <input class="form-control" [(ngModel)]="form.phone" name="phone" required
                  #phoneEField="ngModel" [class.is-invalid]="phoneEField.invalid && phoneEField.touched" />
                <div class="invalid-feedback" *ngIf="phoneEField.invalid && phoneEField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Alternate Phone</label>
                <input class="form-control" [(ngModel)]="form.alternatePhone" name="alternatePhone" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" type="email" [(ngModel)]="form.email" name="email"
                  #emailEField="ngModel" [class.is-invalid]="emailEField.invalid && emailEField.touched" />
                <div class="invalid-feedback" *ngIf="emailEField.invalid && emailEField.touched">Enter a valid email.</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Address *</label>
              <input class="form-control" [(ngModel)]="form.address" name="address" required
                #addrEField="ngModel" [class.is-invalid]="addrEField.invalid && addrEField.touched" />
              <div class="invalid-feedback" *ngIf="addrEField.invalid && addrEField.touched">Required.</div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">City</label>
                <input class="form-control" [(ngModel)]="form.city" name="city" />
              </div>
              <div class="form-group">
                <label class="form-label">Profit Rate % *</label>
                <input class="form-control" type="number" [(ngModel)]="form.profitRatePercent" name="profitRatePercent" required min="0" max="100"
                  #prEField="ngModel" [class.is-invalid]="prEField.invalid && prEField.touched" />
                <div class="invalid-feedback" *ngIf="prEField.invalid && prEField.touched">Required.</div>
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Status *</label>
                <select class="form-control" [(ngModel)]="form.status" name="status" required>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="form.notes" name="notes" rows="2"></textarea>
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

    <!-- VIEW INVESTOR DETAIL -->
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="view === 'view' && !subView">
      <div class="modal-box lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Investor Details</h2>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="openEdit(selected!)">
              <span class="material-icons">edit</span> Edit
            </button>
            <button class="modal-close" (click)="view = 'list'"><span class="material-icons">close</span></button>
          </div>
        </div>
        <div class="modal-body" *ngIf="selected">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value font-bold">{{ selected.firstName }} {{ selected.lastName }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value"><span class="badge" [ngClass]="{'badge-success':selected.status==='Active','badge-neutral':selected.status==='Inactive'}">{{ selected.status }}</span></span></div>
            <div class="detail-item"><span class="detail-label">CNIC</span><span class="detail-value">{{ selected.cnic }}</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">{{ selected.phone }}</span></div>
            <div class="detail-item"><span class="detail-label">Alternate Phone</span><span class="detail-value">{{ selected.alternatePhone || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">{{ selected.email || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">City</span><span class="detail-value">{{ selected.city || '—' }}</span></div>
            <div class="detail-item"><span class="detail-label">Profit Rate</span><span class="detail-value">{{ selected.profitRatePercent }}%</span></div>
            <div class="detail-item full"><span class="detail-label">Address</span><span class="detail-value">{{ selected.address }}</span></div>
            <div class="detail-item full"><span class="detail-label">Notes</span><span class="detail-value">{{ selected.notes || '—' }}</span></div>
          </div>

          <h3 class="section-heading">Investments</h3>
          <div class="loading-center" *ngIf="investmentsLoading"><div class="spinner"></div></div>
          <div class="table-wrapper" *ngIf="!investmentsLoading">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Investment Date</th>
                  <th>Maturity Date</th>
                  <th>Rate %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="selectedInvestments.length === 0">
                  <td colspan="5" class="text-center text-muted">No investments recorded.</td>
                </tr>
                <tr *ngFor="let inv of selectedInvestments">
                  <td class="font-bold">{{ inv.amount | number:'1.2-2' }}</td>
                  <td>{{ inv.investmentDate }}</td>
                  <td>{{ inv.maturityDate || '—' }}</td>
                  <td>{{ inv.profitRatePercent }}%</td>
                  <td><span class="badge" [ngClass]="investmentStatusClass(inv.status)">{{ inv.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- SUB MODAL: ADD INVESTMENT -->
    <div class="modal-overlay" *ngIf="subView === 'addInvestment'">
      <div class="modal-box sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Add Investment</h2>
          <button class="modal-close" (click)="subView = null"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="subFormError">{{ subFormError }}</div>
          <p class="text-muted text-sm mb-4">Investor: <strong>{{ selected?.firstName }} {{ selected?.lastName }}</strong></p>
          <form #investForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Amount *</label>
              <input class="form-control" type="number" [(ngModel)]="investForm2.amount" name="amount" required min="1"
                #amtField="ngModel" [class.is-invalid]="amtField.invalid && amtField.touched" placeholder="0.00" />
              <div class="invalid-feedback" *ngIf="amtField.invalid && amtField.touched">Valid amount required.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Investment Date *</label>
              <input class="form-control" type="date" [(ngModel)]="investForm2.investmentDate" name="investmentDate" required
                #idField="ngModel" [class.is-invalid]="idField.invalid && idField.touched" />
              <div class="invalid-feedback" *ngIf="idField.invalid && idField.touched">Date required.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Maturity Date</label>
              <input class="form-control" type="date" [(ngModel)]="investForm2.maturityDate" name="maturityDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Profit Rate % *</label>
              <input class="form-control" type="number" [(ngModel)]="investForm2.profitRatePercent" name="profitRatePercent" required min="0" max="100"
                #prInvField="ngModel" [class.is-invalid]="prInvField.invalid && prInvField.touched" placeholder="0.00" />
              <div class="invalid-feedback" *ngIf="prInvField.invalid && prInvField.touched">Required.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="investForm2.notes" name="notes" rows="2"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="subView = null">Cancel</button>
          <button class="btn btn-primary" (click)="saveInvestment(investForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Add Investment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- SUB MODAL: WITHDRAW INVESTMENT -->
    <div class="modal-overlay" *ngIf="subView === 'withdrawInvestment'">
      <div class="modal-box sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Withdraw Investment</h2>
          <button class="modal-close" (click)="subView = null"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="subFormError">{{ subFormError }}</div>
          <p class="text-muted text-sm mb-4">Select the active investment to withdraw:</p>
          <form #withdrawForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Investment *</label>
              <select class="form-control" [(ngModel)]="withdrawInvestmentId" name="investmentId" required
                #wInvField="ngModel" [class.is-invalid]="wInvField.invalid && wInvField.touched">
                <option [ngValue]="0" disabled>Select Investment</option>
                <option *ngFor="let inv of activeInvestments" [ngValue]="inv.investmentID">
                  {{ inv.amount | number:'1.2-2' }} — {{ inv.investmentDate }} ({{ inv.profitRatePercent }}%)
                </option>
              </select>
              <div class="invalid-feedback" *ngIf="wInvField.invalid && wInvField.touched">Required.</div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="subView = null">Cancel</button>
          <button class="btn btn-warning" (click)="saveWithdraw(withdrawForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Processing…' : 'Withdraw' }}
          </button>
        </div>
      </div>
    </div>

    <!-- SUB MODAL: PAY PROFIT -->
    <div class="modal-overlay" *ngIf="subView === 'payProfit'">
      <div class="modal-box sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Pay Profit</h2>
          <button class="modal-close" (click)="subView = null"><span class="material-icons">close</span></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-error" *ngIf="subFormError">{{ subFormError }}</div>
          <form #profitForm="ngForm" novalidate>
            <div class="form-group">
              <label class="form-label">Investment *</label>
              <select class="form-control" [(ngModel)]="profitPaymentForm.investmentID" name="investmentID" required
                #ppInvField="ngModel" [class.is-invalid]="ppInvField.invalid && ppInvField.touched">
                <option [ngValue]="0" disabled>Select Investment</option>
                <option *ngFor="let inv of activeInvestments" [ngValue]="inv.investmentID">
                  {{ inv.amount | number:'1.2-2' }} — {{ inv.investmentDate }} ({{ inv.profitRatePercent }}%)
                </option>
              </select>
              <div class="invalid-feedback" *ngIf="ppInvField.invalid && ppInvField.touched">Required.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Amount *</label>
              <input class="form-control" type="number" [(ngModel)]="profitPaymentForm.amount" name="amount" required min="1"
                #ppAmtField="ngModel" [class.is-invalid]="ppAmtField.invalid && ppAmtField.touched" placeholder="0.00" />
              <div class="invalid-feedback" *ngIf="ppAmtField.invalid && ppAmtField.touched">Required.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Date *</label>
              <input class="form-control" type="date" [(ngModel)]="profitPaymentForm.paymentDate" name="paymentDate" required
                #ppDateField="ngModel" [class.is-invalid]="ppDateField.invalid && ppDateField.touched" />
              <div class="invalid-feedback" *ngIf="ppDateField.invalid && ppDateField.touched">Required.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method *</label>
              <select class="form-control" [(ngModel)]="profitPaymentForm.paymentMethod" name="paymentMethod" required>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Reference No</label>
              <input class="form-control" [(ngModel)]="profitPaymentForm.referenceNo" name="referenceNo" placeholder="Cheque/Transaction ref" />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-control" [(ngModel)]="profitPaymentForm.notes" name="notes" rows="2"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="subView = null">Cancel</button>
          <button class="btn btn-success" (click)="saveProfit(profitForm)" [disabled]="saving">
            <div class="spinner sm" *ngIf="saving"></div>
            {{ saving ? 'Saving…' : 'Pay Profit' }}
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
  `]
})
export class InvestorsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  view: MainView = 'list';
  subView: SubView = null;
  investors: Investor[] = [];
  investments: Investment[] = [];
  selected: Investor | null = null;
  selectedInvestments: Investment[] = [];
  loading = true;
  investmentsLoading = false;
  saving = false;
  error = '';
  formError = '';
  subFormError = '';
  search = '';

  form: Partial<Investor> = this.blankForm();
  investForm2: Partial<Investment> = this.blankInvestmentForm();
  profitPaymentForm: Partial<ProfitPayment> = this.blankProfitForm();
  withdrawInvestmentId = 0;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.getInvestments().subscribe({ next: d => this.investments = d, error: () => {} });
    this.loadInvestors();
  }

  private loadInvestors(): void {
    this.loading = true;
    this.api.getInvestors().subscribe({
      next: d => { this.investors = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Failed to load investors.'; this.loading = false; }
    });
  }

  get filtered(): Investor[] {
    const q = this.search.toLowerCase();
    if (!q) return this.investors;
    return this.investors.filter(i =>
      `${i.firstName} ${i.lastName}`.toLowerCase().includes(q) ||
      i.cnic.toLowerCase().includes(q) ||
      i.phone.toLowerCase().includes(q)
    );
  }

  getTotalInvestment(investorId: number): number {
    return this.investments
      .filter(i => i.investorID === investorId && i.status === 'Active')
      .reduce((sum, i) => sum + i.amount, 0);
  }

  get activeInvestments(): Investment[] {
    if (!this.selected) return [];
    return this.investments.filter(i => i.investorID === this.selected!.investorID && i.status === 'Active');
  }

  investmentStatusClass(s: string): Record<string, boolean> {
    return {
      'badge-success': s === 'Active',
      'badge-info': s === 'Matured',
      'badge-warning': s === 'Withdrawn',
      'badge-danger': s === 'Cancelled'
    };
  }

  openAdd(): void { this.form = this.blankForm(); this.formError = ''; this.view = 'add'; }
  openEdit(i: Investor): void { this.form = { ...i }; this.formError = ''; this.view = 'edit'; }

  openView(i: Investor): void {
    this.selected = i;
    this.view = 'view';
    this.investmentsLoading = true;
    this.api.getInvestmentsByInvestor(i.investorID!).subscribe({
      next: d => { this.selectedInvestments = d; this.investmentsLoading = false; this.cdr.detectChanges() },
      error: () => { this.selectedInvestments = []; this.investmentsLoading = false; }
    });
  }

  openSubModal(i: Investor, sv: SubView): void {
    this.selected = i;
    this.subFormError = '';
    this.investForm2 = this.blankInvestmentForm();
    this.profitPaymentForm = this.blankProfitForm();
    this.withdrawInvestmentId = 0;
    this.subView = sv;
  }

  saveAdd(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    const dup = this.investors.find(i => i.cnic === this.form.cnic);
    if (dup) { this.formError = 'An investor with this CNIC already exists.'; return; }
    this.saving = true;
    this.api.createInvestor(this.form as Investor).subscribe({
      next: () => { this.saving = false; this.loadInvestors(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  saveEdit(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.updateInvestor(this.form.investorID!, this.form as Investor).subscribe({
      next: () => { this.saving = false; this.loadInvestors(); this.view = 'list'; },
      error: () => { this.saving = false; this.formError = 'Failed to save.'; }
    });
  }

  saveInvestment(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: Investment = { ...this.investForm2, investorID: this.selected!.investorID!, status: 'Active' } as Investment;
    this.api.createInvestment(payload).subscribe({
      next: d => {
        this.investments.push(d);
        this.saving = false;
        this.subView = null;
      },
      error: () => { this.saving = false; this.subFormError = 'Failed to save investment.'; }
    });
  }

  saveWithdraw(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    if (!this.withdrawInvestmentId) { this.subFormError = 'Select an investment.'; return; }
    const inv = this.investments.find(i => i.investmentID === this.withdrawInvestmentId);
    if (!inv) return;
    this.saving = true;
    this.api.updateInvestment(inv.investmentID!, { ...inv, status: 'Withdrawn' }).subscribe({
      next: () => {
        const idx = this.investments.findIndex(i => i.investmentID === inv.investmentID);
        if (idx >= 0) this.investments[idx].status = 'Withdrawn';
        this.saving = false;
        this.subView = null;
      },
      error: () => { this.saving = false; this.subFormError = 'Failed to withdraw.'; }
    });
  }

  saveProfit(f: NgForm): void {
    if (f.valid !== true) { f.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.createProfitPayment(this.profitPaymentForm as ProfitPayment).subscribe({
      next: () => { this.saving = false; this.subView = null; },
      error: () => { this.saving = false; this.subFormError = 'Failed to save.'; }
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }

  private blankForm(): Partial<Investor> {
    return { firstName: '', lastName: '', cnic: '', phone: '', alternatePhone: '', email: '', address: '', city: '', profitRatePercent: 0, status: 'Active', notes: '' };
  }

  private blankInvestmentForm(): Partial<Investment> {
    const today = new Date().toISOString().split('T')[0];
    return { amount: undefined, investmentDate: today, maturityDate: '', profitRatePercent: 0, notes: '' };
  }

  private blankProfitForm(): Partial<ProfitPayment> {
    const today = new Date().toISOString().split('T')[0];
    return { investmentID: 0, amount: undefined, paymentDate: today, paymentMethod: 'Cash', referenceNo: '', notes: '' };
  }
}
