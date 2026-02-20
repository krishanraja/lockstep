// AI Assistant - Conversational AI interface for event management
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  MessageCircle,
  X,
  Lightbulb,
  Users,
  Bell,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIAssistantProps {
  eventId: string;
  eventTitle: string;
  daysUntilEvent: number | null;
  stats: {
    totalGuests: number;
    respondedCount: number;
    pendingCount: number;
    inCount: number;
  } | null;
  blocks: Array<{ id: string; name: string }>;
  onAction?: (action: AIAction) => void;
}

export interface AIAction {
  type: 'nudge' | 'schedule' | 'share' | 'export';
  payload?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'action';
  icon: typeof Users;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const AIAssistant = ({ 
  eventId, 
  eventTitle,
  daysUntilEvent,
  stats, 
  blocks,
  onAction 
}: AIAssistantProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  // Rate limit: max 1 message per 2 seconds
  const RATE_LIMIT_MS = 2000;

  // Auto-expand chat on high-priority insights
  useEffect(() => {
    if (insights.some(i => i.type === 'warning' && i.action)) {
      setIsExpanded(true);
    }
  }, [insights]);

  // Generate proactive insights based on event state
  useEffect(() => {
    if (!stats) return;

    const newInsights: Insight[] = [];

    // Pending guests insight
    if (stats.pendingCount > 0) {
      newInsights.push({
        id: 'pending',
        type: stats.pendingCount >= 3 ? 'warning' : 'info',
        icon: Users,
        title: `${stats.pendingCount} guests haven't responded`,
        description: stats.pendingCount >= 3 
          ? 'Consider sending a nudge to get responses before the deadline.'
          : 'A few guests still need to RSVP.',
        action: stats.pendingCount >= 3 ? {
          label: 'Send Nudge',
          onClick: () => onAction?.({ type: 'nudge' }),
        } : undefined,
      });
    }

    // All responded insight
    if (stats.pendingCount === 0 && stats.totalGuests > 0) {
      newInsights.push({
        id: 'all-responded',
        type: 'success',
        icon: Sparkles,
        title: 'Everyone has responded!',
        description: `${stats.inCount} guests are confirmed. You're all set!`,
      });
    }

    // Low attendance warning
    if (stats.totalGuests > 0 && stats.inCount < stats.totalGuests * 0.5 && stats.pendingCount === 0) {
      newInsights.push({
        id: 'low-attendance',
        type: 'warning',
        icon: Calendar,
        title: 'Lower than expected attendance',
        description: 'Less than half of your guests are confirmed. Consider reaching out directly.',
      });
    }

    setInsights(newInsights);
  }, [stats, onAction]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    
    // Validation
    if (!trimmedInput || isLoading) return;
    
    if (trimmedInput.length > 500) {
      setRateLimitError('Message is too long. Please keep it under 500 characters.');
      return;
    }
    
    // Rate limiting
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;
    if (timeSinceLastMessage < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastMessage) / 1000);
      setRateLimitError(`Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before sending another message.`);
      return;
    }
    
    setRateLimitError(null);
    setLastMessageTime(now);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI to generate response
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          eventId,
          eventTitle,
          totalGuests: stats?.totalGuests || 0,
          respondedCount: stats?.respondedCount || 0,
          pendingCount: stats?.pendingCount || 0,
          daysUntilEvent: daysUntilEvent ?? 0,
          userQuery: trimmedInput,
          summaryType: 'suggestions',
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.summary || getDefaultResponse(input.trim(), stats),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultResponse = (query: string, stats: AIAssistantProps['stats']): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('who') && lowerQuery.includes('coming')) {
      return `Based on current RSVPs, ${stats?.inCount || 0} guests are confirmed as attending out of ${stats?.totalGuests || 0} total.`;
    }
    
    if (lowerQuery.includes('status') || lowerQuery.includes('summary')) {
      return `Here's the current status: ${stats?.respondedCount || 0} of ${stats?.totalGuests || 0} guests have responded. ${stats?.inCount || 0} are confirmed, and ${stats?.pendingCount || 0} are still pending.`;
    }
    
    if (lowerQuery.includes('nudge') || lowerQuery.includes('remind')) {
      return `You have ${stats?.pendingCount || 0} guests who haven't responded yet. Would you like me to send them a reminder?`;
    }
    
    return `I'm here to help you manage "${eventTitle}". You can ask me about attendance, send nudges, or get a summary of responses.`;
  };

  return (
    <div className="relative">
      {/* Proactive Insights (always visible) */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb className="w-4 h-4 text-primary" />
          AI Insights
        </div>
        
        <AnimatePresence>
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${
                  insight.type === 'warning' 
                    ? 'bg-maybe/10 border-maybe/30' 
                    : insight.type === 'success'
                    ? 'bg-confirmed/10 border-confirmed/30'
                    : 'bg-card border-border/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <insight.icon className={`w-5 h-5 mt-0.5 ${
                    insight.type === 'warning' ? 'text-maybe' 
                    : insight.type === 'success' ? 'text-confirmed'
                    : 'text-primary'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    {insight.action && (
                      <button
                        onClick={insight.action.onClick}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground 
                          text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        {insight.action.label}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  No actions needed right now. Everything looks good!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Interface Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 rounded-xl bg-card border border-border/50 
          flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">Ask me anything about this event</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded Chat */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-card border border-border/50 overflow-hidden">
              {/* Messages */}
              <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Try asking:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["Who's coming?", "What's the status?", "Send nudges", "Export data"].map((suggestion, index) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setInput(suggestion);
                            handleSendMessage();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium
                            hover:bg-primary/20 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-2xl bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Rate limit error */}
              {rateLimitError && (
                <div className="px-4 py-2 border-t border-border/50 bg-maybe/10 border-b border-maybe/20">
                  <p className="text-xs text-maybe">{rateLimitError}</p>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border/50 p-3 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setRateLimitError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about attendance, send nudges..."
                  maxLength={500}
                  className="flex-1 px-4 py-2 rounded-xl bg-muted border-none outline-none
                    focus:ring-2 focus:ring-primary text-foreground text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-xl bg-primary text-primary-foreground
                    hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {input.length > 400 && (
                <div className="px-3 pb-2 text-xs text-muted-foreground text-right">
                  {input.length}/500 characters
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistant;
