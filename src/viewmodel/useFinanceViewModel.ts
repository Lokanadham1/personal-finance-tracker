import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TransactionEntity,
  FinanceUiState,
  ExpenseCategory,
  IncomeSource,
  DateRangeOption,
  CategoryStat,
} from '../types';
import { roomDatabase, EXPENSE_CATEGORIES } from '../db/roomDatabase';

export function useFinanceViewModel() {
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastDeletedTransaction, setLastDeletedTransaction] = useState<TransactionEntity | null>(null);

  // Selected Month for Dashboard (Default to current month '2026-08')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Filters for Transaction List Screen
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Load from Room / Local Storage Database
  const loadTransactions = useCallback(async () => {
    try {
      const data = await roomDatabase.getAllTransactions();
      setTransactions(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reactive subscription to database changes
  useEffect(() => {
    loadTransactions();
    const unsubscribe = roomDatabase.subscribe(() => {
      loadTransactions();
    });
    return () => unsubscribe();
  }, [loadTransactions]);

  // Month navigation helpers
  const goToPrevMonth = useCallback(() => {
    setSelectedMonth((curr) => {
      const [yearStr, monthStr] = curr.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) - 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      return `${year}-${String(month).padStart(2, '0')}`;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((curr) => {
      const [yearStr, monthStr] = curr.split('-');
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      return `${year}-${String(month).padStart(2, '0')}`;
    });
  }, []);

  // Transactions filtered by the selected month for dashboard calculations
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Selected Month Calculations
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const remainingBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const spentPercentage = useMemo(() => {
    if (totalIncome <= 0) return totalExpense > 0 ? 100 : 0;
    return Math.round((totalExpense / totalIncome) * 100);
  }, [totalIncome, totalExpense]);

  // Category breakdown calculation for the selected month
  const categoryBreakdown = useMemo((): CategoryStat[] => {
    const expenses = monthTransactions.filter((t) => t.type === 'EXPENSE');
    const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap: Record<string, { total: number; count: number }> = {
      Food: { total: 0, count: 0 },
      Rent: { total: 0, count: 0 },
      Transport: { total: 0, count: 0 },
      Shopping: { total: 0, count: 0 },
      Bills: { total: 0, count: 0 },
      Other: { total: 0, count: 0 },
    };

    expenses.forEach((tx) => {
      const cat = tx.category in categoryMap ? tx.category : 'Other';
      categoryMap[cat].total += tx.amount;
      categoryMap[cat].count += 1;
    });

    const categoryColorMap: Record<string, string> = {
      Food: '#F97316',
      Rent: '#8B5CF6',
      Transport: '#0EA5E9',
      Shopping: '#EC4899',
      Bills: '#3B82F6',
      Other: '#64748B',
    };

    return Object.entries(categoryMap)
      .map(([category, stats]) => ({
        category: category as ExpenseCategory,
        total: stats.total,
        percentage: totalExp > 0 ? (stats.total / totalExp) * 100 : 0,
        count: stats.count,
        color: categoryColorMap[category] || '#94A3B8',
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthTransactions]);

  // Filtered transactions for Transaction List Screen
  const filteredTransactions = useMemo(() => {
    // Current date helpers for date range
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    let prevMonthYear = currentYear;
    let prevMonthNum = currentMonthNum - 1;
    if (prevMonthNum < 1) {
      prevMonthNum = 12;
      prevMonthYear -= 1;
    }
    const prevMonthKey = `${prevMonthYear}-${String(prevMonthNum).padStart(2, '0')}`;

    return transactions.filter((tx) => {
      // 1. Type Filter (All / Income / Expense)
      if (selectedFilter === 'INCOME' && tx.type !== 'INCOME') return false;
      if (selectedFilter === 'EXPENSE' && tx.type !== 'EXPENSE') return false;

      // 2. Category Filter (Only applies if not 'ALL')
      if (selectedCategoryFilter !== 'ALL' && tx.category !== selectedCategoryFilter) {
        return false;
      }

      // 3. Date Range Filter
      if (dateRangeOption === 'THIS_MONTH') {
        if (!tx.date.startsWith(selectedMonth)) return false;
      } else if (dateRangeOption === 'LAST_MONTH') {
        if (!tx.date.startsWith(prevMonthKey)) return false;
      } else if (dateRangeOption === 'CUSTOM') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // 4. Search Filter (Description, Category, Amount)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesAmt = tx.amount.toString().includes(query);
        return matchesDesc || matchesCat || matchesAmt;
      }

      return true;
    });
  }, [
    transactions,
    selectedFilter,
    selectedCategoryFilter,
    dateRangeOption,
    selectedMonth,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Actions / Mutations
  const addIncome = useCallback(
    async (amount: number, source: IncomeSource | string, date: string, description?: string) => {
      const timestamp = new Date(date + 'T12:00:00').getTime() || Date.now();
      const newTx: TransactionEntity = {
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        type: 'INCOME',
        amount: Math.abs(amount),
        category: source,
        description: description?.trim() || `${source} Income`,
        date: date,
        timestamp: timestamp,
        createdAt: Date.now(),
      };
      await roomDatabase.insertTransaction(newTx);
      return newTx;
    },
    []
  );

  const addExpense = useCallback(
    async (amount: number, category: ExpenseCategory | string, description: string, date: string) => {
      const timestamp = new Date(date + 'T12:00:00').getTime() || Date.now();
      const newTx: TransactionEntity = {
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        type: 'EXPENSE',
        amount: Math.abs(amount),
        category: category,
        description: description.trim() || `${category} expense`,
        date: date,
        timestamp: timestamp,
        createdAt: Date.now(),
      };
      await roomDatabase.insertTransaction(newTx);
      return newTx;
    },
    []
  );

  const editTransaction = useCallback(async (updated: TransactionEntity) => {
    const timestamp = new Date(updated.date + 'T12:00:00').getTime() || updated.timestamp || Date.now();
    const normalized: TransactionEntity = {
      ...updated,
      amount: Math.abs(updated.amount),
      timestamp: timestamp,
    };
    await roomDatabase.updateTransaction(normalized);
    return normalized;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const deleted = await roomDatabase.deleteTransaction(id);
    if (deleted) {
      setLastDeletedTransaction(deleted);
    }
    return deleted;
  }, []);

  const restoreLastDeleted = useCallback(async () => {
    if (lastDeletedTransaction) {
      await roomDatabase.restoreTransaction(lastDeletedTransaction);
      setLastDeletedTransaction(null);
    }
  }, [lastDeletedTransaction]);

  const clearLastDeleted = useCallback(() => {
    setLastDeletedTransaction(null);
  }, []);

  const resetData = useCallback(async () => {
    await roomDatabase.resetDatabase();
  }, []);

  const clearAllData = useCallback(async () => {
    await roomDatabase.clearAll();
  }, []);

  const uiState: FinanceUiState = {
    transactions,
    isLoading,
    selectedMonth,
    totalIncome,
    totalExpense,
    remainingBalance,
    spentPercentage,
    categoryBreakdown,
    lastDeletedTransaction,
  };

  return {
    uiState,
    selectedMonth,
    setSelectedMonth,
    goToPrevMonth,
    goToNextMonth,
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    dateRangeOption,
    setDateRangeOption,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    addIncome,
    addExpense,
    editTransaction,
    deleteTransaction,
    restoreLastDeleted,
    clearLastDeleted,
    resetData,
    clearAllData,
  };
}

