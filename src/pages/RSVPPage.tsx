import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar, MapPin, ChevronRight, ChevronLeft, AlertCircle, CalendarPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

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
  cover_image_url: string | null;
  organiser_id: string;
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
  
  const [step, setStep] = useState<RSVPStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<BlockRSVP[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [organiserName, setOrganiserName] = useState<string | null>(null);
  const [socialProof, setSocialProof] = useState<{ responded: number; total: number } | null>(null);
  const [completionCounts, setCompletionCounts] = useState<Array<{ blockId: string; name: string; inCount: number }>>([]);
  
  // Auto-save key for localStorage
  const autoSaveKey = token ? `rsvp_autosave_${token}` : null;

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

      // Fetch organiser display name (via SECURITY DEFINER function, callable by anon)
      if (eventData.organiser_id) {
        const { data: nameData } = await supabase
          .rpc('get_organiser_display_name', { organiser_uuid: eventData.organiser_id });
        if (!cancelled.current && nameData) {
          setOrganiserName(nameData as string);
        }
      }

      // Social proof: how many guests have already responded
      const { data: allGuests } = await supabase
        .from('guests')
        .select('id, status')
        .eq('event_id', guestData.event_id);

      if (!cancelled.current && allGuests) {
        setSocialProof({
          responded: allGuests.filter(g => g.status === 'responded').length,
          total: allGuests.length,
        });
      }

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
      } else {
        // Try to load from auto-save
        const autoSaveKey = `rsvp_autosave_${magicToken}`;
        try {
          const saved = localStorage.getItem(autoSaveKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.answers) {
              setAnswers(parsed.answers);
            }
            if (parsed.responses) {
              setResponses(parsed.responses);
            }
          }
        } catch (err) {
          console.warn('Failed to load auto-saved RSVP:', err);
        }
      }

      // Check if user has RSVP'd before - skip welcome step
      const hasPreviousRSVP = existingRsvps && existingRsvps.length > 0;
      
      // Check for deep link focus
      const focus = searchParams.get('focus');
      if (focus?.startsWith('block:')) {
        setStep('blocks');
      } else if (focus?.startsWith('question:')) {
        setStep('questions');
      } else if (hasPreviousRSVP) {
        // Skip welcome for returning guests
        setStep('blocks');
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
    setResponses((prev) => {
      const updated = prev.map((r) => r.blockId === blockId ? { ...r, response } : r);
      // Auto-save
      if (autoSaveKey) {
        try {
          localStorage.setItem(autoSaveKey, JSON.stringify({
            responses: updated,
            answers,
            timestamp: Date.now(),
          }));
        } catch (err) {
          console.warn('Failed to auto-save RSVP:', err);
        }
      }
      return updated;
    });
  };

  const handleQuestionAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => {
      const updated = prev.map((a) => a.questionId === questionId ? { ...a, value } : a);
      // Auto-save
      if (autoSaveKey) {
        try {
          localStorage.setItem(autoSaveKey, JSON.stringify({
            responses,
            answers: updated,
            timestamp: Date.now(),
          }));
        } catch (err) {
          console.warn('Failed to auto-save RSVP:', err);
        }
      }
      return updated;
    });
  };
  
  // Validate form before submit
  const validateForm = (): string | null => {
    // Check required questions
    for (const question of questions) {
      if (question.required) {
        const answer = answers.find(a => a.questionId === question.id);
        if (!answer || answer.value === null || answer.value === '') {
          return `Please answer the required question: "${question.prompt}"`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!guest) return;

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
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

      // Clear auto-save on successful submit
      if (autoSaveKey) {
        localStorage.removeItem(autoSaveKey);
      }

      // Fetch "in" counts for blocks guest said yes to (for completion social proof)
      const inBlockIds = responses.filter(r => r.response === 'in').map(r => r.blockId);
      if (inBlockIds.length > 0) {
        const counts = await Promise.all(
          inBlockIds.map(async (blockId) => {
            const { data: rsvps } = await supabase
              .from('rsvps')
              .select('response')
              .eq('block_id', blockId)
              .eq('response', 'in');
            const block = blocks.find(b => b.id === blockId);
            return { blockId, name: block?.name || '', inCount: rsvps?.length || 0 };
          })
        );
        setCompletionCounts(counts);
      }

      setStep('complete');
    } catch (err: any) {
      console.error('[RSVPPage] Error submitting RSVP:', err);
      setSubmitError(err.message || 'Failed to submit RSVP. Please try again.');
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

  const handleAddToCalendar = () => {
    const inResponses = responses.filter(r => r.response === 'in');
    if (inResponses.length === 0) return;

    const formatICSDate = (iso: string) =>
      iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const vevents = inResponses.map(r => {
      const block = blocks.find(b => b.id === r.blockId);
      if (!block) return '';
      const dtstart = block.start_time ? formatICSDate(block.start_time) : formatICSDate(event.start_date || new Date().toISOString());
      const dtend = block.end_time ? formatICSDate(block.end_time) : dtstart;
      return [
        'BEGIN:VEVENT',
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${event.title} — ${block.name}`,
        event.location ? `LOCATION:${event.location}` : '',
        `UID:${block.id}@lockstep`,
        'END:VEVENT',
      ].filter(Boolean).join('\r\n');
    });

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lockstep//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...vevents,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            className="h-full flex flex-col overflow-y-auto"
          >
            {/* Cover image */}
            {event.cover_image_url && (
              <div className="w-full h-44 flex-shrink-0 relative overflow-hidden">
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-sm"
              >
                {/* Organiser byline */}
                <p className="text-sm text-muted-foreground mb-1">
                  {organiserName
                    ? <><span className="font-medium text-foreground">{organiserName}</span> invited you to</>
                    : 'You\'re invited to'
                  }
                </p>

                <h1 className="text-2xl font-display font-bold text-foreground mb-4">
                  {event.title}
                </h1>

                <div className="flex flex-col items-center gap-1.5 mb-4">
                  {event.start_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {format(parseISO(event.start_date), 'EEE, MMM d')}
                        {event.end_date && ` – ${format(parseISO(event.end_date), 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                    {event.description}
                  </p>
                )}

                {/* Social proof */}
                {socialProof && socialProof.responded > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                      bg-confirmed/10 border border-confirmed/20 text-sm text-confirmed mb-2"
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {socialProof.responded === socialProof.total - 1
                        ? `Everyone else has responded — you're the last one!`
                        : `${socialProof.responded} of ${socialProof.total} people have already responded`
                      }
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="px-6 pb-8 flex-shrink-0">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={goNext}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Start RSVP process"
              >
                Let's RSVP
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
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

            {/* Bulk actions */}
            {blocks.length > 1 && (
              <div className="px-4 pt-4 flex gap-2">
                <button
                  onClick={() => {
                    const allIn = blocks.map(b => ({ blockId: b.id, response: 'in' as RSVPResponse }));
                    setResponses(allIn);
                    // Auto-save
                    if (autoSaveKey) {
                      try {
                        localStorage.setItem(autoSaveKey, JSON.stringify({
                          responses: allIn,
                          answers,
                          timestamp: Date.now(),
                        }));
                      } catch (err) {
                        console.warn('Failed to auto-save RSVP:', err);
                      }
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-confirmed/10 text-confirmed text-sm font-medium
                    hover:bg-confirmed/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-confirmed"
                  aria-label="Select all blocks as attending"
                >
                  I'm in for everything
                </button>
                <button
                  onClick={() => {
                    const allOut = blocks.map(b => ({ blockId: b.id, response: 'out' as RSVPResponse }));
                    setResponses(allOut);
                    // Auto-save
                    if (autoSaveKey) {
                      try {
                        localStorage.setItem(autoSaveKey, JSON.stringify({
                          responses: allOut,
                          answers,
                          timestamp: Date.now(),
                        }));
                      } catch (err) {
                        console.warn('Failed to auto-save RSVP:', err);
                      }
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-out/10 text-out text-sm font-medium
                    hover:bg-out/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-out"
                  aria-label="Select all blocks as not attending"
                >
                  I'm out for everything
                </button>
              </div>
            )}

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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{block.name}</h3>
                        {block.start_time && (
                          <div className="space-y-0.5">
                            <p className="text-sm text-foreground font-medium">
                              {format(new Date(block.start_time), 'EEEE, MMMM d')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(block.start_time), 'h:mm a')}
                              {block.end_time && ` - ${format(new Date(block.end_time), 'h:mm a')}`}
                            </p>
                          </div>
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

            {/* Submit error (shown when no questions and submit fails) */}
            {submitError && questions.length === 0 && (
              <div className="flex-shrink-0 px-4">
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              </div>
            )}

            {/* Continue button */}
            <div className="flex-shrink-0 p-4 border-t border-border/50">
              <button
                onClick={goNext}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-medium
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                  disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : questions.length > 0 ? 'Continue' : 'Submit RSVP'}
                {!isSubmitting && <ChevronRight className="w-5 h-5" />}
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
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-medium text-foreground">
                        {question.prompt}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      {!question.required && (
                        <button
                          onClick={() => handleQuestionAnswer(question.id, null)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Skip
                        </button>
                      )}
                    </div>

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

            {/* Submit error */}
            {submitError && (
              <div className="flex-shrink-0 px-4">
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              </div>
            )}

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
            className="h-full flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
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
                ? `You're in for ${confirmedCount} of ${blocks.length} ${blocks.length === 1 ? 'session' : 'sessions'}.`
                : 'We\'ve recorded your response.'}
            </p>

            {event.start_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Calendar className="w-4 h-4" />
                <span>{format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}

            {/* Social proof per block */}
            {completionCounts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-xs mt-6 space-y-2"
              >
                {completionCounts.map(c => (
                  <div key={c.blockId} className="flex items-center justify-between px-4 py-2.5
                    rounded-xl bg-card border border-border/50 text-sm"
                  >
                    <span className="text-foreground font-medium">{c.name}</span>
                    <span className="text-confirmed font-medium">{c.inCount} going</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Add to Calendar */}
            {confirmedCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleAddToCalendar}
                className="mt-6 flex items-center gap-2 px-5 py-3 rounded-xl
                  bg-primary/10 text-primary border border-primary/20 text-sm font-medium
                  hover:bg-primary/20 transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                Add to Calendar
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RSVPPage;
