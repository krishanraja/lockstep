import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Block {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
}

interface Question {
  id: string;
  prompt: string;
  type: string;
  options: string[] | null;
  required: boolean | null;
}

interface Guest {
  id: string;
  name: string;
  event_id: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
}

type RSVPResponse = 'in' | 'maybe' | 'out';
type RSVPStep = 'welcome' | 'blocks' | 'questions' | 'complete';

interface BlockRSVP {
  blockId: string;
  response: RSVPResponse;
}

interface QuestionAnswer {
  questionId: string;
  value: any;
}

const RSVPPage = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [step, setStep] = useState<RSVPStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<BlockRSVP[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

  const loadRSVPData = useCallback(async (magicToken: string, cancelled: { current: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Find guest by magic token
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('*')
        .eq('magic_token', magicToken)
        .single();

      if (cancelled.current) return;

      if (guestError || !guestData) {
        setError('Invalid or expired invitation link.');
        setIsLoading(false);
        return;
      }

      setGuest(guestData);

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', guestData.event_id)
        .single();

      if (cancelled.current) return;

      if (eventError || !eventData) {
        setError('Event not found.');
        setIsLoading(false);
        return;
      }

      setEvent(eventData);

      // Load blocks
      const { data: blocksData } = await supabase
        .from('blocks')
        .select('*')
        .eq('event_id', guestData.event_id)
        .order('order_index');

      if (cancelled.current) return;

      if (blocksData) {
        setBlocks(blocksData);
        // Pre-select all blocks as "in" (positive bias)
        setResponses(blocksData.map((b) => ({ blockId: b.id, response: 'in' as RSVPResponse })));
      }

      // Load questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', guestData.event_id)
        .order('order_index');

      if (cancelled.current) return;

      if (questionsData) {
        setQuestions(questionsData.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : null
        })));
        // Initialize empty answers
        setAnswers(questionsData.map((q) => ({ questionId: q.id, value: null })));
      }

      // Load existing RSVPs
      const { data: existingRsvps } = await supabase
        .from('rsvps')
        .select('*')
        .eq('guest_id', guestData.id);

      if (cancelled.current) return;

      if (existingRsvps && existingRsvps.length > 0) {
        setResponses(existingRsvps.map((r) => ({ 
          blockId: r.block_id, 
          response: r.response as RSVPResponse 
        })));
      }

      // Load existing answers
      const { data: existingAnswers } = await supabase
        .from('answers')
        .select('*')
        .eq('guest_id', guestData.id);

      if (cancelled.current) return;

      if (existingAnswers && existingAnswers.length > 0) {
        setAnswers(existingAnswers.map((a) => ({
          questionId: a.question_id,
          value: a.value,
        })));
      }

      // Check for deep link focus
      const focus = searchParams.get('focus');
      if (focus?.startsWith('block:')) {
        setStep('blocks');
      } else if (focus?.startsWith('question:')) {
        setStep('questions');
      }

    } catch (err) {
      if (cancelled.current) return;
      setError('Something went wrong. Please try again.');
    } finally {
      if (!cancelled.current) {
        setIsLoading(false);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    
    const cancelled = { current: false };
    loadRSVPData(token, cancelled);
    
    return () => {
      cancelled.current = true;
    };
  }, [token, loadRSVPData]);

  const handleBlockResponse = (blockId: string, response: RSVPResponse) => {
    setResponses((prev) => 
      prev.map((r) => r.blockId === blockId ? { ...r, response } : r)
    );
  };

  const handleQuestionAnswer = (questionId: string, value: any) => {
    setAnswers((prev) =>
      prev.map((a) => a.questionId === questionId ? { ...a, value } : a)
    );
  };

  const handleSubmit = async () => {
    if (!guest) return;

    setIsSubmitting(true);
    try {
      // Upsert RSVPs
      for (const response of responses) {
        const { error } = await supabase
          .from('rsvps')
          .upsert({
            guest_id: guest.id,
            block_id: response.blockId,
            response: response.response,
          }, {
            onConflict: 'guest_id,block_id',
          });

        if (error) throw error;
      }

      // Upsert answers
      for (const answer of answers) {
        if (answer.value !== null) {
          const { error } = await supabase
            .from('answers')
            .upsert({
              guest_id: guest.id,
              question_id: answer.questionId,
              value: answer.value,
            }, {
              onConflict: 'guest_id,question_id',
            });

          if (error) throw error;
        }
      }

      // Update guest status
      await supabase
        .from('guests')
        .update({ status: 'responded' })
        .eq('id', guest.id);

      setStep('complete');
    } catch (err: any) {
      toast({
        title: 'Error submitting RSVP',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === 'welcome') setStep('blocks');
    else if (step === 'blocks') {
      if (questions.length > 0) {
        setStep('questions');
      } else {
        handleSubmit();
      }
    } else if (step === 'questions') {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step === 'blocks') setStep('welcome');
    else if (step === 'questions') setStep('blocks');
  };

  if (isLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <span className="text-2xl">😕</span>
        </div>
        <h1 className="text-xl font-medium text-foreground mb-2">Oops!</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!event || !guest) return null;

  const confirmedCount = responses.filter(r => r.response === 'in').length;

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Progress bar */}
      {step !== 'complete' && (
        <div className="h-1 bg-muted flex-shrink-0">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ 
              width: step === 'welcome' ? '25%' : step === 'blocks' ? '50%' : '75%' 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col p-6"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-sm text-muted-foreground mb-2">You're invited to</p>
                <h1 className="text-2xl font-display font-bold text-foreground mb-4">
                  {event.title}
                </h1>
                
                {event.location && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.start_date && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(event.start_date), 'MMM d')}
                      {event.end_date && ` - ${format(new Date(event.end_date), 'MMM d, yyyy')}`}
                    </span>
                  </div>
                )}

                {event.description && (
                  <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                    {event.description}
                  </p>
                )}
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={goNext}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium
                flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Let's RSVP
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}

        {step === 'blocks' && (
          <motion.div
            key="blocks"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border/50">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-3"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
              <h2 className="text-xl font-display font-bold text-foreground">
                Which parts can you make?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                We've marked you as "in" for everything. Just tap to change.
              </p>
            </div>

            {/* Blocks list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {blocks.map((block, index) => {
                const response = responses.find((r) => r.blockId === block.id);
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl bg-card border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">{block.name}</h3>
                        {block.start_time && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(block.start_time), 'EEE, MMM d • h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Segmented control */}
                    <div className="flex gap-1 bg-muted rounded-xl p-1">
                      {(['in', 'maybe', 'out'] as RSVPResponse[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => handleBlockResponse(block.id, option)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${response?.response === option
                              ? option === 'in'
                                ? 'bg-confirmed text-background'
                                : option === 'maybe'
                                  ? 'bg-maybe text-background'
                                  : 'bg-out text-background'
                              : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          {option === 'in' ? "I'm in" : option === 'maybe' ? 'Maybe' : 'Out'}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Continue button */}
            <div className="flex-shrink-0 p-4 border-t border-border/50">
              <button
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                {questions.length > 0 ? 'Continue' : 'Submit RSVP'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border/50">
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-3"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
              <h2 className="text-xl font-display font-bold text-foreground">
                Quick questions
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Help us plan better
              </p>
            </div>

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {questions.map((question, index) => {
                const answer = answers.find((a) => a.questionId === question.id);
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl bg-card border border-border/50"
                  >
                    <label className="font-medium text-foreground block mb-3">
                      {question.prompt}
                      {question.required && <span className="text-destructive ml-1">*</span>}
                    </label>

                    {/* Render based on question type */}
                    {(question.type === 'single_select' || question.type === 'multi_select') && question.options && (
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((option) => {
                          const isSelected = question.type === 'multi_select'
                            ? Array.isArray(answer?.value) && answer.value.includes(option)
                            : answer?.value === option;

                          const handleClick = () => {
                            if (question.type === 'multi_select') {
                              const current = Array.isArray(answer?.value) ? answer.value : [];
                              const newValue = isSelected
                                ? current.filter((v: string) => v !== option)
                                : [...current, option];
                              handleQuestionAnswer(question.id, newValue);
                            } else {
                              handleQuestionAnswer(question.id, option);
                            }
                          };

                          return (
                            <button
                              key={option}
                              onClick={handleClick}
                              className={`px-4 py-2 rounded-xl text-sm font-medium
                                border transition-all duration-200
                                ${isSelected
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-muted border-transparent text-foreground hover:border-primary/50'
                                }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <input
                        type="text"
                        value={answer?.value || ''}
                        onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full p-3 rounded-xl bg-muted border-none outline-none
                          focus:ring-2 focus:ring-primary text-foreground"
                      />
                    )}

                    {question.type === 'number' && (
                      <input
                        type="number"
                        value={answer?.value || ''}
                        onChange={(e) => handleQuestionAnswer(question.id, parseInt(e.target.value) || '')}
                        placeholder="0"
                        className="w-full p-3 rounded-xl bg-muted border-none outline-none
                          focus:ring-2 focus:ring-primary text-foreground"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Submit button */}
            <div className="flex-shrink-0 p-4 border-t border-border/50">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                  disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                <Check className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-confirmed/10 flex items-center justify-center mb-6"
            >
              <Check className="w-10 h-10 text-confirmed" />
            </motion.div>
            
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              You're all set!
            </h1>
            <p className="text-muted-foreground mb-1">
              {confirmedCount > 0 
                ? `You're in for ${confirmedCount} of ${blocks.length} sessions.`
                : 'We\'ve recorded your response.'}
            </p>
            {event.location && (
              <p className="text-sm text-muted-foreground mt-4">
                📍 {event.location}
              </p>
            )}
            {event.start_date && (
              <p className="text-sm text-muted-foreground">
                📅 {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RSVPPage;
