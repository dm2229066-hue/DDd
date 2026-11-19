import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileArchive,
  Image as ImageIcon,
  Terminal,
} from 'lucide-react';
import { BuildStatusResponse } from '../types/calculator';

const BUILD_COMMANDS = `unzip SmartCalculator-Android-Project.zip
cd android-app
chmod +x build-release-apk.sh
./build-release-apk.sh`;

const ADB_COMMANDS = `adb install -r app/build/outputs/apk/release/app-universal-release.apk
adb shell am start -n com.smarttools.smartcalculator/.MainActivity`;

export const ApkBuildAndDownloadSection: React.FC = () => {
  const [status, setStatus] = useState<BuildStatusResponse | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<'build' | 'adb' | null>(null);

  useEffect(() => {
    fetch('/api/environment/build-status')
      .then((res) => res.json())
      .then((data: BuildStatusResponse) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const copyCommand = async (kind: 'build' | 'adb', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmd(kind);
      setTimeout(() => setCopiedCmd(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <section id="build-apk" className="py-12 border-t border-slate-200 dark:border-slate-800/80">
      <div className="mb-6">
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          04. Android Build &amp; Export
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Download Project Package &amp; Build Signed Release APK
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-3xl">
          Download the complete Android Studio Kotlin project archive and app icon, or run the
          included release signing script locally with Android SDK / Gradle to compile the signed
          release APK.
        </p>
      </div>

      {/* Honest Toolchain Check Banner */}
      <div className="rounded-2xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Cloud Sandbox APK Compiler Unavailable — Real Android Source Export Ready
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
              {status
                ? `Toolchain check in this runtime container: Java JDK (${
                    status.toolchain.java ? 'Installed' : 'Not installed'
                  }) · Gradle (${
                    status.toolchain.gradle ? 'Installed' : 'Not installed'
                  }) · Android SDK (${
                    status.toolchain.androidSdk ? 'Configured' : 'Not installed'
                  }). Because Android SDK & JDK are not present here, no placeholder or fake .apk binary is generated. Instead, download the complete ${
                    status.projectStats.fileCount
                  }-file Gradle project below to build and sign the genuine release APK.`
                : 'Checking container toolchain... Download the complete Android Studio project ZIP below to compile the signed release APK locally.'}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Downloads + Project Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src="/src/assets/images/smart_calculator_app_icon_1795062286272.jpg"
                alt="Smart Calculator Adaptive Icon"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Smart Calculator
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  com.smarttools.smartcalculator · v1.0.0
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Min SDK 24 (Android 7.0) · Target SDK 35
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Release Optimization</span>
                <span className="font-mono">R8 Minify + Shrink Resources</span>
              </div>
              <div className="flex justify-between">
                <span>ABI Splits</span>
                <span className="font-mono">arm64-v8a, armeabi-v7a, universal</span>
              </div>
              <div className="flex justify-between">
                <span>AdMob Integration</span>
                <span className="font-mono">Official Google Test IDs + UMP</span>
              </div>
              <div className="flex justify-between">
                <span>Core Calculator Mode</span>
                <span className="font-mono">100% Offline</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href="/api/download/android-project.zip"
              download="SmartCalculator-Android-Project.zip"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors"
            >
              <FileArchive className="w-4 h-4" />
              Download Complete Android Project (.ZIP)
            </a>
            <a
              href="/api/download/app-icon.jpg"
              download="smart-calculator-icon.jpg"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Download App Icon Asset (.JPG)
            </a>
          </div>
        </div>

        {/* Exact Build & Installation Steps */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                1. Generate Keystore, Run Unit Tests &amp; Build Signed Release APK
              </h3>
              <button
                type="button"
                onClick={() => copyCommand('build', BUILD_COMMANDS)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {copiedCmd === 'build' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
              {BUILD_COMMANDS}
            </pre>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Runs <code className="font-mono">keytool</code> to create an RSA-2048 keystore,
              executes <code className="font-mono">CalculatorEngineTest</code>, and builds the
              R8-optimized signed APK at{' '}
              <code className="font-mono">
                app/build/outputs/apk/release/app-universal-release.apk
              </code>
              .
            </p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-500" />
                2. Install &amp; Launch on Android Device via ADB
              </h3>
              <button
                type="button"
                onClick={() => copyCommand('adb', ADB_COMMANDS)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {copiedCmd === 'adb' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="rounded-xl bg-slate-950 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
              {ADB_COMMANDS}
            </pre>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Alternatively, open the extracted <code className="font-mono">android-app</code>{' '}
              folder in Android Studio Ladybug+ and select{' '}
              <strong>Build → Generate Signed App Bundle / APK</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
