import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, RefreshCw, Calendar, MapPin, Users, Bell, Settings } from 'lucide-react';
import { format } from 'date-fns';
import type { EventTemplate } from '@/data/templates/types';
import { supabase } from '@/integrations/supabase/client';

interface ConfirmStepProps {
  template: EventTemplate;
  eventName: string;
  dateRange: { start: Date; end: Date };
  locationText: string;
  aiDescription: string;
  isGeneratingDescription: boolean;
  onRegenerateDescription: () => void;
  onCustomize: () => void;
  onConfirm: () => void;
}

export function ConfirmStep({
  template,
  eventName,
  dateRange,
  locationText,
  aiDescription,
  isGeneratingDescription,
  onRegenerateDescription,
  onCustomize,
  onConfirm,
}: ConfirmStepProps) {
  
  // Generate description on mount if not already generated
  useEffect(() => {
    if (!aiDescription && !isGeneratingDescription) {
      onRegenerateDescription();
    }
  }, []);

  const formatDateRange = () => {
    const start = format(dateRange.start, 'MMM d');
    const end = format(dateRange.end, 'MMM d, yyyy');
    return `${start} - ${end}`;
  };

  return (
    <div className="h-full flex flex-col px-6 py-8">
      {/* Header with check */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">
          {eventName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {locationText} • {formatDateRange()}
        </p>
      </motion.div>

      {/* AI Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-sm mx-auto w-full"
      >
        <div className="p-4 rounded-2xl bg-card border border-border/50">
          {isGeneratingDescription ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 text-primary animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Writing description...</span>
            </div>
          ) : (
            <>
              <p className="text-foreground text-sm leading-relaxed">
                "{aiDescription || 'Your event description will appear here...'}"
              </p>
              <button
                onClick={onRegenerateDescription}
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* What's been set up */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-6 max-w-sm mx-auto w-full space-y-3"
      >
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-confirmed" />
          </div>
          <span className="text-foreground">
            {template.blocks.length} time blocks set up
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-confirmed" />
          </div>
          <span className="text-foreground">
            {template.checkpoints.length} reminder checkpoints
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-confirmed/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-confirmed" />
          </div>
          <span className="text-foreground">
            {template.questions.length} questions for guests
          </span>
        </div>
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="pt-6 max-w-sm mx-auto w-full space-y-3"
      >
        <button
          onClick={onConfirm}
          disabled={isGeneratingDescription}
          className="w-full py-4 rounded-2xl
            bg-primary text-primary-foreground font-medium
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:opacity-90 transition-opacity"
        >
          Looks Good
          <Check className="w-5 h-5" />
        </button>
        
        <button
          onClick={onCustomize}
          className="w-full py-3 rounded-2xl
            bg-transparent text-muted-foreground font-medium
            flex items-center justify-center gap-2
            hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          Customize
        </button>
      </motion.div>
    </div>
  );
}







