import { motion } from 'framer-motion';
import { Users, MessageSquare, Sparkles, Crown } from 'lucide-react';
import { PricingTier, TIER_LIMITS, TIER_PRICING } from '@/services/subscription';

interface UsageIndicatorProps {
  type: 'guests' | 'nudges';
  used: number;
  limit: number;
  tier: PricingTier;
  showUpgradeHint?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function UsageIndicator({
  type,
  used,
  limit,
  tier,
  showUpgradeHint = true,
  compact = false,
  onClick,
}: UsageIndicatorProps) {
  // Calculate percentage and status
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
  const isAtLimit = !isUnlimited && used >= limit;
  const isNearLimit = !isUnlimited && percentage >= 75;

  // Color based on usage
  const getColor = () => {
    if (isAtLimit) return 'hsl(var(--out))';
    if (isNearLimit) return 'hsl(var(--maybe))';
    return 'hsl(var(--confirmed))';
  };

  const Icon = type === 'guests' ? Users : MessageSquare;
  const label = type === 'guests' ? 'Guests' : 'Nudges';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          ${isAtLimit 
            ? 'bg-out/10 text-out' 
            : isNearLimit 
              ? 'bg-maybe/10 text-maybe' 
              : 'bg-secondary text-muted-foreground'
          }
          ${onClick ? 'hover:bg-secondary/80 cursor-pointer' : ''}
          transition-colors
        `}
      >
        <Icon className="w-4 h-4" />
        <span>
          {isUnlimited ? used : `${used}/${limit}`}
        </span>
        {isAtLimit && showUpgradeHint && (
          <Crown className="w-3 h-3 text-primary" />
        )}
      </button>
    );
  }

  return (
    <div 
      className={`
        p-4 rounded-xl border 
        ${isAtLimit 
          ? 'bg-out/5 border-out/20' 
          : 'bg-card border-border/50'
        }
        ${onClick ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`
            p-1.5 rounded-lg
            ${isAtLimit ? 'bg-out/20' : 'bg-secondary'}
          `}>
            <Icon className={`w-4 h-4 ${isAtLimit ? 'text-out' : 'text-muted-foreground'}`} />
          </div>
          <span className="font-medium text-foreground">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isAtLimit ? 'text-out' : 'text-foreground'}`}>
            {isUnlimited ? (
              <>
                {used} <span className="text-muted-foreground">/ ∞</span>
              </>
            ) : (
              <>
                {used} <span className="text-muted-foreground">/ {limit}</span>
              </>
            )}
          </span>
          {tier !== 'free' && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {TIER_PRICING[tier].label}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: getColor() }}
          />
        </div>
      )}

      {/* Status message */}
      {showUpgradeHint && (
        <div className="mt-2 flex items-center justify-between">
          {isAtLimit ? (
            <p className="text-sm text-out flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Upgrade for more {type}
            </p>
          ) : isNearLimit ? (
            <p className="text-sm text-maybe">
              {remaining} {type} remaining
            </p>
          ) : isUnlimited ? (
            <p className="text-sm text-confirmed flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Unlimited {type}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {remaining} {type} remaining
            </p>
          )}

          {isAtLimit && onClick && (
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">
              Upgrade →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface UsageSummaryProps {
  guestsUsed: number;
  guestsLimit: number;
  nudgesUsed: number;
  nudgesLimit: number;
  tier: PricingTier;
  onUpgradeClick?: () => void;
}

export function UsageSummary({
  guestsUsed,
  guestsLimit,
  nudgesUsed,
  nudgesLimit,
  tier,
  onUpgradeClick,
}: UsageSummaryProps) {
  const isFreeTier = tier === 'free';
  const guestsAtLimit = guestsLimit !== -1 && guestsUsed >= guestsLimit;
  const nudgesAtLimit = nudgesLimit !== -1 && nudgesUsed >= nudgesLimit;
  const anyAtLimit = guestsAtLimit || nudgesAtLimit;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Usage</h3>
        {isFreeTier && (
          <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded-full">
            Free Tier
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <UsageIndicator
          type="guests"
          used={guestsUsed}
          limit={guestsLimit}
          tier={tier}
          compact
          onClick={guestsAtLimit ? onUpgradeClick : undefined}
        />
        <UsageIndicator
          type="nudges"
          used={nudgesUsed}
          limit={nudgesLimit}
          tier={tier}
          compact
          onClick={nudgesAtLimit ? onUpgradeClick : undefined}
        />
      </div>

      {anyAtLimit && isFreeTier && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onUpgradeClick}
          className="w-full py-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Upgrade to unlock more
        </motion.button>
      )}
    </div>
  );
}

export default UsageIndicator;









