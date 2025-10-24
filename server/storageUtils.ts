// Storage quota utilities for video uploads

export const STORAGE_QUOTAS = {
  free: 10 * 1024 * 1024 * 1024, // 10 GB total storage
  enthusiast: 75 * 1024 * 1024 * 1024, // 75 GB total storage
  gym_pro: 150 * 1024 * 1024 * 1024, // 150 GB total storage
} as const;

export const PER_VIDEO_LIMITS = {
  free: 100 * 1024 * 1024, // 100 MB per video
  enthusiast: 500 * 1024 * 1024, // 500 MB per video
  gym_pro: 500 * 1024 * 1024, // 500 MB per video
} as const;

export type SubscriptionTier = keyof typeof STORAGE_QUOTAS;

/**
 * Get storage quota in bytes for a subscription tier
 */
export function getStorageQuota(tier: string): number {
  const normalizedTier = tier?.toLowerCase() as SubscriptionTier;
  return STORAGE_QUOTAS[normalizedTier] || STORAGE_QUOTAS.free;
}

/**
 * Get per-video file size limit in bytes for a subscription tier
 */
export function getPerVideoLimit(tier: string): number {
  const normalizedTier = tier?.toLowerCase() as SubscriptionTier;
  return PER_VIDEO_LIMITS[normalizedTier] || PER_VIDEO_LIMITS.free;
}

/**
 * Check if user has enough storage quota for a file
 */
export function hasStorageQuota(
  currentUsage: number,
  fileSize: number,
  subscriptionTier: string
): boolean {
  const quota = getStorageQuota(subscriptionTier);
  return currentUsage + fileSize <= quota;
}

/**
 * Calculate remaining storage in bytes
 */
export function getRemainingStorage(
  currentUsage: number,
  subscriptionTier: string
): number {
  const quota = getStorageQuota(subscriptionTier);
  return Math.max(0, quota - currentUsage);
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get storage usage percentage (0-100)
 */
export function getStoragePercentage(
  currentUsage: number,
  subscriptionTier: string
): number {
  const quota = getStorageQuota(subscriptionTier);
  if (quota === 0) return 0;
  return Math.min(100, Math.round((currentUsage / quota) * 100));
}

/**
 * Get storage tier info for display
 */
export function getStorageTierInfo(subscriptionTier: string): {
  quota: number;
  quotaFormatted: string;
  tierName: string;
} {
  const quota = getStorageQuota(subscriptionTier);
  const quotaFormatted = formatBytes(quota);
  
  let tierName = 'Free';
  if (subscriptionTier === 'enthusiast') {
    tierName = 'BJJ Enthusiast';
  } else if (subscriptionTier === 'gym_pro') {
    tierName = 'Gym Pro';
  }

  return { quota, quotaFormatted, tierName };
}
