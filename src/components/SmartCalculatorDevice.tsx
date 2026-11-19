import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  Copy,
  Delete,
  History,
  Info,
  RotateCcw,
  Settings,
  Share2,
  ShieldCheck,
  Sigma,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { evaluateExpression, formatNumber } from '../engine/calculatorEngine';
import {
  AppScreen,
  CalculatorSettings,
  DeviceOrientation,
  HistoryItem,
  ThemeMode,
} from '../types/calculator';
import { playKeyClickSound, triggerHapticFeedback } from '../utils/feedback';

interface SmartCalculatorDeviceProps {
  settings: CalculatorSettings;
  onUpdateSettings: (updater: (prev: CalculatorSettings) => CalculatorSettings) => void;
  history: HistoryItem[];
  onAddHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

const APP_ICON_URL = '/src/assets/images/smart_calculator_app_icon_1795062286272.jpg';
const SPLASH_EMBLEM_URL = '/src/assets/images/smart_calculator_splash_emblem_1795062286327.jpg';

export const SmartCalculatorDevice: React.FC<SmartCalculatorDeviceProps> = ({
  settings,
  onUpdateSettings,
  history,
  onAddHistory,
  onDeleteHistory,
  onClearHistory,
}) => {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('basic');
  const [orientation, setOrientation] = useState<DeviceOrientation>('portrait');
  const [expression, setExpression] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [isInverseTrig, setIsInverseTrig] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [showInterstitialModal, setShowInterstitialModal] = useState<boolean>(false);
  const [showRewardedModal, setShowRewardedModal] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [calcCount, setCalcCount] = useState<number>(0);

  const displayScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (displayScrollRef.current) {
      displayScrollRef.current.scrollLeft = displayScrollRef.current.scrollWidth;
    }
  }, [expression]);

  const feedback = useCallback(() => {
    playKeyClickSound(settings.buttonSoundEnabled);
    triggerHapticFeedback(settings.vibrationEnabled);
  }, [settings.buttonSoundEnabled, settings.vibrationEnabled]);

  const livePreview = useMemo(() => {
    if (!expression.trim()) return '';
    const res = evaluateExpression(
      expression,
      settings.angleUnit,
      settings.decimalPrecision,
      settings.thousandsSeparatorEnabled
    );
    return res.ok ? res.formatted : '';
  }, [
    expression,
    settings.angleUnit,
    settings.decimalPrecision,
    settings.thousandsSeparatorEnabled,
  ]);

  const appendToken = useCallback(
    (token: string) => {
      feedback();
      setErrorMessage(null);
      setExpression((prev) => {
        const startsFresh = justEvaluated && /^[0-9(πe√a-zA-Z]/.test(token);
        const base = startsFresh ? '' : prev;
        return base + token;
      });
      setJustEvaluated(false);
    },
    [feedback, justEvaluated]
  );

  const appendOperator = useCallback(
    (op: string) => {
      feedback();
      setErrorMessage(null);
      setExpression((prev) => {
        if (!prev && op !== '-') return prev;
        const last = prev.slice(-1);
        if (['+', '-', '×', '÷', '^'].includes(last)) {
          return prev.slice(0, -1) + op;
        }
        return prev + op;
      });
      setJustEvaluated(false);
    },
    [feedback]
  );

  const appendDecimal = useCallback(() => {
    feedback();
    setErrorMessage(null);
    setExpression((prev) => {
      const base = justEvaluated ? '' : prev;
      const match = base.match(/[0-9.]+$/);
      const segment = match ? match[0] : '';
      if (segment.includes('.')) return base;
      return base + (segment === '' ? '0.' : '.');
    });
    setJustEvaluated(false);
  }, [feedback, justEvaluated]);

  const toggleSign = useCallback(() => {
    feedback();
    setErrorMessage(null);
    setExpression((prev) => {
      if (!prev) return '-';
      if (prev.startsWith('-(') && prev.endsWith(')')) {
        return prev.slice(2, -1);
      }
      if (/^-\d+(\.\d+)?$/.test(prev)) {
        return prev.slice(1);
      }
      if (/^\d+(\.\d+)?$/.test(prev)) {
        return `-${prev}`;
      }
      return `-(${prev})`;
    });
    setJustEvaluated(false);
  }, [feedback]);

  const appendSmartParenthesis = useCallback(() => {
    feedback();
    setErrorMessage(null);
    setExpression((prev) => {
      const base = justEvaluated ? '' : prev;
      const openCount = (base.match(/\(/g) || []).length;
      const closeCount = (base.match(/\)/g) || []).length;
      const last = base.slice(-1);
      const shouldClose =
        openCount > closeCount && last !== '' && /[0-9)πe!%]/.test(last);
      return base + (shouldClose ? ')' : '(');
    });
    setJustEvaluated(false);
  }, [feedback, justEvaluated]);

  const clearAll = useCallback(() => {
    feedback();
    setExpression('');
    setErrorMessage(null);
    setJustEvaluated(false);
  }, [feedback]);

  const deleteLast = useCallback(() => {
    feedback();
    setErrorMessage(null);
    setExpression((prev) => {
      if (!prev) return '';
      const fns = ['asin(', 'acos(', 'atan(', 'sqrt(', 'sin(', 'cos(', 'tan(', 'log(', 'ln('];
      const matched = fns.find((fn) => prev.endsWith(fn));
      if (matched) return prev.slice(0, -matched.length);
      return prev.slice(0, -1);
    });
    setJustEvaluated(false);
  }, [feedback]);

  const handleEvaluate = useCallback(
    (isSci: boolean) => {
      feedback();
      const trimmed = expression.trim();
      if (!trimmed) return;
      const res = evaluateExpression(
        trimmed,
        settings.angleUnit,
        settings.decimalPrecision,
        settings.thousandsSeparatorEnabled
      );
      if (res.ok) {
        const plainResult = formatNumber(res.value, settings.decimalPrecision, false);
        setExpression(plainResult);
        setErrorMessage(null);
        setJustEvaluated(true);
        const nextCount = calcCount + 1;
        setCalcCount(nextCount);
        if (settings.adsEnabled && nextCount % 12 === 0) {
          setShowInterstitialModal(true);
        }
        onAddHistory({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          expression: trimmed,
          result: res.formatted,
          timestamp: Date.now(),
          isScientific: isSci,
        });
      } else {
        setErrorMessage(res.message);
      }
    },
    [
      calcCount,
      expression,
      feedback,
      onAddHistory,
      settings.adsEnabled,
      settings.angleUnit,
      settings.decimalPrecision,
      settings.thousandsSeparatorEnabled,
    ]
  );

  // Memory operations
  const handleMemoryClear = () => {
    feedback();
    onUpdateSettings((prev) => ({ ...prev, memoryValue: 0, hasMemoryValue: false }));
  };

  const handleMemoryRecall = () => {
    if (!settings.hasMemoryValue) return;
    const formatted = formatNumber(settings.memoryValue, settings.decimalPrecision, false);
    appendToken(formatted);
  };

  const handleMemoryDelta = (subtract: boolean) => {
    feedback();
    const res = evaluateExpression(
      expression.trim() || '0',
      settings.angleUnit,
      settings.decimalPrecision,
      false
    );
    if (res.ok) {
      const delta = subtract ? -res.value : res.value;
      onUpdateSettings((prev) => ({
        ...prev,
        memoryValue: prev.memoryValue + delta,
        hasMemoryValue: true,
      }));
    }
  };

  // Physical keyboard support when on Basic or Scientific screens
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeScreen !== 'basic' && activeScreen !== 'scientific') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        appendToken(e.key);
      } else if (e.key === '+') {
        e.preventDefault();
        appendOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        appendOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        appendOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        appendOperator('÷');
      } else if (e.key === '^') {
        e.preventDefault();
        appendOperator('^');
      } else if (e.key === '%') {
        e.preventDefault();
        appendToken('%');
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        appendToken(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        appendDecimal();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEvaluate(activeScreen === 'scientific');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteLast();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearAll();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeScreen,
    appendDecimal,
    appendOperator,
    appendToken,
    clearAll,
    deleteLast,
    handleEvaluate,
  ]);

  const handleCopyHistory = async (item: HistoryItem) => {
    const text = `${item.expression} = ${item.result}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setShareToast('Clipboard permission unavailable');
      setTimeout(() => setShareToast(null), 2000);
    }
  };

  const handleShareHistory = async (item: HistoryItem) => {
    const text = `${item.expression} = ${item.result}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Smart Calculator Result', text });
        return;
      } catch {
        // User cancelled or share unsupported; fallback to clipboard
      }
    }
    await handleCopyHistory(item);
    setShareToast('Copied calculation for sharing');
    setTimeout(() => setShareToast(null), 2000);
  };

  const keyStyle = (variant: 'num' | 'fn' | 'op' | 'clear' | 'eq') => {
    switch (variant) {
      case 'num':
        return 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60';
      case 'fn':
        return 'bg-slate-200/80 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/70 border border-slate-300/60 dark:border-slate-700/40';
      case 'op':
        return 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 border border-indigo-200/80 dark:border-indigo-500/30';
      case 'clear':
        return 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-200/80 dark:border-rose-500/30';
      case 'eq':
        return 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20';
    }
  };

  const displayBox = (
    <div className="rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 px-4 py-3.5 flex flex-col justify-between min-h-[116px]">
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
        <span>
          {activeScreen === 'scientific' ? settings.angleUnit : 'BASIC'}
          {settings.hasMemoryValue ? ` · M=${formatNumber(settings.memoryValue, 4, true)}` : ''}
        </span>
        <span className="tabular-nums">
          {settings.decimalPrecision} dp · {settings.thousandsSeparatorEnabled ? '1,000' : '1000'}
        </span>
      </div>
      <div
        ref={displayScrollRef}
        className="overflow-x-auto whitespace-nowrap text-right font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white py-1 thin-scrollbar"
        aria-label="Expression display"
      >
        {expression || '0'}
      </div>
      <div className="text-right font-mono tabular-nums text-base min-h-[24px] truncate">
        {errorMessage ? (
          <span className="text-rose-600 dark:text-rose-400 font-medium">{errorMessage}</span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">{livePreview}</span>
        )}
      </div>
    </div>
  );

  const memoryRow = (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: 'MC', enabled: settings.hasMemoryValue, action: handleMemoryClear },
        { label: 'MR', enabled: settings.hasMemoryValue, action: handleMemoryRecall },
        { label: 'M+', enabled: true, action: () => handleMemoryDelta(false) },
        { label: 'M-', enabled: true, action: () => handleMemoryDelta(true) },
      ].map((m) => (
        <button
          key={m.label}
          type="button"
          disabled={!m.enabled}
          onClick={m.action}
          className={`h-9 rounded-xl font-mono text-xs font-semibold transition-transform active:scale-95 ${
            m.enabled
              ? 'bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const adBanner = settings.adsEnabled ? (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-900/60 px-3 py-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
          AdMob Test Banner · ca-app-pub-3940256099942544/6300978111
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShowRewardedModal(true)}
        className="text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
      >
        Remove Ads
      </button>
    </div>
  ) : null;

  const basicButtons: Array<{
    label: string;
    variant: 'num' | 'fn' | 'op' | 'clear' | 'eq';
    action: () => void;
    span?: number;
  }> = [
    { label: 'AC', variant: 'clear', action: clearAll },
    { label: '( )', variant: 'fn', action: appendSmartParenthesis },
    { label: '%', variant: 'fn', action: () => appendToken('%') },
    { label: '÷', variant: 'op', action: () => appendOperator('÷') },
    { label: '7', variant: 'num', action: () => appendToken('7') },
    { label: '8', variant: 'num', action: () => appendToken('8') },
    { label: '9', variant: 'num', action: () => appendToken('9') },
    { label: '×', variant: 'op', action: () => appendOperator('×') },
    { label: '4', variant: 'num', action: () => appendToken('4') },
    { label: '5', variant: 'num', action: () => appendToken('5') },
    { label: '6', variant: 'num', action: () => appendToken('6') },
    { label: '−', variant: 'op', action: () => appendOperator('-') },
    { label: '1', variant: 'num', action: () => appendToken('1') },
    { label: '2', variant: 'num', action: () => appendToken('2') },
    { label: '3', variant: 'num', action: () => appendToken('3') },
    { label: '+', variant: 'op', action: () => appendOperator('+') },
    { label: '+/-', variant: 'fn', action: toggleSign },
    { label: '0', variant: 'num', action: () => appendToken('0') },
    { label: '.', variant: 'num', action: appendDecimal },
    { label: 'DEL', variant: 'clear', action: deleteLast },
  ];

  const sciButtons: Array<{
    label: string;
    variant: 'num' | 'fn' | 'op' | 'clear' | 'eq';
    action: () => void;
  }> = [
    {
      label: settings.angleUnit,
      variant: 'op',
      action: () => {
        feedback();
        onUpdateSettings((p) => ({
          ...p,
          angleUnit: p.angleUnit === 'DEG' ? 'RAD' : 'DEG',
        }));
      },
    },
    {
      label: isInverseTrig ? '1st' : '2nd',
      variant: 'op',
      action: () => {
        feedback();
        setIsInverseTrig((v) => !v);
      },
    },
    {
      label: isInverseTrig ? 'sin⁻¹' : 'sin',
      variant: 'fn',
      action: () => appendToken(isInverseTrig ? 'asin(' : 'sin('),
    },
    {
      label: isInverseTrig ? 'cos⁻¹' : 'cos',
      variant: 'fn',
      action: () => appendToken(isInverseTrig ? 'acos(' : 'cos('),
    },
    {
      label: isInverseTrig ? 'tan⁻¹' : 'tan',
      variant: 'fn',
      action: () => appendToken(isInverseTrig ? 'atan(' : 'tan('),
    },
    { label: '√', variant: 'fn', action: () => appendToken('sqrt(') },
    { label: 'x²', variant: 'fn', action: () => appendToken('^2') },
    { label: 'x³', variant: 'fn', action: () => appendToken('^3') },
    { label: 'xʸ', variant: 'fn', action: () => appendOperator('^') },
    { label: 'n!', variant: 'fn', action: () => appendToken('!') },
    { label: 'log', variant: 'fn', action: () => appendToken('log(') },
    { label: 'ln', variant: 'fn', action: () => appendToken('ln(') },
    { label: 'π', variant: 'fn', action: () => appendToken('π') },
    { label: 'e', variant: 'fn', action: () => appendToken('e') },
    { label: '10ˣ', variant: 'fn', action: () => appendToken('10^') },
    { label: 'AC', variant: 'clear', action: clearAll },
    { label: '( )', variant: 'fn', action: appendSmartParenthesis },
    { label: '%', variant: 'fn', action: () => appendToken('%') },
    { label: 'DEL', variant: 'clear', action: deleteLast },
    { label: '÷', variant: 'op', action: () => appendOperator('÷') },
    { label: '7', variant: 'num', action: () => appendToken('7') },
    { label: '8', variant: 'num', action: () => appendToken('8') },
    { label: '9', variant: 'num', action: () => appendToken('9') },
    { label: '+/-', variant: 'fn', action: toggleSign },
    { label: '×', variant: 'op', action: () => appendOperator('×') },
    { label: '4', variant: 'num', action: () => appendToken('4') },
    { label: '5', variant: 'num', action: () => appendToken('5') },
    { label: '6', variant: 'num', action: () => appendToken('6') },
    { label: '(', variant: 'fn', action: () => appendToken('(') },
    { label: '−', variant: 'op', action: () => appendOperator('-') },
    { label: '1', variant: 'num', action: () => appendToken('1') },
    { label: '2', variant: 'num', action: () => appendToken('2') },
    { label: '3', variant: 'num', action: () => appendToken('3') },
    { label: ')', variant: 'fn', action: () => appendToken(')') },
    { label: '+', variant: 'op', action: () => appendOperator('+') },
    { label: '0', variant: 'num', action: () => appendToken('0') },
    { label: '.', variant: 'num', action: appendDecimal },
    { label: 'EE', variant: 'fn', action: () => appendToken('E') },
    { label: 'MR', variant: 'fn', action: handleMemoryRecall },
    { label: '=', variant: 'eq', action: () => handleEvaluate(true) },
  ];

  const navTabs: Array<{ id: AppScreen; label: string; icon: React.ReactNode }> = [
    { id: 'basic', label: 'Basic', icon: <Calculator className="w-4 h-4" /> },
    { id: 'scientific', label: 'Scientific', icon: <Sigma className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Device Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Interactive Android Preview</span>
          <span aria-hidden="true">·</span>
          <span>Offline Engine Active</span>
          <span aria-hidden="true">·</span>
          <span>Keyboard Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setOrientation('portrait')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                orientation === 'portrait'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Portrait
            </button>
            <button
              type="button"
              onClick={() => setOrientation('landscape')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                orientation === 'landscape'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Landscape
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSplash(true);
              setTimeout(() => setShowSplash(false), 900);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replay Splash
          </button>
        </div>
      </div>

      {/* Android Device Shell */}
      <div
        className={`relative mx-auto rounded-[28px] border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-[#0B1120] shadow-xl overflow-hidden transition-all duration-200 ${
          orientation === 'landscape' ? 'w-full max-w-[780px]' : 'w-full max-w-[430px]'
        }`}
      >
        {/* Android Status Strip */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <img
              src={APP_ICON_URL}
              alt="Smart Calculator app icon"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-md object-cover"
            />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Smart Calculator
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <Smartphone className="w-3.5 h-3.5" />
            <span>{orientation === 'portrait' ? '9:19' : '19:9'}</span>
          </div>
        </div>

        {/* Splash Screen Overlay */}
        {showSplash && (
          <div className="absolute inset-0 z-30 bg-[#090D16] flex flex-col items-center justify-center gap-4 text-white p-6">
            <img
              src={SPLASH_EMBLEM_URL}
              alt="Smart Calculator splash emblem"
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border border-slate-800 shadow-lg"
            />
            <div className="text-center">
              <p className="font-display text-xl font-bold tracking-tight">Smart Calculator</p>
              <p className="text-xs text-slate-400 mt-1">Precision Scientific &amp; Offline Engine</p>
            </div>
          </div>
        )}

        {/* Active Screen Content */}
        <div
          className={`p-4 ${
            orientation === 'landscape' ? 'min-h-[400px]' : 'min-h-[560px]'
          } flex flex-col justify-between gap-3`}
        >
          {activeScreen === 'basic' && (
            orientation === 'landscape' ? (
              <div className="grid grid-cols-12 gap-4 flex-1 items-stretch">
                <div className="col-span-5 flex flex-col justify-between gap-3">
                  {adBanner}
                  {displayBox}
                  {memoryRow}
                </div>
                <div className="col-span-7 flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {basicButtons.map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={btn.action}
                        className={`min-h-[44px] rounded-xl text-base font-semibold transition-transform active:scale-95 ${keyStyle(
                          btn.variant
                        )}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEvaluate(false)}
                    className={`h-11 rounded-xl text-lg transition-transform active:scale-[0.98] ${keyStyle(
                      'eq'
                    )}`}
                  >
                    =
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 flex-1">
                {adBanner}
                {displayBox}
                {memoryRow}
                <div className="grid grid-cols-4 gap-2 flex-1">
                  {basicButtons.map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={btn.action}
                      className={`min-h-[50px] rounded-2xl text-lg font-semibold transition-transform active:scale-95 ${keyStyle(
                        btn.variant
                      )}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleEvaluate(false)}
                  className={`h-12 rounded-2xl text-xl transition-transform active:scale-[0.98] ${keyStyle(
                    'eq'
                  )}`}
                >
                  =
                </button>
              </div>
            )
          )}

          {activeScreen === 'scientific' && (
            orientation === 'landscape' ? (
              <div className="grid grid-cols-12 gap-3 flex-1 items-stretch">
                <div className="col-span-4 flex flex-col justify-between gap-2">
                  {displayBox}
                  {memoryRow}
                </div>
                <div className="col-span-8 grid grid-cols-5 gap-1.5">
                  {sciButtons.map((btn, idx) => (
                    <button
                      key={`${btn.label}-${idx}`}
                      type="button"
                      onClick={btn.action}
                      className={`min-h-[42px] rounded-xl text-xs font-semibold transition-transform active:scale-95 ${keyStyle(
                        btn.variant
                      )}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 flex-1">
                {displayBox}
                <div className="grid grid-cols-5 gap-1.5 flex-1">
                  {sciButtons.map((btn, idx) => (
                    <button
                      key={`${btn.label}-${idx}`}
                      type="button"
                      onClick={btn.action}
                      className={`min-h-[44px] rounded-xl text-xs font-semibold transition-transform active:scale-95 ${keyStyle(
                        btn.variant
                      )}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {activeScreen === 'history' && (
            <div className="flex flex-col gap-3 flex-1 max-h-[540px]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Calculation History
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {history.length} saved locally · Tap entry to reuse
                  </p>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              {shareToast && (
                <div className="rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs px-3 py-2">
                  {shareToast}
                </div>
              )}

              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <History className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No calculations yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Press = on Basic or Scientific mode to save timestamped results here.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 thin-scrollbar">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 transition-colors hover:border-amber-500/40"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setExpression(item.result.replace(/,/g, ''));
                          setErrorMessage(null);
                          setActiveScreen(item.isScientific ? 'scientific' : 'basic');
                        }}
                        className="w-full text-left"
                      >
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {new Date(item.timestamp).toLocaleString()} ·{' '}
                          {item.isScientific ? 'Scientific' : 'Basic'}
                        </div>
                        <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1 break-all">
                          {item.expression}
                        </div>
                        <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 dark:text-white mt-0.5">
                          = {item.result}
                        </div>
                      </button>
                      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleCopyHistory(item)}
                          aria-label="Copy calculation"
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareHistory(item)}
                          aria-label="Share calculation"
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteHistory(item.id)}
                          aria-label="Delete history item"
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          <Delete className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeScreen === 'settings' && (
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[540px] pr-1 thin-scrollbar">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Settings</h3>

              {/* Theme */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Theme</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ['system', 'System'],
                      ['dark', 'Dark'],
                      ['light', 'Light'],
                    ] as Array<[ThemeMode, string]>
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        onUpdateSettings((prev) => ({ ...prev, themeMode: mode }))
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
                        settings.themeMode === mode
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback & Formatting */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                {[
                  {
                    label: 'Button Sound',
                    desc: 'Play tactile audio click on key press',
                    checked: settings.buttonSoundEnabled,
                    toggle: () =>
                      onUpdateSettings((p) => ({
                        ...p,
                        buttonSoundEnabled: !p.buttonSoundEnabled,
                      })),
                  },
                  {
                    label: 'Vibration Feedback',
                    desc: 'Haptic pulse on mobile devices',
                    checked: settings.vibrationEnabled,
                    toggle: () =>
                      onUpdateSettings((p) => ({
                        ...p,
                        vibrationEnabled: !p.vibrationEnabled,
                      })),
                  },
                  {
                    label: 'Thousands Separator',
                    desc: 'Format numbers like 1,234,567.89',
                    checked: settings.thousandsSeparatorEnabled,
                    toggle: () =>
                      onUpdateSettings((p) => ({
                        ...p,
                        thousandsSeparatorEnabled: !p.thousandsSeparatorEnabled,
                      })),
                  },
                  {
                    label: 'AdMob Test Ads',
                    desc: 'Non-blocking banner & interstitial test mode',
                    checked: settings.adsEnabled,
                    toggle: () =>
                      onUpdateSettings((p) => ({ ...p, adsEnabled: !p.adsEnabled })),
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.checked}
                      onClick={item.toggle}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${
                        item.checked
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          item.checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Decimal Precision
                    </span>
                    <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                      {settings.decimalPrecision} digits
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={settings.decimalPrecision}
                    onChange={(e) =>
                      onUpdateSettings((p) => ({
                        ...p,
                        decimalPrecision: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowConsentModal(true)}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Manage Ad Consent (UMP)
                </button>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                >
                  Clear Calculation History ({history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('about')}
                  className="w-full text-left py-2 px-3 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  About Application
                </button>
              </div>
            </div>
          )}

          {activeScreen === 'about' && (
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[540px] pr-1 thin-scrollbar">
              <div className="flex flex-col items-center text-center py-3">
                <img
                  src={APP_ICON_URL}
                  alt="Smart Calculator icon"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover shadow-md border border-slate-200 dark:border-slate-700"
                />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-3">
                  Smart Calculator
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  v1.0.0 · com.smarttools.smartcalculator
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  100% Offline Core Engine
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Basic and scientific arithmetic, BODMAS parsing, memory registers, and local
                  history run entirely on-device with zero network dependency.
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Security &amp; Permissions
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Only INTERNET, ACCESS_NETWORK_STATE (for optional AdMob), and VIBRATE are
                  requested. Local preferences use Android DataStore and private app sandbox files.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Android Navigation Bar */}
        <nav
          aria-label="Calculator app navigation"
          className="grid grid-cols-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 px-1 py-1.5"
        >
          {navTabs.map((tab) => {
            const active = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveScreen(tab.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span className="truncate max-w-full px-1">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Modals inside Device Shell */}
        {showPrivacyModal && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Privacy Policy</h4>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Smart Calculator processes all calculations and history locally on your device. No
                personal files or calculation logs are transmitted to external servers. Optional
                AdMob ads use official Google UMP user consent controls.
              </p>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showConsentModal && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Google UMP Ad Consent
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Choose how optional AdMob test ads operate. Declining ad consent never restricts
                calculator or scientific functionality.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings((p) => ({ ...p, consentGranted: false, adsEnabled: false }));
                    setShowConsentModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Disable Ads
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings((p) => ({ ...p, consentGranted: true, adsEnabled: true }));
                    setShowConsentModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold"
                >
                  Allow Test Ads
                </button>
              </div>
            </div>
          </div>
        )}

        {showInterstitialModal && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 text-white flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                AdMob Test Interstitial · 90s Cooldown
              </span>
              <button
                type="button"
                onClick={() => setShowInterstitialModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium"
              >
                Close Ad
              </button>
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-bold">Google AdMob Test Interstitial</p>
              <p className="text-xs font-mono text-amber-400">
                ca-app-pub-3940256099942544/1033173712
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Triggered non-blockingly only after completing 12 calculations with cooldown
                protection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInterstitialModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold"
            >
              Return to Calculator
            </button>
          </div>
        )}

        {showRewardedModal && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 text-white flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Optional Rewarded Ad
              </span>
              <button
                type="button"
                onClick={() => setShowRewardedModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-bold">Ad-Free Session Reward</p>
              <p className="text-xs font-mono text-amber-400">
                ca-app-pub-3940256099942544/5224354917
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Confirming this optional test rewarded ad disables banner &amp; interstitial ads for
                your session.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings((p) => ({ ...p, adsEnabled: false }));
                setShowRewardedModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-semibold"
            >
              Claim Ad-Free Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
