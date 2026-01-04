// Voice Commands Hook - Web Speech API integration for voice-first UX
import { useState, useCallback, useRef, useEffect } from 'react';

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoiceCommand {
  command: string;
  type: 'query' | 'action';
  intent: 'status' | 'attendance' | 'nudge' | 'schedule' | 'help' | 'unknown';
  entities: {
    blockName?: string;
    guestName?: string;
    time?: string;
  };
}

interface UseVoiceCommandsOptions {
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  language?: string;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
}

// Parse voice command to extract intent and entities
function parseVoiceCommand(transcript: string): VoiceCommand {
  const lower = transcript.toLowerCase().trim();
  
  const command: VoiceCommand = {
    command: transcript,
    type: 'query',
    intent: 'unknown',
    entities: {},
  };

  // Status queries
  if (lower.includes('status') || lower.includes('summary') || lower.includes('how many')) {
    command.intent = 'status';
    command.type = 'query';
  }
  
  // Attendance queries
  else if (lower.includes('who') && (lower.includes('coming') || lower.includes('attending') || lower.includes('in'))) {
    command.intent = 'attendance';
    command.type = 'query';
    
    // Extract block name if mentioned
    const blockMatch = lower.match(/(?:to|for)\s+(.+?)(?:\?|$)/);
    if (blockMatch) {
      command.entities.blockName = blockMatch[1].trim();
    }
  }
  
  // Nudge actions
  else if (lower.includes('nudge') || lower.includes('remind') || lower.includes('send reminder')) {
    command.intent = 'nudge';
    command.type = 'action';
    
    // Check if targeting specific person
    const personMatch = lower.match(/(?:nudge|remind)\s+(\w+)/);
    if (personMatch && !['everyone', 'all', 'them', 'pending'].includes(personMatch[1])) {
      command.entities.guestName = personMatch[1];
    }
  }
  
  // Schedule actions
  else if (lower.includes('schedule') || lower.includes('set reminder') || lower.includes('remind me')) {
    command.intent = 'schedule';
    command.type = 'action';
    
    // Extract time if mentioned
    const timeMatch = lower.match(/(?:at|for|in)\s+([\w\s]+)/);
    if (timeMatch) {
      command.entities.time = timeMatch[1].trim();
    }
  }
  
  // Help
  else if (lower.includes('help') || lower.includes('what can')) {
    command.intent = 'help';
    command.type = 'query';
  }

  return command;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn {
  const { onCommand, onTranscript, language = 'en-US' } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check for browser support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      onTranscript?.(currentTranscript, !!finalTranscript);

      if (finalTranscript) {
        const command = parseVoiceCommand(finalTranscript);
        onCommand?.(command);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      recognition.abort();
    };
  }, [isSupported, language, onCommand, onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not supported');
      return;
    }

    setTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already started, ignore
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!synthRef.current) return;

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      synthRef.current!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        reject(e);
      };

      synthRef.current!.speak(utterance);
    });
  }, [language]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    speak,
    isSpeaking,
  };
}

// Helper to generate response text based on command and event data
export function generateVoiceResponse(
  command: VoiceCommand,
  eventData: {
    title: string;
    totalGuests: number;
    respondedCount: number;
    pendingCount: number;
    inCount: number;
    blocks?: Array<{ name: string; inCount: number }>;
  }
): string {
  switch (command.intent) {
    case 'status':
      return `For ${eventData.title}, ${eventData.respondedCount} of ${eventData.totalGuests} guests have responded. ${eventData.inCount} are confirmed, and ${eventData.pendingCount} are still pending.`;
    
    case 'attendance':
      if (command.entities.blockName && eventData.blocks) {
        const block = eventData.blocks.find(
          b => b.name.toLowerCase().includes(command.entities.blockName!.toLowerCase())
        );
        if (block) {
          return `${block.inCount} guests are confirmed for ${block.name}.`;
        }
        return `I couldn't find a block called ${command.entities.blockName}.`;
      }
      return `${eventData.inCount} guests are confirmed as attending overall.`;
    
    case 'nudge':
      if (eventData.pendingCount === 0) {
        return `Great news! All guests have already responded.`;
      }
      return `I'll send nudges to the ${eventData.pendingCount} pending guests now.`;
    
    case 'schedule':
      return `I'll set up a reminder. When would you like to send it?`;
    
    case 'help':
      return `You can ask me things like: Who's coming? What's the status? Send nudges. Or schedule a reminder.`;
    
    default:
      return `I'm not sure what you mean. Try asking about attendance, status, or sending nudges.`;
  }
}

export default useVoiceCommands;
