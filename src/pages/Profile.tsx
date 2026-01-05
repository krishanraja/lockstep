// Profile - Complete user profile with avatar, phone verification, and preferences
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Mail, 
  Calendar, 
  Crown, 
  LogOut, 
  Settings, 
  ArrowRight,
  User,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getSubscription, PricingTier, TIER_PRICING } from '@/services/subscription';
import { format } from 'date-fns';
import { AvatarUpload, PhoneVerification, PreferencesPanel } from '@/components/Profile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface UserSubscription {
  tier: PricingTier;
  isAnnual: boolean;
  expiresAt?: Date;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  timezone: string;
  preferences: {
    notifications: {
      email_updates: boolean;
      sms_reminders: boolean;
      marketing: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
}

const DEFAULT_PREFERENCES = {
  notifications: {
    email_updates: true,
    sms_reminders: true,
    marketing: false,
  },
  theme: 'system' as const,
  language: 'en',
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription>({ tier: 'free', isAnnual: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/auth');
        return;
      }

      setUser(authUser);

      // Get or create profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      // If no profile exists, create one
      if (profileError && profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ user_id: authUser.id })
          .select()
          .single();
        
        if (!createError) {
          profileData = newProfile;
        }
      }

      if (profileData) {
        const prefs = profileData.preferences || DEFAULT_PREFERENCES;
        setProfile({
          ...profileData,
          preferences: {
            notifications: prefs.notifications || DEFAULT_PREFERENCES.notifications,
            theme: prefs.theme || DEFAULT_PREFERENCES.theme,
            language: prefs.language || DEFAULT_PREFERENCES.language,
          },
        });
        setDisplayName(profileData.display_name || '');
      }

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

  const handleSaveDisplayName = async () => {
    if (!user || !profile) return;
    
    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() || null })
        .eq('user_id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, display_name: displayName.trim() || null } : null);
      }
    } catch (err) {
      console.error('Error saving display name:', err);
    } finally {
      setIsSavingName(false);
    }
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
          {/* Avatar & Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-6">Account</h2>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile && (
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    onAvatarChange={(url) => {
                      setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                    }}
                  />
                )}
              </div>

              {/* Account Info */}
              <div className="flex-1 space-y-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Display Name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="display_name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="bg-background"
                    />
                    <Button
                      onClick={handleSaveDisplayName}
                      disabled={isSavingName || displayName === (profile?.display_name || '')}
                      size="sm"
                    >
                      {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{user?.email}</span>
                </div>

                {/* Member Since */}
                {user?.created_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Member since {format(new Date(user.created_at), 'MMMM yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Phone Verification Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Phone Verification</h2>
            {profile && (
              <PhoneVerification
                userId={user.id}
                currentPhone={profile.phone}
                isVerified={!!profile.phone_verified_at}
                onPhoneChange={(phone, verified) => {
                  setProfile(prev => prev ? {
                    ...prev,
                    phone,
                    phone_verified_at: verified ? new Date().toISOString() : null,
                  } : null);
                }}
              />
            )}
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card border border-border/50 p-6"
          >
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                Preferences
              </h2>
              <ChevronLeft className={`w-5 h-5 text-muted-foreground transition-transform 
                ${showPreferences ? '-rotate-90' : 'rotate-180'}`} />
            </button>

            {showPreferences && profile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-border/50"
              >
                <PreferencesPanel
                  userId={user.id}
                  preferences={profile.preferences}
                  timezone={profile.timezone}
                  onPreferencesChange={(prefs) => {
                    setProfile(prev => prev ? { ...prev, preferences: prefs } : null);
                  }}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
