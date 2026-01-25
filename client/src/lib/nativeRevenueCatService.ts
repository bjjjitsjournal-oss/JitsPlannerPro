import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import type { CustomerInfo, PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

class NativeRevenueCatService {
  private isInitialized = false;

  async initialize(userId: string) {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    const platform = Capacitor.getPlatform();
    let apiKey: string;
    if (platform === 'ios') {
      apiKey = import.meta.env.VITE_REVENUECAT_IOS_SDK_KEY;
    } else if (platform === 'android') {
      apiKey = import.meta.env.VITE_REVENUECAT_ANDROID_SDK_KEY;
    } else {
      apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_SDK_KEY;
    }
    
    if (!apiKey) {
      console.error(`❌ RevenueCat SDK key not found for platform: ${platform}`);
      throw new Error('RevenueCat SDK key not configured');
    }

    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      
      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });
      
      this.isInitialized = true;
      console.log('✅ RevenueCat initialized for iOS user:', userId);
    } catch (error) {
      console.error('❌ Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.isInitialized) {
      console.error('RevenueCat not initialized');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      console.log('📦 RevenueCat offerings:', offerings);
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      console.log('💳 Purchasing package:', pkg.identifier);
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      console.log('✅ Purchase successful:', result);
      return result.customerInfo;
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      
      if (error.code === '1') {
        throw new Error('Purchase cancelled by user');
      }
      
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const result = await Purchases.getCustomerInfo();
      console.log('👤 Customer info:', result);
      return result.customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  async hasActiveSubscription(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return false;
    }

    return Object.keys(customerInfo.entitlements.active).length > 0;
  }

  async getActiveEntitlements(): Promise<string[]> {
    const customerInfo = await this.getCustomerInfo();
    
    if (!customerInfo) {
      return [];
    }

    return Object.keys(customerInfo.entitlements.active);
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (!this.isInitialized) {
      throw new Error('RevenueCat not initialized');
    }

    try {
      console.log('🔄 Restoring purchases...');
      const result = await Purchases.restorePurchases();
      console.log('✅ Purchases restored:', result);
      return result.customerInfo;
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
    }
  }

  async syncSubscriptionToBackend(): Promise<void> {
    try {
      console.log('🔄 Syncing subscription to backend (server will verify with RevenueCat)');

      // Get access token from Capacitor Preferences (works on iOS/Android)
      const tokenResult = await Preferences.get({ key: 'supabase_access_token' });
      const accessToken = tokenResult.value;
      
      if (!accessToken) {
        console.error('❌ No access token found for sync');
        return;
      }

      // Get the correct backend URL for native platforms
      const API_BASE_URL = 'https://jitsjournal-backend.onrender.com';

      // SECURITY: Backend verifies subscription server-side with RevenueCat API
      // No client-provided entitlement data is trusted
      const response = await fetch(`${API_BASE_URL}/api/sync-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}), // Empty body - server verifies directly with RevenueCat
      });

      if (!response.ok) {
        console.error('Failed to sync subscription to backend');
      } else {
        console.log('✅ Subscription synced to backend (verified by server)');
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
    }
  }
}

export const nativeRevenueCatService = new NativeRevenueCatService();
