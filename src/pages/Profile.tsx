import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, User, Mail, Calendar, Crown, LogOut, Settings, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getSubscription, PricingTier, TIER_PRICING } from '@/services/subscription';
import { format } from 'date-fns';

interface UserSubscription {
  tier: PricingTier;
  isAnnual: boolean;
  expiresAt?: Date;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<UserSubscription>({ tier: 'free', isAnnual: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/auth');
        return;
      }

      setUser(authUser);

      // Get subscription
      const sub = await getSubscription(authUser.id);
      setSubscription({
        tier: sub.tier,
        isAnnual: sub.isAnnual,
        expiresAt: sub.expiresAt,
      });

      setIsLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getTierDisplayName = (tier: PricingTier) => {
    if (tier === 'annual_pro') return 'Annual Pro';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (isLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pricing = subscription.tier !== 'free' ? TIER_PRICING[subscription.tier] : null;

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground
              hover:bg-muted transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-foreground">Profile</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Account</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              {user?.created_at && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Member since {format(new Date(user.created_at), 'MMMM yyyy')}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Subscription</h2>
              {subscription.tier !== 'free' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {getTierDisplayName(subscription.tier)}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                <p className="text-lg font-semibold text-foreground">
                  {subscription.tier === 'free' 
                    ? 'Free' 
                    : pricing 
                      ? `${pricing.label} - $${pricing.price}${subscription.isAnnual ? '/year' : '/event'}`
                      : getTierDisplayName(subscription.tier)
                  }
                </p>
                {subscription.expiresAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews on {format(subscription.expiresAt, 'MMMM d, yyyy')}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                {subscription.tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Settings</h2>
            <div className="space-y-3">
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">Preferences</span>
                </div>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </button>
            </div>
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-xl border border-border/50 text-foreground font-medium
                flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;




