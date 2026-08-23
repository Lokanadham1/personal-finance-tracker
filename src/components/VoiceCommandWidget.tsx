import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Check,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { ExpenseCategory, IncomeSource, TransactionType } from '../types';
import { parseVoiceCommand, ParsedVoiceCommand } from '../utils/voiceCommandParser';
import { formatCurrency, getCategoryColor, getCategoryIcon } from './M3Components';
import { useLanguage } from '../i18n/LanguageContext';

interface VoiceCommandWidgetProps {
  onApplyParsedCommand: (cmd: ParsedVoiceCommand) => void;
  onAutoSubmitParsedCommand: (cmd: ParsedVoiceCommand) => Promise<void>;
}

export function VoiceCommandWidget({
  onApplyParsedCommand,
  onAutoSubmitParsedCommand,
}: VoiceCommandWidgetProps) {
  const { t, getCategoryName } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceCommand | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setParsedResult(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage('Web Speech API is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Works great for Indian English / general English

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (currentTranscript.trim()) {
          const parsed = parseVoiceCommand(currentTranscript);
          setParsedResult(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech was detected. Please try again.');
        } else {
          setErrorMessage(`Speech error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('Failed to start microphone. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleExampleClick = (example: string) => {
    setTranscript(example);
    const parsed = parseVoiceCommand(example);
    setParsedResult(parsed);
    setErrorMessage(null);
  };

  const handleApply = () => {
    if (parsedResult) {
      onApplyParsedCommand(parsedResult);
      // Optional: reset or keep
    }
  };

  const handleAutoSave = async () => {
    if (parsedResult && parsedResult.amount) {
      setIsAutoSaving(true);
      try {
        await onAutoSubmitParsedCommand(parsedResult);
        setTranscript('');
        setParsedResult(null);
      } finally {
        setIsAutoSaving(false);
      }
    }
  };

  const sampleCommands = [
    'Spent 500 on dinner for food',
    'Paid 1200 for electricity bill',
    'Spent 350 on uber for transport',
    'Bought shoes for 2499 in shopping',
    'Received 50000 salary today',
    'Got 15000 from freelance project',
    'Spent 150 on coffee yesterday',
  ];

  return (
    <div className="bg-white dark:bg-[#202227] border border-[#e1e2e8] dark:border-[#2d3036] rounded-2xl p-4 shadow-xs space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#005cb2]/10 text-[#005cb2] dark:text-[#a5c8ff]">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1c1e] dark:text-[#e2e2e6] flex items-center gap-1.5">
              <span>{t.voiceTitle}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                {t.aiVoiceBadge}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              {t.voiceSubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 p-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer font-medium"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.examples}</span>
        </button>
      </div>

      {/* Voice Trigger Banner */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#f0f4f9] dark:bg-[#2a2d33] p-3 rounded-xl">
        <div className="relative">
          <button
            id="btn-voice-input-mic"
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isListening
                ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 animate-pulse scale-105'
                : 'bg-[#005cb2] hover:bg-[#004a77] text-white hover:scale-105'
            }`}
            title={isListening ? 'Stop listening' : 'Start speaking voice command'}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {isListening && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-rose-500 -z-10"
            />
          )}
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isListening ? 'bg-rose-500 animate-ping' : 'bg-neutral-400'
              }`}
            />
            <p className="text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6]">
              {isListening
                ? t.listening
                : transcript
                ? t.capturedCommand
                : t.tapMicToSpeak}
            </p>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 italic truncate mt-0.5 min-h-[18px]">
            {transcript ? `"${transcript}"` : t.samplePromptNotice}
          </p>
        </div>

        {transcript && !isListening && (
          <button
            type="button"
            onClick={startListening}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold"
            title={t.retry}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.retry}</span>
          </button>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Example Prompt Chips */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 pt-1 overflow-hidden"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              {t.quickTestCommands}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleCommands.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => handleExampleClick(cmd)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#f0f4f9] hover:bg-[#d8e2ff] dark:bg-[#2a2d33] dark:hover:bg-[#004a77]/50 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                >
                  &ldquo;{cmd}&rdquo;
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed Output Card Preview */}
      {parsedResult && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f8fafc] dark:bg-[#1a1c1e] border border-[#005cb2]/30 dark:border-[#a5c8ff]/30 p-3 rounded-xl space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#005cb2] dark:text-[#a5c8ff] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{t.parsedCommand}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                parsedResult.type === 'INCOME'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}
            >
              {parsedResult.type === 'INCOME' ? t.income : t.expense}
            </span>
          </div>

          {/* Parsed Fields Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white dark:bg-[#24272e] p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-500 block">{t.amount}</span>
              <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                {parsedResult.amount ? formatCurrency(parsedResult.amount) : '0'}
              </span>
            </div>

            <div className="bg-white dark:bg-[#24272e] p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-500 block">{t.category} / {t.incomeSourceLabel}</span>
              <span className="font-bold text-neutral-900 dark:text-white truncate block">
                {getCategoryName(parsedResult.categoryOrSource)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#24272e] p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-500 block">{t.description}</span>
              <span className="font-semibold text-neutral-900 dark:text-white truncate block">
                {parsedResult.description}
              </span>
            </div>

            <div className="bg-white dark:bg-[#24272e] p-2 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-500 block">{t.date}</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {parsedResult.date}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              id="btn-apply-voice-to-form"
              type="button"
              onClick={handleApply}
              className="flex-1 py-2 px-3 bg-[#f0f4f9] hover:bg-[#e4ebf5] dark:bg-[#282b33] dark:hover:bg-[#323640] text-xs font-bold text-[#1a1c1e] dark:text-[#e2e2e6] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{t.fillIntoForm}</span>
            </button>

            {parsedResult.amount && (
              <button
                id="btn-voice-instant-save"
                type="button"
                disabled={isAutoSaving}
                onClick={handleAutoSave}
                className="flex-1 py-2 px-3 bg-[#005cb2] hover:bg-[#004a77] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isAutoSaving ? t.saving : t.instantSave}</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
