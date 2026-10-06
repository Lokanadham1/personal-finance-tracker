import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  ChevronDown,
  CalendarDays,
  Edit2,
  Check,
  History,
  Tag,
  Clock,
} from 'lucide-react';
import { TransactionEntity, NavigationTab, DateRangeOption, ExpenseCategory, TransactionType } from '../types';
import { EXPENSE_CATEGORIES } from '../db/roomDatabase';
import {
  M3Card,
  formatCurrency,
  formatDateLabel,
  getCategoryIcon,
  getCategoryColor,
} from './M3Components';
import { useLanguage } from '../i18n/LanguageContext';
import { saveCsvToAndroidFileSystem } from '../utils/csvExport';
import {
  getStoredRecentSearches,
  saveRecentSearchTerm,
  removeRecentSearchTerm,
  clearAllRecentSearches,
  COMMON_CATEGORY_KEYWORDS,
} from '../utils/recentSearches';

export function TransactionListScreen({
  transactions,
  filteredTransactions,
  selectedMonth,
  onDeleteTransaction,
  onEditTransaction,
  onRestoreLastDeleted,
  lastDeletedTransaction,
  onClearLastDeleted,
  onNavigate,
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
}: {
  transactions: TransactionEntity[];
  filteredTransactions: TransactionEntity[];
  selectedMonth: string;
  onDeleteTransaction: (id: string) => Promise<any>;
  onEditTransaction?: (tx: TransactionEntity) => Promise<any>;
  onRestoreLastDeleted?: () => Promise<void>;
  lastDeletedTransaction?: TransactionEntity | null;
  onClearLastDeleted?: () => void;
  onNavigate: (tab: NavigationTab, initialType?: TransactionType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFilter: 'ALL' | 'INCOME' | 'EXPENSE';
  setSelectedFilter: (f: 'ALL' | 'INCOME' | 'EXPENSE') => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (c: string) => void;
  dateRangeOption: DateRangeOption;
  setDateRangeOption: (opt: DateRangeOption) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
}) {
  const { t, language, getCategoryName } = useLanguage();
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionEntity | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  // Recent Searches State
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getStoredRecentSearches());

  const handleSelectRecentSearch = (term: string) => {
    if (searchQuery.toLowerCase().trim() === term.toLowerCase().trim()) {
      // Toggle off if already selected
      setSearchQuery('');
    } else {
      setSearchQuery(term);
      const updated = saveRecentSearchTerm(term);
      setRecentSearches(updated);
    }
  };

  const handleRemoveRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearchTerm(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecentSearches = () => {
    const updated = clearAllRecentSearches();
    setRecentSearches(updated);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim().length >= 2) {
        const updated = saveRecentSearchTerm(searchQuery);
        setRecentSearches(updated);
      }
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleSearchBlur = () => {
    if (searchQuery.trim().length >= 2) {
      const updated = saveRecentSearchTerm(searchQuery);
      setRecentSearches(updated);
    }
  };

  // Group filtered transactions by date for clean timeline view
  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const dateKey = tx.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, TransactionEntity[]>);

  const dateKeys = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const handleOpenDetail = (tx: TransactionEntity) => {
    setSelectedTxDetail(tx);
    setIsEditing(false);
    setEditDescription(tx.description);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditDate(tx.date);
  };

  const handleSaveEdit = async () => {
    if (!selectedTxDetail || !onEditTransaction) return;
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const updated: TransactionEntity = {
      ...selectedTxDetail,
      description: editDescription.trim() || selectedTxDetail.description,
      amount: numAmount,
      category: editCategory || selectedTxDetail.category,
      date: editDate || selectedTxDetail.date,
    };

    await onEditTransaction(updated);
    setSelectedTxDetail(updated);
    setIsEditing(false);
  };

  const handleExportCSV = async () => {
    if (filteredTransactions.length === 0) return;
    try {
      await saveCsvToAndroidFileSystem(
        filteredTransactions,
        'finance-transactions-ledger',
        'Current-View'
      );
    } catch (err: any) {
      console.warn('CSV export error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 pb-28 px-4 pt-3 max-w-xl mx-auto w-full">
      {/* Top Header & Counter */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#5a5f69] dark:text-[#9ea3ae]">
            {t.navTransactions}
          </p>
          <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
            {t.transactions}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {filteredTransactions.length > 0 && (
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              title={t.exportCsv}
              className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-[#e1e2e8] dark:border-[#2d3036] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{t.exportCsv}</span>
            </button>
          )}
          <button
            id="tx-screen-add-entry-btn"
            onClick={() =>
              onNavigate('add_entry', selectedFilter === 'INCOME' ? 'INCOME' : selectedFilter === 'EXPENSE' ? 'EXPENSE' : undefined)
            }
            className="flex items-center gap-1 px-3 py-1.5 bg-[#005cb2] text-white rounded-xl text-xs font-bold hover:bg-[#004a77] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.navAddEntry}</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL AT TOP */}
      <div className="bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] p-3.5 rounded-2xl shadow-2xs space-y-3">
        {/* 1. Search Box (Description, Category, Amount) */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-neutral-400 pointer-events-none" />
          <input
            id="input-search-transactions"
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchBlur}
            className="w-full bg-[#f0f4f9] dark:bg-[#2a2d33] border border-transparent focus:border-[#005cb2] rounded-xl pl-10 pr-9 py-2 text-xs md:text-sm text-[#1a1c1e] dark:text-[#e2e2e6] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recent Searches & Quick Filters Section */}
        <div className="space-y-2 pt-0.5">
          {/* Header */}
          <div className="flex items-center justify-between px-0.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-neutral-600 dark:text-neutral-300">
              <History className="w-3.5 h-3.5 text-[#005cb2] dark:text-[#a5c8ff]" />
              <span>{t.recentSearches}</span>
            </div>
            {recentSearches.length > 0 && (
              <button
                id="btn-clear-recent-searches"
                type="button"
                onClick={handleClearAllRecentSearches}
                className="text-[11px] font-semibold text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors"
              >
                {t.clearRecentSearches}
              </button>
            )}
          </div>

          {/* Recent Searches Chips */}
          {recentSearches.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5 pb-1">
              {recentSearches.map((item) => {
                const isActive = searchQuery.toLowerCase().trim() === item.toLowerCase().trim();
                const IconComponent = getCategoryIcon(item);

                return (
                  <div
                    key={item}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectRecentSearch(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectRecentSearch(item);
                      }
                    }}
                    title={`Filter by "${item}"`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border select-none ${
                      isActive
                        ? 'bg-[#005cb2] text-white border-[#005cb2] shadow-xs'
                        : 'bg-[#f0f4f9] dark:bg-[#2a2d33] text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700/80 hover:bg-[#e2e8f0] dark:hover:bg-[#343840]'
                    }`}
                  >
                    <IconComponent
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-white' : 'text-[#005cb2] dark:text-[#a5c8ff]'
                      }`}
                    />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentSearch(item, e)}
                      title={`Remove "${item}" from history`}
                      className={`p-0.5 rounded-full hover:bg-black/15 dark:hover:bg-white/20 transition-colors ml-0.5 cursor-pointer ${
                        isActive ? 'text-white/80 hover:text-white' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic px-0.5">
              {t.searchHistoryEmpty}
            </p>
          )}

          {/* Quick Common Category Filter Pills */}
          <div className="pt-0.5 space-y-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {t.quickFilters}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5">
              {COMMON_CATEGORY_KEYWORDS.map((cat) => {
                const isActive = searchQuery.toLowerCase().trim() === cat.toLowerCase().trim();
                const IconComp = getCategoryIcon(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectRecentSearch(cat)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900 border-transparent shadow-2xs font-semibold'
                        : 'bg-white dark:bg-[#1a1c1e] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700/60 hover:border-neutral-400'
                    }`}
                  >
                    <IconComp className="w-2.5 h-2.5 opacity-70" />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Filter by Type: All / Income / Expense */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#f0f4f9] dark:bg-[#2a2d33] p-1 rounded-xl">
          <button
            id="filter-type-all"
            type="button"
            onClick={() => {
              setSelectedFilter('ALL');
              setSelectedCategoryFilter('ALL');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-white dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            {t.all} ({transactions.length})
          </button>
          <button
            id="filter-type-income"
            type="button"
            onClick={() => {
              setSelectedFilter('INCOME');
              setSelectedCategoryFilter('ALL');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              selectedFilter === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.income}</span>
          </button>
          <button
            id="filter-type-expense"
            type="button"
            onClick={() => setSelectedFilter('EXPENSE')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              selectedFilter === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100/50'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{t.expense}</span>
          </button>
        </div>

        {/* 3. Secondary Filters: Date Range & Expense Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#e1e2e8] dark:border-[#2d3036]">
          {/* Date Range Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {t.dateRange}
            </label>
            <div className="relative">
              <select
                id="select-date-range-filter"
                value={dateRangeOption}
                onChange={(e) => setDateRangeOption(e.target.value as DateRangeOption)}
                className="w-full bg-[#f0f4f9] dark:bg-[#2a2d33] border border-transparent focus:border-[#005cb2] text-xs font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] rounded-xl px-3 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none"
              >
                <option value="THIS_MONTH">{t.thisMonth} ({selectedMonth})</option>
                <option value="LAST_MONTH">{t.lastMonth}</option>
                <option value="ALL">{t.allTime}</option>
                <option value="CUSTOM">{t.customRange}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Category Dropdown (for expenses) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {t.category} {selectedFilter === 'INCOME' && `(${t.expense})`}
            </label>
            <div className="relative">
              <select
                id="select-category-filter"
                value={selectedCategoryFilter}
                disabled={selectedFilter === 'INCOME'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategoryFilter(val);
                  if (val !== 'ALL') {
                    const updated = saveRecentSearchTerm(val);
                    setRecentSearches(updated);
                  }
                }}
                className={`w-full bg-[#f0f4f9] dark:bg-[#2a2d33] border border-transparent focus:border-[#005cb2] text-xs font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] rounded-xl px-3 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none ${
                  selectedFilter === 'INCOME' ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <option value="ALL">{t.allCategories}</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {getCategoryName(c.name)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range Pickers if 'CUSTOM' selected */}
        {dateRangeOption === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">{t.fromDate}</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-[#f0f4f9] dark:bg-[#2a2d33] text-xs text-[#1a1c1e] dark:text-[#e2e2e6] rounded-xl px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-[#005cb2]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">{t.toDate}</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-[#f0f4f9] dark:bg-[#2a2d33] text-xs text-[#1a1c1e] dark:text-[#e2e2e6] rounded-xl px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-[#005cb2]"
              />
            </div>
          </div>
        )}

        {/* Showing Filter Counts */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 pt-1">
          <span>
            Showing <strong className="text-neutral-800 dark:text-neutral-200">{filteredTransactions.length}</strong> {t.entriesCount}
          </span>
          {(searchQuery || selectedCategoryFilter !== 'ALL' || selectedFilter !== 'ALL' || dateRangeOption !== 'THIS_MONTH') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('ALL');
                setSelectedCategoryFilter('ALL');
                setDateRangeOption('THIS_MONTH');
              }}
              className="text-[#005cb2] dark:text-[#a5c8ff] hover:underline font-bold cursor-pointer"
            >
              {t.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* Undo Delete Notification Banner */}
      <AnimatePresence>
        {lastDeletedTransaction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[#1a1c1e] text-white p-3 rounded-xl flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2 text-xs">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">
                {t.delete} &quot;{lastDeletedTransaction.description}&quot; ({formatCurrency(lastDeletedTransaction.amount)})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {onRestoreLastDeleted && (
                <button
                  onClick={onRestoreLastDeleted}
                  className="px-2.5 py-1 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.undo}</span>
                </button>
              )}
              {onClearLastDeleted && (
                <button
                  onClick={onClearLastDeleted}
                  className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe to Delete Hint */}
      <div className="flex items-center justify-between text-[11px] text-[#74777f] dark:text-[#8e9099] px-1">
        <span className="flex items-center gap-1 font-medium">
          <ArrowUpDown className="w-3 h-3" />
          <span>Sorted descending by date</span>
        </span>
        <span className="text-[11px] text-neutral-500 font-medium">
          {t.swipeToDelete}
        </span>
      </div>

      {/* Transaction List Container */}
      {dateKeys.length === 0 ? (
        <M3Card className="p-8 text-center flex flex-col items-center justify-center mt-2">
          <Sparkles className="w-8 h-8 text-neutral-400 mb-2" />
          <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
            {searchQuery || selectedCategoryFilter !== 'ALL' || selectedFilter !== 'ALL'
              ? t.noMatchingTransactions
              : t.noTransactions}
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            {searchQuery || selectedCategoryFilter !== 'ALL' || selectedFilter !== 'ALL'
              ? t.tryAdjustingFilters
              : t.logFirstEntry}
          </p>
          {searchQuery || selectedCategoryFilter !== 'ALL' || selectedFilter !== 'ALL' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('ALL');
                setSelectedCategoryFilter('ALL');
                setDateRangeOption('THIS_MONTH');
              }}
              className="mt-4 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#1a1c1e] dark:text-[#e2e2e6] text-xs font-bold rounded-xl cursor-pointer border border-neutral-300 dark:border-neutral-700 transition-colors"
            >
              {t.resetFilters}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('add_entry')}
              className="mt-4 px-4 py-2 bg-[#005cb2] hover:bg-[#004a77] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              {t.navAddEntry}
            </button>
          )}
        </M3Card>
      ) : (
        <div className="flex flex-col gap-4">
          {dateKeys.map((dateKey) => {
            const items = groupedByDate[dateKey];
            const dayIncome = items.filter((i) => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0);
            const dayExpense = items.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0);

            return (
              <div key={dateKey} className="flex flex-col gap-2">
                {/* Date Header Separator */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#005cb2] dark:text-[#a5c8ff]" />
                    <span className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                      {formatDateLabel(dateKey, language)}
                    </span>
                    <span className="text-[11px] text-neutral-400">({dateKey})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {dayIncome > 0 && (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        −{formatCurrency(dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in this date */}
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((tx) => {
                      const isIncome = tx.type === 'INCOME';
                      const Icon = getCategoryIcon(tx.category);
                      const colorInfo = getCategoryColor(tx.category);

                      return (
                        <div key={tx.id} className="relative overflow-hidden rounded-xl">
                          {/* Background swipe reveal (Red Trash Container) */}
                          <div className="absolute inset-0 bg-rose-600 flex items-center justify-end px-5 rounded-xl text-white">
                            <div className="flex items-center gap-1.5 text-xs font-bold">
                              <Trash2 className="w-4 h-4" />
                              <span>{t.delete}</span>
                            </div>
                          </div>

                          {/* Interactive Swipeable Card with Motion */}
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -300, transition: { duration: 0.25 } }}
                            drag="x"
                            dragConstraints={{ left: -100, right: 0 }}
                            dragElastic={0.1}
                            onDragEnd={(_, info) => {
                              if (info.offset.x < -70) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="relative bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] p-3.5 rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors shadow-2xs z-10"
                          >
                            <div
                              className="flex items-center gap-3 min-w-0 flex-1"
                              onClick={() => handleOpenDetail(tx)}
                            >
                              <div className={`p-2.5 rounded-xl ${colorInfo.bg} shrink-0`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                                  {tx.description}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                                  <span className="font-semibold px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                                    {getCategoryName(tx.category)}
                                  </span>
                                  <span>•</span>
                                  <span>{isIncome ? t.income : t.expense}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              {/* Income in green with + sign, expenses in red with − sign */}
                              <span
                                className={`text-sm md:text-base font-extrabold tracking-tight ${
                                  isIncome
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {isIncome ? `+${formatCurrency(tx.amount)}` : `−${formatCurrency(tx.amount)}`}
                              </span>

                              {/* Delete direct button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTransaction(tx.id);
                                }}
                                title={t.delete}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Detail & Edit Dialog */}
      <AnimatePresence>
        {selectedTxDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl max-w-sm w-full p-5 shadow-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-neutral-500">
                  {isEditing ? t.edit : 'Transaction Details'}
                </span>
                <button
                  onClick={() => setSelectedTxDetail(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isEditing ? (
                <>
                  <div className="text-center py-2">
                    <span
                      className={`text-3xl font-extrabold ${
                        selectedTxDetail.type === 'INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {selectedTxDetail.type === 'INCOME' ? '+' : '−'}
                      {formatCurrency(selectedTxDetail.amount)}
                    </span>
                    <h4 className="text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] mt-1">
                      {selectedTxDetail.description}
                    </h4>
                  </div>

                  <div className="bg-[#f8fafc] dark:bg-[#1a1c1e] p-3.5 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Type:</span>
                      <span className="font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                        {selectedTxDetail.type === 'INCOME' ? t.income : t.expense}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{t.category} / {t.incomeSourceLabel}:</span>
                      <span className="font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                        {getCategoryName(selectedTxDetail.category)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{t.date}:</span>
                      <span className="font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                        {selectedTxDetail.date} ({formatDateLabel(selectedTxDetail.date, language)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">ID:</span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {selectedTxDetail.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1a1c1e] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t.edit}</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteTransaction(selectedTxDetail.id);
                        setSelectedTxDetail(null);
                      }}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.delete}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Edit Form Mode */
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                      {t.amount} (₹)
                    </label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-[#1a1c1e] border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                      {t.description}
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-[#1a1c1e] border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                      {t.date}
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#f8fafc] dark:bg-[#1a1c1e] border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 px-3 bg-[#005cb2] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.saveChanges}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

