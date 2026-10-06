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
  Keyboard,
  CheckCircle2,
} from 'lucide-react';
import { ExpenseCategory, IncomeSource, TransactionType } from '../types';
import { parseVoiceCommand, ParsedVoiceCommand } from '../utils/voiceCommandParser';
import { formatCurrency, getCategoryColor, getCategoryIcon } from './M3Components';
import { useLanguage } from '../i18n/LanguageContext';

interface VoiceCommandWidgetProps {
  onApplyParsedCommand: (cmd: ParsedVoiceCommand) => void;
  onAutoSubmitParsedCommand: (cmd: ParsedVoiceCommand) => Promise<void>;
  autoStart?: boolean;
}

export function VoiceCommandWidget({
  onApplyParsedCommand,
  onAutoSubmitParsedCommand,
  autoStart = false,
}: VoiceCommandWidgetProps) {
  const { t, language, getCategoryName } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceCommand | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showManualDictation, setShowManualDictation] = useState(false);
  const [dictationInput, setDictationInput] = useState('');

  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    if (autoStart) {
      startListening();
    }

    return () => {
      stopListening();
    };
  }, []);

  const cleanupAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      audioStreamRef.current = null;
    }
  };

  const startListening = async () => {
    setErrorMessage(null);
    setTranscript('');
    setParsedResult(null);

    // 1. Explicitly request microphone stream to trigger Android native permission dialog in APK / WebView
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
      }
    } catch (permErr: any) {
      console.warn('Microphone permission request result:', permErr);
      if (
        permErr.name === 'NotAllowedError' ||
        permErr.name === 'PermissionDeniedError' ||
        permErr.message?.includes('denied')
      ) {
        setErrorMessage(
          language === 'te'
            ? 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి ఫోన్ సెట్టింగ్స్ > Apps > Money Mitra లో మైక్రోఫోన్ అనుమతించండి.'
            : 'Microphone permission denied. Please allow microphone in Android Settings > Apps > Money Mitra > Permissions.'
        );
        setIsListening(false);
        return;
      }
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setShowManualDictation(true);
      setErrorMessage(
        language === 'te'
          ? 'ఈ పరికరంలో Web Speech API అందుబాటులో లేదు. క్రింది బాక్స్‌లో మీ కీబోర్డ్ మైక్ ద్వారా మాట్లాడండి.'
          : 'Web Speech API is unavailable in this WebView. You can use your keyboard microphone or speech typing below.'
      );
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // Support bilingual recognition based on active language
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

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
          setErrorMessage(
            language === 'te'
              ? 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి అనుమతించండి.'
              : 'Microphone access denied. Please grant microphone permission.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            language === 'te'
              ? 'ఏమీ వినపడలేదు. దయచేసి మళ్లీ మైక్ నొక్కి మాట్లాడండి.'
              : 'No speech was detected. Please tap mic and try again.'
          );
        } else if (event.error === 'service-not-allowed' || event.error === 'network') {
          setShowManualDictation(true);
          setErrorMessage(
            language === 'te'
              ? 'వాయిస్ సర్వీస్ కనెక్ట్ కాలేదు. క్రింది బాక్స్‌లో మీ కీబోర్డ్ మైక్ ఉపయోగించండి.'
              : 'Voice recognition service unavailable. Use keyboard voice typing or the dictation box below.'
          );
        } else {
          setErrorMessage(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
        cleanupAudioStream();
      };

      recognition.onend = () => {
        setIsListening(false);
        cleanupAudioStream();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setShowManualDictation(true);
      setErrorMessage(
        language === 'te'
          ? 'మైక్రోఫోన్ ప్రారంభించడంలో సమస్య ఉంది. క్రింది వాయిస్ టైపింగ్ బాక్స్ ఉపయోగించండి.'
          : 'Could not initialize speech recognition. Use the voice dictation box below.'
      );
      setIsListening(false);
      cleanupAudioStream();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    cleanupAudioStream();
    setIsListening(false);
  };

  const handleExampleClick = (example: string) => {
    setTranscript(example);
    const parsed = parseVoiceCommand(example);
    setParsedResult(parsed);
    setErrorMessage(null);
  };

  const handleManualDictationChange = (text: string) => {
    setDictationInput(text);
    setTranscript(text);
    if (text.trim().length > 2) {
      const parsed = parseVoiceCommand(text);
      setParsedResult(parsed);
    } else {
      setParsedResult(null);
    }
  };

  const handleApply = () => {
    if (parsedResult) {
      onApplyParsedCommand(parsedResult);
    }
  };

  const handleAutoSave = async () => {
    if (parsedResult && parsedResult.amount) {
      setIsAutoSaving(true);
      try {
        await onAutoSubmitParsedCommand(parsedResult);
        setTranscript('');
        setDictationInput('');
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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowManualDictation(!showManualDictation)}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer font-medium"
            title="Keyboard Voice / Dictation Input"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.examples}</span>
          </button>
        </div>
      </div>

      {/* Voice Trigger Banner */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#f0f4f9] dark:bg-[#2a2d33] p-3 rounded-xl">
        <div className="relative">
          <button
            id="btn-voice-input-mic"
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isListening
                ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 animate-pulse scale-105'
                : 'bg-[#005cb2] hover:bg-[#004a77] text-white hover:scale-105 active:scale-95'
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
          
          {/* Animated Waveform when listening */}
          {isListening ? (
            <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
              {[0.4, 0.9, 0.5, 0.8, 1.0, 0.6, 0.9, 0.4].map((scale, idx) => (
                <motion.div
                  key={idx}
                  animate={{ height: [4, scale * 16, 4] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: idx * 0.1,
                    ease: 'easeInOut',
                  }}
                  className="w-1 bg-rose-500 rounded-full"
                />
              ))}
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold ml-2">
                {language === 'te' ? 'మాట్లాడుతున్న మాటలను వింటున్నాము...' : 'Listening to microphone...'}
              </span>
            </div>
          ) : (
            <p className="text-xs text-neutral-600 dark:text-neutral-300 italic truncate mt-0.5 min-h-[18px]">
              {transcript ? `"${transcript}"` : t.samplePromptNotice}
            </p>
          )}
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
        <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {language === 'te'
                ? 'చిట్కా: మీరు కీబోర్డ్ మైక్ బటన్ ద్వారా కూడా మాట్లాడి నింపవచ్చు.'
                : 'Tip: You can also tap the keyboard icon above and speak via Gboard / phone voice typing.'}
            </p>
          </div>
        </div>
      )}

      {/* Manual Voice Dictation Input for WebViews / Gboard */}
      <AnimatePresence>
        {showManualDictation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 pt-1 overflow-hidden"
          >
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
              <label className="text-[11px] font-bold text-[#005cb2] dark:text-[#a5c8ff] flex items-center justify-between">
                <span>{language === 'te' ? 'కీబోర్డ్ వాయిస్ టైపింగ్ / డిక్టేషన్:' : 'Keyboard Voice Dictation / Speech Input:'}</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  {language === 'te' ? 'కీబోర్డ్ మైక్ బటన్ నొక్కండి' : 'Tap keyboard 🎙️ button to speak'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dictationInput}
                  onChange={(e) => handleManualDictationChange(e.target.value)}
                  placeholder={language === 'te' ? 'ఉదా: "Spent 450 on petrol for transport"' : 'e.g. "Spent 500 for dinner on food"'}
                  className="w-full bg-white dark:bg-[#1a1c1e] text-xs text-[#1a1c1e] dark:text-[#e2e2e6] px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 focus:outline-none focus:ring-2 focus:ring-[#005cb2]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
