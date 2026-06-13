import { Capacitor } from '@capacitor/core';

// Centralized platform detection
// Returns true if running natively on iOS or Android via Capacitor
export const isNativeApp = Capacitor.isNativePlatform() || import.meta.env.VITE_APP_TARGET === 'mobile';
