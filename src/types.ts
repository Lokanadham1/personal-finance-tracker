export type TransactionType = 'INCOME' | 'EXPENSE';

export type ExpenseCategory = 'Food' | 'Rent' | 'Transport' | 'Shopping' | 'Bills' | 'Other';

export type IncomeSource = 'Salary' | 'Freelance' | 'Investments' | 'Gift' | 'Business' | 'Other';

export interface TransactionEntity {
  id: string;
  type: TransactionType;
  amount: number;
  category: ExpenseCategory | IncomeSource | string; // Expense Category or Income Source
  description: string;
  date: string; // YYYY-MM-DD
  timestamp: number; // Unix timestamp in milliseconds for sorting
  createdAt: number;
}

export type DateRangeOption = 'THIS_MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM';

export interface CategoryStat {
  category: ExpenseCategory | string;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

export interface FinanceUiState {
  transactions: TransactionEntity[];
  isLoading: boolean;
  selectedMonth: string; // YYYY-MM e.g. "2026-08"
  // Month-specific stats for the selected month
  totalIncome: number;
  totalExpense: number;
  remainingBalance: number;
  spentPercentage: number; // e.g. 60 for 60%
  categoryBreakdown: CategoryStat[];
  lastDeletedTransaction: TransactionEntity | null;
}

export type NavigationTab = 'home' | 'business' | 'transactions' | 'add_entry' | 'breakdown';

export type OrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delivered';

export type OrderExpenseType = 'Groceries / Raw Materials' | 'Packaging' | 'Delivery' | 'Other';

export interface OrderEntity {
  id: string;
  customerName: string;
  orderDate: string; // YYYY-MM-DD
  itemDetails: string;
  quantity: string; // e.g. "50 Plates", "25 Meals", "10"
  orderPrice: number; // Amount customer is paying in ₹
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderExpenseEntity {
  id: string;
  orderId: string; // Linked order ID
  expenseType: OrderExpenseType;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface BusinessInvestmentEntity {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  purpose: string; // e.g., Equipment, Raw Ingredients Stock, Packaging Materials
  notes?: string;
  createdAt: number;
}

export type BusinessSubView = 'orders' | 'expenses' | 'income' | 'investments';
export type BusinessPeriodFilter = 'daily' | 'weekly' | 'monthly' | 'all';
