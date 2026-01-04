// Smart Actions - Proactive action suggestions based on event state
import { motion } from 'framer-motion';
import { 
  Send, 
  Share2, 
  Download, 
  Clock, 
  Zap,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface SmartAction {
  id: string;
  icon: typeof Send;
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  onClick: () => void;
  disabled?: boolean;
}

interface SmartActionsProps {
  pendingCount: number;
  totalGuests: number;
  daysUntilEvent: number | null;
  onNudge: () => void;
  onShare: () => void;
  onExport: () => void;
  onScheduleReminder: () => void;
  isNudgeLoading?: boolean;
}

export const SmartActions = ({
  pendingCount,
  totalGuests,
  daysUntilEvent,
  onNudge,
  onShare,
  onExport,
  onScheduleReminder,
  isNudgeLoading,
}: SmartActionsProps) => {
  // Build smart actions based on event state
  const actions: SmartAction[] = [];

  // High priority: Nudge pending guests
  if (pendingCount > 0) {
    actions.push({
      id: 'nudge',
      icon: Send,
      label: `Nudge ${pendingCount} pending`,
      description: 'Send a friendly reminder to get responses',
      priority: pendingCount >= 3 ? 'high' : 'medium',
      onClick: onNudge,
      disabled: isNudgeLoading,
    });
  }

  // Medium priority: Share event link
  actions.push({
    id: 'share',
    icon: Share2,
    label: 'Share RSVP Link',
    description: 'Copy link to send to guests',
    priority: totalGuests === 0 ? 'high' : 'medium',
    onClick: onShare,
  });

  // Schedule reminder if event is coming up
  if (daysUntilEvent !== null && daysUntilEvent > 0 && daysUntilEvent <= 14) {
    actions.push({
      id: 'schedule',
      icon: Clock,
      label: 'Schedule Reminder',
      description: `Auto-nudge ${daysUntilEvent <= 3 ? 'tomorrow' : 'in a few days'}`,
      priority: daysUntilEvent <= 3 ? 'high' : 'medium',
      onClick: onScheduleReminder,
    });
  }

  // Export data
  if (totalGuests > 0) {
    actions.push({
      id: 'export',
      icon: Download,
      label: 'Export Guest List',
      description: 'Download as CSV for planning',
      priority: 'low',
      onClick: onExport,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const getPriorityStyles = (priority: SmartAction['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-maybe text-background hover:bg-maybe/90';
      case 'medium':
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'low':
        return 'bg-card border border-border/50 text-foreground hover:bg-muted/50';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Zap className="w-4 h-4 text-primary" />
        Quick Actions
      </div>

      <div className="grid gap-2">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all
              ${getPriorityStyles(action.priority)}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <action.icon className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs opacity-80">{action.description}</div>
            </div>
            {action.priority === 'high' && (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
          </motion.button>
        ))}
      </div>

      {/* All caught up message */}
      {pendingCount === 0 && totalGuests > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-confirmed/10 border border-confirmed/30 
            flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5 text-confirmed" />
          <span className="text-sm text-confirmed">
            All guests have responded. You're all set!
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default SmartActions;
