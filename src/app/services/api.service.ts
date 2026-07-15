import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Customer, Guarantor, Investor, Investment, ProfitPayment,
  ProductCategory, Product, InstallmentPlan, InstallmentPayment
} from '../models/models';

// const BASE_URL = 'https://localhost:7120/api';
const BASE_URL = 'https://temp.somee.com/InstallmentAPI_Publish/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Customers
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${BASE_URL}/Customers`);
  }
  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${BASE_URL}/Customers/${id}`);
  }
  createCustomer(c: Customer): Observable<Customer> {
    return this.http.post<Customer>(`${BASE_URL}/Customers`, c);
  }
  updateCustomer(id: number, c: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${BASE_URL}/Customers/${id}`, c);
  }

  // Guarantors
  getGuarantors(): Observable<Guarantor[]> {
    return this.http.get<Guarantor[]>(`${BASE_URL}/Guarantors`);
  }
  getGuarantor(id: number): Observable<Guarantor> {
    return this.http.get<Guarantor>(`${BASE_URL}/Guarantors/${id}`);
  }
  createGuarantor(g: Guarantor): Observable<Guarantor> {
    return this.http.post<Guarantor>(`${BASE_URL}/Guarantors`, g);
  }
  updateGuarantor(id: number, g: Guarantor): Observable<Guarantor> {
    return this.http.put<Guarantor>(`${BASE_URL}/Guarantors/${id}`, g);
  }

  // Investors
  getInvestors(): Observable<Investor[]> {
    return this.http.get<Investor[]>(`${BASE_URL}/Investors`);
  }
  getInvestor(id: number): Observable<Investor> {
    return this.http.get<Investor>(`${BASE_URL}/Investors/${id}`);
  }
  createInvestor(i: Investor): Observable<Investor> {
    return this.http.post<Investor>(`${BASE_URL}/Investors`, i);
  }
  updateInvestor(id: number, i: Investor): Observable<Investor> {
    return this.http.put<Investor>(`${BASE_URL}/Investors/${id}`, i);
  }

  // Investments
  getInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(`${BASE_URL}/Investments`);
  }
  getInvestmentsByInvestor(investorId: number): Observable<Investment[]> {
    return this.http.get<Investment[]>(`${BASE_URL}/Investments?investorId=${investorId}`);
  }
  createInvestment(i: Investment): Observable<Investment> {
    return this.http.post<Investment>(`${BASE_URL}/Investments`, i);
  }
  updateInvestment(id: number, i: Investment): Observable<Investment> {
    return this.http.put<Investment>(`${BASE_URL}/Investments/${id}`, i);
  }

  // Profit Payments
  getProfitPayments(): Observable<ProfitPayment[]> {
    return this.http.get<ProfitPayment[]>(`${BASE_URL}/ProfitPayments`);
  }
  createProfitPayment(p: ProfitPayment): Observable<ProfitPayment> {
    return this.http.post<ProfitPayment>(`${BASE_URL}/ProfitPayments`, p);
  }

  // Product Categories
  getProductCategories(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(`${BASE_URL}/ProductCategories`);
  }
  getProductCategory(id: number): Observable<ProductCategory> {
    return this.http.get<ProductCategory>(`${BASE_URL}/ProductCategories/${id}`);
  }
  createProductCategory(c: ProductCategory): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(`${BASE_URL}/ProductCategories`, c);
  }
  updateProductCategory(id: number, c: ProductCategory): Observable<ProductCategory> {
    return this.http.put<ProductCategory>(`${BASE_URL}/ProductCategories/${id}`, c);
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${BASE_URL}/Products`);
  }
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${BASE_URL}/Products/${id}`);
  }
  createProduct(p: Product): Observable<Product> {
    return this.http.post<Product>(`${BASE_URL}/Products`, p);
  }
  updateProduct(id: number, p: Product): Observable<Product> {
    return this.http.put<Product>(`${BASE_URL}/Products/${id}`, p);
  }

  // Installment Plans
  getInstallmentPlans(): Observable<InstallmentPlan[]> {
    return this.http.get<InstallmentPlan[]>(`${BASE_URL}/InstallmentPlans`);
  }
  getInstallmentPlansByCustomer(customerId: number): Observable<InstallmentPlan[]> {
    return this.http.get<InstallmentPlan[]>(`${BASE_URL}/InstallmentPlans?customerId=${customerId}`);
  }
  createInstallmentPlan(p: InstallmentPlan): Observable<InstallmentPlan> {
    return this.http.post<InstallmentPlan>(`${BASE_URL}/InstallmentPlans`, p);
  }
  updateInstallmentPlan(id: number, p: InstallmentPlan): Observable<InstallmentPlan> {
    return this.http.put<InstallmentPlan>(`${BASE_URL}/InstallmentPlans/${id}`, p);
  }

  // Installment Payments
  getInstallmentPayments(): Observable<InstallmentPayment[]> {
    return this.http.get<InstallmentPayment[]>(`${BASE_URL}/InstallmentPayments`);
  }
  getInstallmentPaymentsByPlan(planId: number): Observable<InstallmentPayment[]> {
    return this.http.get<InstallmentPayment[]>(`${BASE_URL}/InstallmentPayments?planId=${planId}`);
  }
  createInstallmentPayment(p: InstallmentPayment): Observable<InstallmentPayment> {
    return this.http.post<InstallmentPayment>(`${BASE_URL}/InstallmentPayments`, p);
  }
  updateInstallmentPayment(id: number, p: InstallmentPayment): Observable<InstallmentPayment> {
    return this.http.put<InstallmentPayment>(`${BASE_URL}/InstallmentPayments/${id}`, p);
  }
}
