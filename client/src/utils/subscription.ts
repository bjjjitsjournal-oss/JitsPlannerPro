// Subscription utility functions

// Special accounts with unlimited access
const UNLIMITED_ACCESS_EMAILS = [
  'Joe@cleancutconstructions.com.au',
  'joe833360@gmail.com',
  'Bjjjitsjournal@gmail.com',
  'bjjjitsjournal@gmail.com', // Added lowercase version
  'admin@apexbjj.com.au'
];

export const hasUnlimitedAccess = (email?: string): boolean => {
  if (!email) return false;
  return UNLIMITED_ACCESS_EMAILS.includes(email);
};

export const isPremiumUser = (email?: string, subscriptionStatus?: string, subscriptionExpiresAt?: string | null): boolean => {
  // Check for unlimited access first
  if (hasUnlimitedAccess(email)) return true;
  
  // Check subscription status (RevenueCat statuses)
  if (subscriptionStatus === 'premium' || subscriptionStatus === 'active') return true;
  
  // Check if user has a future expiration date (backend premium upgrade or RevenueCat sync)
  if (subscriptionExpiresAt) {
    const expirationDate = new Date(subscriptionExpiresAt);
    const now = new Date();
    return expirationDate > now;
  }
  
  return false;
};

export const getSubscriptionPlan = (email?: string, subscriptionStatus?: string, subscriptionExpiresAt?: string | null): string => {
  if (hasUnlimitedAccess(email)) return 'Premium (Unlimited)';
  if (isPremiumUser(email, subscriptionStatus, subscriptionExpiresAt)) return 'Premium';
  return 'Free Tier';
};

// Limits for free tier
export const FREE_TIER_LIMITS = {
  classes: 10,
  notes: 5
};