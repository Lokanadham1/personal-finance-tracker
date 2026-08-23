import React, { useRef, useState } from 'react';
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
} from 'lucide-react';
import { M3Card } from './M3Components';
import { roomDatabase } from '../db/roomDatabase';
import { useLanguage } from '../i18n/LanguageContext';

export function AndroidSettingsModal({
  isOpen,
  onClose,
  onResetData,
  onClearData,
  transactionCount,
  onOpenAndroidInstallModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => Promise<void>;
  onClearData: () => Promise<void>;
  transactionCount: number;
  onOpenAndroidInstallModal?: () => void;
}) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCSV = async () => {
    try {
      const data = await roomDatabase.getAllTransactions();
      if (!data || data.length === 0) {
        setStatusMsg('No transactions to export');
        setTimeout(() => setStatusMsg(null), 3000);
        return;
      }

      // Sort by date descending
      const sortedData = [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const headers = ['Transaction ID', 'Type', 'Category / Source', 'Description', 'Amount (INR)', 'Date'];
      const rows = sortedData.map((t) => [
        `"${t.id}"`,
        t.type,
        `"${t.category.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.date,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `finance-transactions-all-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg(`Exported ${data.length} transactions to CSV`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg('Failed to export CSV file');
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
      setStatusMsg('Backup downloaded successfully');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch {
      setStatusMsg('Failed to export backup');
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
          setStatusMsg(`Successfully imported ${parsed.length} transactions`);
          setTimeout(() => setStatusMsg(null), 3000);
        }
      } catch {
        setStatusMsg('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4 text-[#1a1c1e] dark:text-[#e2e2e6]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#d8e2ff] dark:bg-[#004a77] text-[#001d36] dark:text-[#c2e7ff] rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{t.settingsTitle}</h3>
              <p className="text-xs text-neutral-500">{t.settingsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status */}
        <div className="bg-[#f8fafc] dark:bg-[#1a1c1e] p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
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
            <span className="font-bold">{transactionCount} {t.transactions}</span>
          </div>
        </div>

        {statusMsg && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Install on Android Mobile (100% Free) */}
          {onOpenAndroidInstallModal && (
            <button
              id="btn-settings-install-android"
              onClick={() => {
                onClose();
                onOpenAndroidInstallModal();
              }}
              className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-[#005cb2] dark:text-[#a5c8ff] border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              <Smartphone className="w-4 h-4 text-[#005cb2] dark:text-[#a5c8ff]" />
              <span>{t.installAndroidTitle}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                Free
              </span>
            </button>
          )}

          {/* Export to CSV Button */}
          <button
            id="btn-settings-export-csv"
            onClick={handleExportCSV}
            className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.exportCsvBtn}</span>
          </button>

          <button
            id="btn-settings-export-backup"
            onClick={handleExportBackup}
            className="w-full py-2.5 px-3 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] rounded-xl text-xs font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.exportBackupBtn}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />
          <button
            id="btn-settings-import-backup"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-3 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] rounded-xl text-xs font-semibold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>{t.importBackupBtn}</span>
          </button>

          <button
            id="btn-settings-reset-sample"
            onClick={async () => {
              await onResetData();
              setStatusMsg('Reset to default sample data');
              setTimeout(() => setStatusMsg(null), 2500);
            }}
            className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetSampleBtn}</span>
          </button>

          <button
            id="btn-settings-clear-data"
            onClick={async () => {
              if (window.confirm(t.confirmClearMsg)) {
                await onClearData();
                setStatusMsg('All transactions cleared');
                setTimeout(() => setStatusMsg(null), 2500);
              }
            }}
            className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t.clearAllBtn}</span>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#005cb2] text-white font-semibold text-xs rounded-xl hover:bg-[#004a77] cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
