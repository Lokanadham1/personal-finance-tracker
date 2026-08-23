import { TransactionEntity, ExpenseCategory, IncomeSource } from '../types';

const ROOM_STORAGE_KEY = 'room_db_personal_finance_rupee_v2';

// Pre-seeded initial data matching typical personal finance activity in August 2026
const INITIAL_SEED_TRANSACTIONS: TransactionEntity[] = [
  {
    id: 'tx-1',
    type: 'INCOME',
    amount: 65000,
    category: 'Salary',
    description: 'Monthly Software Engineering Salary',
    date: '2026-08-01',
    timestamp: new Date('2026-08-01T09:00:00').getTime(),
    createdAt: new Date('2026-08-01T09:00:00').getTime(),
  },
  {
    id: 'tx-2',
    type: 'EXPENSE',
    amount: 18000,
    category: 'Rent',
    description: 'Apartment monthly house rent',
    date: '2026-08-02',
    timestamp: new Date('2026-08-02T10:30:00').getTime(),
    createdAt: new Date('2026-08-02T10:30:00').getTime(),
  },
  {
    id: 'tx-3',
    type: 'EXPENSE',
    amount: 3200,
    category: 'Bills',
    description: 'Electricity & High-speed Broadband WiFi',
    date: '2026-08-05',
    timestamp: new Date('2026-08-05T14:15:00').getTime(),
    createdAt: new Date('2026-08-05T14:15:00').getTime(),
  },
  {
    id: 'tx-4',
    type: 'EXPENSE',
    amount: 4650,
    category: 'Food',
    description: 'Weekly organic groceries & fresh vegetables',
    date: '2026-08-09',
    timestamp: new Date('2026-08-09T18:45:00').getTime(),
    createdAt: new Date('2026-08-09T18:45:00').getTime(),
  },
  {
    id: 'tx-5',
    type: 'INCOME',
    amount: 12500,
    category: 'Freelance',
    description: 'Web development client milestone payment',
    date: '2026-08-14',
    timestamp: new Date('2026-08-14T11:20:00').getTime(),
    createdAt: new Date('2026-08-14T11:20:00').getTime(),
  },
  {
    id: 'tx-6',
    type: 'EXPENSE',
    amount: 1850,
    category: 'Transport',
    description: 'Metro pass recharge & fuel',
    date: '2026-08-17',
    timestamp: new Date('2026-08-17T08:30:00').getTime(),
    createdAt: new Date('2026-08-17T08:30:00').getTime(),
  },
  {
    id: 'tx-7',
    type: 'EXPENSE',
    amount: 3499,
    category: 'Shopping',
    description: 'Noise cancelling headphones on sale',
    date: '2026-08-20',
    timestamp: new Date('2026-08-20T16:10:00').getTime(),
    createdAt: new Date('2026-08-20T16:10:00').getTime(),
  },
  {
    id: 'tx-8',
    type: 'EXPENSE',
    amount: 1450,
    category: 'Food',
    description: 'Weekend dinner with friends',
    date: '2026-08-21',
    timestamp: new Date('2026-08-21T20:30:00').getTime(),
    createdAt: new Date('2026-08-21T20:30:00').getTime(),
  },
  // July 2026 Seed Transactions (for previous month comparison)
  {
    id: 'tx-prev-1',
    type: 'INCOME',
    amount: 65000,
    category: 'Salary',
    description: 'July Salary Credit',
    date: '2026-07-01',
    timestamp: new Date('2026-07-01T09:00:00').getTime(),
    createdAt: new Date('2026-07-01T09:00:00').getTime(),
  },
  {
    id: 'tx-prev-2',
    type: 'EXPENSE',
    amount: 18000,
    category: 'Rent',
    description: 'July House Rent',
    date: '2026-07-02',
    timestamp: new Date('2026-07-02T10:00:00').getTime(),
    createdAt: new Date('2026-07-02T10:00:00').getTime(),
  },
  {
    id: 'tx-prev-3',
    type: 'EXPENSE',
    amount: 6800,
    category: 'Food',
    description: 'July groceries and dining',
    date: '2026-07-15',
    timestamp: new Date('2026-07-15T15:00:00').getTime(),
    createdAt: new Date('2026-07-15T15:00:00').getTime(),
  },
];

export const EXPENSE_CATEGORIES: { name: ExpenseCategory; color: string; iconName: string }[] = [
  { name: 'Food', color: '#F97316', iconName: 'Utensils' }, // Orange
  { name: 'Rent', color: '#8B5CF6', iconName: 'Home' }, // Purple
  { name: 'Transport', color: '#0EA5E9', iconName: 'Car' }, // Sky Blue
  { name: 'Shopping', color: '#EC4899', iconName: 'ShoppingBag' }, // Pink
  { name: 'Bills', color: '#3B82F6', iconName: 'Receipt' }, // Blue
  { name: 'Other', color: '#64748B', iconName: 'Layers' }, // Slate
];

export const INCOME_SOURCES: { name: IncomeSource; iconName: string }[] = [
  { name: 'Salary', iconName: 'Briefcase' },
  { name: 'Freelance', iconName: 'Laptop' },
  { name: 'Investments', iconName: 'TrendingUp' },
  { name: 'Gift', iconName: 'Gift' },
  { name: 'Business', iconName: 'Building' },
  { name: 'Other', iconName: 'Coins' },
];

/**
 * Local Storage DAO Implementation
 * Simulates SQLite/Room persistent storage with reactive listeners.
 */
class RoomTransactionDao {
  private listeners: Set<() => void> = new Set();

  private getStoredData(): TransactionEntity[] {
    try {
      const data = localStorage.getItem(ROOM_STORAGE_KEY);
      if (!data) {
        // Seed initial data on first launch
        localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(INITIAL_SEED_TRANSACTIONS));
        return INITIAL_SEED_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading from Room DB local storage', e);
      return INITIAL_SEED_TRANSACTIONS;
    }
  }

  private saveStoredData(data: TransactionEntity[]): void {
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners();
    } catch (e) {
      console.error('Error writing to Room DB local storage', e);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  // @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
  public async getAllTransactions(): Promise<TransactionEntity[]> {
    const list = this.getStoredData();
    return [...list].sort((a, b) => {
      // Sort descending by date/timestamp
      return b.timestamp - a.timestamp || b.createdAt - a.createdAt;
    });
  }

  // @Insert(onConflict = OnConflictStrategy.REPLACE)
  public async insertTransaction(transaction: TransactionEntity): Promise<void> {
    const list = this.getStoredData();
    const index = list.findIndex((t) => t.id === transaction.id);
    if (index >= 0) {
      list[index] = transaction;
    } else {
      list.unshift(transaction);
    }
    this.saveStoredData(list);
  }

  // @Update
  public async updateTransaction(transaction: TransactionEntity): Promise<void> {
    const list = this.getStoredData();
    const index = list.findIndex((t) => t.id === transaction.id);
    if (index >= 0) {
      list[index] = transaction;
      this.saveStoredData(list);
    } else {
      await this.insertTransaction(transaction);
    }
  }

  // @Delete
  public async deleteTransaction(id: string): Promise<TransactionEntity | null> {
    const list = this.getStoredData();
    const target = list.find((t) => t.id === id);
    if (target) {
      const filtered = list.filter((t) => t.id !== id);
      this.saveStoredData(filtered);
      return target;
    }
    return null;
  }

  public async restoreTransaction(transaction: TransactionEntity): Promise<void> {
    await this.insertTransaction(transaction);
  }

  public async resetDatabase(): Promise<void> {
    this.saveStoredData(INITIAL_SEED_TRANSACTIONS);
  }

  public async clearAll(): Promise<void> {
    this.saveStoredData([]);
  }
}

export const roomDatabase = new RoomTransactionDao();

