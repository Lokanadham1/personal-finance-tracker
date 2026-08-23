import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Download,
  Printer,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { FinanceUiState } from '../types';
import { formatCurrency, formatDateLabel } from './M3Components';
import { generateMonthlyPDFReport, MonthlyReportData } from '../utils/pdfGenerator';
import { useLanguage } from '../i18n/LanguageContext';

export function MonthlyReportModal({
  isOpen,
  onClose,
  uiState,
  selectedMonth,
}: {
  isOpen: boolean;
  onClose: () => void;
  uiState: FinanceUiState;
  selectedMonth: string;
}) {
  const { t, language, getCategoryName } = useLanguage();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const { totalIncome, totalExpense, remainingBalance, spentPercentage, transactions, categoryBreakdown } = uiState;
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));

  const formatMonthTitle = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthKey;
    }
  };

  const monthTitle = formatMonthTitle(selectedMonth);

  const reportData: MonthlyReportData = {
    selectedMonth,
    monthTitle,
    totalIncome,
    totalExpense,
    remainingBalance,
    spentPercentage,
    transactions: monthTransactions,
    categoryBreakdown,
  };

  const handleDownloadPDF = () => {
    generateMonthlyPDFReport(reportData);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isBalancePositive = remainingBalance >= 0;
  const activeCategories = categoryBreakdown.filter((c) => c.total > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-[#1e2025] border border-[#e1e2e8] dark:border-[#2d3036] rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 my-8 max-h-[90vh] flex flex-col text-[#1a1c1e] dark:text-[#e2e2e6]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e1e2e8] dark:border-[#2d3036] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#005cb2]/15 text-[#005cb2] dark:text-[#a5c8ff]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{t.pdfModalTitle}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {monthTitle} ({selectedMonth})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Report Content Area (Formatted for printing & preview) */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1 print:p-0" id="printable-monthly-report">
          {/* Report Top Summary Banner */}
          <div className="bg-[#f0f4f9] dark:bg-[#282b33] p-4 rounded-2xl border border-[#e1e2e8] dark:border-[#2d3036]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400">
                  {t.statementPeriod}
                </span>
                <h4 className="text-lg font-extrabold text-[#005cb2] dark:text-[#a5c8ff]">
                  {monthTitle} {t.financialStatement}
                </h4>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                <span>{monthTransactions.length} {t.totalEntriesCount}</span>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3.5">
              {/* Income */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t.totalIncome}</span>
                </div>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                  +{formatCurrency(totalIncome)}
                </span>
              </div>

              {/* Expense */}
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 mb-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t.totalSpent}</span>
                </div>
                <span className="text-base font-extrabold text-rose-700 dark:text-rose-300">
                  −{formatCurrency(totalExpense)}
                </span>
              </div>

              {/* Net Balance */}
              <div
                className={`p-3 rounded-xl border ${
                  isBalancePositive
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isBalancePositive ? t.netSurplus : t.netDeficit}
                  </span>
                </div>
                <span className="text-base font-extrabold">
                  {isBalancePositive ? '+' : '−'}
                  {formatCurrency(Math.abs(remainingBalance))}
                </span>
              </div>
            </div>

            {/* Income Spent ratio */}
            <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
              <span>{t.budgetUtilization}: <strong>{spentPercentage}%</strong></span>
              {totalIncome > 0 && (
                <span>{t.savingsRate}: <strong>{(Math.max(0, 100 - spentPercentage)).toFixed(1)}%</strong></span>
              )}
            </div>
          </div>

          {/* Category Breakdown Table */}
          {activeCategories.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{t.categoryBreakdownTitle}</span>
              </h5>
              <div className="border border-[#e1e2e8] dark:border-[#2d3036] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f0f4f9] dark:bg-[#282b33] border-b border-[#e1e2e8] dark:border-[#2d3036] text-neutral-600 dark:text-neutral-300 font-bold">
                    <tr>
                      <th className="py-2 px-3">{t.category}</th>
                      <th className="py-2 px-3 text-right">{t.amount} (₹)</th>
                      <th className="py-2 px-3 text-right">{t.shareOfExpense}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e2e8] dark:divide-[#2d3036]">
                    {activeCategories.map((c) => (
                      <tr key={c.category} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <td className="py-2 px-3 font-semibold">{getCategoryName(c.category)}</td>
                        <td className="py-2 px-3 text-right font-bold">{formatCurrency(c.total)}</td>
                        <td className="py-2 px-3 text-right text-neutral-500">{c.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Itemized Transactions Table */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.itemizedLedger} ({monthTransactions.length})</span>
            </h5>
            {monthTransactions.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-3 text-center bg-[#f0f4f9] dark:bg-[#282b33] rounded-xl">
                {t.noTransactionsMonth}
              </p>
            ) : (
              <div className="border border-[#e1e2e8] dark:border-[#2d3036] rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f0f4f9] dark:bg-[#282b33] border-b border-[#e1e2e8] dark:border-[#2d3036] text-neutral-600 dark:text-neutral-300 font-bold">
                    <tr>
                      <th className="py-2 px-3">{t.date}</th>
                      <th className="py-2 px-3">{t.type}</th>
                      <th className="py-2 px-3">{t.category}</th>
                      <th className="py-2 px-3">{t.description}</th>
                      <th className="py-2 px-3 text-right">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e2e8] dark:divide-[#2d3036]">
                    {monthTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                        <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">{tx.date}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'INCOME'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {tx.type === 'INCOME' ? t.income : t.expense}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-neutral-700 dark:text-neutral-300">
                          {getCategoryName(tx.category)}
                        </td>
                        <td className="py-2 px-3 font-semibold truncate max-w-[140px]">
                          {tx.description}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                            tx.type === 'INCOME'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+' : '−'}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Download Success Notice */}
        {downloadSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.downloadSuccess}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#e1e2e8] dark:border-[#2d3036] shrink-0">
          <button
            id="btn-print-monthly-report"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] text-[#1a1c1e] dark:text-[#e2e2e6] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReport}</span>
          </button>

          <button
            id="btn-download-pdf-report"
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 px-4 bg-[#005cb2] hover:bg-[#004a77] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadPdfFile}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
