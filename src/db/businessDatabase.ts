import { OrderEntity, OrderExpenseEntity, BusinessInvestmentEntity } from '../types';

const BIZ_ORDERS_KEY = 'biz_db_orders_v1';
const BIZ_EXPENSES_KEY = 'biz_db_expenses_v1';
const BIZ_INVESTMENTS_KEY = 'biz_db_investments_v1';

// Initial seed orders reflecting realistic orders in catering/food services
const INITIAL_ORDERS: OrderEntity[] = [
  {
    id: 'ord-101',
    customerName: 'Suresh Reddy',
    orderDate: '2026-09-24',
    itemDetails: 'Corporate Executive Lunch Buffet & Desserts',
    quantity: '75 Plates',
    orderPrice: 37500,
    orderStatus: 'Delivered',
    notes: 'Delivered on time to Cyber Towers Hitec City. Customer paid in full.',
    createdAt: new Date('2026-09-24T09:30:00').getTime(),
    updatedAt: new Date('2026-09-24T14:00:00').getTime(),
  },
  {
    id: 'ord-102',
    customerName: 'Priya Sharma',
    orderDate: '2026-09-24',
    itemDetails: 'Birthday Celebration Snack Boxes & Fresh Fruit Juices',
    quantity: '50 Boxes',
    orderPrice: 16500,
    orderStatus: 'Completed',
    notes: 'Special packaging with customized stickers.',
    createdAt: new Date('2026-09-24T11:00:00').getTime(),
    updatedAt: new Date('2026-09-24T18:30:00').getTime(),
  },
  {
    id: 'ord-103',
    customerName: 'Anand & Sunita Verma',
    orderDate: '2026-09-25',
    itemDetails: 'Grand Wedding Reception Special Dum Biryani, Starters & Halwa',
    quantity: '180 Plates',
    orderPrice: 94000,
    orderStatus: 'In Progress',
    notes: 'Advance received 50%, remaining balance upon delivery tomorrow evening.',
    createdAt: new Date('2026-09-23T16:00:00').getTime(),
    updatedAt: new Date('2026-09-24T10:00:00').getTime(),
  },
  {
    id: 'ord-104',
    customerName: 'Kavitha Rao',
    orderDate: '2026-09-26',
    itemDetails: 'Housewarming Traditional South Indian Lunch Spread',
    quantity: '40 Banana Leaf Meals',
    orderPrice: 14000,
    orderStatus: 'Pending',
    notes: 'Requires 2 serving helpers.',
    createdAt: new Date('2026-09-24T15:20:00').getTime(),
    updatedAt: new Date('2026-09-24T15:20:00').getTime(),
  },
];

// Initial seed expenses linked directly to orders
const INITIAL_EXPENSES: OrderExpenseEntity[] = [
  // Linked to Suresh Reddy (ord-101)
  {
    id: 'exp-201',
    orderId: 'ord-101',
    expenseType: 'Groceries / Raw Materials',
    amount: 14200,
    date: '2026-09-23',
    notes: 'Fresh paneer, basmati rice, vegetables, spices & dairy products',
    createdAt: new Date('2026-09-23T10:00:00').getTime(),
  },
  {
    id: 'exp-202',
    orderId: 'ord-101',
    expenseType: 'Packaging',
    amount: 1800,
    date: '2026-09-24',
    notes: 'Thermal meal containers, eco cutlery and napkins',
    createdAt: new Date('2026-09-24T08:00:00').getTime(),
  },
  {
    id: 'exp-203',
    orderId: 'ord-101',
    expenseType: 'Delivery',
    amount: 1200,
    date: '2026-09-24',
    notes: 'Dedicated tempo delivery & fuel charges to Hitec City',
    createdAt: new Date('2026-09-24T12:00:00').getTime(),
  },

  // Linked to Priya Sharma (ord-102)
  {
    id: 'exp-204',
    orderId: 'ord-102',
    expenseType: 'Groceries / Raw Materials',
    amount: 6200,
    date: '2026-09-24',
    notes: 'Snack ingredients, samosa dough, sweets & fresh fruit concentrates',
    createdAt: new Date('2026-09-24T07:30:00').getTime(),
  },
  {
    id: 'exp-205',
    orderId: 'ord-102',
    expenseType: 'Packaging',
    amount: 1400,
    date: '2026-09-24',
    notes: '50 premium branded party snack boxes',
    createdAt: new Date('2026-09-24T09:00:00').getTime(),
  },

  // Linked to Anand Verma (ord-103)
  {
    id: 'exp-206',
    orderId: 'ord-103',
    expenseType: 'Groceries / Raw Materials',
    amount: 34500,
    date: '2026-09-24',
    notes: 'Bulk meat, saffron, pure ghee, dry fruits & premium basmati rice',
    createdAt: new Date('2026-09-24T08:15:00').getTime(),
  },
  {
    id: 'exp-207',
    orderId: 'ord-103',
    expenseType: 'Packaging',
    amount: 3200,
    date: '2026-09-24',
    notes: 'Heavy duty foil containers, serving spoons & banquet covers',
    createdAt: new Date('2026-09-24T11:45:00').getTime(),
  },
  {
    id: 'exp-208',
    orderId: 'ord-103',
    expenseType: 'Delivery',
    amount: 2500,
    date: '2026-09-25',
    notes: 'Van transport & loading helpers reserved',
    createdAt: new Date('2026-09-24T13:00:00').getTime(),
  },
];

// Initial seed investments (equipment, bulk ingredients stock, packaging inventory)
const INITIAL_INVESTMENTS: BusinessInvestmentEntity[] = [
  {
    id: 'inv-301',
    amount: 42000,
    date: '2026-08-10',
    purpose: 'Commercial Stainless Steel Chafing Dishes & Food Warmers',
    notes: 'Purchased 6 sets of luxury buffet food warmers for events',
    createdAt: new Date('2026-08-10T11:00:00').getTime(),
  },
  {
    id: 'inv-302',
    amount: 24000,
    date: '2026-08-20',
    purpose: 'Bulk Ingredients Stock (Pure Desi Ghee & Aged Basmati Rice 100kg)',
    notes: 'Wholesale purchase at discounted distributor price',
    createdAt: new Date('2026-08-20T14:30:00').getTime(),
  },
  {
    id: 'inv-303',
    amount: 11500,
    date: '2026-09-05',
    purpose: 'Branded Eco-Friendly Packaging Boxes (Bulk 1,000 units)',
    notes: 'Direct from packaging manufacturer with custom logo print',
    createdAt: new Date('2026-09-05T16:00:00').getTime(),
  },
];

class BusinessDatabaseService {
  private listeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in BusinessDatabase listener', e);
      }
    });
  }

  // --- Orders CRUD ---
  public getOrders(): OrderEntity[] {
    try {
      const stored = localStorage.getItem(BIZ_ORDERS_KEY);
      if (!stored) {
        localStorage.setItem(BIZ_ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
        return INITIAL_ORDERS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_ORDERS;
    }
  }

  public saveOrder(order: OrderEntity): void {
    const list = this.getOrders();
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      list[idx] = { ...order, updatedAt: Date.now() };
    } else {
      list.unshift({ ...order, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(BIZ_ORDERS_KEY, JSON.stringify(list));
    this.notify();
  }

  public deleteOrder(orderId: string): void {
    const list = this.getOrders().filter((o) => o.id !== orderId);
    localStorage.setItem(BIZ_ORDERS_KEY, JSON.stringify(list));
    // Also remove associated expenses
    const expenses = this.getExpenses().filter((e) => e.orderId !== orderId);
    localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(expenses));
    this.notify();
  }

  // --- Expenses CRUD ---
  public getExpenses(): OrderExpenseEntity[] {
    try {
      const stored = localStorage.getItem(BIZ_EXPENSES_KEY);
      if (!stored) {
        localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(INITIAL_EXPENSES));
        return INITIAL_EXPENSES;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_EXPENSES;
    }
  }

  public saveExpense(expense: OrderExpenseEntity): void {
    const list = this.getExpenses();
    const idx = list.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      list[idx] = expense;
    } else {
      list.unshift({ ...expense, createdAt: expense.createdAt || Date.now() });
    }
    localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(list));
    this.notify();
  }

  public deleteExpense(expenseId: string): void {
    const list = this.getExpenses().filter((e) => e.id !== expenseId);
    localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(list));
    this.notify();
  }

  // --- Investments CRUD ---
  public getInvestments(): BusinessInvestmentEntity[] {
    try {
      const stored = localStorage.getItem(BIZ_INVESTMENTS_KEY);
      if (!stored) {
        localStorage.setItem(BIZ_INVESTMENTS_KEY, JSON.stringify(INITIAL_INVESTMENTS));
        return INITIAL_INVESTMENTS;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_INVESTMENTS;
    }
  }

  public saveInvestment(investment: BusinessInvestmentEntity): void {
    const list = this.getInvestments();
    const idx = list.findIndex((i) => i.id === investment.id);
    if (idx >= 0) {
      list[idx] = investment;
    } else {
      list.unshift({ ...investment, createdAt: investment.createdAt || Date.now() });
    }
    localStorage.setItem(BIZ_INVESTMENTS_KEY, JSON.stringify(list));
    this.notify();
  }

  public deleteInvestment(investmentId: string): void {
    const list = this.getInvestments().filter((i) => i.id !== investmentId);
    localStorage.setItem(BIZ_INVESTMENTS_KEY, JSON.stringify(list));
    this.notify();
  }

  // --- Bulk CSV Imports without duplicating or overwriting existing data ---
  public importOrders(ordersToImport: OrderEntity[]): { added: number } {
    if (!ordersToImport || ordersToImport.length === 0) return { added: 0 };
    const list = this.getOrders();
    const existingIds = new Set(list.map((o) => o.id));

    const preparedOrders = ordersToImport.map((ord) => {
      let finalId = ord.id;
      if (!finalId || existingIds.has(finalId)) {
        finalId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      existingIds.add(finalId);
      return {
        ...ord,
        id: finalId,
        createdAt: ord.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    });

    const updatedList = [...preparedOrders, ...list];
    localStorage.setItem(BIZ_ORDERS_KEY, JSON.stringify(updatedList));
    this.notify();
    return { added: preparedOrders.length };
  }

  public importExpenses(expensesToImport: OrderExpenseEntity[]): { added: number } {
    if (!expensesToImport || expensesToImport.length === 0) return { added: 0 };
    const list = this.getExpenses();
    const existingIds = new Set(list.map((e) => e.id));

    const preparedExpenses = expensesToImport.map((exp) => {
      let finalId = exp.id;
      if (!finalId || existingIds.has(finalId)) {
        finalId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      existingIds.add(finalId);
      return {
        ...exp,
        id: finalId,
        createdAt: exp.createdAt || Date.now(),
      };
    });

    const updatedList = [...preparedExpenses, ...list];
    localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(updatedList));
    this.notify();
    return { added: preparedExpenses.length };
  }

  public importInvestments(investmentsToImport: BusinessInvestmentEntity[]): { added: number } {
    if (!investmentsToImport || investmentsToImport.length === 0) return { added: 0 };
    const list = this.getInvestments();
    const existingIds = new Set(list.map((i) => i.id));

    const preparedInvestments = investmentsToImport.map((inv) => {
      let finalId = inv.id;
      if (!finalId || existingIds.has(finalId)) {
        finalId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      existingIds.add(finalId);
      return {
        ...inv,
        id: finalId,
        createdAt: inv.createdAt || Date.now(),
      };
    });

    const updatedList = [...preparedInvestments, ...list];
    localStorage.setItem(BIZ_INVESTMENTS_KEY, JSON.stringify(updatedList));
    this.notify();
    return { added: preparedInvestments.length };
  }

  // --- Reset & Clear ---
  public resetToSampleData(): void {
    localStorage.setItem(BIZ_ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(BIZ_INVESTMENTS_KEY, JSON.stringify(INITIAL_INVESTMENTS));
    this.notify();
  }

  public clearAllBusinessData(): void {
    localStorage.setItem(BIZ_ORDERS_KEY, JSON.stringify([]));
    localStorage.setItem(BIZ_EXPENSES_KEY, JSON.stringify([]));
    localStorage.setItem(BIZ_INVESTMENTS_KEY, JSON.stringify([]));
    this.notify();
  }
}

export const businessDatabase = new BusinessDatabaseService();
