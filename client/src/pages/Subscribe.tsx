import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, Shield, Smartphone } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPlatform, isWebPlatform } from '@/lib/platform';
import { revenueCatService } from '@/lib/revenueCatService';

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const platform = getPlatform();
  const isWeb = isWebPlatform();

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/stripe/subscription-status'],
    enabled: !!user && isWeb, // Only fetch Stripe status on web
  });

  const currentTier = subscriptionStatus?.tier || 'free';

  const handleSubscribe = async (tier: string) => {
    // On Android/iOS, show app store instructions
    if (!isWeb) {
      toast({
        title: 'Subscribe via App Store',
        description: `To subscribe on ${platform}, please use your device's app store (Google Play or Apple App Store).`,
      });
      return;
    }

    // Web platform: use RevenueCat (Stripe checkout)
    try {
      setLoadingTier(tier);
      
      // Initialize RevenueCat if needed
      if (user?.id) {
        await revenueCatService.initialize(user.id);
      }
      
      // Get offerings
      const offerings = await revenueCatService.getOfferings();
      
      if (!offerings || !offerings.current) {
        throw new Error('No subscription offerings available');
      }

      // Find the right package based on tier
      let packageToPurchase = null;
      
      if (tier === 'enthusiast') {
        packageToPurchase = offerings.current.monthly || offerings.current.availablePackages.find((p: any) => 
          p.identifier.toLowerCase().includes('enthusiast') || p.identifier.toLowerCase().includes('premium')
        );
      } else if (tier === 'gym_pro') {
        packageToPurchase = offerings.current.annual || offerings.current.availablePackages.find((p: any) => 
          p.identifier.toLowerCase().includes('gym') || p.identifier.toLowerCase().includes('pro')
        );
      }

      if (!packageToPurchase) {
        throw new Error('Selected plan not available');
      }

      // Trigger purchase (shows Stripe checkout modal)
      await revenueCatService.purchasePackage(packageToPurchase, user?.email);
      
      toast({
        title: 'Success!',
        description: 'Subscription activated successfully',
      });
      
      // Refresh subscription status
      window.location.reload();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive',
      });
    } finally {
      setLoadingTier(null);
    }
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
      price: '$19.99',
      tier: 'gym_pro',
      description: 'For gym owners & coaches',
      priceId: import.meta.env.VITE_STRIPE_GYM_PRO_PRICE_ID || import.meta.env.STRIPE_GYM_PRO_PRICE_ID,
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
              <Smartphone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Subscribe via {platform === 'android' ? 'Google Play Store' : 'Apple App Store'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  To manage subscriptions on {platform}, please use your device's app store:
                </p>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Open {platform === 'android' ? 'Google Play Store' : 'Apple App Store'}</li>
                  <li>Search for "Jits Journal"</li>
                  <li>View subscription options and purchase</li>
                  <li>Subscription will sync automatically</li>
                </ol>
              </div>
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
                    {tier.tier !== 'free' && (
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    )}
                  </div>
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
            <CardDescription>Start training smarter in 3 easy steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-semibold mb-2">Choose Your Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click "Get Started" on any plan above
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <h3 className="font-semibold mb-2">Complete Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure checkout via Stripe - all major cards accepted
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
                💡 <strong>Pro Tip:</strong> After subscribing, you can add this web app to your home screen for a native app experience!
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
                  We accept all major credit and debit cards through Stripe, our secure payment processor.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
