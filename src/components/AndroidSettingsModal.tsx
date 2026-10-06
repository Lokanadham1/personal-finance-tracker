import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  X,
  Check,
  Smartphone,
  ShieldCheck,
  HardDrive,
  FileSpreadsheet,
  Share2,
  FolderDown,
  AlertCircle,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { roomDatabase } from '../db/roomDatabase';
import { useLanguage } from '../i18n/LanguageContext';
import { TransactionEntity } from '../types';
import {
  saveCsvToAndroidFileSystem,
  shareCsvViaAndroid,
  isAndroidFileSharingSupported,
} from '../utils/csvExport';

export function AndroidSettingsModal({
  isOpen,
  onClose,
  onResetData,
  onClearData,
  transactionCount,
  currentTransactions = [],
  allTransactions = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => Promise<void>;
  onClearData: () => Promise<void>;
  transactionCount: number;
  currentTransactions?: TransactionEntity[];
  allTransactions?: TransactionEntity[];
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportScope, setExportScope] = useState<'current' | 'all'>(
    currentTransactions && currentTransactions.length > 0 ? 'current' : 'all'
  );
  const [canShare, setCanShare] = useState<boolean>(false);

  useEffect(() => {
    setCanShare(isAndroidFileSharingSupported());
  }, []);

  if (!isOpen) return null;

  // Compute transactions to export based on selected scope
  const getTargetTransactions = async (scope: 'current' | 'all' = exportScope): Promise<TransactionEntity[]> => {
    if (scope === 'current' && currentTransactions && currentTransactions.length > 0) {
      return currentTransactions;
    }
    if (allTransactions && allTransactions.length > 0) {
      return allTransactions;
    }
    // Fallback to querying roomDatabase directly
    return await roomDatabase.getAllTransactions();
  };

  const handleExportCSVToAndroid = async (overrideScope?: 'current' | 'all') => {
    const scopeToUse = overrideScope || exportScope;
    setIsExporting(true);
    try {
      const data = await getTargetTransactions(scopeToUse);
      if (!data || data.length === 0) {
        setStatusMsg({ text: 'No transactions to export in the selected history', type: 'error' });
        setTimeout(() => setStatusMsg(null), 3500);
        return;
      }

      const scopeName = scopeToUse === 'current' ? 'Current-History' : 'All-History';
      const result = await saveCsvToAndroidFileSystem(
        data,
        `finance-transactions-${scopeToUse}`,
        scopeName
      );

      setStatusMsg({
        text: `Exported ${result.count} transactions to CSV file (${result.filename})`,
        type: 'success',
      });
      setTimeout(() => setStatusMsg(null), 4500);
    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        // User cancelled the file picker dialog
        setStatusMsg({ text: 'Export cancelled by user', type: 'error' });
      } else {
        setStatusMsg({ text: err.message || 'Failed to export CSV file', type: 'error' });
      }
      setTimeout(() => setStatusMsg(null), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareCSV = async () => {
    setIsExporting(true);
    try {
      const data = await getTargetTransactions();
      if (!data || data.length === 0) {
        setStatusMsg({ text: 'No transactions to export in the selected history', type: 'error' });
        setTimeout(() => setStatusMsg(null), 3500);
        return;
      }

      const scopeName = exportScope === 'current' ? 'Current-History' : 'All-History';
      const result = await shareCsvViaAndroid(
        data,
        `finance-transactions-${exportScope}`,
        scopeName
      );

      setStatusMsg({
        text: `Shared ${result.count} transactions (${result.filename})`,
        type: 'success',
      });
      setTimeout(() => setStatusMsg(null), 4500);
    } catch (err: any) {
      if (err.message && !err.message.includes('AbortError')) {
        setStatusMsg({ text: err.message || 'Failed to share CSV', type: 'error' });
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await roomDatabase.getAllTransactions();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_room_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ text: 'JSON backup downloaded successfully', type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg({ text: 'Failed to export backup', type: 'error' });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            await roomDatabase.insertTransaction(item);
          }
          setStatusMsg({
            text: `Successfully imported ${parsed.length} transactions`,
            type: 'success',
          });
          setTimeout(() => setStatusMsg(null), 3000);
        }
      } catch {
        setStatusMsg({ text: 'Invalid JSON backup file', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const currentCount = currentTransactions?.length || 0;
  const allCount = allTransactions?.length || transactionCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4 text-[#1a1c1e] dark:text-[#e2e2e6] max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#d8e2ff] dark:bg-[#004a77] text-[#001d36] dark:text-[#c2e7ff] rounded-xl shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{t.settingsTitle}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.settingsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Card */}
        <div className="bg-[#f8fafc] dark:bg-[#1a1c1e] p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{t.storageType}:</span>
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Room SQLite (Offline & Private)</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">{t.totalRecordsStored}:</span>
            <span className="font-bold text-[#005cb2] dark:text-[#7bb0ff]">
              {transactionCount} {t.transactions}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-2.5 border rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="leading-snug">{statusMsg.text}</span>
          </motion.div>
        )}

        {/* FEATURE: Android File System CSV Export Card */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-transparent dark:from-emerald-950/30 dark:via-[#1e2726] dark:to-transparent border border-emerald-200 dark:border-emerald-800/70 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  {t.exportCsvSectionTitle}
                </h4>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  {t.exportCsvSectionDesc}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-full uppercase tracking-wider">
              Android CSV
            </span>
          </div>

          {/* Scope Selector: Current History vs All History */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block">
              Select Export Range:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-csv-scope-current"
                onClick={() => setExportScope('current')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                  exportScope === 'current'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-[#1a1c1e] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="text-xs">{t.exportCurrentScopeLabel}</span>
                <span
                  className={`text-[10px] ${
                    exportScope === 'current' ? 'text-emerald-100' : 'text-neutral-400'
                  }`}
                >
                  ({currentCount} records)
                </span>
              </button>

              <button
                type="button"
                id="btn-csv-scope-all"
                onClick={() => setExportScope('all')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all ${
                  exportScope === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-[#1a1c1e] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="text-xs">{t.exportAllScopeLabel}</span>
                <span
                  className={`text-[10px] ${
                    exportScope === 'all' ? 'text-emerald-100' : 'text-neutral-400'
                  }`}
                >
                  ({allCount} records)
                </span>
              </button>
            </div>
          </div>

          {/* Android Target Storage Notice */}
          <div className="p-2 bg-white/80 dark:bg-[#171a1d] rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 block">
                Target: Android File System
              </span>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {t.androidStorageLocationNote}
              </p>
              <p className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                📄 finance-transactions-{exportScope}-{new Date().toISOString().split('T')[0]}.csv
              </p>
            </div>
          </div>

          {/* CSV Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              id="btn-settings-export-csv"
              onClick={() => handleExportCSVToAndroid()}
              disabled={isExporting || (exportScope === 'current' ? currentCount === 0 : allCount === 0)}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              title="Download financial history as CSV file for Excel / Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>{isExporting ? 'Exporting...' : 'Export to CSV'}</span>
            </button>

            {canShare && (
              <button
                id="btn-settings-share-csv"
                onClick={handleShareCSV}
                disabled={isExporting || (exportScope === 'current' ? currentCount === 0 : allCount === 0)}
                className="py-2.5 px-3 bg-white dark:bg-[#282b33] hover:bg-neutral-100 dark:hover:bg-[#323640] border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title={t.shareViaAndroidBtn}
              >
                <Share2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="sm:hidden">{t.shareViaAndroidBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Other Database Operations (JSON Backup & Reset) */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Backup & Management
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              id="btn-export-to-csv"
              onClick={() => handleExportCSVToAndroid('all')}
              disabled={isExporting || allCount === 0}
              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors border border-emerald-200/80 dark:border-emerald-800/60 disabled:opacity-50"
              title="Export all financial history to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Export to CSV</span>
            </button>

            <button
              id="btn-settings-export-backup"
              onClick={handleExportBackup}
              className="py-2 px-2 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] rounded-xl text-xs font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title={t.exportBackupBtn}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">JSON Backup</span>
            </button>

            <button
              id="btn-settings-import-backup"
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-2 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] rounded-xl text-xs font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title={t.importBackupBtn}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Import JSON</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-settings-reset-sample"
              onClick={async () => {
                await onResetData();
                setStatusMsg({ text: 'Reset to default sample data', type: 'success' });
                setTimeout(() => setStatusMsg(null), 2500);
              }}
              className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="truncate">{t.resetSampleBtn}</span>
            </button>

            <button
              id="btn-settings-clear-data"
              onClick={async () => {
                if (window.confirm(t.confirmClearMsg)) {
                  await onClearData();
                  setStatusMsg({ text: 'All transactions cleared', type: 'success' });
                  setTimeout(() => setStatusMsg(null), 2500);
                }
              }}
              className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="truncate">{t.clearAllBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#005cb2] text-white font-semibold text-xs rounded-xl hover:bg-[#004a77] cursor-pointer shadow-xs"
          >
            {t.closeBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
