import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  ArrowUpDown,
  PlusCircle,
  PieChart,
  LucideIcon,
  Utensils,
  Home as HomeIcon,
  Car,
  ShoppingBag,
  Layers,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Building,
  Coins,
  Calendar,
  X,
  RotateCcw,
  Check,
  Receipt,
  FileText,
} from 'lucide-react';
import { NavigationTab, ExpenseCategory, IncomeSource } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Languages, Globe } from 'lucide-react';

/**
 * Indian Rupee (₹) Currency Formatter
 * Formats numbers in standard Indian or international grouping with prominent ₹ symbol.
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  
  // Format with en-IN locale for Indian numbering standard (Lakhs / Crores / Thousands)
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(Math.abs(amount));
    
    return `₹${formatted}`;
  } catch {
    return `₹${Math.abs(amount).toLocaleString()}`;
  }
}

export function formatDateLabel(dateString: string, lang: 'en' | 'te' = 'en'): string {
  try {
    const targetDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (targetDate.getTime() === today.getTime()) {
      return lang === 'te' ? 'ఈరోజు' : 'Today';
    } else if (targetDate.getTime() === yesterday.getTime()) {
      return lang === 'te' ? 'నిన్న' : 'Yesterday';
    } else {
      return targetDate.toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: targetDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch {
    return dateString;
  }
}

export function getCategoryIcon(name: string): LucideIcon {
  switch (name) {
    case 'Food':
      return Utensils;
    case 'Rent':
      return HomeIcon;
    case 'Transport':
      return Car;
    case 'Shopping':
      return ShoppingBag;
    case 'Bills':
      return Receipt;
    case 'Salary':
      return Briefcase;
    case 'Freelance':
      return Laptop;
    case 'Investments':
      return TrendingUp;
    case 'Gift':
      return Gift;
    case 'Business':
      return Building;
    case 'Other':
    default:
      return Coins;
  }
}

export function getCategoryColor(name: string): { bg: string; text: string; hex: string } {
  switch (name) {
    case 'Food':
      return { bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', text: 'text-orange-600', hex: '#F97316' };
    case 'Rent':
      return { bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', text: 'text-purple-600', hex: '#8B5CF6' };
    case 'Transport':
      return { bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', text: 'text-sky-600', hex: '#0EA5E9' };
    case 'Shopping':
      return { bg: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300', text: 'text-pink-600', hex: '#EC4899' };
    case 'Bills':
      return { bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', text: 'text-blue-600', hex: '#3B82F6' };
    case 'Salary':
      return { bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', text: 'text-emerald-600', hex: '#10B981' };
    case 'Freelance':
      return { bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300', text: 'text-teal-600', hex: '#14B8A6' };
    case 'Investments':
      return { bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300', text: 'text-cyan-600', hex: '#06B6D4' };
    case 'Gift':
      return { bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', text: 'text-amber-600', hex: '#F59E0B' };
    case 'Business':
      return { bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300', text: 'text-indigo-600', hex: '#6366F1' };
    case 'Other':
    default:
      return { bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-600', hex: '#64748B' };
  }
}


/**
 * Material 3 Navigation Bar (Bottom Nav)
 * 3 Tabs: Home, Transactions, Add Entry (+ Breakdown shortcut)
 */
export function M3NavigationBar({
  currentTab,
  onSelectTab,
}: {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}) {
  const { t } = useLanguage();
  const tabs = [
    { id: 'home' as NavigationTab, label: t.navHome, icon: Home },
    { id: 'business' as NavigationTab, label: t.ordersTab, icon: Briefcase },
    { id: 'transactions' as NavigationTab, label: t.navTransactions, icon: ArrowUpDown },
    { id: 'add_entry' as NavigationTab, label: t.navAddEntry, icon: PlusCircle },
  ];

  return (
    <nav
      id="m3-bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#f7f9fc] dark:bg-[#1a1c1e] border-t border-[#e1e2e8] dark:border-[#2d3036] px-4 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onSelectTab(tab.id)}
            className="flex flex-col items-center justify-center relative py-1 px-4 min-w-[76px] transition-colors group cursor-pointer"
          >
            {/* Active Pill indicator */}
            <div className="relative flex items-center justify-center w-16 h-8 rounded-full mb-1">
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-[#d8e2ff] dark:bg-[#004a77] rounded-full"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive
                    ? 'text-[#001d36] dark:text-[#c2e7ff] stroke-[2.4]'
                    : 'text-[#44474e] dark:text-[#c4c7d0] stroke-[1.8] group-hover:text-[#1a1c1e]'
                }`}
              />
            </div>
            <span
              className={`text-xs tracking-tight transition-all font-medium ${
                isActive
                  ? 'text-[#001d36] dark:text-[#c2e7ff] font-semibold'
                  : 'text-[#44474e] dark:text-[#8e9099]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Material 3 Language Toggle Switch (English / తెలుగు)
 */
export function LanguageToggleSwitch() {
  const { language, toggleLanguage, setLanguage } = useLanguage();

  return (
    <div
      id="language-toggle-switch"
      className="flex items-center bg-[#e7ebf0] dark:bg-[#282b33] p-0.5 rounded-xl border border-[#d2d6dd] dark:border-[#383b42] shadow-2xs"
    >
      <button
        id="btn-lang-en"
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          language === 'en'
            ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
        title="Switch to English"
      >
        <span>EN</span>
      </button>

      <button
        id="btn-lang-te"
        type="button"
        onClick={() => setLanguage('te')}
        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
          language === 'te'
            ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
        title="తెలుగులోకి మార్చండి (Switch to Telugu)"
      >
        <span>తెలుగు</span>
      </button>
    </div>
  );
}

/**
 * Material 3 Top App Bar
 */
export function M3TopAppBar({
  title,
  subtitle,
  leadingAction,
  trailingActions,
}: {
  title: string;
  subtitle?: string;
  leadingAction?: ReactNode;
  trailingActions?: ReactNode;
}) {
  return (
    <header
      id="m3-top-app-bar"
      className="sticky top-0 z-30 bg-[#f7f9fc]/90 dark:bg-[#1a1c1e]/90 backdrop-blur-md px-4 py-3 border-b border-[#e1e2e8]/60 dark:border-[#2d3036]/60 flex items-center justify-between min-h-[56px]"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {leadingAction}
        <div className="truncate">
          <h1 className="text-lg font-semibold tracking-tight text-[#1a1c1e] dark:text-[#e2e2e6] truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#74777f] dark:text-[#8e9099] truncate font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {trailingActions && (
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {trailingActions}
        </div>
      )}
    </header>
  );
}

/**
 * Material 3 Floating / Styled Card
 */
export function M3Card({
  children,
  className = '',
  onClick,
  id,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  key?: React.Key;
}) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white dark:bg-[#202227] rounded-2xl border border-[#e1e2e8] dark:border-[#2d3036] shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Material 3 Outlined Text Field
 */
export function M3TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  helperText,
  id,
  required,
  min,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  helperText?: string;
  id?: string;
  required?: boolean;
  min?: string | number;
  step?: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 w-full" id={id ? `${id}-container` : undefined}>
      <label className="text-xs font-semibold text-[#44474e] dark:text-[#c4c7d0] px-1 flex items-center justify-between">
        <span>{label}</span>
        {required && <span className="text-xs text-rose-500 font-normal">*Required</span>}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[#74777f] dark:text-[#8e9099] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
          className={`w-full bg-[#fdfcff] dark:bg-[#1f2126] border rounded-xl px-3.5 py-2.5 text-sm text-[#1a1c1e] dark:text-[#e2e2e6] placeholder:text-[#94a3b8] dark:placeholder:text-[#64748b] transition-all outline-none focus:ring-2 ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200 dark:focus:ring-rose-950/50'
              : 'border-[#c4c7d0] dark:border-[#44474e] focus:border-[#005cb2] focus:ring-[#005cb2]/20 dark:focus:border-[#a5c8ff]'
          }`}
        />
      </div>
      {error ? (
        <span className="text-xs text-rose-500 font-medium px-1">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#74777f] dark:text-[#8e9099] px-1">{helperText}</span>
      ) : null}
    </div>
  );
}

/**
 * Material 3 Segmented Toggle (Tab/Choice)
 */
export function M3SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  id,
}: {
  options: { value: T; label: string; icon?: LucideIcon; activeColor?: string }[];
  value: T;
  onChange: (val: T) => void;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="flex p-1 bg-[#e7ebf0] dark:bg-[#25282e] rounded-xl border border-[#d2d6de] dark:border-[#373a42] gap-1"
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              isSelected
                ? 'bg-white dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] shadow-sm'
                : 'text-[#5a5f69] dark:text-[#9ea3ae] hover:text-[#1a1c1e] dark:hover:text-white'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Material 3 Undo Snackbar
 */
export function M3Snackbar({
  message,
  actionLabel = 'Undo',
  onAction,
  onDismiss,
}: {
  message: string;
  actionLabel?: string;
  onAction: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      id="m3-snackbar-container"
      className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-[#313033] dark:bg-[#e6e1e5] text-[#f4eff4] dark:text-[#313033] px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 border border-neutral-700/20"
    >
      <span className="text-xs font-medium truncate">{message}</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onAction}
          id="m3-snackbar-undo-btn"
          className="text-xs font-bold text-[#d0bcff] dark:text-[#6750a4] hover:underline uppercase tracking-wider px-2 py-1 cursor-pointer flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full text-neutral-400 hover:text-white dark:hover:text-black cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
