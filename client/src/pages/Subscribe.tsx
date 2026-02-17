import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, Shield, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlatform, isWebPlatform } from '@/lib/platform';
import { nativeRevenueCatService } from '@/lib/nativeRevenueCatService';
import type { PurchasesOfferings } from '@revenuecat/purchases-capacitor';

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const platform = getPlatform();
  const isWeb = isWebPlatform();

  const { data: subscriptionStatus } = useQuery<{ tier: string; status: string }>({
    queryKey: ['/api/stripe/subscription-status'],
    enabled: !!user && isWeb, // Only fetch Stripe status on web
  });

  const currentTier = subscriptionStatus?.tier || 'free';

  useEffect(() => {
    if ((platform === 'ios' || platform === 'android') && user) {
      initializeRevenueCat();
    }
  }, [platform, user]);

  const initializeRevenueCat = async () => {
    if (!user) return;

    try {
      await nativeRevenueCatService.initialize(user.id.toString());
      const offers = await nativeRevenueCatService.getOfferings();
      setOfferings(offers);
      
      await nativeRevenueCatService.syncSubscriptionToBackend();
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription options. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openAppStore = () => {
    const appId = 'com.jitsjournal.app';
    
    if (platform === 'android') {
      window.location.href = `market://details?id=${appId}`;
      
      setTimeout(() => {
        window.location.href = `https://play.google.com/store/apps/details?id=${appId}`;
      }, 500);
    } else if (platform === 'ios') {
      toast({
        title: 'Subscribe Below',
        description: 'Select a plan below to purchase directly in the app!',
      });
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    
    try {
      const customerInfo = await nativeRevenueCatService.restorePurchases();
      
      await nativeRevenueCatService.syncSubscriptionToBackend();
      
      const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (hasActive) {
        toast({
          title: 'Success!',
          description: 'Your purchases have been restored.',
        });
      } else {
        toast({
          title: 'No Purchases Found',
          description: 'No active subscriptions to restore.',
        });
      }
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore purchases. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (isWeb) {
      toast({
        title: 'Subscribe via App Store',
        description: 'Download the app from Google Play Store or Apple App Store to unlock premium features.',
        duration: 5000,
      });
      return;
    }

    if (platform === 'ios') {
      setLoadingTier(tier);
      
      try {
        // Try current (default) offering first, then look for named offerings
        let offering = offerings?.current || 
                       offerings?.all?.['Premium'] || 
                       offerings?.all?.['premium'] ||
                       offerings?.all?.['default'];
        
        // If still not found, try to get the first available offering
        if (!offering && offerings?.all) {
          const offeringKeys = Object.keys(offerings.all);
          console.log('📦 iOS - Available offering keys:', offeringKeys);
          if (offeringKeys.length > 0) {
            offering = offerings.all[offeringKeys[0]];
            console.log('📦 iOS - Using first available offering:', offeringKeys[0]);
          }
        }
        
        if (!offering) {
          console.error('❌ iOS - No offerings found. Full offerings object:', JSON.stringify(offerings, null, 2));
          throw new Error('No offerings available');
        }
        
        console.log('📦 iOS - Using offering:', offering);

        if (tier === 'gym_pro') {
          toast({
            title: 'Contact Required',
            description: 'Please contact us for Gym Pro subscription.',
          });
          return;
        }

        // Find the first available package in the offering
        const pkg = offering.availablePackages[0];

        if (!pkg) {
          console.error('Available packages:', offering.availablePackages);
          throw new Error('No subscription package found in offering');
        }
        
        console.log('📦 Purchasing package:', pkg.identifier, pkg);

        const customerInfo = await nativeRevenueCatService.purchasePackage(pkg);
        
        await nativeRevenueCatService.syncSubscriptionToBackend();
        
        toast({
          title: 'Success!',
          description: `Welcome to ${tier === 'enthusiast' ? 'BJJ Enthusiast' : 'Gym Pro'}!`,
        });
        
        window.location.reload();
      } catch (error: any) {
        if (error.message === 'Purchase cancelled by user') {
          toast({
            title: 'Purchase Cancelled',
            description: 'You can subscribe anytime.',
          });
        } else {
          console.error('Purchase failed:', error);
          toast({
            title: 'Purchase Failed',
            description: error.message || 'Something went wrong. Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoadingTier(null);
      }
      
      return;
    }

    if (platform === 'android') {
      setLoadingTier(tier);
      
      try {
        // Try current (default) offering first, then look for named offerings
        let offering = offerings?.current || 
                       offerings?.all?.['Premium'] || 
                       offerings?.all?.['premium'] ||
                       offerings?.all?.['default'];
        
        // If still not found, try to get the first available offering
        if (!offering && offerings?.all) {
          const offeringKeys = Object.keys(offerings.all);
          console.log('📦 Android - Available offering keys:', offeringKeys);
          if (offeringKeys.length > 0) {
            offering = offerings.all[offeringKeys[0]];
            console.log('📦 Android - Using first available offering:', offeringKeys[0]);
          }
        }
        
        if (!offering) {
          console.error('❌ Android - No offerings found. Full offerings object:', JSON.stringify(offerings, null, 2));
          throw new Error('No offerings available');
        }
        
        console.log('📦 Android - Using offering:', offering);

        if (tier === 'gym_pro') {
          toast({
            title: 'Contact Required',
            description: 'Please contact us for Gym Pro subscription.',
          });
          setLoadingTier(null);
          return;
        }

        // Find the first available package in the offering
        const pkg = offering.availablePackages[0];

        if (!pkg) {
          console.error('Available packages:', offering.availablePackages);
          throw new Error('No subscription package found in offering');
        }
        
        console.log('📦 Purchasing package:', pkg.identifier, pkg);

        const customerInfo = await nativeRevenueCatService.purchasePackage(pkg);
        
        await nativeRevenueCatService.syncSubscriptionToBackend();
        
        toast({
          title: 'Success!',
          description: `Welcome to ${tier === 'enthusiast' ? 'BJJ Enthusiast' : 'Gym Pro'}!`,
        });
        
        window.location.reload();
      } catch (error: any) {
        if (error.message === 'Purchase cancelled by user') {
          toast({
            title: 'Purchase Cancelled',
            description: 'You can subscribe anytime.',
          });
        } else {
          console.error('Android purchase failed:', error);
          toast({
            title: 'Purchase Failed',
            description: error.message || 'Something went wrong. Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoadingTier(null);
      }
      
      return;
    }

    setLoadingTier(tier);
    
    toast({
      title: 'Opening Store...',
      description: `Subscribe to ${tier === 'enthusiast' ? 'BJJ Enthusiast' : 'Gym Pro'} in the Play Store`,
    });

    setTimeout(() => {
      openAppStore();
      setLoadingTier(null);
    }, 500);
  };

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      tier: 'free',
      description: 'Get started with BJJ tracking',
      features: [
        'View community notes',
        'View gym notes (with code)',
        'Log up to 3 classes',
        'Create up to 3 notes',
        'No note sharing',
      ],
      icon: Shield,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      isCurrent: currentTier === 'free',
    },
    {
      name: 'BJJ Enthusiast',
      price: '$9.99',
      tier: 'enthusiast',
      description: 'For dedicated practitioners',
      priceId: import.meta.env.VITE_STRIPE_ENTHUSIAST_PRICE_ID || import.meta.env.STRIPE_ENTHUSIAST_PRICE_ID,
      features: [
        'Unlimited class logs',
        'Unlimited notes',
        'Share to community: 1x/week',
        'View all gym notes',
        'Priority support',
      ],
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isCurrent: currentTier === 'enthusiast',
      popular: true,
    },
    {
      name: 'Gym Pro',
      price: 'Contact Us',
      tier: 'gym_pro',
      description: 'For gym owners & coaches',
      contactEmail: 'bjjjitsjournal@gmail.com',
      features: [
        'Everything in Enthusiast',
        'Share to community: 10x/week',
        'Share to gym: Unlimited',
        'Admin approval required',
        'Premium support',
      ],
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      isCurrent: currentTier === 'gym_pro',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* App Store Notice for Mobile */}
        {!isWeb && (
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Subscribe via {platform === 'android' ? 'Google Play Store' : 'Apple App Store'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {platform === 'ios' 
                    ? 'Click "Get Started" below to purchase directly in the app!'
                    : 'Click "Get Started" on any plan below to open the Play Store where you can complete your subscription.'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                  💡 Your subscription will sync automatically after purchase!
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <Button
                variant="outline"
                onClick={handleRestorePurchases}
                disabled={isRestoring}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Already subscribed? Restore your purchases here.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Track your BJJ journey with the right plan for you
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.tier}
                className={`relative ${tier.popular ? 'ring-2 ring-blue-500 shadow-xl' : ''} ${
                  tier.isCurrent ? 'border-green-500' : tier.borderColor
                }`}
                data-testid={`tier-card-${tier.tier}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                {tier.isCurrent && (
                  <div className="absolute -top-4 right-4 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </div>
                )}

                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${tier.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {tier.price}
                    </span>
                    {tier.tier !== 'free' && tier.tier !== 'gym_pro' && (
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    )}
                  </div>
                  {tier.tier === 'enthusiast' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Auto-renewable monthly subscription. Billed at $9.99/month. Cancel anytime.
                    </p>
                  )}
                  {tier.tier === 'gym_pro' && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Email: bjjjitsjournal@gmail.com
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.tier !== 'free' && !tier.isCurrent && (
                    <>
                      {tier.tier === 'gym_pro' ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${tier.contactEmail}?subject=Gym Pro Subscription Inquiry&body=Hi, I'm interested in the Gym Pro plan for my gym.`}
                          data-testid={`button-subscribe-${tier.tier}`}
                        >
                          Contact Us
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant={tier.popular ? 'default' : 'outline'}
                          onClick={() => handleSubscribe(tier.tier)}
                          disabled={loadingTier === tier.tier}
                          data-testid={`button-subscribe-${tier.tier}`}
                        >
                          {loadingTier === tier.tier ? 'Loading...' : 'Get Started'}
                        </Button>
                      )}
                    </>
                  )}

                  {tier.isCurrent && (
                    <Button className="w-full" variant="secondary" disabled data-testid={`button-current-${tier.tier}`}>
                      Current Plan
                    </Button>
                  )}

                  {tier.tier === 'free' && !tier.isCurrent && (
                    <Button className="w-full" variant="outline" disabled data-testid="button-free-tier">
                      Free Forever
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Download and subscribe in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-semibold mb-2">Download the App</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get Jits Journal from Google Play Store or Apple App Store
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <h3 className="font-semibold mb-2">Choose Your Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Subscribe directly through your app store
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <h3 className="font-semibold mb-2">Start Training</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access all premium features instantly!
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                📱 <strong>Coming Soon:</strong> Jits Journal will be available on Google Play Store and Apple App Store!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can cancel your subscription at any time. You'll retain access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does Gym Pro approval work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  When you subscribe to Gym Pro, you'll need to request approval from our team. This ensures quality gym content for the community. Approval typically takes 24-48 hours.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  All payments are processed securely through Google Play Store or Apple App Store, using your preferred payment method on file.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subscription Terms - Required by Apple Guideline 3.1.2 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Subscription Terms</h3>
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <p>
                <strong>Jits Journal Premium</strong> is available as a monthly auto-renewable subscription at <strong>$9.99 AUD/month</strong>.
              </p>
              <p>
                Payment will be charged to your Apple ID or Google Play account at confirmation of purchase. Your subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current billing period. Your account will be charged for renewal within 24 hours prior to the end of the current period at the same price. You can manage and cancel your subscriptions by going to your account settings on the App Store or Google Play Store after purchase.
              </p>
              <p>
                Any unused portion of a free trial period, if offered, will be forfeited when you purchase a subscription.
              </p>
              <div className="flex gap-4 mt-3">
                <a href="https://jitsjournal-backend.onrender.com/privacy" className="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                <a href="https://jitsjournal-backend.onrender.com/terms" className="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">Terms of Use</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
