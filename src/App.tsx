import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AndroidSourceExplorer } from './components/AndroidSourceExplorer';
import { ApkBuildAndDownloadSection } from './components/ApkBuildAndDownloadSection';
import { SmartCalculatorDevice } from './components/SmartCalculatorDevice';
import { VerificationSuiteSection } from './components/VerificationSuiteSection';
import { CalculatorSettings, HistoryItem } from './types/calculator';

const SETTINGS_STORAGE_KEY = 'smart_calculator_settings_v1';
const HISTORY_STORAGE_KEY = 'smart_calculator_history_v1';

const DEFAULT_SETTINGS: CalculatorSettings = {
  themeMode: 'dark',
  buttonSoundEnabled: true,
  vibrationEnabled: true,
  decimalPrecision: 8,
  thousandsSeparatorEnabled: true,
  angleUnit: 'DEG',
  memoryValue: 0,
  hasMemoryValue: false,
  adsEnabled: true,
  consentGranted: true,
};

function loadInitialSettings(): CalculatorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadInitialHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [settings, setSettings] = useState<CalculatorSettings>(loadInitialSettings);
  const [history, setHistory] = useState<HistoryItem[]>(loadInitialHistory);

  // Sync Tailwind v4 .dark class on <html> according to user preference (Dark / Light / System)
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark =
        settings.themeMode === 'dark' || (settings.themeMode === 'system' && systemDark);
      root.classList.toggle('dark', shouldUseDark);
    };

    applyTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage quota errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage quota errors
    }
  }, [history]);

  const handleUpdateSettings = useCallback(
    (updater: (prev: CalculatorSettings) => CalculatorSettings) => {
      setSettings((prev) => updater(prev));
    },
    []
  );

  const handleAddHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 250));
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090D16] dark:text-slate-100 transition-colors">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#090D16]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#calculator"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            Smart Calculator
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#calculator"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Calculator
            </a>
            <a
              href="#tests"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Tests
            </a>
            <a
              href="#android-source"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Android Source
            </a>
            <a
              href="#build-apk"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Build &amp; Export
            </a>
          </nav>

          <a
            href="/api/download/android-project.zip"
            download="SmartCalculator-Android-Project.zip"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Android ZIP
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero + Live Interactive Calculator Workspace */}
        <section id="calculator" className="py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Product Overview & Quick Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  01. Android Application &amp; Live Runtime
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 leading-[1.12] [text-wrap:balance]">
                  Precision Basic &amp; Scientific Calculator for Android
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                  Built with Kotlin, Jetpack Compose, Material 3, and a custom recursive-descent
                  BODMAS engine. Test all five screens live on the right—including Scientific mode,
                  timestamped History, Memory registers, Dark/Light themes, and Google AdMob test
                  controls.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/api/download/android-project.zip"
                  download="SmartCalculator-Android-Project.zip"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Download Android Project
                </a>
                <a
                  href="#build-apk"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors whitespace-nowrap"
                >
                  APK Build Instructions
                </a>
              </div>

              {/* Architecture & Capability Matrix (Clean Hairline Rows, No Card Sandwiches) */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Implemented Engineering Specifications
                </h2>
                <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">Application ID</dt>
                    <dd className="font-mono text-slate-900 dark:text-slate-100 text-right">
                      com.smarttools.smartcalculator
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">Math Engine</dt>
                    <dd className="font-mono text-slate-900 dark:text-slate-100 text-right">
                      BODMAS · DEG/RAD · Sci Notation · Error Safe
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">Persistence</dt>
                    <dd className="font-mono text-slate-900 dark:text-slate-100 text-right">
                      DataStore + Private History JSON
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">Monetization</dt>
                    <dd className="font-mono text-slate-900 dark:text-slate-100 text-right">
                      AdMob Test IDs + UMP Consent SDK
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-slate-500 dark:text-slate-400">Keyboard Shortcuts</dt>
                    <dd className="font-mono text-slate-900 dark:text-slate-100 text-right">
                      0–9, + − * / ^ % ( ) Enter Backspace Esc
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Right Column: Live Interactive 5-Screen Smart Calculator */}
            <div className="lg:col-span-7">
              <SmartCalculatorDevice
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                history={history}
                onAddHistory={handleAddHistory}
                onDeleteHistory={handleDeleteHistory}
                onClearHistory={handleClearHistory}
              />
            </div>
          </div>
        </section>

        <VerificationSuiteSection />
        <AndroidSourceExplorer />
        <ApkBuildAndDownloadSection />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Smart Calculator · Kotlin &amp; Jetpack Compose Android Application</span>
          <span>Offline Mathematical Engine · Release Signing Ready</span>
        </div>
      </footer>
    </div>
  );
}
