import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Users, MessageSquare, Zap, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PricingTier,
  TIER_LIMITS,
  TIER_PRICING,
  createCheckoutSession,
  getRecommendedTier,
} from '@/services/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventType?: string; // e.g., 'bucks', 'wedding', 'offsite'
  limitType: 'nudges' | 'guests';
  currentUsage: number;
  currentLimit: number;
  onUpgradeSuccess?: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  eventId,
  eventType,
  limitType,
  currentUsage,
  currentLimit,
  onUpgradeSuccess,
}: UpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get recommended tier based on event type
  const recommendedTier = eventType ? getRecommendedTier(eventType) : 'pro';

  const handleUpgrade = async (tier: PricingTier) => {
    setSelectedTier(tier);
    setIsLoading(true);

    const result = await createCheckoutSession({
      tier,
      eventId,
      successUrl: `${window.location.origin}/events/${eventId}?upgraded=true`,
      cancelUrl: window.location.href,
    });

    if ('url' in result && result.url) {
      window.location.href = result.url;
    } else {
      console.error('Checkout error:', result.error);
      setIsLoading(false);
      setSelectedTier(null);
    }
  };

  const tiers: PricingTier[] = ['pro', 'wedding', 'business'];

  // Generate message based on limit type
  const getMessage = () => {
    if (limitType === 'nudges') {
      return {
        title: "You've used all your nudges",
        subtitle: `${currentUsage} of ${currentLimit} nudges sent`,
        description: "Upgrade to send more reminders and ensure everyone responds.",
      };
    } else {
      return {
        title: "Guest limit reached",
        subtitle: `${currentUsage} of ${currentLimit} guests added`,
        description: "Upgrade to invite more guests to your event.",
      };
    }
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 pb-4 border-b border-border/50">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {message.title}
                  </h2>
                </div>

                <p className="text-sm text-muted-foreground">
                  {message.subtitle}
                </p>
              </div>

              {/* Usage bar */}
              <div className="px-6 py-4 bg-secondary/30">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {limitType === 'nudges' ? 'Nudges' : 'Guests'} used
                  </span>
                  <span className="font-medium text-foreground">
                    {currentUsage} / {currentLimit}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-out to-maybe rounded-full"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {message.description}
                </p>
              </div>

              {/* Tier options */}
              <div className="p-6">
                <p className="text-sm font-medium text-foreground mb-4">
                  Choose a plan for this event:
                </p>

                <div className="space-y-3">
                  {tiers.map((tier) => {
                    const pricing = TIER_PRICING[tier];
                    const limits = TIER_LIMITS[tier];
                    const isRecommended = tier === recommendedTier;

                    return (
                      <motion.button
                        key={tier}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleUpgrade(tier)}
                        disabled={isLoading}
                        className={`
                          w-full p-4 rounded-xl text-left transition-all
                          ${isRecommended 
                            ? 'bg-primary/10 border-2 border-primary/50 hover:border-primary' 
                            : 'bg-secondary/50 border border-border hover:border-primary/30'
                          }
                          ${isLoading && selectedTier === tier ? 'opacity-70' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center
                              ${isRecommended ? 'bg-primary/20' : 'bg-secondary'}
                            `}>
                              {tier === 'pro' && <MessageSquare className="w-5 h-5 text-primary" />}
                              {tier === 'wedding' && <Users className="w-5 h-5 text-primary" />}
                              {tier === 'business' && <Zap className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">
                                  {pricing.label}
                                </span>
                                {isRecommended && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {limits.guests} guests
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {limits.nudges === -1 ? '∞' : limits.nudges} nudges
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-foreground">
                              ${pricing.price}
                            </span>
                            {isLoading && selectedTier === tier ? (
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ArrowRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Feature highlights for this tier */}
                        {isRecommended && (
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/20">
                            {limits.aiSummaries && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 text-confirmed" />
                                AI summaries
                              </span>
                            )}
                            {limits.whatsapp && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 text-confirmed" />
                                WhatsApp
                              </span>
                            )}
                            {limits.export && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 text-confirmed" />
                                CSV export
                              </span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-secondary/20 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Maybe later
                  </button>
                  <a
                    href="/pricing"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Compare all plans →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpgradeModal;

