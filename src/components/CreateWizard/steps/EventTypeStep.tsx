import { motion } from 'framer-motion';
import { templates } from '@/data/templates';
import type { EventTemplate } from '@/data/templates/types';

interface EventTypeStepProps {
  onSelect: (template: EventTemplate) => void;
}

export function EventTypeStep({ onSelect }: EventTypeStepProps) {
  return (
    <div className="h-full flex flex-col px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          What are we planning?
        </h1>
        <p className="text-muted-foreground text-sm">
          Pick one and we'll set everything up for you
        </p>
      </motion.div>

      {/* Event type grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {templates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={() => onSelect(template)}
              className={`
                relative p-4 rounded-2xl
                bg-card border border-border/50
                hover:border-primary/50 hover:bg-card/80
                transition-all duration-200
                flex flex-col items-center justify-center
                aspect-square
                group
                ${template.id === 'custom' ? 'col-span-2 aspect-auto py-4' : ''}
              `}
            >
              {/* Icon */}
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                {template.icon}
              </span>
              
              {/* Label */}
              <span className="font-medium text-foreground text-sm">
                {template.label}
              </span>
              
              {/* Subtitle */}
              <span className="text-xs text-muted-foreground mt-0.5">
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

