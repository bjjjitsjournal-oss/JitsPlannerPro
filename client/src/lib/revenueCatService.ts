import { Purchases } from '@revenuecat/purchases-js';
import type { CustomerInfo } from '@revenuecat/purchases-js';
import { getPlatform } from './platform';

/**
 * RevenueCat service for handling multi-platform subscriptions
 * - Web: Uses Stripe via RevenueCat Web Billing
 * - Android/iOS: Use native SDKs (@revenuecat/purchases-capacitor)
 * 
 * Note: This is the WEB SDK only. For native platforms, use Capacitor plugin.
 */
class RevenueCatService {
  private purchasesInstance: any = null;

  /**
   * Initialize RevenueCat SDK (Web only)
   * Call this once when the app starts
   */
  async initialize(userId: string) {
    if (this.purchasesInstance) {
      return;
    }

    const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY;
    
    if (!apiKey) {
      console.warn('RevenueCat SDK key not found. Subscriptions will not work.');
      return;
    }

    try {
      this.purchasesInstance = Purchases.configure({
        apiKey,
        appUserId: userId,
      });
      
      console.log('✅ RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings() {
    if (!this.purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await this.purchasesInstance.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: any, email?: string): Promise<CustomerInfo> {
    if (!this.purchasesInstance) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await this.purchasesInstance.purchase({
        packageToPurchase: pkg,
        email,
      });
      return customerInfo;
    } catch (error: any) {
      if (error.errorCode === 'UserCancelledError') {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  }

  /**
   * Get current customer info (subscription status)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.purchasesInstance) {
      return null;
    }

    try {
      const customerInfo = await this.purchasesInstance.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return false;
    }

    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  /**
   * Get active subscription tier (if any)
   */
  async getSubscriptionTier(): Promise<'free' | 'enthusiast' | 'gym_pro'> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return 'free';
    }

    // Check for Gym Pro entitlement first (higher tier)
    if (customerInfo.entitlements.active['gym_pro']) {
      return 'gym_pro';
    }

    // Then check for Enthusiast
    if (customerInfo.entitlements.active['enthusiast']) {
      return 'enthusiast';
    }

    return 'free';
  }

  /**
   * Switch to a different user ID
   */
  async changeUser(newUserId: string) {
    if (!this.purchasesInstance) {
      return;
    }

    try {
      await this.purchasesInstance.changeAppUserId(newUserId);
    } catch (error) {
      console.error('Error changing user:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
