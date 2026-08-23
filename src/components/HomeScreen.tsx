import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowRight,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  FileText,
  Download,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { FinanceUiState, NavigationTab, TransactionEntity } from '../types';
import { M3Card, formatCurrency, formatDateLabel, getCategoryColor, getCategoryIcon } from './M3Components';
import { MonthlyReportModal } from './MonthlyReportModal';
import { generateMonthlyPDFReport } from '../utils/pdfGenerator';
import { useLanguage } from '../i18n/LanguageContext';

export function HomeScreen({
  uiState,
  onNavigate,
  onSelectTransaction,
  selectedMonth,
  setSelectedMonth,
  goToPrevMonth,
  goToNextMonth,
  onOpenAndroidModal,
}: {
  uiState: FinanceUiState;
  onNavigate: (tab: NavigationTab) => void;
  onSelectTransaction?: (tx: TransactionEntity) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  onOpenAndroidModal?: () => void;
}) {
  const { t, language, getCategoryName } = useLanguage();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const { totalIncome, totalExpense, remainingBalance, spentPercentage, transactions, categoryBreakdown } = uiState;
  
  // Transactions for the selected month
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const recentTransactions = monthTransactions.slice(0, 4);

  // Format month name nicely (e.g. "August 2026")
  const formatMonthTitle = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  const handleQuickDownloadPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateMonthlyPDFReport({
      selectedMonth,
      monthTitle: formatMonthTitle(selectedMonth),
      totalIncome,
      totalExpense,
      remainingBalance,
      spentPercentage,
      transactions: monthTransactions,
      categoryBreakdown,
    });
  };

  // Balance condition: blue if positive, red if negative
  const isBalancePositive = remainingBalance >= 0;

  // Month options for dropdown selector
  const monthOptions = [
    { value: '2026-06', label: language === 'te' ? 'జూన్ 2026' : 'June 2026' },
    { value: '2026-07', label: language === 'te' ? 'జూలై 2026' : 'July 2026' },
    { value: '2026-08', label: language === 'te' ? 'ఆగస్టు 2026' : 'August 2026' },
    { value: '2026-09', label: language === 'te' ? 'సెప్టెంబర్ 2026' : 'September 2026' },
    { value: '2026-10', label: language === 'te' ? 'అక్టోబర్ 2026' : 'October 2026' },
    { value: '2026-11', label: language === 'te' ? 'నవంబర్ 2026' : 'November 2026' },
    { value: '2026-12', label: language === 'te' ? 'డిసెంబర్ 2026' : 'December 2026' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-3 max-w-xl mx-auto w-full">
      {/* Month Selector Bar & PDF Report Button at Top */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl p-2 shadow-xs flex items-center justify-between">
          <button
            id="btn-prev-month"
            onClick={goToPrevMonth}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={t.prevMonth}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#005cb2] dark:text-[#a5c8ff]" />
            <div className="relative">
              <select
                id="select-dashboard-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-transparent text-sm md:text-base font-bold text-[#1a1c1e] dark:text-[#e2e2e6] pr-6 pl-1 py-1 cursor-pointer focus:outline-none"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-black dark:text-white dark:bg-[#202227]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-neutral-400">
                <span className="text-[10px]">▼</span>
              </div>
            </div>
          </div>

          <button
            id="btn-next-month"
            onClick={goToNextMonth}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={t.nextMonth}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Generate PDF Report Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-open-pdf-report"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex-1 sm:flex-initial py-2.5 px-3.5 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#202227] dark:hover:bg-[#282b33] text-[#005cb2] dark:text-[#a5c8ff] border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            title={t.pdfReport}
          >
            <FileText className="w-4 h-4" />
            <span>{t.pdfReport}</span>
          </button>

          <button
            id="btn-quick-download-pdf"
            onClick={handleQuickDownloadPDF}
            className="p-2.5 bg-[#005cb2] hover:bg-[#004a77] text-white rounded-2xl cursor-pointer transition-colors shadow-2xs"
            title={t.quickDownloadPdf}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* THREE BIG CARDS FOR SELECTED MONTH ONLY */}
      <div className="flex flex-col gap-3">
        {/* 1. Remaining Balance Card (Blue if positive / Red if negative) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={`rounded-2xl p-5 text-white shadow-sm border transition-all ${
            isBalancePositive
              ? 'bg-gradient-to-br from-[#005cb2] to-[#0d47a1] border-[#005cb2]/30 shadow-blue-500/10'
              : 'bg-gradient-to-br from-[#ba1a1a] to-[#8c0009] border-[#ba1a1a]/30 shadow-red-500/10'
          }`}
          id="card-remaining-balance"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                {t.remainingBalance}
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isBalancePositive
                  ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                  : 'bg-rose-900/40 text-rose-200 border border-rose-300/30'
              }`}
            >
              {isBalancePositive ? t.netSurplus : t.netDeficit}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {formatCurrency(remainingBalance)}
            </h3>
            <span className="text-xs text-white/80">
              {formatMonthTitle(selectedMonth)}
            </span>
          </div>

          {/* Small Progress Bar Showing How Much of Income is Spent */}
          <div className="mt-4 pt-3 border-t border-white/15">
            <div className="flex justify-between text-xs text-white/90 font-medium mb-1.5">
              <span>
                {totalIncome > 0 ? (
                  <>
                    <strong className="text-white font-bold">{spentPercentage}%</strong> {t.ofIncomeSpent}
                  </>
                ) : totalExpense > 0 ? (
                  <span className="text-amber-200">₹{totalExpense.toLocaleString()} {t.totalSpent}</span>
                ) : (
                  <span>{t.noTransactionsMonth}</span>
                )}
              </span>
              {totalIncome > 0 && (
                <span>
                  {Math.max(0, 100 - spentPercentage)}% {t.savingsRate}
                </span>
              )}
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  spentPercentage > 90
                    ? 'bg-rose-400'
                    : spentPercentage > 70
                    ? 'bg-amber-300'
                    : 'bg-emerald-300'
                }`}
                style={{ width: `${Math.min(100, Math.max(spentPercentage > 0 ? 4 : 0, spentPercentage))}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* 2 & 3. Total Income (Green) and Total Spent (Red) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Income Card (Green) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            id="card-total-income"
            className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {t.totalIncome}
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight block">
                +{formatCurrency(totalIncome)}
              </span>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 font-medium">
                {monthTransactions.filter((t) => t.type === 'INCOME').length} {t.transactionsCount}
              </p>
            </div>
          </motion.div>

          {/* Total Spent Card (Red) */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            id="card-total-spent"
            className="rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  {t.totalSpent}
                </span>
              </div>
              <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-extrabold text-rose-700 dark:text-rose-300 tracking-tight block">
                −{formatCurrency(totalExpense)}
              </span>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5 font-medium">
                {monthTransactions.filter((t) => t.type === 'EXPENSE').length} {t.transactionsCount}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Action Bar (Add Income / Add Expense) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          id="home-quick-add-income-btn"
          onClick={() => onNavigate('add_entry')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-xs active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.addIncomeTab}</span>
        </button>
        <button
          id="home-quick-add-expense-btn"
          onClick={() => onNavigate('add_entry')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wide shadow-xs active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.addExpenseTab}</span>
        </button>
      </div>

      {/* Category Spending Breakdown for the Selected Month */}
      {categoryBreakdown.filter((c) => c.total > 0).length > 0 && (
        <M3Card className="p-4" id="home-category-spending-snapshot">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#f0f4f9] dark:bg-[#2a2d33] rounded-lg text-[#1a1c1e] dark:text-[#e2e2e6]">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                {t.categoryBreakdownTitle} ({formatMonthTitle(selectedMonth)})
              </h4>
            </div>
            <button
              onClick={() => onNavigate('breakdown')}
              className="text-xs text-[#005cb2] dark:text-[#a5c8ff] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>{t.spendingAnalytics}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {categoryBreakdown
              .filter((c) => c.total > 0)
              .slice(0, 4)
              .map((item) => {
                const Icon = getCategoryIcon(item.category);
                const colorInfo = getCategoryColor(item.category);
                return (
                  <div key={item.category} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${colorInfo.bg}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          {getCategoryName(item.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                          {item.percentage.toFixed(0)}%
                        </span>
                        <span className="font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-[#e1e2e8] dark:bg-[#32363e] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, item.percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </M3Card>
      )}

      {/* Android Mobile Free App Banner */}
      {onOpenAndroidModal && (
        <div
          onClick={onOpenAndroidModal}
          className="bg-gradient-to-r from-[#005cb2]/10 via-[#38bdf8]/15 to-[#005cb2]/5 dark:from-[#005cb2]/25 dark:via-[#38bdf8]/20 dark:to-transparent border border-[#005cb2]/25 dark:border-[#38bdf8]/30 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005cb2] to-[#003566] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                  {t.installAndroidTitle}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider shrink-0">
                  {t.androidFreeBadge}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                1-tap phone install • 100% Offline Room DB • Zero Ads
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-2">
            <span className="px-3 py-1.5 bg-[#005cb2] group-hover:bg-[#004a77] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-colors">
              <span>{t.installAndroidBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity for this month */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#74777f] dark:text-[#8e9099]" />
            <span>{t.recentTransactions} ({formatMonthTitle(selectedMonth)})</span>
          </h3>
          <button
            id="home-view-all-transactions-btn"
            onClick={() => onNavigate('transactions')}
            className="text-xs text-[#005cb2] dark:text-[#a5c8ff] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t.viewAll} ({monthTransactions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <M3Card className="p-8 text-center flex flex-col items-center justify-center">
            <Sparkles className="w-8 h-8 text-neutral-400 mb-2" />
            <p className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e2e2e6]">
              {t.noTransactionsMonth}
            </p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              {t.logFirstEntry}
            </p>
            <button
              onClick={() => onNavigate('add_entry')}
              className="mt-4 px-4 py-2 bg-[#005cb2] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              {t.navAddEntry}
            </button>
          </M3Card>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME';
              const Icon = getCategoryIcon(tx.category);
              const colorInfo = getCategoryColor(tx.category);

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction?.(tx)}
                  className="bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] p-3.5 rounded-xl flex items-center justify-between hover:border-[#b0b4be] dark:hover:border-[#424650] transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${colorInfo.bg} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-[#74777f] dark:text-[#8e9099] mt-0.5">
                        <span className="font-medium">{getCategoryName(tx.category)}</span>
                        <span>•</span>
                        <span>{formatDateLabel(tx.date, language)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? `+${formatCurrency(tx.amount)}` : `−${formatCurrency(tx.amount)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Printable / Downloadable PDF Report Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <MonthlyReportModal
            isOpen={isPdfModalOpen}
            onClose={() => setIsPdfModalOpen(false)}
            uiState={uiState}
            selectedMonth={selectedMonth}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

