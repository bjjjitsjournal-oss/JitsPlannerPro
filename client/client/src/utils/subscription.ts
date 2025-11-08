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

// Subscription tier limits
export const FREE_TIER_LIMITS = {
  classes: 3,
  notes: 3,
  dataLimitGB: 0, // Free tier has no video uploads
  communitySharesPerWeek: 0 // Can only share via socials, not to community
};

export const PREMIUM_TIER_LIMITS = {
  classes: Infinity, // Unlimited
  notes: Infinity, // Unlimited
  dataLimitGB: 50,
  communitySharesPerWeek: 1
};

export const GYM_TIER_LIMITS = {
  classes: Infinity, // Unlimited
  notes: Infinity, // Unlimited
  dataLimitGB: 100,
  communitySharesPerWeek: 3,
  gymSharesPerWeek: Infinity, // Unlimited gym sharing
  costPerMember: 5 // $5 per gym member per month
};