import React, { useState } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingDown,
  Layers,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { FinanceUiState, NavigationTab, ExpenseCategory } from '../types';
import {
  M3Card,
  M3SegmentedControl,
  formatCurrency,
  getCategoryIcon,
  getCategoryColor,
} from './M3Components';
import { useLanguage } from '../i18n/LanguageContext';

export function CategoryBreakdownScreen({
  uiState,
  onNavigate,
}: {
  uiState: FinanceUiState;
  onNavigate: (tab: NavigationTab) => void;
}) {
  const { t, getCategoryName } = useLanguage();
  const { categoryBreakdown, totalExpense, transactions } = uiState;
  const [chartView, setChartView] = useState<'PIE' | 'BAR'>('PIE');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter only categories that have spent > 0 for pie chart
  const activeBreakdown = categoryBreakdown.filter((item) => item.total > 0);

  const topCategory = activeBreakdown.length > 0 ? activeBreakdown[0] : null;

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-3 max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('home')}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            title={t.navHome}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#5a5f69] dark:text-[#9ea3ae]">
              {t.spendingAnalytics}
            </p>
            <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
              {t.categoryBreakdownTitle}
            </h2>
          </div>
        </div>

        {/* Chart View Toggle (Pie vs Bar) */}
        <div className="flex items-center bg-[#e7ebf0] dark:bg-[#2c2f36] p-1 rounded-xl">
          <button
            onClick={() => setChartView('PIE')}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              chartView === 'PIE'
                ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                : 'text-neutral-500'
            }`}
            title="Pie Chart View"
          >
            <PieChartIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartView('BAR')}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              chartView === 'BAR'
                ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                : 'text-neutral-500'
            }`}
            title="Bar Chart View"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Total Spent Summary Card */}
      <M3Card className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border-rose-100 dark:border-rose-900/30">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              {t.totalSpent}
            </span>
            <h3 className="text-2xl font-extrabold text-[#1a1c1e] dark:text-white mt-0.5">
              {formatCurrency(totalExpense)}
            </h3>
          </div>
          {topCategory && (
            <div className="text-right">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                Highest:
              </span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {getCategoryName(topCategory.category)} ({topCategory.percentage.toFixed(0)}%)
              </span>
            </div>
          )}
        </div>
      </M3Card>

      {/* Chart Section */}
      {activeBreakdown.length === 0 ? (
        <M3Card className="p-8 text-center flex flex-col items-center justify-center">
          <Layers className="w-8 h-8 text-neutral-400 mb-2" />
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
            {t.addExpenseTab}
          </button>
        </M3Card>
      ) : (
        <>
          <M3Card className="p-4 flex flex-col items-center justify-center min-h-[260px]" id="card-category-chart">
            <h4 className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] self-start mb-2">
              {chartView === 'PIE' ? 'Expense Distribution Pie Chart' : 'Category Spending Bar Chart'}
            </h4>

            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'PIE' ? (
                  <RePieChart>
                    <Pie
                      data={activeBreakdown.map((e) => ({ ...e, displayName: getCategoryName(e.category) }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="displayName"
                      onClick={(entry: any) => setSelectedCategory(entry?.category ? String(entry.category) : null)}
                    >
                      {activeBreakdown.map((entry) => (
                        <Cell
                          key={`cell-${entry.category}`}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), t.totalSpent]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                  </RePieChart>
                ) : (
                  <BarChart
                    data={activeBreakdown.map((e) => ({ ...e, displayName: getCategoryName(e.category) }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="displayName" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val), t.totalSpent]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                      {activeBreakdown.map((entry) => (
                        <Cell key={`bar-${entry.category}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </M3Card>

          {/* Bar List of Total Spent Per Category */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center gap-1.5 px-1">
              <span>{t.categoryBreakdownTitle}</span>
              <span className="text-xs text-neutral-400 font-normal">
                ({activeBreakdown.length} {t.activeFilters})
              </span>
            </h4>

            <div className="space-y-2.5">
              {categoryBreakdown.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const colorInfo = getCategoryColor(item.category);
                const isSelected = selectedCategory === item.category;

                return (
                  <M3Card
                    key={item.category}
                    className={`p-3.5 transition-all ${
                      isSelected ? 'ring-2 ring-[#005cb2] bg-[#f0f4f9] dark:bg-[#25282e]' : ''
                    }`}
                    onClick={() => setSelectedCategory(isSelected ? null : (item.category as string))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${colorInfo.bg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
                            {getCategoryName(item.category)}
                          </h5>
                          <span className="text-[11px] text-[#74777f] dark:text-[#8e9099]">
                            {item.count} {t.transactionsCount}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#1a1c1e] dark:text-[#e2e2e6]">
                          {formatCurrency(item.total)}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                          {item.percentage.toFixed(1)}% {t.ofIncomeSpent}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#e1e2e8] dark:bg-[#32363e] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(item.total > 0 ? 3 : 0, item.percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </M3Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
