// PreferencesPanel - Full preferences settings panel
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  Globe, 
  Languages,
  Check,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PreferencesPanelProps {
  userId: string;
  preferences: {
    notifications: {
      email_updates: boolean;
      sms_reminders: boolean;
      marketing: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  timezone: string;
  onPreferencesChange: (prefs: any) => void;
}

// Common timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Toronto', label: 'Toronto' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { value: 'UTC', label: 'UTC' },
];

// Languages
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

export const PreferencesPanel = ({
  userId,
  preferences: initialPreferences,
  timezone: initialTimezone,
  onPreferencesChange,
}: PreferencesPanelProps) => {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [isSaving, setIsSaving] = useState(false);
  const [savedField, setSavedField] = useState<string | null>(null);

  // Detect timezone from browser
  useEffect(() => {
    if (!initialTimezone || initialTimezone === 'UTC') {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (TIMEZONES.some(tz => tz.value === browserTimezone)) {
        setTimezone(browserTimezone);
      }
    }
  }, [initialTimezone]);

  // Apply theme when it changes
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme(preferences.theme);

    // Listen for system theme changes
    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [preferences.theme]);

  const savePreference = async (field: string, value: any) => {
    setIsSaving(true);
    setSavedField(null);

    try {
      let updateData: any = {};

      if (field === 'timezone') {
        updateData.timezone = value;
      } else {
        updateData.preferences = {
          ...preferences,
          ...value,
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      setSavedField(field);
      setTimeout(() => setSavedField(null), 2000);

      if (field !== 'timezone') {
        onPreferencesChange({ ...preferences, ...value });
      }
    } catch (err) {
      console.error('Error saving preference:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = {
      ...preferences.notifications,
      [key]: value,
    };
    setPreferences(prev => ({
      ...prev,
      notifications: newNotifications,
    }));
    savePreference('notifications', { notifications: newNotifications });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setPreferences(prev => ({ ...prev, theme }));
    savePreference('theme', { theme });
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    savePreference('timezone', tz);
  };

  const handleLanguageChange = (lang: string) => {
    setPreferences(prev => ({ ...prev, language: lang }));
    savePreference('language', { language: lang });
  };

  const SaveIndicator = ({ field }: { field: string }) => (
    savedField === field && (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="text-confirmed"
      >
        <Check className="w-4 h-4" />
      </motion.span>
    )
  );

  return (
    <div className="space-y-6">
      {/* Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Bell className="w-4 h-4 text-muted-foreground" />
          Notifications
        </div>

        <div className="space-y-3 pl-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_updates" className="text-foreground">
                Email Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email notifications about your events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SaveIndicator field="notifications" />
              <Switch
                id="email_updates"
                checked={preferences.notifications.email_updates}
                onCheckedChange={(checked) => handleNotificationChange('email_updates', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms_reminders" className="text-foreground">
                SMS Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Get text message reminders for upcoming events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="sms_reminders"
                checked={preferences.notifications.sms_reminders}
                onCheckedChange={(checked) => handleNotificationChange('sms_reminders', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing" className="text-foreground">
                Marketing
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive tips, updates, and promotional content
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="marketing"
                checked={preferences.notifications.marketing}
                onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sun className="w-4 h-4 text-muted-foreground" />
          Appearance
        </div>

        <div className="grid grid-cols-3 gap-2 pl-6">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value as 'light' | 'dark' | 'system')}
              className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                ${preferences.theme === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div className="pl-6">
          <SaveIndicator field="theme" />
        </div>
      </div>

      {/* Regional Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="w-4 h-4 text-muted-foreground" />
          Regional
        </div>

        <div className="space-y-4 pl-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              Timezone
              <SaveIndicator field="timezone" />
            </Label>
            <select
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border
                text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              Language
              <SaveIndicator field="language" />
            </Label>
            <select
              value={preferences.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border
                text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
};

export default PreferencesPanel;
