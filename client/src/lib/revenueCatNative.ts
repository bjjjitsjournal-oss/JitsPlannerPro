import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

/**
 * RevenueCat native service for Android/iOS in-app purchases
 * Uses the Capacitor plugin to trigger native Google Play/App Store billing
 */
class RevenueCatNativeService {
  private isConfigured = false;

  /**
   * Initialize RevenueCat SDK for native platforms
   * Call this once when the app starts
   */
  async initialize(userId: string) {
    if (this.isConfigured) {
      console.log('RevenueCat already configured');
      return;
    }

    const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY;
    
    if (!apiKey) {
      console.error('❌ RevenueCat API key not found');
      throw new Error('RevenueCat API key not configured');
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      
      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.isConfigured = true;
      console.log('✅ RevenueCat native SDK initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat native:', error);
      throw error;
    }
  }

  /**
   * Get available subscription offerings from RevenueCat
   */
  async getOfferings() {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        console.log('📦 Current offering:', offerings.current.identifier);
        console.log('📦 Available packages:', offerings.current.availablePackages.length);
      }
      
      return offerings;
    } catch (error) {
      console.error('❌ Error fetching offerings:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription package
   * This triggers the native Google Play billing dialog
   */
  async purchasePackage(pkg: any) {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      console.log('💳 Starting purchase for package:', pkg.identifier);
      
      const purchaseResult = await Purchases.purchasePackage({
        aPackage: pkg,
      });

      console.log('✅ Purchase successful!');
      console.log('📊 Customer info:', purchaseResult.customerInfo);

      return purchaseResult.customerInfo;
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      if (error.code === '1') {
        throw new Error('Purchase cancelled');
      }
      
      throw new Error(error.message || 'Purchase failed');
    }
  }

  /**
   * Get current customer info (subscription status)
   */
  async getCustomerInfo() {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const result = await Purchases.getCustomerInfo();
      return result.customerInfo;
    } catch (error) {
      console.error('❌ Error getting customer info:', error);
      throw error;
    }
  }

  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      return activeEntitlements.length > 0;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get active subscription tier
   */
  async getSubscriptionTier(): Promise<'free' | 'enthusiast' | 'gym_pro'> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (customerInfo.entitlements.active['gym_pro']) {
        return 'gym_pro';
      }
      
      if (customerInfo.entitlements.active['premium'] || customerInfo.entitlements.active['enthusiast']) {
        return 'enthusiast';
      }
      
      return 'free';
    } catch (error) {
      console.error('❌ Error getting subscription tier:', error);
      return 'free';
    }
  }

  /**
   * Restore purchases (useful for users who reinstall the app)
   */
  async restorePurchases() {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      console.log('🔄 Restoring purchases...');
      const result = await Purchases.restorePurchases();
      console.log('✅ Purchases restored');
      return result.customerInfo;
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }
}

export const revenueCatNative = new RevenueCatNativeService();
