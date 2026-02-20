import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { EventTemplate } from '@/data/templates/types';

interface HostNameStepProps {
  template: EventTemplate;
  hostName: string;
  eventName: string;
  isEventNameCustomized: boolean;
  onHostNameChange: (name: string) => void;
  onEventNameChange: (name: string, isCustomized: boolean) => void;
  onContinue: () => void;
}

export function HostNameStep({
  template,
  hostName,
  eventName,
  isEventNameCustomized,
  onHostNameChange,
  onEventNameChange,
  onContinue,
}: HostNameStepProps) {
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventNameInputRef = useRef<HTMLInputElement>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Load profile name to pre-fill
  useEffect(() => {
    const loadProfileName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.display_name && !hostName) {
            setProfileName(profile.display_name);
            // Pre-fill if host name is empty
            onHostNameChange(profile.display_name);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    };
    loadProfileName();
  }, []);

  useEffect(() => {
    // Focus the input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hostName.trim()) {
      onContinue();
    }
  };

  const handleEventNameEdit = () => {
    setIsEditingEventName(true);
    setTimeout(() => eventNameInputRef.current?.focus(), 50);
  };

  const handleEventNameBlur = () => {
    setIsEditingEventName(false);
  };

  const getPromptText = () => {
    switch (template.id) {
      case 'bucks':
        return "Who's the lucky guy?";
      case 'hens':
        return "Who's the bride-to-be?";
      case 'wedding':
        return "Whose wedding is this?";
      case 'birthday':
        return "Who's celebrating?";
      case 'reunion':
        return "What's the group name?";
      case 'trip':
      case 'offsite':
        return "Who's organizing this?";
      default:
        return "Who's this for?";
    }
  };

  return (
    <div className="h-full flex flex-col px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="text-4xl mb-4">{template.icon}</div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          {getPromptText()}
        </h1>
      </motion.div>

      {/* Main input area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full"
        >
          {/* Host name input */}
          <input
            ref={inputRef}
            type="text"
            value={hostName}
            onChange={(e) => onHostNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="First name"
            className="w-full text-center text-2xl font-medium
              bg-transparent border-b-2 border-border
              focus:border-primary focus:outline-none
              py-3 placeholder:text-muted-foreground/50
              transition-colors duration-200"
          />
          {hostName.trim() && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to continue
            </p>
          )}

          {/* Generated event name */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: eventName ? 1 : 0, 
              height: eventName ? 'auto' : 0 
            }}
            transition={{ duration: 0.3 }}
            className="mt-6 text-center"
          >
            {!isEditingEventName ? (
              <button
                onClick={handleEventNameEdit}
                className="relative inline-flex items-center gap-2 text-lg text-primary font-medium
                  hover:opacity-80 transition-opacity group px-2 py-1 rounded-lg
                  hover:bg-primary/5"
              >
                <span>{eventName}</span>
                <Edit2 className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <input
                ref={eventNameInputRef}
                type="text"
                value={eventName}
                onChange={(e) => onEventNameChange(e.target.value, true)}
                onBlur={handleEventNameBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEventNameBlur();
                  }
                }}
                className="w-full text-center text-lg text-primary font-medium
                  bg-transparent border-b border-primary
                  focus:outline-none py-1"
              />
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Edit2 className="w-3 h-3" />
              Tap to customize
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: hostName.trim() ? 1 : 0.5, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="pt-6"
      >
        <button
          onClick={onContinue}
          disabled={!hostName.trim()}
          className="w-full py-4 rounded-2xl
            bg-button-bg text-button-text font-medium
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:opacity-90 transition-opacity"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}




