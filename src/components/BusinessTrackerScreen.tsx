import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Package,
  Layers,
  Truck,
  Box,
  Coins,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Filter,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Building,
  RotateCcw,
  Sparkles,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Share2,
  Upload,
  FileUp,
  Check,
  FolderDown,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  OrderEntity,
  OrderExpenseEntity,
  BusinessInvestmentEntity,
  OrderStatus,
  OrderExpenseType,
  BusinessSubView,
  BusinessPeriodFilter,
  NavigationTab,
} from '../types';
import { businessDatabase } from '../db/businessDatabase';
import { formatCurrency, formatDateLabel, M3Card } from './M3Components';
import { useLanguage } from '../i18n/LanguageContext';
import {
  saveBusinessCsvToAndroid,
  shareBusinessCsvViaAndroid,
  saveSeparateBusinessCsvFiles,
  isAndroidFileSharingSupported,
} from '../utils/csvExport';
import {
  parseAndValidateBusinessCsv,
  BusinessImportPreview,
} from '../utils/csvImport';

export function BusinessTrackerScreen({
  onNavigate,
}: {
  onNavigate: (tab: NavigationTab) => void;
}) {
  const { t, language } = useLanguage();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<BusinessSubView>('orders');
  const [incomeSectionTab, setIncomeSectionTab] = useState<'profit' | 'investments'>('profit');
  const [incomePeriod, setIncomePeriod] = useState<BusinessPeriodFilter>('all');

  // Database state
  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [expenses, setExpenses] = useState<OrderExpenseEntity[]>([]);
  const [investments, setInvestments] = useState<BusinessInvestmentEntity[]>([]);

  // Search & Filter state
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expenseOrderFilter, setExpenseOrderFilter] = useState<string>('ALL');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderEntity | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OrderExpenseEntity | null>(null);

  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<BusinessInvestmentEntity | null>(null);

  // CSV Export & Import state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'separate' | 'orders' | 'expenses' | 'investments'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [statusToast, setStatusToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // CSV Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetScope, setImportTargetScope] = useState<'auto' | 'orders' | 'expenses' | 'investments'>('auto');
  const [importPreview, setImportPreview] = useState<BusinessImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportParsing, setIsImportParsing] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'valid' | 'issues'>('valid');
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'order' | 'expense' | 'investment';
    id: string;
    title: string;
  } | null>(null);

  // Form states
  // Order Form
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    itemDetails: '',
    quantity: '',
    orderPrice: '',
    orderStatus: 'Pending' as OrderStatus,
    notes: '',
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    orderId: '',
    expenseType: 'Groceries / Raw Materials' as OrderExpenseType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Investment Form
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    notes: '',
  });

  // Load data & subscribe to changes
  useEffect(() => {
    const loadData = () => {
      setOrders(businessDatabase.getOrders());
      setExpenses(businessDatabase.getExpenses());
      setInvestments(businessDatabase.getInvestments());
    };

    loadData();
    const unsubscribe = businessDatabase.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // Map of total expenses per orderId
  const expensesPerOrderMap = useMemo(() => {
    const map = new Map<string, { total: number; count: number; items: OrderExpenseEntity[] }>();
    expenses.forEach((exp) => {
      const existing = map.get(exp.orderId) || { total: 0, count: 0, items: [] };
      existing.total += exp.amount;
      existing.count += 1;
      existing.items.push(exp);
      map.set(exp.orderId, existing);
    });
    return map;
  }, [expenses]);

  // Overall Global Calculations
  const totalGrossOrderPrice = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.orderPrice || 0), 0);
  }, [orders]);

  const totalAllOrderExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenses]);

  // Total Income = Gross Sales - Total Expenses across all orders
  const totalNetOrderIncome = totalGrossOrderPrice - totalAllOrderExpenses;

  // Total Investment till date
  const totalInvestmentAmount = useMemo(() => {
    return investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [investments]);

  // Overall Business Net Profit = Total Net Income - Total Investment
  const overallNetProfit = totalNetOrderIncome - totalInvestmentAmount;

  // Filtered orders for Income period analysis
  const filteredOrdersForPeriod = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return orders.filter((order) => {
      if (incomePeriod === 'all') return true;

      const [y, m, d] = order.orderDate.split('-').map(Number);
      const orderDate = new Date(y, m - 1, d);
      orderDate.setHours(0, 0, 0, 0);

      if (incomePeriod === 'daily') {
        return orderDate.getTime() === today.getTime();
      }

      if (incomePeriod === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo && orderDate <= today;
      }

      if (incomePeriod === 'monthly') {
        const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        return order.orderDate.startsWith(currentYearMonth);
      }

      return true;
    });
  }, [orders, incomePeriod]);

  // Period-specific income calculations
  const periodStats = useMemo(() => {
    const periodOrders = filteredOrdersForPeriod;
    const periodOrderIds = new Set(periodOrders.map((o) => o.id));

    const gross = periodOrders.reduce((sum, o) => sum + o.orderPrice, 0);
    const expTotal = expenses
      .filter((e) => periodOrderIds.has(e.orderId))
      .reduce((sum, e) => sum + e.amount, 0);
    const net = gross - expTotal;
    const margin = gross > 0 ? (net / gross) * 100 : 0;

    return {
      gross,
      expenses: expTotal,
      net,
      margin,
      orderCount: periodOrders.length,
    };
  }, [filteredOrdersForPeriod, expenses]);

  // Filtered orders list for the Orders view
  const displayOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesQuery =
          o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
          o.itemDetails.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
          o.quantity.toLowerCase().includes(orderSearchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime() || b.createdAt - a.createdAt);
  }, [orders, orderSearchQuery, statusFilter]);

  // Filtered expenses list for the Expenses view
  const displayExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesOrder = expenseOrderFilter === 'ALL' || exp.orderId === expenseOrderFilter;
        const matchesType = expenseTypeFilter === 'ALL' || exp.expenseType === expenseTypeFilter;
        return matchesOrder && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
  }, [expenses, expenseOrderFilter, expenseTypeFilter]);

  // Helper for Order Status Badge styling
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return {
          bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          icon: CheckCircle2,
          label: t.statusDelivered,
        };
      case 'Completed':
        return {
          bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          icon: CheckCircle2,
          label: t.statusCompleted,
        };
      case 'In Progress':
        return {
          bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          icon: Clock,
          label: t.statusInProgress,
        };
      case 'Pending':
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          icon: AlertCircle,
          label: t.statusPending,
        };
    }
  };

  // Helper for Expense Type styling & icons
  const getExpenseTypeInfo = (type: OrderExpenseType) => {
    switch (type) {
      case 'Groceries / Raw Materials':
        return {
          icon: Layers,
          color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
          border: 'border-orange-200 dark:border-orange-800/40',
          label: t.expenseTypeGroceries,
        };
      case 'Packaging':
        return {
          icon: Box,
          color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
          border: 'border-purple-200 dark:border-purple-800/40',
          label: t.expenseTypePackaging,
        };
      case 'Delivery':
        return {
          icon: Truck,
          color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
          border: 'border-sky-200 dark:border-sky-800/40',
          label: t.expenseTypeDelivery,
        };
      case 'Other':
      default:
        return {
          icon: Coins,
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          label: t.expenseTypeOther,
        };
    }
  };

  // Open Order Modal for Add or Edit
  const openOrderModal = (order?: OrderEntity) => {
    if (order) {
      setEditingOrder(order);
      setOrderForm({
        customerName: order.customerName,
        orderDate: order.orderDate,
        itemDetails: order.itemDetails,
        quantity: order.quantity,
        orderPrice: order.orderPrice.toString(),
        orderStatus: order.orderStatus,
        notes: order.notes || '',
      });
    } else {
      setEditingOrder(null);
      setOrderForm({
        customerName: '',
        orderDate: new Date().toISOString().split('T')[0],
        itemDetails: '',
        quantity: '',
        orderPrice: '',
        orderStatus: 'Pending',
        notes: '',
      });
    }
    setIsOrderModalOpen(true);
  };

  // Save Order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customerName.trim() || !orderForm.itemDetails.trim()) return;

    const price = parseFloat(orderForm.orderPrice) || 0;
    const orderData: OrderEntity = {
      id: editingOrder ? editingOrder.id : `ord-${Date.now()}`,
      customerName: orderForm.customerName.trim(),
      orderDate: orderForm.orderDate || new Date().toISOString().split('T')[0],
      itemDetails: orderForm.itemDetails.trim(),
      quantity: orderForm.quantity.trim() || '1',
      orderPrice: price,
      orderStatus: orderForm.orderStatus,
      notes: orderForm.notes.trim() || undefined,
      createdAt: editingOrder ? editingOrder.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    businessDatabase.saveOrder(orderData);
    setIsOrderModalOpen(false);
  };

  // Open Expense Modal for Add or Edit
  const openExpenseModal = (expense?: OrderExpenseEntity, prefillOrderId?: string) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        orderId: expense.orderId,
        expenseType: expense.expenseType,
        amount: expense.amount.toString(),
        date: expense.date,
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setExpenseForm({
        orderId: prefillOrderId || (orders.length > 0 ? orders[0].id : ''),
        expenseType: 'Groceries / Raw Materials',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setIsExpenseModalOpen(true);
  };

  // Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.orderId) return;

    const amount = parseFloat(expenseForm.amount) || 0;
    if (amount <= 0) return;

    const expenseData: OrderExpenseEntity = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      orderId: expenseForm.orderId,
      expenseType: expenseForm.expenseType,
      amount,
      date: expenseForm.date || new Date().toISOString().split('T')[0],
      notes: expenseForm.notes.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : Date.now(),
    };

    businessDatabase.saveExpense(expenseData);
    setIsExpenseModalOpen(false);
  };

  // Open Investment Modal for Add or Edit
  const openInvestmentModal = (investment?: BusinessInvestmentEntity) => {
    if (investment) {
      setEditingInvestment(investment);
      setInvestmentForm({
        amount: investment.amount.toString(),
        date: investment.date,
        purpose: investment.purpose,
        notes: investment.notes || '',
      });
    } else {
      setEditingInvestment(null);
      setInvestmentForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        notes: '',
      });
    }
    setIsInvestmentModalOpen(true);
  };

  // Save Investment
  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(investmentForm.amount) || 0;
    if (amount <= 0 || !investmentForm.purpose.trim()) return;

    const investmentData: BusinessInvestmentEntity = {
      id: editingInvestment ? editingInvestment.id : `inv-${Date.now()}`,
      amount,
      date: investmentForm.date || new Date().toISOString().split('T')[0],
      purpose: investmentForm.purpose.trim(),
      notes: investmentForm.notes.trim() || undefined,
      createdAt: editingInvestment ? editingInvestment.createdAt : Date.now(),
    };

    businessDatabase.saveInvestment(investmentData);
    setIsInvestmentModalOpen(false);
  };

  // Execute confirmed delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return;
    if (deleteConfirmation.type === 'order') {
      businessDatabase.deleteOrder(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'expense') {
      businessDatabase.deleteExpense(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'investment') {
      businessDatabase.deleteInvestment(deleteConfirmation.id);
    }
    setDeleteConfirmation(null);
  };

  // CSV Export Handlers
  const handleSaveBusinessCsv = async (scope: 'all' | 'separate' | 'orders' | 'expenses' | 'investments' = exportScope) => {
    if (scope === 'separate') {
      const totalCount = orders.length + expenses.length + investments.length;
      if (totalCount === 0) {
        setStatusToast({
          text: 'No business records available to export',
          type: 'error',
        });
        setTimeout(() => setStatusToast(null), 3000);
        return;
      }

      setIsExporting(true);
      try {
        const result = await saveSeparateBusinessCsvFiles(orders, expenses, investments);
        setStatusToast({
          text: `✓ ${result.message}`,
          type: 'success',
        });
        setIsExportModalOpen(false);
      } catch (err: any) {
        if (err.message !== 'Export cancelled by user') {
          setStatusToast({
            text: err.message || 'Failed to export separate CSV files',
            type: 'error',
          });
        }
      } finally {
        setIsExporting(false);
        setTimeout(() => setStatusToast(null), 3500);
      }
      return;
    }

    const totalCount =
      scope === 'orders'
        ? orders.length
        : scope === 'expenses'
        ? expenses.length
        : scope === 'investments'
        ? investments.length
        : orders.length + expenses.length + investments.length;

    if (totalCount === 0) {
      setStatusToast({
        text: 'No business records available to export',
        type: 'error',
      });
      setTimeout(() => setStatusToast(null), 3000);
      return;
    }

    setIsExporting(true);
    try {
      const result = await saveBusinessCsvToAndroid(
        orders,
        expenses,
        investments,
        scope,
        'business-tracker'
      );
      setStatusToast({
        text: `✓ ${result.message}`,
        type: 'success',
      });
      setIsExportModalOpen(false);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        setStatusToast({
          text: err.message || 'Failed to export CSV file',
          type: 'error',
        });
      }
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusToast(null), 3500);
    }
  };

  const handleShareBusinessCsv = async (scope: 'all' | 'separate' | 'orders' | 'expenses' | 'investments' = exportScope) => {
    // Sharing separate files via Web Share API can fall back to combined
    const effectiveScope = scope === 'separate' ? 'all' : scope;
    const totalCount =
      effectiveScope === 'orders'
        ? orders.length
        : effectiveScope === 'expenses'
        ? expenses.length
        : effectiveScope === 'investments'
        ? investments.length
        : orders.length + expenses.length + investments.length;

    if (totalCount === 0) {
      setStatusToast({
        text: 'No business records available to export',
        type: 'error',
      });
      setTimeout(() => setStatusToast(null), 3000);
      return;
    }

    setIsExporting(true);
    try {
      const result = await shareBusinessCsvViaAndroid(
        orders,
        expenses,
        investments,
        effectiveScope,
        'business-tracker'
      );
      setStatusToast({
        text: `✓ ${result.message}`,
        type: 'success',
      });
      setIsExportModalOpen(false);
    } catch (err: any) {
      if (err.message !== 'Share cancelled by user') {
        setStatusToast({
          text: err.message || 'Failed to share CSV',
          type: 'error',
        });
      }
    } finally {
      setIsExporting(false);
      setTimeout(() => setStatusToast(null), 3500);
    }
  };

  // CSV Import Handlers
  const handleTriggerFileInput = (targetScope: 'auto' | 'orders' | 'expenses' | 'investments' = 'auto') => {
    setImportTargetScope(targetScope);
    setIsHeaderMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content || !content.trim()) {
        setStatusToast({ text: 'Selected CSV file is empty', type: 'error' });
        setTimeout(() => setStatusToast(null), 3000);
        setIsImportParsing(false);
        return;
      }

      try {
        const preview = parseAndValidateBusinessCsv(
          content,
          file.name,
          importTargetScope,
          orders
        );

        if (preview.totalValidCount === 0 && preview.totalInvalidCount === 0) {
          setStatusToast({ text: 'No data rows found in CSV file', type: 'error' });
          setTimeout(() => setStatusToast(null), 3000);
        } else {
          setImportPreview(preview);
          setActivePreviewTab(preview.totalValidCount > 0 ? 'valid' : 'issues');
          setIsImportModalOpen(true);
        }
      } catch (err: any) {
        setStatusToast({ text: `Failed to parse CSV: ${err.message}`, type: 'error' });
        setTimeout(() => setStatusToast(null), 3500);
      } finally {
        setIsImportParsing(false);
      }
    };

    reader.onerror = () => {
      setStatusToast({ text: 'Failed to read selected CSV file', type: 'error' });
      setTimeout(() => setStatusToast(null), 3000);
      setIsImportParsing(false);
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.totalValidCount === 0) return;

    setIsImporting(true);
    try {
      let importedCount = 0;

      if (importPreview.ordersResult && importPreview.ordersResult.validRows.length > 0) {
        const ordersData = importPreview.ordersResult.validRows.map((r) => r.data);
        const res = businessDatabase.importOrders(ordersData);
        importedCount += res.added;
      }

      if (importPreview.expensesResult && importPreview.expensesResult.validRows.length > 0) {
        const expensesData = importPreview.expensesResult.validRows.map((r) => r.data);
        const res = businessDatabase.importExpenses(expensesData);
        importedCount += res.added;
      }

      if (importPreview.investmentsResult && importPreview.investmentsResult.validRows.length > 0) {
        const investmentsData = importPreview.investmentsResult.validRows.map((r) => r.data);
        const res = businessDatabase.importInvestments(investmentsData);
        importedCount += res.added;
      }

      const skippedCount = importPreview.totalInvalidCount;
      const typeLabel =
        importPreview.scope === 'orders'
          ? 'orders'
          : importPreview.scope === 'expenses'
          ? 'expenses'
          : importPreview.scope === 'investments'
          ? 'investments'
          : 'records';

      const successMsg =
        skippedCount > 0
          ? `${importedCount} ${typeLabel} imported successfully (${skippedCount} invalid rows skipped)`
          : `${importedCount} ${typeLabel} imported successfully!`;

      setStatusToast({
        text: `✓ ${successMsg}`,
        type: 'success',
      });
      setIsImportModalOpen(false);
      setImportPreview(null);
    } catch (err: any) {
      setStatusToast({
        text: `Failed to import records: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsImporting(false);
      setTimeout(() => setStatusToast(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-3 max-w-lg mx-auto w-full relative">
      {/* Top Header Title & Menu Actions Bar */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#005cb2]/10 dark:bg-[#005cb2]/20 text-[#005cb2] dark:text-blue-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight truncate">
                {t.navBusiness}
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#005cb2] dark:text-blue-300 shrink-0">
                {orders.length} {t.ordersTab}
              </span>
            </div>
            <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] truncate">
              {orders.length + expenses.length + investments.length} total records
            </p>
          </div>
        </div>

        {/* Global CSV Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          accept=".csv,text/csv"
          className="hidden"
          id="global-csv-file-input"
        />

        {/* Header Actions: Import & Export */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-header-import-csv"
            type="button"
            disabled={isImportParsing}
            onClick={() => handleTriggerFileInput('auto')}
            title="Import data from CSV file"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#202227] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold border border-[#d2d6de] dark:border-[#2d3036] shadow-2xs transition-all cursor-pointer select-none active:scale-95 shrink-0 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-[#005cb2] dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Import</span>
            <span className="sm:hidden">Import</span>
          </button>

          <button
            id="btn-menu-export-csv"
            type="button"
            onClick={() => {
              setExportScope(
                activeSubTab === 'orders'
                  ? 'orders'
                  : activeSubTab === 'expenses'
                  ? 'expenses'
                  : activeSubTab === 'investments' || incomeSectionTab === 'investments'
                  ? 'investments'
                  : 'all'
              );
              setIsExportModalOpen(true);
            }}
            title={t.exportBusinessCsv}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#202227] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold border border-[#d2d6de] dark:border-[#2d3036] shadow-2xs transition-all cursor-pointer select-none active:scale-95 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">{t.exportCsv}</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* 3-Pill Horizontal Tab Bar: Orders, Expenses, Income & Profit */}
      <div 
        id="biz-tracker-tabs"
        className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[#e7ebf0] dark:bg-[#202227] border border-[#d2d6de] dark:border-[#2d3036] shadow-2xs w-full"
      >
        {/* Pill 1: Orders */}
        <button
          id="btn-subtab-orders"
          type="button"
          onClick={() => setActiveSubTab('orders')}
          className={`h-10 sm:h-11 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 select-none ${
            activeSubTab === 'orders'
              ? 'bg-[#005cb2] text-white shadow-xs'
              : 'bg-white/80 dark:bg-[#1a1c1e] text-[#4b5563] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white border border-[#d2d6de]/60 dark:border-[#2d3036] hover:bg-white dark:hover:bg-[#252830]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">{t.ordersTab}</span>
          <span
            className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] rounded-full font-black shrink-0 leading-none ${
              activeSubTab === 'orders'
                ? 'bg-white/25 text-white'
                : 'bg-[#005cb2]/10 dark:bg-[#a5c8ff]/20 text-[#005cb2] dark:text-[#a5c8ff]'
            }`}
          >
            {orders.length}
          </span>
        </button>

        {/* Pill 2: Expenses */}
        <button
          id="btn-subtab-expenses"
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          className={`h-10 sm:h-11 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 select-none ${
            activeSubTab === 'expenses'
              ? 'bg-[#005cb2] text-white shadow-xs'
              : 'bg-white/80 dark:bg-[#1a1c1e] text-[#4b5563] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white border border-[#d2d6de]/60 dark:border-[#2d3036] hover:bg-white dark:hover:bg-[#252830]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">{t.expensesTab}</span>
          <span
            className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] rounded-full font-black shrink-0 leading-none ${
              activeSubTab === 'expenses'
                ? 'bg-white/25 text-white'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {expenses.length}
          </span>
        </button>

        {/* Pill 3: Income & Profit */}
        <button
          id="btn-subtab-income"
          type="button"
          onClick={() => setActiveSubTab('income')}
          className={`h-10 sm:h-11 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 select-none ${
            activeSubTab === 'income' || activeSubTab === 'investments'
              ? 'bg-[#005cb2] text-white shadow-xs'
              : 'bg-white/80 dark:bg-[#1a1c1e] text-[#4b5563] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white border border-[#d2d6de]/60 dark:border-[#2d3036] hover:bg-white dark:hover:bg-[#252830]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">{t.incomeTab}</span>
        </button>
      </div>

      {/* Sub-view 1: ORDERS SECTION */}
      {activeSubTab === 'orders' && (
        <div className="flex flex-col gap-3.5">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
                {t.ordersTab}
              </h2>
              <p className="text-xs text-[#74777f] dark:text-[#8e9099]">
                {orders.length} {t.ordersTab} recorded • Most recent first
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="btn-import-orders-csv"
                type="button"
                onClick={() => handleTriggerFileInput('orders')}
                title="Import Orders from CSV file"
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <Upload className="w-4 h-4 text-[#005cb2] dark:text-blue-400" />
                <span className="hidden sm:inline">Import</span>
              </button>

              <button
                id="btn-export-orders-csv"
                type="button"
                onClick={() => {
                  setExportScope('orders');
                  setIsExportModalOpen(true);
                }}
                title="Export Orders CSV"
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                id="btn-add-order"
                type="button"
                onClick={() => openOrderModal()}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#005cb2] hover:bg-[#004a77] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="truncate">{t.addNewOrder}</span>
              </button>
            </div>
          </div>

          {/* Search & Status Filter Controls */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search Customer or Item */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-neutral-400 pointer-events-none" />
                <input
                  id="input-search-orders"
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search customer, item, quantity..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-[#1a1c1e] dark:text-[#e2e2e6] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all shadow-2xs"
                />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative sm:w-52 shrink-0">
                <select
                  id="select-filter-order-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter orders by stage"
                  className="w-full appearance-none text-xs py-2.5 pl-3.5 pr-8 rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-[#1a1c1e] dark:text-[#e2e2e6] font-semibold focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Stages ({orders.length})</option>
                  <option value="Pending">Pending ({orders.filter((o) => o.orderStatus === 'Pending').length})</option>
                  <option value="In Progress">In Progress ({orders.filter((o) => o.orderStatus === 'In Progress').length})</option>
                  <option value="Completed">Completed ({orders.filter((o) => o.orderStatus === 'Completed').length})</option>
                  <option value="Delivered">Delivered ({orders.filter((o) => o.orderStatus === 'Delivered').length})</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            {/* Filter Chips with Smooth Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none [-webkit-overflow-scrolling:touch]">
              {(['ALL', 'Pending', 'In Progress', 'Completed', 'Delivered'] as const).map((status) => {
                const count =
                  status === 'ALL'
                    ? orders.length
                    : orders.filter((o) => o.orderStatus === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all select-none flex items-center gap-1.5 ${
                      statusFilter === status
                        ? 'bg-[#005cb2] text-white shadow-2xs'
                        : 'bg-white dark:bg-[#202227] text-neutral-600 dark:text-neutral-300 border border-[#e1e2e8] dark:border-[#2d3036] hover:bg-neutral-50 dark:hover:bg-[#282b33]'
                    }`}
                  >
                    <span>
                      {status === 'ALL'
                        ? t.filterAll
                        : status === 'Pending'
                        ? t.statusPending
                        : status === 'In Progress'
                        ? t.statusInProgress
                        : status === 'Completed'
                        ? t.statusCompleted
                        : t.statusDelivered}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        statusFilter === status
                          ? 'bg-white/25 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Cards List */}
          {displayOrders.length === 0 ? (
            <M3Card className="p-8 text-center flex flex-col items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                {t.noOrdersFound}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                {t.createFirstOrder}
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handleTriggerFileInput('orders')}
                  className="px-3.5 py-2.5 bg-white dark:bg-[#202227] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#005cb2] dark:text-blue-400 border border-[#d2d6de] dark:border-[#2d3036] text-xs font-bold rounded-xl cursor-pointer shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => openOrderModal()}
                  className="px-4 py-2.5 bg-[#005cb2] hover:bg-[#004a77] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addNewOrder}</span>
                </button>
              </div>
            </M3Card>
          ) : (
            <div className="space-y-3">
              {displayOrders.map((order) => {
                const badge = getStatusBadge(order.orderStatus);
                const StatusIcon = badge.icon;
                const orderExpensesData = expensesPerOrderMap.get(order.id) || { total: 0, count: 0, items: [] };
                const orderProfit = order.orderPrice - orderExpensesData.total;
                const profitMargin = order.orderPrice > 0 ? (orderProfit / order.orderPrice) * 100 : 0;

                return (
                  <M3Card key={order.id} className="p-4" id={`order-card-${order.id}`}>
                    {/* Top Row: Customer Name, Status Badge, Edit/Delete */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#e1e2e8]/60 dark:border-[#2d3036]/60 pb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                            {order.customerName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#74777f] dark:text-[#8e9099] mt-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{formatDateLabel(order.orderDate, language)}</span>
                          <span>•</span>
                          <span>{order.orderDate}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openOrderModal(order)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-[#005cb2] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title={t.editOrder}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirmation({
                              type: 'order',
                              id: order.id,
                              title: `${t.ordersTab}: "${order.customerName}" (${formatCurrency(order.orderPrice)})`,
                            })
                          }
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Item details & Quantity */}
                    <div className="py-2.5 text-xs text-[#1a1c1e] dark:text-[#e2e2e6]">
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm leading-tight text-neutral-900 dark:text-neutral-100">
                            {order.itemDetails}
                          </p>
                          <p className="text-xs text-[#74777f] dark:text-[#8e9099] mt-1 font-medium">
                            {t.quantity}: <strong className="text-neutral-900 dark:text-neutral-100 font-bold">{order.quantity}</strong>
                          </p>
                        </div>
                      </div>

                      {order.notes && (
                        <p className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-300 bg-[#f0f4f9] dark:bg-[#1a1c1e] border border-[#e1e2e8]/60 dark:border-[#2d3036]/60 p-2.5 rounded-xl italic">
                          "{order.notes}"
                        </p>
                      )}
                    </div>

                    {/* Financial Summary Strip for this Order */}
                    <div className="bg-[#f0f4f9] dark:bg-[#181a1f] rounded-xl p-3 border border-[#e1e2e8] dark:border-[#2d3036] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#44474e] dark:text-[#c4c7d0] font-medium">
                          {t.orderPrice}:
                        </span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(order.orderPrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#44474e] dark:text-[#c4c7d0] font-medium flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-rose-500" />
                          <span>{t.linkedExpenses} ({orderExpensesData.count}):</span>
                        </span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          −{formatCurrency(orderExpensesData.total)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#e1e2e8] dark:border-[#2d3036] flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                            {t.orderProfit}:
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                            Margin: {profitMargin.toFixed(0)}%
                          </span>
                        </div>
                        <span
                          className={`text-sm font-black ${
                            orderProfit >= 0
                              ? 'text-[#005cb2] dark:text-[#a5c8ff]'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {orderProfit >= 0 ? `+${formatCurrency(orderProfit)}` : `−${formatCurrency(Math.abs(orderProfit))}`}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action: Add linked Expense quickly */}
                    <div className="mt-3 pt-2 border-t border-[#e1e2e8]/40 dark:border-[#2d3036]/40 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => openExpenseModal(undefined, order.id)}
                        className="text-xs font-bold text-[#005cb2] dark:text-[#a5c8ff] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addExpenseForOrder}</span>
                      </button>

                      {orderExpensesData.count > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpenseOrderFilter(order.id);
                            setActiveSubTab('expenses');
                          }}
                          className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>View {orderExpensesData.count} Expenses</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </M3Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-view 2: EXPENSES SECTION (linked to each order) */}
      {activeSubTab === 'expenses' && (
        <div className="flex flex-col gap-3.5">
          {/* Header & Add Expense Button */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
                {t.expensesTab}
              </h2>
              <p className="text-xs text-[#74777f] dark:text-[#8e9099]">
                {expenses.length} expenses linked to customer orders
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                id="btn-import-expenses-csv"
                type="button"
                onClick={() => handleTriggerFileInput('expenses')}
                title="Import Expenses from CSV file"
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <Upload className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">Import</span>
              </button>

              <button
                id="btn-export-expenses-csv"
                type="button"
                onClick={() => {
                  setExportScope('expenses');
                  setIsExportModalOpen(true);
                }}
                title="Export Expenses CSV"
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                id="btn-add-expense"
                type="button"
                onClick={() => openExpenseModal()}
                disabled={orders.length === 0}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all shrink-0 ${
                  orders.length === 0
                    ? 'bg-neutral-400 cursor-not-allowed opacity-60'
                    : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="truncate">{t.addNewExpense}</span>
              </button>
            </div>
          </div>

          {orders.length === 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Please create at least one order first to link expenses against it.</span>
            </div>
          )}

          {/* Filters: Filter by Order and Filter by Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Filter by Order */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0]">
                Filter by Order:
              </label>
              <select
                id="select-filter-expense-order"
                value={expenseOrderFilter}
                onChange={(e) => setExpenseOrderFilter(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all shadow-2xs"
              >
                <option value="ALL">All Orders ({orders.length})</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.customerName} - {formatCurrency(o.orderPrice)} ({o.orderDate})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0]">
                Filter by Type:
              </label>
              <select
                id="select-filter-expense-type"
                value={expenseTypeFilter}
                onChange={(e) => setExpenseTypeFilter(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all shadow-2xs"
              >
                <option value="ALL">All Expense Types</option>
                <option value="Groceries / Raw Materials">{t.expenseTypeGroceries}</option>
                <option value="Packaging">{t.expenseTypePackaging}</option>
                <option value="Delivery">{t.expenseTypeDelivery}</option>
                <option value="Other">{t.expenseTypeOther}</option>
              </select>
            </div>
          </div>

          {/* Active order filter reminder chip */}
          {expenseOrderFilter !== 'ALL' && (
            <div className="flex items-center justify-between p-2.5 bg-[#f0f4f9] dark:bg-[#202227] rounded-xl border border-[#e1e2e8] dark:border-[#2d3036] text-xs">
              <div className="flex items-center gap-1.5 text-[#005cb2] dark:text-[#a5c8ff] font-semibold truncate">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Filtered to: {orders.find((o) => o.id === expenseOrderFilter)?.customerName || 'Selected Order'}
                </span>
              </div>
              <button
                onClick={() => setExpenseOrderFilter('ALL')}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer ml-2"
              >
                Show All
              </button>
            </div>
          )}

          {/* Expense Items List */}
          {displayExpenses.length === 0 ? (
            <M3Card className="p-8 text-center flex flex-col items-center justify-center">
              <Layers className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                {t.noExpensesFound}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                Add materials, packaging, or delivery expenses linked to specific orders.
              </p>
              <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handleTriggerFileInput('expenses')}
                  className="px-3.5 py-2.5 bg-white dark:bg-[#202227] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-rose-600 dark:text-rose-400 border border-[#d2d6de] dark:border-[#2d3036] text-xs font-bold rounded-xl cursor-pointer shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openExpenseModal()}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addNewExpense}</span>
                  </button>
                )}
              </div>
            </M3Card>
          ) : (
            <div className="space-y-2.5">
              {displayExpenses.map((exp) => {
                const linkedOrder = orders.find((o) => o.id === exp.orderId);
                const typeInfo = getExpenseTypeInfo(exp.expenseType);
                const TypeIcon = typeInfo.icon;

                return (
                  <M3Card key={exp.id} className="p-4" id={`expense-card-${exp.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`p-2.5 rounded-xl ${typeInfo.color} shrink-0`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                              {typeInfo.label}
                            </span>
                            <span className="text-[10px] text-neutral-400">•</span>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {formatDateLabel(exp.date, language)}
                            </span>
                          </div>

                          {/* Linked Order Reference */}
                          <div className="mt-1 flex items-center gap-1 text-xs">
                            <span className="text-neutral-500 dark:text-neutral-400 shrink-0">Order:</span>
                            {linkedOrder ? (
                              <button
                                onClick={() => {
                                  setActiveSubTab('orders');
                                  setOrderSearchQuery(linkedOrder.customerName);
                                }}
                                className="font-semibold text-[#005cb2] dark:text-[#a5c8ff] hover:underline truncate text-left cursor-pointer"
                              >
                                {linkedOrder.customerName} ({formatCurrency(linkedOrder.orderPrice)})
                              </button>
                            ) : (
                              <span className="text-neutral-400 italic">Unknown Order</span>
                            )}
                          </div>

                          {exp.notes && (
                            <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                              {exp.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Amount & Actions */}
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                          −{formatCurrency(exp.amount)}
                        </span>
                        <div className="flex items-center gap-1 mt-1.5">
                          <button
                            onClick={() => openExpenseModal(exp)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-[#005cb2] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title={t.editExpense}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'expense',
                                id: exp.id,
                                title: `Expense: ${typeInfo.label} (${formatCurrency(exp.amount)})`,
                              })
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </M3Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-view 3: INCOME & PROFIT SECTION (Order Profit & Margins + Capital Investments) */}
      {(activeSubTab === 'income' || activeSubTab === 'investments') && (
        <div className="flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
                {t.incomeTab}
              </h2>
              <p className="text-xs text-[#74777f] dark:text-[#8e9099]">
                {(incomeSectionTab === 'profit' && activeSubTab !== 'investments')
                  ? t.incomeFormula
                  : 'Equipment, raw ingredients bulk stock & capital assets'}
              </p>
            </div>
            {(incomeSectionTab === 'investments' || activeSubTab === 'investments') && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="btn-import-investments-csv"
                  type="button"
                  onClick={() => handleTriggerFileInput('investments')}
                  title="Import Investments from CSV file"
                  className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Import</span>
                </button>

                <button
                  id="btn-export-investments-csv"
                  type="button"
                  onClick={() => {
                    setExportScope('investments');
                    setIsExportModalOpen(true);
                  }}
                  title="Export Investments to CSV"
                  className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  id="btn-add-investment"
                  type="button"
                  onClick={() => openInvestmentModal()}
                  className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span className="truncate">{t.addNewInvestment}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-Segment Toggle: Order Profit & Margins vs Capital Investments */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#e7ebf0] dark:bg-[#202227] border border-[#d2d6de] dark:border-[#2d3036] shadow-2xs">
            <button
              type="button"
              id="btn-income-mode-profit"
              onClick={() => {
                setActiveSubTab('income');
                setIncomeSectionTab('profit');
              }}
              className={`h-9 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                incomeSectionTab === 'profit' && activeSubTab !== 'investments'
                  ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                  : 'text-[#5a5f69] dark:text-[#9ea3ae] hover:text-[#1a1c1e] dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Order Profit & Margins</span>
            </button>

            <button
              type="button"
              id="btn-income-mode-investments"
              onClick={() => {
                setActiveSubTab('income');
                setIncomeSectionTab('investments');
              }}
              className={`h-9 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                incomeSectionTab === 'investments' || activeSubTab === 'investments'
                  ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                  : 'text-[#5a5f69] dark:text-[#9ea3ae] hover:text-[#1a1c1e] dark:hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.investmentTab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                  incomeSectionTab === 'investments' || activeSubTab === 'investments'
                    ? 'bg-[#005cb2]/15 text-[#005cb2] dark:bg-[#a5c8ff]/20 dark:text-[#a5c8ff]'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {investments.length}
              </span>
            </button>
          </div>

          {/* Section 1: Order Profit & Margins View */}
          {(incomeSectionTab === 'profit' && activeSubTab !== 'investments') && (
            <div className="flex flex-col gap-3.5">
              {/* Timeframe Period Filter Segmented Control */}
              <div className="bg-[#e7ebf0] dark:bg-[#202227] p-1 rounded-2xl border border-[#d2d6de] dark:border-[#2d3036] flex items-center justify-between gap-1 text-xs font-semibold shadow-2xs">
                {(['daily', 'weekly', 'monthly', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setIncomePeriod(period)}
                    className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer text-center text-xs select-none ${
                      incomePeriod === period
                        ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] font-bold shadow-2xs'
                        : 'text-[#5a5f69] dark:text-[#9ea3ae] hover:text-[#1a1c1e] dark:hover:text-white'
                    }`}
                  >
                    {period === 'daily'
                      ? t.periodDaily
                      : period === 'weekly'
                      ? t.periodWeekly
                      : period === 'monthly'
                      ? t.periodMonthly
                      : t.periodAllTime}
                  </button>
                ))}
              </div>

              {/* Period Highlight Banner */}
              <M3Card className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                      {incomePeriod === 'daily'
                        ? "Today's Net Income"
                        : incomePeriod === 'weekly'
                        ? "This Week's Net Income"
                        : incomePeriod === 'monthly'
                        ? "This Month's Net Income"
                        : 'All-Time Net Income'}
                    </span>
                    <h3 className="text-2xl font-black mt-1 tracking-tight">
                      +{formatCurrency(periodStats.net)}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
                  <div>
                    <span className="text-white/80 block text-[10px]">Gross Sales</span>
                    <span className="font-bold">{formatCurrency(periodStats.gross)}</span>
                  </div>
                  <div>
                    <span className="text-white/80 block text-[10px]">Expenses</span>
                    <span className="font-bold">−{formatCurrency(periodStats.expenses)}</span>
                  </div>
                  <div>
                    <span className="text-white/80 block text-[10px]">Net Margin</span>
                    <span className="font-bold">{periodStats.margin.toFixed(0)}%</span>
                  </div>
                </div>
              </M3Card>

              {/* Order-by-Order Income Breakdown */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mt-2">
                  Itemized Order Profit ({filteredOrdersForPeriod.length} orders)
                </h3>

                {filteredOrdersForPeriod.length === 0 ? (
                  <M3Card className="p-6 text-center">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      No orders recorded for this period. Switch to "All Time" to view full history.
                    </p>
                  </M3Card>
                ) : (
                  <div className="space-y-2.5">
                    {filteredOrdersForPeriod.map((ord) => {
                      const expData = expensesPerOrderMap.get(ord.id) || { total: 0, count: 0, items: [] };
                      const netOrderIncome = ord.orderPrice - expData.total;
                      const marginPct = ord.orderPrice > 0 ? (netOrderIncome / ord.orderPrice) * 100 : 0;

                      return (
                        <M3Card key={ord.id} className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                                {ord.customerName}
                              </h4>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {ord.itemDetails} ({ord.quantity})
                              </p>
                              <span className="text-[10px] text-neutral-400 mt-0.5 block font-medium">
                                {formatDateLabel(ord.orderDate, language)}
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                                Price: {formatCurrency(ord.orderPrice)}
                              </span>
                              <span className="text-[11px] text-rose-500 dark:text-rose-400 block font-medium">
                                Expenses: −{formatCurrency(expData.total)}
                              </span>
                              <span
                                className={`text-sm font-black ${
                                  netOrderIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                Net: +{formatCurrency(netOrderIncome)}
                              </span>
                            </div>
                          </div>

                          {/* Margin Progress Bar */}
                          <div className="mt-2.5 pt-2 border-t border-[#e1e2e8]/60 dark:border-[#2d3036]/60 flex items-center justify-between text-[11px]">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Profit Margin:</span>
                            <span className="font-bold text-[#005cb2] dark:text-[#a5c8ff]">
                              {marginPct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-[#e1e2e8] dark:bg-[#32363e] rounded-full h-1.5 overflow-hidden mt-1">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
                            />
                          </div>
                        </M3Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Capital Investments View */}
          {(incomeSectionTab === 'investments' || activeSubTab === 'investments') && (
            <div className="flex flex-col gap-3.5">
              {/* Simple Summary: Total Investment vs Total Income vs Net Profit */}
              <M3Card className="p-4 bg-[#f0f4f9] dark:bg-[#1f2229] border border-[#e1e2e8] dark:border-[#2d3036]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#005cb2] dark:text-[#a5c8ff]" />
                  <span>{t.investmentSummaryTitle}</span>
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block uppercase truncate">
                      Total Investment
                    </span>
                    <span className="text-xs sm:text-sm font-black text-blue-800 dark:text-blue-200 mt-1 block truncate">
                      {formatCurrency(totalInvestmentAmount)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block uppercase truncate">
                      Order Income
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-200 mt-1 block truncate">
                      +{formatCurrency(totalNetOrderIncome)}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border ${
                      overallNetProfit >= 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold block uppercase truncate">
                      {overallNetProfit >= 0 ? t.netProfit : t.netLoss}
                    </span>
                    <span className="text-xs sm:text-sm font-black mt-1 block truncate">
                      {overallNetProfit >= 0 ? `+${formatCurrency(overallNetProfit)}` : `−${formatCurrency(Math.abs(overallNetProfit))}`}
                    </span>
                  </div>
                </div>

                {/* Investment Recovery Progress Bar */}
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    <span>Capital Recovery Rate</span>
                    <span>
                      {totalInvestmentAmount > 0
                        ? `${Math.min(200, Math.round((totalNetOrderIncome / totalInvestmentAmount) * 100))}%`
                        : '100%'}
                    </span>
                  </div>
                  <div className="w-full bg-[#e1e2e8] dark:bg-[#32363e] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#005cb2] transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          totalInvestmentAmount > 0 ? (totalNetOrderIncome / totalInvestmentAmount) * 100 : 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </M3Card>

              {/* List of Investments */}
              {investments.length === 0 ? (
                <M3Card className="p-8 text-center flex flex-col items-center justify-center">
                  <Building className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                    {t.noInvestmentsFound}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                    Add equipment, initial stock, or machinery investments.
                  </p>
                  <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => handleTriggerFileInput('investments')}
                      className="px-3.5 py-2.5 bg-white dark:bg-[#202227] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-blue-600 dark:text-blue-400 border border-[#d2d6de] dark:border-[#2d3036] text-xs font-bold rounded-xl cursor-pointer shadow-2xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openInvestmentModal()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addNewInvestment}</span>
                    </button>
                  </div>
                </M3Card>
              ) : (
                <div className="space-y-2.5">
                  {investments.map((inv) => (
                    <M3Card key={inv.id} className="p-4" id={`investment-card-${inv.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                              {inv.purpose}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDateLabel(inv.date, language)}</span>
                              <span>•</span>
                              <span>{inv.date}</span>
                            </div>
                            {inv.notes && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5 italic">
                                "{inv.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                            {formatCurrency(inv.amount)}
                          </span>
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              onClick={() => openInvestmentModal(inv)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title={t.editInvestment}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmation({
                                  type: 'investment',
                                  id: inv.id,
                                  title: `Investment: "${inv.purpose}" (${formatCurrency(inv.amount)})`,
                                })
                              }
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Investment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </M3Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Database Sample Data Seed / Reset Footer */}
      <div className="pt-4 mt-2 border-t border-[#e1e2e8] dark:border-[#2d3036] flex items-center justify-between text-xs text-[#74777f] dark:text-[#8e9099]">
        <span>Business data is saved locally on device.</span>
        <button
          onClick={() => {
            if (confirm('Load sample catering & food order business data?')) {
              businessDatabase.resetToSampleData();
            }
          }}
          className="text-[#005cb2] dark:text-[#a5c8ff] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Orders</span>
        </button>
      </div>

      {/* --- MODAL 1: ADD / EDIT ORDER --- */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="bg-white dark:bg-[#202227] rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e1e2e8] dark:border-[#2d3036]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-[#e1e2e8] dark:border-[#2d3036]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#005cb2]/10 text-[#005cb2] dark:text-[#a5c8ff] flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                      {editingOrder ? t.editOrder : t.addNewOrder}
                    </h3>
                    <p className="text-xs text-[#74777f] dark:text-[#8e9099]">Customer details, pricing & status</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOrder} className="mt-4 space-y-3.5 pb-2">
                {/* Customer Name */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.customerName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    placeholder="e.g. Suresh Reddy / Cyber Towers"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                  />
                </div>

                {/* Order Date & Status */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.orderDate} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={orderForm.orderDate}
                      onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.orderStatus}
                    </label>
                    <select
                      value={orderForm.orderStatus}
                      onChange={(e) => setOrderForm({ ...orderForm, orderStatus: e.target.value as OrderStatus })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                    >
                      <option value="Pending">{t.statusPending}</option>
                      <option value="In Progress">{t.statusInProgress}</option>
                      <option value="Completed">{t.statusCompleted}</option>
                      <option value="Delivered">{t.statusDelivered}</option>
                    </select>
                  </div>
                </div>

                {/* Item / Product Details */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.itemDetails} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={orderForm.itemDetails}
                    onChange={(e) => setOrderForm({ ...orderForm, itemDetails: e.target.value })}
                    placeholder="e.g. Lunch Buffet (Paneer butter masala, Veg Biryani, Gulab Jamun)"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all resize-none"
                  />
                </div>

                {/* Quantity & Order Price */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.quantity} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.quantity}
                      onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                      placeholder="e.g. 75 Plates"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.orderPrice} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-sm font-bold text-neutral-500 pointer-events-none">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={orderForm.orderPrice}
                        onChange={(e) => setOrderForm({ ...orderForm, orderPrice: e.target.value })}
                        placeholder="35000"
                        className="w-full text-xs sm:text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] font-bold focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.notesOptional}
                  </label>
                  <input
                    type="text"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    placeholder="Advance paid, delivery instructions, contact phone..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e1e2e8] dark:border-[#2d3036]">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#005cb2] hover:bg-[#004a77] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {editingOrder ? 'Update Order' : 'Save Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: ADD / EDIT EXPENSE --- */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="bg-white dark:bg-[#202227] rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e1e2e8] dark:border-[#2d3036]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-[#e1e2e8] dark:border-[#2d3036]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                      {editingExpense ? t.editExpense : t.addNewExpense}
                    </h3>
                    <p className="text-xs text-[#74777f] dark:text-[#8e9099]">Linked to customer order</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="mt-4 space-y-3.5 pb-2">
                {/* Order Reference Selector */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.orderReference} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={expenseForm.orderId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, orderId: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                  >
                    <option value="" disabled>Select Order...</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.customerName} — {o.itemDetails.substring(0, 30)}... ({formatCurrency(o.orderPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Type & Date */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.expenseType} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={expenseForm.expenseType}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value as OrderExpenseType })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                    >
                      <option value="Groceries / Raw Materials">{t.expenseTypeGroceries}</option>
                      <option value="Packaging">{t.expenseTypePackaging}</option>
                      <option value="Delivery">{t.expenseTypeDelivery}</option>
                      <option value="Other">{t.expenseTypeOther}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.expenseDate} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                    />
                  </div>
                </div>

                {/* Expense Amount */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.expenseAmount} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-bold text-neutral-500 pointer-events-none">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="14500"
                      className="w-full text-xs sm:text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.notesOptional}
                  </label>
                  <input
                    type="text"
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    placeholder="e.g. 20kg Basmati Rice, vegetables, ghee purchase"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e1e2e8] dark:border-[#2d3036]">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: ADD / EDIT INVESTMENT --- */}
      <AnimatePresence>
        {isInvestmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="bg-white dark:bg-[#202227] rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e1e2e8] dark:border-[#2d3036]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-[#e1e2e8] dark:border-[#2d3036]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                      {editingInvestment ? t.editInvestment : t.addNewInvestment}
                    </h3>
                    <p className="text-xs text-[#74777f] dark:text-[#8e9099]">Equipment, tools & bulk inventory stock</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInvestmentModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveInvestment} className="mt-4 space-y-3.5 pb-2">
                {/* Purpose / Description */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.investmentPurpose} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={investmentForm.purpose}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, purpose: e.target.value })}
                    placeholder="e.g. Commercial Stainless Steel Chafing Dishes / Bulk Rice Stock"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                  />
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.investmentAmount} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-sm font-bold text-neutral-500 pointer-events-none">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={investmentForm.amount}
                        onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                        placeholder="45000"
                        className="w-full text-xs sm:text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] font-bold focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                      {t.investmentDate} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={investmentForm.date}
                      onChange={(e) => setInvestmentForm({ ...investmentForm, date: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                    />
                  </div>
                </div>

                {/* Notes (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] block mb-1">
                    {t.notesOptional}
                  </label>
                  <input
                    type="text"
                    value={investmentForm.notes}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, notes: e.target.value })}
                    placeholder="Vendor name, warranty, receipt number..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/20 focus:border-[#005cb2] transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e1e2e8] dark:border-[#2d3036]">
                  <button
                    type="button"
                    onClick={() => setIsInvestmentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {editingInvestment ? 'Update Investment' : 'Save Investment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DELETE MODAL --- */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#202227] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#e1e2e8] dark:border-[#2d3036] text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3.5">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                Confirm Deletion
              </h3>
              <p className="text-xs text-[#74777f] dark:text-[#8e9099] mt-1.5 mb-5">
                Are you sure you want to delete {deleteConfirmation.title}?
                {deleteConfirmation.type === 'order' && (
                  <span className="block mt-1 text-rose-600 dark:text-rose-400 font-semibold">
                    (All expenses linked to this order will also be removed)
                  </span>
                )}
              </p>
              <div className="flex items-center justify-center gap-2.5">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) for Export to CSV */}
      <div className="fixed bottom-20 left-0 right-0 z-30 pointer-events-none flex justify-center">
        <div className="w-full max-w-lg px-4 flex justify-end">
          <motion.button
            id="btn-fab-export-csv"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              setExportScope(
                activeSubTab === 'orders'
                  ? 'orders'
                  : activeSubTab === 'expenses'
                  ? 'expenses'
                  : 'all'
              );
              setIsExportModalOpen(true);
            }}
            className="pointer-events-auto flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl shadow-emerald-700/25 border border-emerald-400/30 transition-all cursor-pointer select-none"
            title={t.exportBusinessCsv}
          >
            <FileSpreadsheet className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span className="font-bold tracking-tight">{t.exportCsv}</span>
            {(orders.length > 0 || expenses.length > 0) && (
              <span className="bg-emerald-800/80 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-black ml-0.5">
                {orders.length + expenses.length}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* --- EXPORT TO CSV MODAL --- */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#202227] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-[#e1e2e8] dark:border-[#2d3036] flex flex-col gap-4 text-left"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
                      {t.exportBusinessCsv}
                    </h3>
                    <p className="text-[11px] text-[#74777f] dark:text-[#8e9099]">
                      Excel & Google Sheets Compatible (.csv)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Summary Chips */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#f2f4f8] dark:bg-[#16181b] border border-[#e1e2e8] dark:border-[#2d3036] text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#74777f] dark:text-[#8e9099]">
                    {t.ordersTab}
                  </span>
                  <span className="text-sm font-black text-[#005cb2] dark:text-blue-400">
                    {orders.length}
                  </span>
                </div>
                <div className="flex flex-col border-x border-[#e1e2e8] dark:border-[#2d3036]">
                  <span className="text-[10px] uppercase font-bold text-[#74777f] dark:text-[#8e9099]">
                    {t.expensesTab}
                  </span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {expenses.length}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#74777f] dark:text-[#8e9099]">
                    {t.investmentTab}
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {investments.length}
                  </span>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#44474e] dark:text-[#c4c7d0] uppercase tracking-wider block">
                  Select Export Option
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                  {/* Option 1: All Business Data Combined */}
                  <label
                    onClick={() => setExportScope('all')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      exportScope === 'all'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] hover:bg-neutral-50 dark:hover:bg-[#252830]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-scope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          All Data (Combined Report)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-md">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                        Combined ledger: Executive profit summary, Orders, Expenses, and Investments in one CSV.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: All Data as Separate Files */}
                  <label
                    onClick={() => setExportScope('separate')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      exportScope === 'separate'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] hover:bg-neutral-50 dark:hover:bg-[#252830]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-scope"
                      checked={exportScope === 'separate'}
                      onChange={() => setExportScope('separate')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          All Data (Separate CSV Files)
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded-md">
                          3 Files
                        </span>
                      </div>
                      <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                        Downloads individual CSV files for Orders, Expenses, and Investments.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Orders Only */}
                  <label
                    onClick={() => setExportScope('orders')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      exportScope === 'orders'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] hover:bg-neutral-50 dark:hover:bg-[#252830]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-scope"
                      checked={exportScope === 'orders'}
                      onChange={() => setExportScope('orders')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          Orders Only
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-md">
                          {orders.length} items
                        </span>
                      </div>
                      <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                        Customer Name, Order Date, Item/Product, Quantity, Order Price, Status, Notes.
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Expenses Only */}
                  <label
                    onClick={() => setExportScope('expenses')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      exportScope === 'expenses'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] hover:bg-neutral-50 dark:hover:bg-[#252830]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-scope"
                      checked={exportScope === 'expenses'}
                      onChange={() => setExportScope('expenses')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          Expenses Only
                        </span>
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded-md">
                          {expenses.length} items
                        </span>
                      </div>
                      <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                        Order Reference, Expense Type, Amount, Date, Notes.
                      </p>
                    </div>
                  </label>

                  {/* Option 5: Investments Only */}
                  <label
                    onClick={() => setExportScope('investments')}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      exportScope === 'investments'
                        ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] hover:bg-neutral-50 dark:hover:bg-[#252830]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="export-scope"
                      checked={exportScope === 'investments'}
                      onChange={() => setExportScope('investments')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          Investments Only
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded-md">
                          {investments.length} items
                        </span>
                      </div>
                      <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                        Amount, Date, Purpose/Description, Notes.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Target Filename Preview */}
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 font-mono flex items-center gap-2 truncate">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">
                  {exportScope === 'separate'
                    ? `business-orders, expenses, investments-${new Date().toISOString().split('T')[0]}.csv`
                    : `business-tracker-${exportScope}-${new Date().toISOString().split('T')[0]}.csv`}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  id="btn-confirm-save-csv"
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleSaveBusinessCsv(exportScope)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <Download className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {isExporting
                      ? 'Exporting CSV...'
                      : exportScope === 'separate'
                      ? 'Save 3 CSV Files'
                      : 'Save CSV to Device'}
                  </span>
                </button>

                {exportScope !== 'separate' && (
                  <button
                    id="btn-confirm-share-csv"
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleShareBusinessCsv(exportScope)}
                    className="py-3 px-4 rounded-xl bg-white dark:bg-[#1a1c1e] hover:bg-neutral-50 dark:hover:bg-[#252830] text-neutral-800 dark:text-neutral-200 border border-[#e1e2e8] dark:border-[#2d3036] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Share CSV via system share sheet"
                  >
                    <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Share</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CSV IMPORT PREVIEW & CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {isImportModalOpen && importPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#202227] rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-[#e1e2e8] dark:border-[#2d3036] flex flex-col gap-4 text-left max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-[#005cb2] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight truncate">
                      Review CSV Import Data
                    </h3>
                    <p className="text-[11px] text-[#74777f] dark:text-[#8e9099] truncate font-mono">
                      {importPreview.filename}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportPreview(null);
                  }}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Overview Metric Cards */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-[#f2f4f8] dark:bg-[#16181b] border border-[#e1e2e8] dark:border-[#2d3036] text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#74777f] dark:text-[#8e9099]">
                    Type
                  </span>
                  <span className="text-xs font-black text-[#1a1c1e] dark:text-[#e2e2e6] capitalize truncate">
                    {importPreview.scope}
                  </span>
                </div>
                <div className="flex flex-col border-x border-[#e1e2e8] dark:border-[#2d3036]">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                    Valid Rows
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ✓ {importPreview.totalValidCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#74777f] dark:text-[#8e9099]">
                    Issues
                  </span>
                  <span
                    className={`text-sm font-black ${
                      importPreview.totalInvalidCount > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {importPreview.totalInvalidCount}
                  </span>
                </div>
              </div>

              {/* Preview Mode Switcher (Valid vs Issues) */}
              {importPreview.totalInvalidCount > 0 && (
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#e7ebf0] dark:bg-[#1a1c1e] border border-[#d2d6de] dark:border-[#2d3036]">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('valid')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activePreviewTab === 'valid'
                        ? 'bg-white dark:bg-[#252830] text-[#005cb2] dark:text-blue-300 shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Valid Records ({importPreview.totalValidCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('issues')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activePreviewTab === 'issues'
                        ? 'bg-white dark:bg-[#252830] text-amber-700 dark:text-amber-300 shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Failed Rows ({importPreview.totalInvalidCount})</span>
                  </button>
                </div>
              )}

              {/* Scrollable Data Preview Area */}
              <div className="flex-1 overflow-y-auto max-h-64 space-y-2 border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl p-2.5 bg-neutral-50/50 dark:bg-[#181a1f]">
                {activePreviewTab === 'valid' ? (
                  importPreview.totalValidCount === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                      No valid rows found in this file to import.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Orders Preview */}
                      {importPreview.ordersResult &&
                        importPreview.ordersResult.validRows.map((row) => (
                          <div
                            key={`preview-ord-${row.rowNumber}`}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-xs flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  #{row.rowNumber}
                                </span>
                                <span className="truncate">{row.data.customerName}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold shrink-0">
                                  {row.data.orderStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {row.data.itemDetails} • Qty: {row.data.quantity} • {row.data.orderDate}
                              </p>
                            </div>
                            <span className="font-black text-[#005cb2] dark:text-blue-400 shrink-0">
                              {formatCurrency(row.data.orderPrice)}
                            </span>
                          </div>
                        ))}

                      {/* Expenses Preview */}
                      {importPreview.expensesResult &&
                        importPreview.expensesResult.validRows.map((row) => (
                          <div
                            key={`preview-exp-${row.rowNumber}`}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-xs flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  #{row.rowNumber}
                                </span>
                                <span className="truncate">{row.data.expenseType}</span>
                              </div>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                Ref: {row.data.orderId} • {row.data.date}
                              </p>
                            </div>
                            <span className="font-black text-rose-600 dark:text-rose-400 shrink-0">
                              −{formatCurrency(row.data.amount)}
                            </span>
                          </div>
                        ))}

                      {/* Investments Preview */}
                      {importPreview.investmentsResult &&
                        importPreview.investmentsResult.validRows.map((row) => (
                          <div
                            key={`preview-inv-${row.rowNumber}`}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] text-xs flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  #{row.rowNumber}
                                </span>
                                <span className="truncate">{row.data.purpose}</span>
                              </div>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                Date: {row.data.date}
                              </p>
                            </div>
                            <span className="font-black text-blue-700 dark:text-blue-300 shrink-0">
                              {formatCurrency(row.data.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )
                ) : (
                  /* Failed / Invalid Rows Display */
                  <div className="space-y-2">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-200">
                      These rows failed validation and will be skipped. Valid rows can still be imported safely.
                    </div>
                    {[
                      ...(importPreview.ordersResult?.invalidRows || []),
                      ...(importPreview.expensesResult?.invalidRows || []),
                      ...(importPreview.investmentsResult?.invalidRows || []),
                    ].map((invRow, idx) => (
                      <div
                        key={`invalid-${idx}`}
                        className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs"
                      >
                        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Row {invRow.rowNumber} Failed:</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-rose-600 dark:text-rose-400 space-y-0.5 pl-1 mb-1.5">
                          {invRow.errors.map((err, errIdx) => (
                            <li key={errIdx}>{err}</li>
                          ))}
                        </ul>
                        <div className="p-1.5 bg-white/70 dark:bg-[#1a1c1e]/70 rounded font-mono text-[10px] text-neutral-600 dark:text-neutral-400 truncate">
                          {Object.entries(invRow.raw)
                            .map(([k, v]) => `${k}: "${v}"`)
                            .join(' | ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safe Import Assurance Note */}
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#005cb2] dark:text-blue-400 mt-0.5" />
                <span>
                  New records will be added safely to your ledger without duplicating or deleting any existing records.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportPreview(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={importPreview.totalValidCount === 0 || isImporting}
                  onClick={handleConfirmImport}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#005cb2] hover:bg-[#004a77] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Import {importPreview.totalValidCount} Valid Records</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {statusToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-16 left-4 right-4 max-w-sm mx-auto z-50 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-2.5 text-xs font-semibold ${
              statusToast.type === 'success'
                ? 'bg-emerald-700 text-white border border-emerald-500/40'
                : 'bg-rose-700 text-white border border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {statusToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
              )}
              <span className="truncate">{statusToast.text}</span>
            </div>
            <button
              onClick={() => setStatusToast(null)}
              className="p-1 rounded-full hover:bg-white/20 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
