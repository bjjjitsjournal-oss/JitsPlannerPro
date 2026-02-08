import { Capacitor } from '@capacitor/core';

export type Platform = 'web' | 'android' | 'ios';

/**
 * Detect the current platform
 * - web: Browser access via Render URL
 * - android: Android app via Google Play Store
 * - ios: iOS app via App Store
 * 
 * IMPORTANT: Check getPlatform() FIRST because isNativePlatform() can return false
 * in some Android WebView configurations even when running as a native app.
 */
export function getPlatform(): Platform {
  // Check Capacitor.getPlatform() first - this is more reliable
  const platform = Capacitor.getPlatform();
  
  // If Capacitor reports android or ios, trust it
  if (platform === 'android') {
    return 'android';
  }
  
  if (platform === 'ios') {
    return 'ios';
  }
  
  // Additional check: if isNativePlatform is true but platform name wasn't recognized
  if (Capacitor.isNativePlatform()) {
    // Try to detect from user agent as fallback
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) {
      return 'android';
    }
    if (ua.includes('iphone') || ua.includes('ipad')) {
      return 'ios';
    }
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
