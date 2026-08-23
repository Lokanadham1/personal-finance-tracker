import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  FileText,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Tag,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { ExpenseCategory, IncomeSource, TransactionType, NavigationTab } from '../types';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '../db/roomDatabase';
import {
  M3Card,
  M3SegmentedControl,
  M3TextField,
  getCategoryIcon,
  getCategoryColor,
} from './M3Components';
import { VoiceCommandWidget } from './VoiceCommandWidget';
import { ParsedVoiceCommand } from '../utils/voiceCommandParser';
import { useLanguage } from '../i18n/LanguageContext';
import confetti from 'canvas-confetti';

export function AddEntryScreen({
  onAddIncome,
  onAddExpense,
  onNavigate,
  defaultType = 'EXPENSE',
}: {
  onAddIncome: (amount: number, source: IncomeSource | string, date: string, description?: string) => Promise<any>;
  onAddExpense: (amount: number, category: ExpenseCategory | string, description: string, date: string) => Promise<any>;
  onNavigate: (tab: NavigationTab) => void;
  defaultType?: TransactionType;
}) {
  const { t, getCategoryName } = useLanguage();
  const [entryType, setEntryType] = useState<TransactionType>(defaultType);

  // Common Form Fields
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Expense Specific Fields (Food, Rent, Transport, Shopping, Bills, Other)
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Food');
  const [expenseDescription, setExpenseDescription] = useState<string>('');

  // Income Specific Fields
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('Salary');
  const [incomeCustomSource, setIncomeCustomSource] = useState<string>('');
  const [incomeDescription, setIncomeDescription] = useState<string>('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const quickAmounts = entryType === 'EXPENSE' ? [100, 250, 500, 1000, 2000, 5000] : [1000, 5000, 10000, 25000, 50000];

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleDatePreset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleApplyVoiceCommand = (cmd: ParsedVoiceCommand) => {
    setEntryType(cmd.type);
    if (cmd.amount) {
      setAmount(cmd.amount.toString());
    }
    if (cmd.date) {
      setDate(cmd.date);
    }
    if (cmd.type === 'EXPENSE') {
      const validCategory = EXPENSE_CATEGORIES.some((c) => c.name === cmd.categoryOrSource)
        ? (cmd.categoryOrSource as ExpenseCategory)
        : 'Food';
      setExpenseCategory(validCategory);
      setExpenseDescription(cmd.description);
    } else {
      const validSource = INCOME_SOURCES.some((s) => s.name === cmd.categoryOrSource)
        ? (cmd.categoryOrSource as IncomeSource)
        : 'Salary';
      setIncomeSource(validSource);
      setIncomeDescription(cmd.description);
    }
    setError(null);
  };

  const handleAutoSubmitVoiceCommand = async (cmd: ParsedVoiceCommand) => {
    if (!cmd.amount || cmd.amount <= 0) {
      setError(t.amountRequiredError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (cmd.type === 'INCOME') {
        const finalSource = cmd.categoryOrSource || 'Salary';
        await onAddIncome(cmd.amount, finalSource, cmd.date, cmd.description);
      } else {
        const finalCategory = cmd.categoryOrSource || 'Food';
        const finalDesc = cmd.description || `${finalCategory} expense`;
        await onAddExpense(cmd.amount, finalCategory, finalDesc, cmd.date);
      }

      try {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.8 },
          colors: cmd.type === 'INCOME' ? ['#10b981', '#34d399', '#059669'] : ['#f43f5e', '#fb7185', '#e11d48'],
        });
      } catch {}

      setTimeout(() => {
        onNavigate('transactions');
      }, 500);
    } catch {
      setError('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t.amountRequiredError);
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (entryType === 'INCOME') {
        const finalSource = incomeSource === 'Other' && incomeCustomSource.trim() ? incomeCustomSource.trim() : incomeSource;
        await onAddIncome(parsedAmount, finalSource, date, incomeDescription);
      } else {
        const finalDescription = expenseDescription.trim() || `${expenseCategory} expense`;
        await onAddExpense(parsedAmount, expenseCategory, finalDescription, date);
      }

      // Trigger celebratory mini confetti
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: entryType === 'INCOME' ? ['#10b981', '#34d399', '#059669'] : ['#f43f5e', '#fb7185', '#e11d48'],
        });
      } catch {}

      setAmount('');
      setExpenseDescription('');
      setIncomeDescription('');

      // Auto redirect to Transactions after short delay
      setTimeout(() => {
        onNavigate('transactions');
      }, 500);
    } catch (err) {
      setError('Failed to save to local storage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-3 max-w-xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-[#5a5f69] dark:text-[#9ea3ae]">
            {t.navAddEntry}
          </p>
          <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e2e2e6] tracking-tight">
            {entryType === 'INCOME' ? t.addIncomeTab : t.addExpenseTab}
          </h2>
        </div>
      </div>

      {/* Segmented Type Selector */}
      <M3SegmentedControl<TransactionType>
        id="add-entry-type-segmented-control"
        value={entryType}
        onChange={(val) => {
          setEntryType(val);
          setError(null);
        }}
        options={[
          {
            value: 'EXPENSE',
            label: t.addExpenseTab,
            icon: TrendingDown,
          },
          {
            value: 'INCOME',
            label: t.addIncomeTab,
            icon: TrendingUp,
          },
        ]}
      />

      {/* Voice Command Widget (Web Speech API) */}
      <VoiceCommandWidget
        onApplyParsedCommand={handleApplyVoiceCommand}
        onAutoSubmitParsedCommand={handleAutoSubmitVoiceCommand}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Amount Input Hero with prominent Rupee ₹ symbol */}
        <M3Card className="p-4 flex flex-col gap-3">
          <label className="text-xs font-bold text-[#44474e] dark:text-[#c4c7d0]">
            {t.amount} (₹)
          </label>
          <div className="relative flex items-center">
            <span
              className={`absolute left-3.5 text-2xl md:text-3xl font-extrabold select-none ${
                entryType === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              ₹
            </span>
            <input
              id="input-transaction-amount"
              type="number"
              step="any"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#f8fafc] dark:bg-[#1a1c1e] text-2xl md:text-3xl font-extrabold text-[#1a1c1e] dark:text-[#e2e2e6] pl-9 pr-4 py-3 rounded-xl border border-[#c4c7d0] dark:border-[#44474e] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/30 focus:border-[#005cb2]"
              autoFocus
              required
            />
          </div>

          {/* Quick amount chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-[#74777f] dark:text-[#8e9099] self-center mr-1 font-medium">
              {t.quickAmounts}:
            </span>
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuickAmount(q)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#e7ebf0] hover:bg-[#d8e2ff] dark:bg-[#2c2f36] dark:hover:bg-[#004a77] text-[#1a1c1e] dark:text-[#e2e2e6] transition-colors cursor-pointer"
              >
                +₹{q.toLocaleString()}
              </button>
            ))}
            {amount && (
              <button
                type="button"
                onClick={() => setAmount('')}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 cursor-pointer"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </M3Card>

        {/* Dynamic Category/Source Selection */}
        {entryType === 'EXPENSE' ? (
          /* Expense Category Selection (Food, Rent, Transport, Shopping, Bills, Other) */
          <M3Card className="p-4 flex flex-col gap-2.5" id="add-expense-category-card">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#44474e] dark:text-[#c4c7d0]">
                {t.expenseCategoryLabel}
              </label>
              <span className="text-[11px] text-neutral-500 font-medium">
                {t.category}: <span className="font-bold text-neutral-800 dark:text-neutral-200">{getCategoryName(expenseCategory)}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = expenseCategory === cat.name;
                const Icon = getCategoryIcon(cat.name);
                const color = getCategoryColor(cat.name);

                return (
                  <button
                    key={cat.name}
                    type="button"
                    id={`btn-category-${cat.name.toLowerCase()}`}
                    onClick={() => setExpenseCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#005cb2] bg-[#d8e2ff]/30 dark:bg-[#004a77]/30 ring-2 ring-[#005cb2]/40 shadow-xs'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] bg-[#f8fafc] dark:bg-[#1a1c1e] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mb-1.5 ${
                        isSelected ? color.bg : 'bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        isSelected ? 'font-bold text-[#001d36] dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {getCategoryName(cat.name)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Description Field */}
            <div className="pt-2">
              <M3TextField
                id="input-expense-description"
                label={t.description}
                placeholder={t.descPlaceholderExpense}
                value={expenseDescription}
                onChange={setExpenseDescription}
                icon={FileText}
                required
              />
            </div>
          </M3Card>
        ) : (
          /* Income Source Selection (Salary, Freelance, Investments, Gift, Business, Other) */
          <M3Card className="p-4 flex flex-col gap-2.5" id="add-income-source-card">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#44474e] dark:text-[#c4c7d0]">
                {t.incomeSourceLabel}
              </label>
              <span className="text-[11px] text-neutral-500 font-medium">
                {t.category}: <span className="font-bold text-neutral-800 dark:text-neutral-200">{getCategoryName(incomeSource)}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {INCOME_SOURCES.map((source) => {
                const isSelected = incomeSource === source.name;
                const Icon = getCategoryIcon(source.name);
                const color = getCategoryColor(source.name);

                return (
                  <button
                    key={source.name}
                    type="button"
                    id={`btn-source-${source.name.toLowerCase()}`}
                    onClick={() => setIncomeSource(source.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[#005cb2] bg-[#d8e2ff]/30 dark:bg-[#004a77]/30 ring-2 ring-[#005cb2]/40 shadow-xs'
                        : 'border-[#e1e2e8] dark:border-[#2d3036] bg-[#f8fafc] dark:bg-[#1a1c1e] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? color.bg : 'bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs truncate ${
                        isSelected ? 'font-bold text-[#001d36] dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {getCategoryName(source.name)}
                    </span>
                  </button>
                );
              })}
            </div>

            {incomeSource === 'Other' && (
              <div className="pt-2">
                <M3TextField
                  id="input-income-custom-source"
                  label="Custom Income Source Name"
                  placeholder="e.g. Dividend payout, Cash gift, Rental income..."
                  value={incomeCustomSource}
                  onChange={setIncomeCustomSource}
                />
              </div>
            )}

            <div className="pt-2">
              <M3TextField
                id="input-income-description"
                label={`${t.description} (${t.notesOptional})`}
                placeholder={t.descPlaceholderIncome}
                value={incomeDescription}
                onChange={setIncomeDescription}
                icon={FileText}
              />
            </div>
          </M3Card>
        )}

        {/* Date Field & Presets */}
        <M3Card className="p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#44474e] dark:text-[#c4c7d0]">
              {t.date}
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleDatePreset(0)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#e7ebf0] dark:bg-[#2c2f36] text-[#1a1c1e] dark:text-[#e2e2e6] hover:bg-[#d8e2ff] cursor-pointer"
              >
                {t.today}
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset(1)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#e7ebf0] dark:bg-[#2c2f36] text-[#1a1c1e] dark:text-[#e2e2e6] hover:bg-[#d8e2ff] cursor-pointer"
              >
                {t.yesterday}
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3.5 text-neutral-500 pointer-events-none" />
            <input
              id="input-transaction-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#f8fafc] dark:bg-[#1a1c1e] border border-[#c4c7d0] dark:border-[#44474e] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#1a1c1e] dark:text-[#e2e2e6] focus:outline-none focus:ring-2 focus:ring-[#005cb2]/30 focus:border-[#005cb2]"
              required
            />
          </div>
        </M3Card>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          id="btn-save-transaction-to-room"
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
            entryType === 'INCOME'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {isSubmitting
              ? t.saving
              : entryType === 'INCOME'
              ? t.saveIncomeBtn
              : t.saveExpenseBtn}
          </span>
        </button>
      </form>
    </div>
  );
}

