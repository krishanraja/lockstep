// Voice FAB - Floating action button for voice commands
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';
import { useVoiceCommands, VoiceCommand, generateVoiceResponse } from '@/hooks/use-voice-commands';

interface VoiceFABProps {
  eventTitle: string;
  stats: {
    totalGuests: number;
    respondedCount: number;
    pendingCount: number;
    inCount: number;
  };
  blocks?: Array<{ id: string; name: string; inCount?: number }>;
  onNudge?: () => void;
  onScheduleReminder?: () => void;
}

export const VoiceFAB = ({ 
  eventTitle, 
  stats, 
  blocks = [],
  onNudge,
  onScheduleReminder 
}: VoiceFABProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCommand = async (command: VoiceCommand) => {
    setIsProcessing(true);
    
    // Generate response
    const responseText = generateVoiceResponse(command, {
      title: eventTitle,
      ...stats,
      blocks: blocks.map(b => ({ name: b.name, inCount: b.inCount || 0 })),
    });
    
    setResponse(responseText);

    // Execute action if needed
    if (command.type === 'action') {
      if (command.intent === 'nudge' && onNudge) {
        onNudge();
      } else if (command.intent === 'schedule' && onScheduleReminder) {
        onScheduleReminder();
      }
    }

    // Speak the response
    await speak(responseText);
    setIsProcessing(false);
  };

  const {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    isSpeaking,
  } = useVoiceCommands({
    onCommand: handleCommand,
  });

  // Auto-close after speaking
  useEffect(() => {
    if (response && !isSpeaking && !isListening && !isProcessing) {
      const timeout = setTimeout(() => {
        setResponse(null);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [response, isSpeaking, isListening, isProcessing]);

  const handleFABClick = () => {
    if (isListening) {
      stopListening();
    } else if (isExpanded) {
      startListening();
    } else {
      setIsExpanded(true);
    }
  };

  const handleClose = () => {
    stopListening();
    setIsExpanded(false);
    setResponse(null);
  };

  if (!isSupported) {
    return null; // Don't show FAB if voice not supported
  }

  return (
    <>
      {/* Expanded Voice Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="max-w-md mx-auto rounded-2xl bg-card border border-border/50 
              shadow-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-confirmed animate-pulse' : 'bg-muted'}`} />
                  <span className="text-sm font-medium text-foreground">
                    {isListening ? 'Listening...' : 'Voice Assistant'}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 min-h-[120px] flex flex-col items-center justify-center">
                {/* Error state */}
                {error && (
                  <div className="text-center">
                    <MicOff className="w-8 h-8 text-out mx-auto mb-2" />
                    <p className="text-sm text-out">
                      {error === 'not-allowed' 
                        ? 'Microphone access denied. Please enable it in your browser settings.'
                        : 'Voice recognition error. Please try again.'}
                    </p>
                  </div>
                )}

                {/* Listening state */}
                {isListening && !error && (
                  <div className="text-center">
                    {/* Voice waveform visualization */}
                    <div className="flex items-center justify-center gap-1 h-12 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: isListening ? [8, 32, 8] : 8,
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                          className="w-1.5 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-foreground">
                      {transcript || 'Say something like "Who\'s coming?"'}
                    </p>
                  </div>
                )}

                {/* Processing state */}
                {isProcessing && (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Processing...</p>
                  </div>
                )}

                {/* Response state */}
                {response && !isListening && !isProcessing && (
                  <div className="text-center">
                    <Volume2 className={`w-8 h-8 mx-auto mb-2 ${isSpeaking ? 'text-primary animate-pulse' : 'text-confirmed'}`} />
                    <p className="text-sm text-foreground">{response}</p>
                  </div>
                )}

                {/* Ready state */}
                {!isListening && !error && !response && !isProcessing && (
                  <div className="text-center">
                    <Mic className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Tap the mic to start speaking
                    </p>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {!isListening && !response && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Who's coming?", "What's the status?", "Send nudges"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={async () => {
                          const command = {
                            command: suggestion,
                            type: 'query' as const,
                            intent: suggestion.includes('coming') ? 'attendance' as const 
                              : suggestion.includes('status') ? 'status' as const 
                              : 'nudge' as const,
                            entities: {},
                          };
                          await handleCommand(command);
                        }}
                        className="px-3 py-1.5 rounded-full bg-muted text-xs text-foreground
                          hover:bg-muted/80 transition-colors"
                      >
                        "{suggestion}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={handleFABClick}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
          flex items-center justify-center shadow-lg transition-colors
          ${isListening 
            ? 'bg-confirmed' 
            : isExpanded 
            ? 'bg-card border border-border/50' 
            : 'bg-primary'
          }`}
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Mic className="w-6 h-6 text-background" />
          </motion.div>
        ) : (
          <Mic className={`w-6 h-6 ${isExpanded ? 'text-primary' : 'text-primary-foreground'}`} />
        )}
      </motion.button>
    </>
  );
};

export default VoiceFAB;
