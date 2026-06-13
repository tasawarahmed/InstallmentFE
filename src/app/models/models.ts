export interface Customer {
  customerId?: number;
  firstName: string;
  lastName: string;
  cnic: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  city: string;
  dateOfBirth?: string;
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  status: 'Active' | 'Blacklisted' | 'Inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Guarantor {
  guarantorID?: number;
  customerId: number;
  firstName: string;
  lastName: string;
  cnic: string;
  phone: string;
  relation?: string;
  address?: string;
  occupation?: string;
  monthlyIncome?: number;
  createdAt?: string;
}

export interface Investor {
  investorID?: number;
  firstName: string;
  lastName: string;
  cnic: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  city?: string;
  profitRatePercent: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  totalInvestment?: number;
}

export interface Investment {
  investmentID?: number;
  investorID: number;
  amount: number;
  investmentDate: string;
  maturityDate?: string;
  profitRatePercent: number;
  status: 'Active' | 'Matured' | 'Withdrawn' | 'Cancelled';
  notes?: string;
  createdAt?: string;
}

export interface ProfitPayment {
  profitPaymentID?: number;
  investmentID: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
  createdAt?: string;
}

export interface ProductCategory {
  categoryID?: number;
  categoryName: string;
  description?: string;
}

export interface Product {
  productID?: number;
  categoryID?: number;
  productName: string;
  brand?: string;
  model?: string;
  costPrice: number;
  salePrice: number;
  description?: string;
  status: 'Available' | 'Discontinued' | 'OutOfStock';
  createdAt?: string;
  updatedAt?: string;
  categoryName?: string;
}

export interface InstallmentPlan {
  planID?: number;
  customerId: number;
  productID: number;
  productSalePrice: number;
  productCostPrice?: number;
  profitAmount?: number;
  downPayment: number;
  loanAmount?: number;
  tenureMonths: number;
  monthlyInstallment: number;
  totalPayable?: number;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'Defaulted' | 'Cancelled';
  approvedBy?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  productName?: string;
}

export interface InstallmentPayment {
  paymentID?: number;
  planID: number;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paidDate?: string;
  penaltyAmount: number;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  status: 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Waived';
  receivedBy?: string;
  notes?: string;
  createdAt?: string;
}
