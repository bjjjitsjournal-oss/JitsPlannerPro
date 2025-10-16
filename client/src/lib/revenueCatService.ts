import Purchases, { PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-js';
import { getPlatform } from './platform';

/**
 * RevenueCat service for handling multi-platform subscriptions
 * - Web: Uses Stripe via RevenueCat
 * - Android: Uses Google Play Billing
 * - iOS: Uses Apple In-App Purchase
 */
class RevenueCatService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   * Call this once when the app starts
   */
  async initialize(userId: string) {
    if (this.initialized) {
      return;
    }

    const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY;
    
    if (!apiKey) {
      console.warn('RevenueCat SDK key not found. App store payments will not work.');
      return;
    }

    try {
      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });
      
      this.initialized = true;
      console.log('✅ RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
    }
  }

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesPackage[]> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current) {
        return [];
      }

      return offerings.current.availablePackages;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return [];
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.initialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Get current customer info (subscription status)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.initialized) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
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

    // Check if user has any active entitlements
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
   * Logout (clear user identity)
   */
  async logout() {
    if (!this.initialized) {
      return;
    }

    try {
      await Purchases.logOut();
      this.initialized = false;
    } catch (error) {
      console.error('Error logging out from RevenueCat:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
