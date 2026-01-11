import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Users, MessageSquare, Zap, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  PricingTier, 
  TIER_LIMITS, 
  TIER_PRICING, 
  createCheckoutSession,
  getSubscription,
} from '@/services/subscription';

interface PricingCardProps {
  tier: PricingTier;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  eventId?: string;
  onSelect: (tier: PricingTier) => void;
  isLoading?: boolean;
}

function PricingCard({ 
  tier, 
  isPopular, 
  isCurrentPlan,
  isRecommended,
  eventId,
  onSelect,
  isLoading,
}: PricingCardProps) {
  const pricing = TIER_PRICING[tier];
  const limits = TIER_LIMITS[tier];

  const features = [
    {
      text: limits.guests === -1 ? 'Unlimited guests' : `Up to ${limits.guests} guests`,
      icon: Users,
      included: true,
    },
    {
      text: limits.nudges === -1 ? 'Unlimited nudges' : `${limits.nudges} nudges`,
      icon: MessageSquare,
      included: true,
    },
    {
      text: 'AI-powered summaries',
      icon: Sparkles,
      included: limits.aiSummaries,
    },
    {
      text: 'WhatsApp messaging',
      icon: MessageSquare,
      included: limits.whatsapp,
    },
    {
      text: 'CSV export',
      icon: BarChart3,
      included: limits.export,
    },
    {
      text: 'Priority AI responses',
      icon: Zap,
      included: limits.priorityAi,
    },
    {
      text: 'Analytics dashboard',
      icon: BarChart3,
      included: limits.analytics,
    },
    {
      text: 'Team access',
      icon: Users,
      included: limits.teamAccess,
    },
  ].filter(f => f.included || tier !== 'free');

  const priceDisplay = tier === 'free' 
    ? '$0' 
    : tier === 'annual_pro' 
      ? `$${pricing.price}` 
      : `$${pricing.price}`;

  const priceSubtext = tier === 'annual_pro' 
    ? '/year' 
    : tier === 'free' 
      ? 'forever' 
      : '/event';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        relative rounded-2xl p-6 flex flex-col
        ${isPopular 
          ? 'bg-gradient-to-b from-primary/20 to-card border-2 border-primary/50' 
          : 'bg-card border border-border/50'
        }
        ${isCurrentPlan ? 'ring-2 ring-confirmed/50' : ''}
      `}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}


      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-1">
          {pricing.label}
        </h3>
        <p className="text-sm text-muted-foreground">
          {pricing.description}
        </p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{priceDisplay}</span>
        <span className="text-muted-foreground ml-1">{priceSubtext}</span>
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        {features.slice(0, 6).map((feature, index) => (
          <li 
            key={index} 
            className={`flex items-center gap-2 text-sm ${
              feature.included ? 'text-foreground' : 'text-muted-foreground/50'
            }`}
          >
            <Check className={`w-4 h-4 flex-shrink-0 ${
              feature.included ? 'text-confirmed' : 'text-muted-foreground/30'
            }`} />
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier)}
        disabled={isLoading || isCurrentPlan}
        className={`w-full ${
          isPopular 
            ? 'bg-primary hover:bg-primary/90' 
            : tier === 'free'
              ? 'bg-secondary hover:bg-secondary/80 text-foreground'
              : 'bg-button-bg text-button-text hover:bg-button-bg/90'
        }`}
      >
        {isCurrentPlan ? 'Active' : tier === 'free' ? 'Get Started' : 'Upgrade'}
        {!isCurrentPlan && tier !== 'free' && <ArrowRight className="w-4 h-4 ml-2" />}
      </Button>
    </motion.div>
  );
}

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event') || undefined;
  
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<PricingTier>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<PricingTier | null>(null);
  const [recommendedTier, setRecommendedTier] = useState<PricingTier | null>(null);
  
  // Get tier from URL params (preserved after auth redirect)
  const tierFromUrl = searchParams.get('tier') as PricingTier | null;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const subscription = await getSubscription(user.id);
        setCurrentTier(subscription.tier);
        
        // Get usage-based recommendation if eventId provided
        if (eventId) {
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
              // Get event usage
              const { getEventUsage } = await import('@/services/subscription');
              const usage = await getEventUsage(eventId, authUser.id);
              
              // Recommend tier based on usage
              if (usage.guestsUsed >= 10 || usage.nudgesUsed >= 2) {
                if (usage.guestsUsed >= 100) {
                  setRecommendedTier('wedding');
                } else if (usage.guestsUsed >= 50) {
                  setRecommendedTier('pro');
                } else {
                  setRecommendedTier('pro');
                }
              }
            }
          } catch (err) {
            // Ignore errors
          }
        }
      }
    };

    checkAuth();
  }, [eventId]);
  
  // Auto-select tier from URL if present (after auth redirect)
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (tierFromUrl && ['pro', 'wedding', 'business', 'annual_pro'].includes(tierFromUrl) && user && !isLoading && !hasAutoSelectedRef.current) {
      // Only auto-select once, if user is logged in and we haven't already selected
      if (currentTier === 'free' && loadingTier === null) {
        hasAutoSelectedRef.current = true;
        // Small delay to ensure UI is ready, then auto-select
        const timer = setTimeout(() => {
          handleSelectTier(tierFromUrl);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFromUrl, user]);

  const handleSelectTier = async (tier: PricingTier) => {
    if (tier === 'free') {
      navigate('/dashboard');
      return;
    }

    if (!user) {
      // Redirect to auth with return URL, preserving tier selection
      const returnUrl = eventId 
        ? `/pricing?event=${eventId}&tier=${tier}`
        : `/pricing?tier=${tier}`;
      navigate(`/auth?returnTo=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsLoading(true);
    setLoadingTier(tier);

    const result = await createCheckoutSession({
      tier,
      eventId,
      successUrl: eventId 
        ? `${window.location.origin}/events/${eventId}?upgraded=true`
        : `${window.location.origin}/dashboard?upgraded=true`,
      cancelUrl: window.location.href,
    });

    if ('url' in result && result.url) {
      window.location.href = result.url;
    } else {
      console.error('Checkout error:', result.error);
      setIsLoading(false);
      setLoadingTier(null);
    }
  };

  const tiers: PricingTier[] = ['free', 'pro', 'wedding', 'business'];

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. No subscriptions required for single events.
          </p>
        </motion.div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <PricingCard
                tier={tier}
                isPopular={tier === 'pro'}
                isCurrentPlan={tier === currentTier}
                isRecommended={tier === recommendedTier}
                eventId={eventId}
                onSelect={handleSelectTier}
                isLoading={isLoading && loadingTier === tier}
              />
            </motion.div>
          ))}
          {/* Annual Pro in main grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <PricingCard
              tier="annual_pro"
              isPopular={false}
              isCurrentPlan={currentTier === 'annual_pro'}
              isRecommended={false}
              eventId={eventId}
              onSelect={handleSelectTier}
              isLoading={isLoading && loadingTier === 'annual_pro'}
            />
          </motion.div>
        </div>

        {/* Usage-based recommendation banner */}
        {recommendedTier && recommendedTier !== currentTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative rounded-2xl p-6 bg-confirmed/10 border border-confirmed/30 mb-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  Recommended for your event
                </h3>
                <p className="text-muted-foreground">
                  Based on your current usage, we recommend the {TIER_PRICING[recommendedTier].label} plan.
                </p>
              </div>
              <Button
                onClick={() => handleSelectTier(recommendedTier)}
                disabled={isLoading}
                className="bg-confirmed hover:bg-confirmed/90 whitespace-nowrap"
              >
                Upgrade to {TIER_PRICING[recommendedTier].label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FaqItem
              question="Can I try Lockstep for free?"
              answer="Yes! The free tier lets you create unlimited events with up to 15 guests each and 3 nudges per event. Perfect for small gatherings."
            />
            <FaqItem
              question="What happens when I upgrade a single event?"
              answer="When you purchase a tier for an event, those features apply only to that specific event. You pay once per event, no subscription needed."
            />
            <FaqItem
              question="Which tier should I choose for my wedding?"
              answer="We recommend the Wedding tier ($49) for wedding weekends. It includes 150 guests, unlimited nudges, and CSV export for vendor coordination."
            />
            <FaqItem
              question="What about corporate events?"
              answer="The Business tier ($99) is designed for corporate offsites and retreats with team access, analytics, and support for up to 200 guests."
            />
            <FaqItem
              question="Can I get a refund?"
              answer="Yes, we offer full refunds within 7 days of purchase if you haven't sent any nudges to your guests."
            />
          </div>
        </motion.div>

        {/* Back to dashboard link */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {user ? '← Back to Dashboard' : '← Back to Home'}
          </button>
        </div>
        </div>
      </main>
    </div>
  );
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-card/50 transition-colors"
      >
        <span className="font-medium text-foreground">{question}</span>
        <span className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="px-6 pb-4"
        >
          <p className="text-muted-foreground">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default Pricing;


