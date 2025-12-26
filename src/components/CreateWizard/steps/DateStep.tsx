import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar, X } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, isSameDay } from 'date-fns';
import type { EventTemplate } from '@/data/templates/types';

interface DateStepProps {
  template: EventTemplate;
  eventName: string;
  dateRange: { start: Date; end: Date } | null;
  onDateRangeChange: (range: { start: Date; end: Date } | null) => void;
  onContinue: () => void;
}

interface WeekendOption {
  label: string;
  sublabel: string;
  start: Date;
  end: Date;
}

export function DateStep({
  template,
  eventName,
  dateRange,
  onDateRangeChange,
  onContinue,
}: DateStepProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  // Generate weekend options
  const getWeekendOptions = (): WeekendOption[] => {
    const today = new Date();
    const options: WeekendOption[] = [];
    
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(addWeeks(today, i), { weekStartsOn: 1 });
      const friday = addDays(weekStart, 4);
      const sunday = addDays(weekStart, 6);
      
      // Skip if Friday is in the past
      if (friday < today) continue;
      
      let label = '';
      if (i === 0) label = 'This Weekend';
      else if (i === 1) label = 'Next Weekend';
      else label = `In ${i} Weeks`;
      
      options.push({
        label,
        sublabel: `${format(friday, 'MMM d')} - ${format(sunday, 'MMM d')}`,
        start: friday,
        end: sunday,
      });
      
      if (options.length >= 3) break;
    }
    
    return options;
  };

  const weekendOptions = getWeekendOptions();

  const isOptionSelected = (option: WeekendOption) => {
    if (!dateRange) return false;
    return isSameDay(dateRange.start, option.start) && isSameDay(dateRange.end, option.end);
  };

  const handleOptionSelect = (option: WeekendOption) => {
    onDateRangeChange({ start: option.start, end: option.end });
  };

  const handleCustomConfirm = () => {
    if (customStart && customEnd) {
      onDateRangeChange({ 
        start: customStart, 
        end: customEnd > customStart ? customEnd : customStart 
      });
      setShowCustomPicker(false);
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
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          When?
        </h1>
        <p className="text-muted-foreground text-sm">
          {eventName}
        </p>
      </motion.div>

      {/* Options */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="space-y-3">
          {weekendOptions.map((option, index) => (
            <motion.button
              key={option.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => handleOptionSelect(option)}
              className={`
                w-full p-4 rounded-2xl
                flex items-center justify-between
                border transition-all duration-200
                ${isOptionSelected(option)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border/50 hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${isOptionSelected(option) ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium text-foreground">{option.label}</span>
              </div>
              <span className={`text-sm ${isOptionSelected(option) ? 'text-primary' : 'text-muted-foreground'}`}>
                {option.sublabel}
              </span>
            </motion.button>
          ))}

          {/* Custom date option */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: weekendOptions.length * 0.05 }}
            onClick={() => setShowCustomPicker(true)}
            className="w-full p-4 rounded-2xl
              flex items-center justify-between
              bg-card border border-border/50
              hover:border-primary/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Pick dates...</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Selected date display */}
        <AnimatePresence>
          {dateRange && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
                <span>{format(dateRange.start, 'EEE, MMM d')}</span>
                <span>→</span>
                <span>{format(dateRange.end, 'EEE, MMM d')}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: dateRange ? 1 : 0.5, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="pt-6"
      >
        <button
          onClick={onContinue}
          disabled={!dateRange}
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

      {/* Custom date picker modal */}
      <AnimatePresence>
        {showCustomPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-medium">Pick your dates</h2>
              <button
                onClick={() => setShowCustomPicker(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
              <div className="w-full max-w-sm space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={customStart ? format(customStart, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomStart(new Date(e.target.value))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full p-4 rounded-xl bg-card border border-border focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={customEnd ? format(customEnd, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setCustomEnd(new Date(e.target.value))}
                    min={customStart ? format(customStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                    className="w-full p-4 rounded-xl bg-card border border-border focus:border-primary outline-none"
                  />
                </div>
              </div>
              
              <button
                onClick={handleCustomConfirm}
                disabled={!customStart || !customEnd}
                className="w-full max-w-sm py-4 rounded-2xl
                  bg-primary text-primary-foreground font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:opacity-90 transition-opacity"
              >
                Confirm Dates
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}






