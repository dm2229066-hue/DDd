import { AngleUnit } from '../engine/calculatorEngine';

export type ThemeMode = 'system' | 'dark' | 'light';
export type AppScreen = 'basic' | 'scientific' | 'history' | 'settings' | 'about';
export type DeviceOrientation = 'portrait' | 'landscape';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  isScientific: boolean;
}

export interface CalculatorSettings {
  themeMode: ThemeMode;
  buttonSoundEnabled: boolean;
  vibrationEnabled: boolean;
  decimalPrecision: number;
  thousandsSeparatorEnabled: boolean;
  angleUnit: AngleUnit;
  memoryValue: number;
  hasMemoryValue: boolean;
  adsEnabled: boolean;
  consentGranted: boolean;
}

export interface AndroidFileEntry {
  path: string;
  size: number;
  lines: number;
}

export interface BuildStatusResponse {
  apkBuildSupported: boolean;
  toolchain: {
    java: boolean;
    gradle: boolean;
    androidSdk: boolean;
  };
  projectStats: {
    applicationId: string;
    versionName: string;
    versionCode: number;
    minSdk: number;
    targetSdk: number;
    fileCount: number;
    totalBytes: number;
  };
}
