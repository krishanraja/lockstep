import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { templates } from '@/data/templates';
import type { EventTemplate } from '@/data/templates/types';

interface EventTypeStepProps {
  onSelect: (template: EventTemplate) => void;
}

// Get recently used templates from localStorage
function getRecentTemplates(): string[] {
  try {
    const recent = localStorage.getItem('lockstep_recent_templates');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

// Save template to recent list
function saveRecentTemplate(templateId: string) {
  try {
    const recent = getRecentTemplates();
    const updated = [templateId, ...recent.filter(id => id !== templateId)].slice(0, 3);
    localStorage.setItem('lockstep_recent_templates', JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

export function EventTypeStep({ onSelect }: EventTypeStepProps) {
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);

  useEffect(() => {
    setRecentTemplateIds(getRecentTemplates());
  }, []);

  const handleSelect = (template: EventTemplate) => {
    saveRecentTemplate(template.id);
    onSelect(template);
  };

  const recentTemplates = recentTemplateIds
    .map(id => templates.find(t => t.id === id))
    .filter((t): t is EventTemplate => t !== undefined);
  
  const otherTemplates = templates.filter(t => !recentTemplateIds.includes(t.id));
  return (
    <div className="h-full flex flex-col px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-6 flex-shrink-0"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          What are we planning?
        </h1>
        <p className="text-muted-foreground text-sm">
          Pick one and we'll set everything up for you
        </p>
      </motion.div>

      {/* Event type grid - scrollable on mobile */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-safe">
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm mx-auto">
          {/* Recent templates section */}
          {recentTemplates.length > 0 && (
            <>
              <div className="col-span-2 flex items-center gap-2 mb-2 mt-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Recently used</span>
              </div>
              {recentTemplates.map((template, index) => (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.04,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  onClick={() => handleSelect(template)}
                  className="
                    relative py-5 px-3 rounded-2xl
                    bg-primary/5 border-2 border-primary/30
                    hover:border-primary/50 hover:bg-primary/10
                    active:scale-[0.98]
                    transition-all duration-200
                    flex flex-col items-center justify-center
                    group
                  "
                >
                  <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-200">
                    {template.icon}
                  </span>
                  <span className="font-medium text-foreground text-sm">
                    {template.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 text-center leading-tight">
                    {template.subtitle}
                  </span>
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                </motion.button>
              ))}
              {otherTemplates.length > 0 && (
                <div className="col-span-2 flex items-center gap-2 mb-2 mt-4">
                  <span className="text-xs text-muted-foreground font-medium">All event types</span>
                </div>
              )}
            </>
          )}
          
          {/* All templates */}
          {otherTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: (recentTemplates.length + index) * 0.04,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={() => handleSelect(template)}
              className="
                relative py-5 px-3 rounded-2xl
                bg-card border border-border/50
                hover:border-primary/50 hover:bg-card/80
                active:scale-[0.98]
                transition-all duration-200
                flex flex-col items-center justify-center
                group
              "
            >
              {/* Icon */}
              <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-200">
                {template.icon}
              </span>
              
              {/* Label */}
              <span className="font-medium text-foreground text-sm">
                {template.label}
              </span>
              
              {/* Subtitle */}
              <span className="text-[11px] text-muted-foreground mt-0.5 text-center leading-tight">
                {template.subtitle}
              </span>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
