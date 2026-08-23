import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone,
  X,
  Download,
  Share2,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Layers,
  Code2,
  CheckCircle2,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKotlinModal?: () => void;
}

// Lightweight QR code SVG matrix generator for any URL
function SimpleQrCode({ url }: { url: string }) {
  // Use a reliable QR image generator API fallback + styled canvas for crisp display
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    url
  )}&bgcolor=ffffff&color=003566&margin=4`;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xs border border-neutral-200">
      <img
        src={qrApiUrl}
        alt="QR Code to open on Android Phone"
        className="w-40 h-40 object-contain rounded-lg"
        loading="lazy"
      />
      <span className="text-[11px] text-neutral-500 font-medium mt-2">
        Point phone camera or Google Lens
      </span>
    </div>
  );
}

export function AndroidInstallModal({
  isOpen,
  onClose,
  onOpenKotlinModal,
}: AndroidInstallModalProps) {
  const { t, language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'qr'>('pwa');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.href);

      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Check if already in standalone PWA mode
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone
      ) {
        setIsInstalled(true);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl || window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    const shareUrl = appUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Money Mitra - Free Android Personal Finance App',
          text: 'Check out Money Mitra - 100% Free Offline Personal Finance Tracker for Android with Room SQLite persistence!',
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Open WhatsApp share
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `Money Mitra for Android (100% Free & Offline Personal Finance App): ${shareUrl}`
      )}`;
      window.open(waUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-[#fdfcff] dark:bg-[#1a1c1e] text-[#1a1c1e] dark:text-[#e2e2e6] w-full max-w-md max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#e1e2e8] dark:border-[#2d3036]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e1e2e8] dark:border-[#2d3036] bg-linear-to-r from-[#005cb2]/10 via-[#38bdf8]/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#005cb2] to-[#003566] text-white flex items-center justify-center shadow-md shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-[#1a1c1e] dark:text-[#e2e2e6]">
                  {t.installAndroidTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  {t.androidFreeBadge}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t.installAndroidSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e1e2e8] dark:border-[#2d3036] bg-[#f0f4f9] dark:bg-[#24272e] p-1 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1-Tap App Install</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR on Phone</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-[#1a1c1e] text-[#005cb2] dark:text-[#a5c8ff] shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Native APK & Code</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* If browser supports direct prompt */}
              {deferredPrompt && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                    {t.instant1TapInstall}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {t.instantInstallPromptNotice}
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Android App Now (Free)</span>
                  </button>
                </div>
              )}

              {/* Status if installed */}
              {isInstalled && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-3 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    App is running in Standalone Android App mode! All transactions are saved locally.
                  </span>
                </div>
              )}

              {/* Step-by-step Guide for Android Mobile */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                  3 Easy Steps to Install on Any Android Mobile (Zero Cost):
                </span>

                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-[#f0f4f9] dark:bg-[#282b33] rounded-2xl border border-neutral-200/70 dark:border-neutral-700/60">
                  <div className="w-7 h-7 rounded-full bg-[#005cb2] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div className="text-xs">
                    <h5 className="font-bold text-neutral-900 dark:text-white">
                      {t.androidInstallStep1}
                    </h5>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {t.androidInstallStep1Desc}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-[#f0f4f9] dark:bg-[#282b33] rounded-2xl border border-neutral-200/70 dark:border-neutral-700/60">
                  <div className="w-7 h-7 rounded-full bg-[#005cb2] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div className="text-xs">
                    <h5 className="font-bold text-neutral-900 dark:text-white">
                      {t.androidInstallStep2}
                    </h5>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {t.androidInstallStep2Desc}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div className="text-xs">
                    <h5 className="font-bold text-emerald-900 dark:text-emerald-200">
                      {t.androidInstallStep3}
                    </h5>
                    <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {t.androidInstallStep3Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlights Feature Cards */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-1">
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% Offline & Private</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#005cb2] dark:text-[#a5c8ff] shrink-0" />
                  <span>No Ads or Subscriptions</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block">
                {t.scanQrCodeTitle}
              </span>

              <SimpleQrCode url={appUrl || (typeof window !== 'undefined' ? window.location.href : '')} />

              <p className="text-xs text-neutral-500">
                Scan with your Android camera to instantly open and install the app on your smartphone.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 px-3 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] rounded-xl text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-neutral-200 dark:border-neutral-700"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? t.linkCopied : t.copyAppLink}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 px-3 bg-[#005cb2] hover:bg-[#004a77] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{t.shareViaApp}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#f0f4f9] dark:bg-[#282b33] rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <div className="flex items-center gap-2 text-[#005cb2] dark:text-[#a5c8ff] font-bold">
                  <Code2 className="w-4 h-4" />
                  <span>Native Jetpack Compose & Kotlin Source</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                  The complete production-ready native Android Studio project files (Room Database Entity, DAO, ViewModel, and Material 3 UI) are included in this app for free.
                </p>
                {onOpenKotlinModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenKotlinModal();
                    }}
                    className="py-1.5 px-3 bg-[#005cb2] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-[#004a77] transition-colors"
                  >
                    <span>View Kotlin Source Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
                <h5 className="font-bold flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Build Standalone APK with Free Tools:</span>
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>
                    <strong>PWABuilder (Free):</strong> Paste this app's URL on{' '}
                    <span className="font-mono underline">PWABuilder.com</span> to automatically package an APK or Google Play AAB.
                  </li>
                  <li>
                    <strong>Android Studio (Free):</strong> Import the Kotlin Jetpack Compose files and click "Build APK".
                  </li>
                  <li>
                    <strong>Capacitor / Bubblewrap:</strong> Wrap as a native Android APK in 2 commands.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Bottom Free Forever Notice */}
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-center text-[10px] text-neutral-500 font-medium">
            {t.freeForeverNotice}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#e1e2e8] dark:border-[#2d3036] bg-[#fdfcff] dark:bg-[#1a1c1e] flex items-center justify-between gap-2">
          <button
            onClick={handleShare}
            className="py-2 px-3.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#005cb2] hover:bg-[#004a77] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            {t.closeBtn}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
