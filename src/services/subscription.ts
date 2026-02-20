// Subscription and Billing Service
// Handles plan limits, usage tracking, and Stripe checkout

import { supabase } from '@/integrations/supabase/client';

// Tier types
export type PricingTier = 'free' | 'pro' | 'wedding' | 'business' | 'annual_pro';

// Feature limits per tier
export interface TierLimits {
  guests: number;
  nudges: number; // -1 = unlimited
  eventsLimit: number; // -1 = unlimited
  aiSummaries: boolean;
  whatsapp: boolean;
  export: boolean;
  priorityAi: boolean;
  analytics: boolean;
  teamAccess: boolean;
  unlimitedEvents: boolean;
}

// Default limits per tier
export const TIER_LIMITS: Record<PricingTier, TierLimits> = {
  free: {
    guests: 15,
    nudges: 3,
    eventsLimit: 3,
    aiSummaries: false,
    whatsapp: false,
    export: false,
    priorityAi: false,
    analytics: false,
    teamAccess: false,
    unlimitedEvents: false,
  },
  pro: {
    guests: 75,
    nudges: 20,
    eventsLimit: -1, // unlimited
    aiSummaries: true,
    whatsapp: true,
    export: false,
    priorityAi: false,
    analytics: false,
    teamAccess: false,
    unlimitedEvents: true,
  },
  wedding: {
    guests: 150,
    nudges: -1,
    eventsLimit: -1,
    aiSummaries: true,
    whatsapp: true,
    export: true,
    priorityAi: true,
    analytics: false,
    teamAccess: false,
    unlimitedEvents: true,
  },
  business: {
    guests: 200,
    nudges: -1,
    eventsLimit: -1,
    aiSummaries: true,
    whatsapp: true,
    export: true,
    priorityAi: true,
    analytics: true,
    teamAccess: true,
    unlimitedEvents: true,
  },
  annual_pro: {
    guests: 75,
    nudges: 20,
    eventsLimit: -1,
    aiSummaries: true,
    whatsapp: true,
    export: false,
    priorityAi: false,
    analytics: false,
    teamAccess: false,
    unlimitedEvents: true,
  },
};

// Pricing per tier
export const TIER_PRICING: Record<PricingTier, { price: number; label: string; description: string }> = {
  free: {
    price: 0,
    label: 'Free',
    description: 'Perfect for small gatherings',
  },
  pro: {
    price: 29,
    label: 'Pro',
    description: 'For bucks, hens, birthdays & trips',
  },
  wedding: {
    price: 49,
    label: 'Wedding',
    description: 'For wedding weekends',
  },
  business: {
    price: 99,
    label: 'Business',
    description: 'For corporate offsites & retreats',
  },
  annual_pro: {
    price: 149,
    label: 'Annual Pro',
    description: 'Unlimited events, billed yearly',
  },
};

// Subscription status
export interface SubscriptionStatus {
  tier: PricingTier;
  isAnnual: boolean;
  limits: TierLimits;
  stripeCustomerId?: string;
  expiresAt?: Date;
}

// Event usage info
export interface EventUsage {
  eventId: string;
  tier: PricingTier;
  guestsUsed: number;
  guestsLimit: number;
  nudgesUsed: number;
  nudgesLimit: number;
  addons: string[];
}

// Limit check result
export interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  upgradeRequired: boolean;
  suggestedTier?: PricingTier;
}

/**
 * Get user's subscription status
 */
export async function getSubscription(userId: string): Promise<SubscriptionStatus> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!subscription || subscription.tier === 'free' || !subscription.tier) {
    return {
      tier: 'free',
      isAnnual: false,
      limits: TIER_LIMITS.free,
    };
  }

  const tier = subscription.tier as PricingTier;
  return {
    tier,
    isAnnual: tier === 'annual_pro',
    limits: TIER_LIMITS[tier] || TIER_LIMITS.free,
    stripeCustomerId: subscription.stripe_customer_id || undefined,
    expiresAt: subscription.current_period_end 
      ? new Date(subscription.current_period_end) 
      : undefined,
  };
}

/**
 * Get event purchase/tier info
 */
export async function getEventPurchase(eventId: string): Promise<{
  tier: PricingTier;
  addons: string[];
  limits: TierLimits;
} | null> {
  const { data: purchase } = await supabase
    .from('event_purchases')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'completed')
    .single();

  if (!purchase) {
    return null;
  }

  const tier = purchase.tier as PricingTier;
  return {
    tier,
    addons: (purchase.addons as string[]) || [],
    limits: TIER_LIMITS[tier] || TIER_LIMITS.free,
  };
}

/**
 * Get effective tier for an event (considers both event purchase and user subscription)
 */
export async function getEventTier(eventId: string, userId: string): Promise<{
  tier: PricingTier;
  limits: TierLimits;
  addons: string[];
}> {
  // Check for event-specific purchase first
  const eventPurchase = await getEventPurchase(eventId);
  if (eventPurchase) {
    return eventPurchase;
  }

  // Check user's subscription
  const subscription = await getSubscription(userId);
  if (subscription.tier === 'annual_pro') {
    // Annual subscribers get Pro features on all events
    return {
      tier: 'annual_pro',
      limits: TIER_LIMITS.annual_pro,
      addons: [],
    };
  }

  // Default to free tier
  return {
    tier: 'free',
    limits: TIER_LIMITS.free,
    addons: [],
  };
}

/**
 * Get usage stats for an event
 */
export async function getEventUsage(eventId: string, userId: string): Promise<EventUsage> {
  const tierInfo = await getEventTier(eventId, userId);

  // Get guest count
  const { count: guestCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  // Get nudge count
  const { count: nudgeCount } = await supabase
    .from('nudges')
    .select('*', { count: 'exact', head: true })
    .eq('checkpoint_id', eventId);

  // Also check event's nudges_sent counter
  const { data: event } = await supabase
    .from('events')
    .select('nudges_sent')
    .eq('id', eventId)
    .single();

  const nudgesUsed = event?.nudges_sent || nudgeCount || 0;

  return {
    eventId,
    tier: tierInfo.tier,
    guestsUsed: guestCount || 0,
    guestsLimit: tierInfo.limits.guests,
    nudgesUsed,
    nudgesLimit: tierInfo.limits.nudges,
    addons: tierInfo.addons,
  };
}

/**
 * Check if a specific limit allows an action
 */
export async function checkLimit(
  eventId: string,
  userId: string,
  limitType: 'guests' | 'nudges'
): Promise<LimitCheckResult> {
  const usage = await getEventUsage(eventId, userId);

  let used: number;
  let limit: number;

  if (limitType === 'guests') {
    used = usage.guestsUsed;
    limit = usage.guestsLimit;
  } else {
    used = usage.nudgesUsed;
    limit = usage.nudgesLimit;
  }

  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: -1,
      used,
      upgradeRequired: false,
    };
  }

  const remaining = Math.max(0, limit - used);
  const allowed = used < limit;

  // Suggest upgrade tier based on current tier
  let suggestedTier: PricingTier | undefined;
  if (!allowed) {
    if (usage.tier === 'free') {
      suggestedTier = 'pro';
    } else if (usage.tier === 'pro') {
      suggestedTier = limitType === 'guests' ? 'wedding' : 'wedding';
    } else if (usage.tier === 'wedding') {
      suggestedTier = 'business';
    }
  }

  return {
    allowed,
    remaining,
    limit,
    used,
    upgradeRequired: !allowed,
    suggestedTier,
  };
}

/**
 * Check if user can send a nudge for an event
 */
export async function canSendNudge(eventId: string, userId: string): Promise<LimitCheckResult> {
  return checkLimit(eventId, userId, 'nudges');
}

/**
 * Check if user can add more guests to an event
 */
export async function canAddGuest(eventId: string, userId: string): Promise<LimitCheckResult> {
  return checkLimit(eventId, userId, 'guests');
}

/**
 * Increment nudge count for an event
 */
export async function incrementNudgeCount(eventId: string): Promise<void> {
  const { data: event } = await supabase
    .from('events')
    .select('nudges_sent')
    .eq('id', eventId)
    .single();

  await supabase
    .from('events')
    .update({ nudges_sent: (event?.nudges_sent || 0) + 1 })
    .eq('id', eventId);
}

/**
 * Create Stripe checkout session for upgrade
 */
export async function createCheckoutSession(params: {
  tier: PricingTier;
  eventId?: string;
  addons?: string[];
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string } | { error: string }> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: params,
  });

  if (error) {
    console.error('Checkout error:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }

  return {
    url: data.url,
    sessionId: data.sessionId,
  };
}

/**
 * Get recommended tier based on event type
 */
export function getRecommendedTier(eventType: string): PricingTier {
  const eventTypeLower = eventType.toLowerCase();
  
  if (eventTypeLower.includes('offsite') || eventTypeLower.includes('retreat') || eventTypeLower.includes('corporate')) {
    return 'business';
  }
  
  if (eventTypeLower.includes('wedding')) {
    return 'wedding';
  }
  
  // Default for bucks, hens, birthday, trip, reunion, etc.
  return 'pro';
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Get tier display info
 */
export function getTierInfo(tier: PricingTier): {
  name: string;
  price: string;
  features: string[];
} {
  const pricing = TIER_PRICING[tier];
  const limits = TIER_LIMITS[tier];

  const features: string[] = [];

  if (limits.guests === -1) {
    features.push('Unlimited guests');
  } else {
    features.push(`Up to ${limits.guests} guests`);
  }

  if (limits.nudges === -1) {
    features.push('Unlimited nudges');
  } else {
    features.push(`${limits.nudges} nudges`);
  }

  if (limits.aiSummaries) features.push('AI summaries');
  if (limits.whatsapp) features.push('WhatsApp messaging');
  if (limits.export) features.push('CSV export');
  if (limits.priorityAi) features.push('Priority AI');
  if (limits.analytics) features.push('Analytics');
  if (limits.teamAccess) features.push('Team access');
  if (limits.unlimitedEvents) features.push('Unlimited events');

  return {
    name: pricing.label,
    price: tier === 'annual_pro' 
      ? `$${pricing.price}/year` 
      : tier === 'free' 
        ? 'Free' 
        : `$${pricing.price}/event`,
    features,
  };
}

/**
 * Check if user can create more events
 */
export async function canCreateEvent(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  eventsUsed?: number;
  eventsLimit?: number;
}> {
  // Get user's subscription
  const subscription = await getSubscription(userId);
  const limits = subscription.limits;

  // Unlimited events
  if (limits.eventsLimit === -1 || limits.unlimitedEvents) {
    return { allowed: true };
  }

  // Count user's existing events
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organiser_id', userId);

  if (error) {
    console.error('[canCreateEvent] Error counting events:', error);
    return {
      allowed: false,
      reason: 'Failed to check event limit',
    };
  }

  const eventsUsed = count || 0;
  const eventsLimit = limits.eventsLimit;

  if (eventsUsed >= eventsLimit) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${eventsLimit} events. Upgrade to Pro for unlimited events.`,
      eventsUsed,
      eventsLimit,
    };
  }

  return {
    allowed: true,
    eventsUsed,
    eventsLimit,
  };
}
