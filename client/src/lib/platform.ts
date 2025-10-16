import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'android' | 'ios';

/**
 * Detect the current platform
 * - web: Browser access via Render URL
 * - android: Android app via Google Play Store
 * - ios: iOS app via App Store
 */
export function getPlatform(): Platform {
  if (!Capacitor.isNativePlatform()) {
    return 'web';
  }
  
  const platform = Capacitor.getPlatform();
  
  if (platform === 'android') {
    return 'android';
  }
  
  if (platform === 'ios') {
    return 'ios';
  }
  
  // Fallback to web
  return 'web';
}

/**
 * Check if user is on a native platform (Android or iOS)
 */
export function isNativePlatform(): boolean {
  const platform = getPlatform();
  return platform === 'android' || platform === 'ios';
}

/**
 * Check if user is on web (browser)
 */
export function isWebPlatform(): boolean {
  return getPlatform() === 'web';
}

/**
 * Get the appropriate payment provider for the current platform
 * - web: Stripe
 * - android/ios: RevenueCat (which handles store billing)
 */
export function getPaymentProvider(): 'stripe' | 'revenuecat' {
  return isWebPlatform() ? 'stripe' : 'revenuecat';
}
