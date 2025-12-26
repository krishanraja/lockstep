import { motion } from 'framer-motion';
import { templates } from '@/data/templates';
import type { EventTemplate } from '@/data/templates/types';

interface EventTypeStepProps {
  onSelect: (template: EventTemplate) => void;
}

export function EventTypeStep({ onSelect }: EventTypeStepProps) {
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
          {templates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.04,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={() => onSelect(template)}
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
