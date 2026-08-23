import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PieChart as PieChartIcon,
  Code2,
  Settings,
  Plus,
  ArrowUpDown,
  Home,
  Smartphone,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { NavigationTab, TransactionEntity } from './types';
import { useFinanceViewModel } from './viewmodel/useFinanceViewModel';
import { useLanguage } from './i18n/LanguageContext';
import {
  M3NavigationBar,
  M3TopAppBar,
  M3Snackbar,
  LanguageToggleSwitch,
  formatCurrency,
} from './components/M3Components';
import { HomeScreen } from './components/HomeScreen';
import { AddEntryScreen } from './components/AddEntryScreen';
import { TransactionListScreen } from './components/TransactionListScreen';
import { CategoryBreakdownScreen } from './components/CategoryBreakdownScreen';
import { KotlinCodeViewerModal } from './components/KotlinCodeViewerModal';
import { AndroidSettingsModal } from './components/AndroidSettingsModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isKotlinModalOpen, setIsKotlinModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const { t, language } = useLanguage();

  const {
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
  } = useFinanceViewModel();

  // Determine App Bar Title & Subtitle based on active tab
  const getAppBarInfo = () => {
    switch (currentTab) {
      case 'home':
        return {
          title: t.appTitle,
          subtitle: t.subHome,
        };
      case 'transactions':
        return {
          title: t.navTransactions,
          subtitle: `${uiState.transactions.length} ${t.subTransactions}`,
        };
      case 'add_entry':
        return {
          title: t.navAddEntry,
          subtitle: t.subAddEntry,
        };
      case 'breakdown':
        return {
          title: t.categoryBreakdownTitle,
          subtitle: t.subBreakdown,
        };
      default:
        return { title: t.appTitle, subtitle: '' };
    }
  };

  const appBarInfo = getAppBarInfo();

  return (
    <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#121316] text-[#1a1c1e] dark:text-[#e2e2e6] font-sans flex flex-col items-center justify-start selection:bg-[#005cb2]/20">
      {/* Android Device Container Shell */}
      <div className="w-full max-w-lg min-h-screen bg-[#fdfcff] dark:bg-[#1a1c1e] shadow-2xl flex flex-col relative overflow-x-hidden">
        
        {/* Material 3 Top App Bar */}
        <M3TopAppBar
          title={appBarInfo.title}
          subtitle={appBarInfo.subtitle}
          leadingAction={
            currentTab === 'breakdown' ? undefined : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#005cb2] text-white font-bold text-sm shadow-xs">
                ₹
              </div>
            )
          }
          trailingActions={
            <div className="flex items-center gap-1.5">
              {/* Language Switcher Button / Toggle */}
              <LanguageToggleSwitch />

              {/* Install on Android Mobile (Free) Button */}
              <button
                id="btn-open-android-install"
                onClick={() => setIsAndroidModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#005cb2] dark:text-[#a5c8ff] text-xs font-bold cursor-pointer transition-colors border border-blue-200 dark:border-blue-800/60 shadow-2xs"
                title={t.installAndroidTitle}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.installAndroidBtn}</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-600 text-white font-extrabold">
                  Free
                </span>
              </button>

              <button
                id="btn-open-kotlin-code-viewer"
                onClick={() => setIsKotlinModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-800/60"
                title="View Kotlin & Jetpack Compose Source Code"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.kotlinSource}</span>
              </button>

              <button
                id="btn-open-room-db-settings"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                title={t.dbSettings}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {/* Main Content View with Animation Transitions */}
        <main className="flex-1 w-full overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <HomeScreen
                  uiState={uiState}
                  onNavigate={setCurrentTab}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  goToPrevMonth={goToPrevMonth}
                  goToNextMonth={goToNextMonth}
                  onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
                />
              </motion.div>
            )}

            {currentTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <TransactionListScreen
                  transactions={uiState.transactions}
                  filteredTransactions={filteredTransactions}
                  selectedMonth={selectedMonth}
                  onDeleteTransaction={deleteTransaction}
                  onEditTransaction={editTransaction}
                  onRestoreLastDeleted={restoreLastDeleted}
                  lastDeletedTransaction={uiState.lastDeletedTransaction}
                  onClearLastDeleted={clearLastDeleted}
                  onNavigate={setCurrentTab}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedFilter={selectedFilter}
                  setSelectedFilter={setSelectedFilter}
                  selectedCategoryFilter={selectedCategoryFilter}
                  setSelectedCategoryFilter={setSelectedCategoryFilter}
                  dateRangeOption={dateRangeOption}
                  setDateRangeOption={setDateRangeOption}
                  customStartDate={customStartDate}
                  setCustomStartDate={setCustomStartDate}
                  customEndDate={customEndDate}
                  setCustomEndDate={setCustomEndDate}
                />
              </motion.div>
            )}

            {currentTab === 'add_entry' && (
              <motion.div
                key="add_entry"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <AddEntryScreen
                  onAddIncome={addIncome}
                  onAddExpense={addExpense}
                  onNavigate={setCurrentTab}
                />
              </motion.div>
            )}

            {currentTab === 'breakdown' && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <CategoryBreakdownScreen
                  uiState={uiState}
                  onNavigate={setCurrentTab}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Material 3 Bottom Navigation Bar with 3 Tabs: Home, Transactions, Add Entry */}
        <M3NavigationBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        {/* Undo Delete Snackbar */}
        <AnimatePresence>
          {uiState.lastDeletedTransaction && (
            <M3Snackbar
              message={`${t.deletedMsg} "${uiState.lastDeletedTransaction.description}" (${formatCurrency(uiState.lastDeletedTransaction.amount)})`}
              actionLabel={t.undo}
              onAction={restoreLastDeleted}
              onDismiss={clearLastDeleted}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Kotlin Code & Jetpack Compose Architecture Modal */}
      <KotlinCodeViewerModal
        isOpen={isKotlinModalOpen}
        onClose={() => setIsKotlinModalOpen(false)}
      />

      {/* Room DB Settings & Backup Modal */}
      <AndroidSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onResetData={resetData}
        onClearData={clearAllData}
        transactionCount={uiState.transactions.length}
        onOpenAndroidInstallModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Android Mobile Free App Install Modal */}
      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        onOpenKotlinModal={() => setIsKotlinModalOpen(true)}
      />
    </div>
  );
}
