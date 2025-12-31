import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  useWizardState, 
  saveWizardState, 
  loadWizardState, 
  clearWizardState,
  hasPendingWizardState,
} from '@/hooks/use-wizard-state';
import { generateBlocks, generateCheckpoints, makePossessive } from '@/data/templates';

// Steps
import { EventTypeStep } from './steps/EventTypeStep';
import { HostNameStep } from './steps/HostNameStep';
import { DateStep } from './steps/DateStep';
import { LocationStep } from './steps/LocationStep';
import { ConfirmStep } from './steps/ConfirmStep';
import { GuestsStep } from './steps/GuestsStep';

export function CreateWizard() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    state,
    selectTemplate,
    setHostName,
    setEventName,
    setDateRange,
    setLocation,
    setLocationText,
    setAIDescription,
    setGeneratingDescription,
    setGuests,
    goNext,
    goBack,
    restoreState,
  } = useWizardState();
  
  // Track if we've already attempted auto-creation (to prevent loops)
  const hasAttemptedAutoCreate = useRef(false);
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // On mount, check for saved wizard state and restore it
  // If returning from auth with pending state, auto-create the event
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const checkAndRestoreState = async () => {
      // Check if there's saved state to restore
      const savedState = loadWizardState();
      if (!savedState) return;

      // Restore the wizard state
      restoreState(savedState);

      // If we have a pending event (was at guests step) and user is now logged in,
      // auto-create the event
      if (hasPendingWizardState() && !hasAttemptedAutoCreate.current) {
        hasAttemptedAutoCreate.current = true;
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isMountedRef.current) return;
        
        if (user) {
          // Small delay to let state settle, then trigger event creation
          timeoutId = setTimeout(() => {
            if (isMountedRef.current) {
              handleCreateEventWithState(savedState);
            }
          }, 100);
        }
      }
    };

    checkAndRestoreState();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [restoreState]);

  // Venue types that should use "at" instead of "in"
  const venueTypes = [
    'house party', 'home', 'backyard', 'rooftop', 'restaurant', 'bar', 
    'club', 'venue', 'hotel', 'beach', 'park', 'local restaurant'
  ];

  // Check if location is a venue type (use "at") vs a city/region (use "in")
  const isVenueType = (location: string): boolean => {
    const locationLower = location.toLowerCase().trim();
    return venueTypes.some(venue => locationLower.includes(venue));
  };

  // Format location with correct preposition
  const formatLocationPhrase = (location: string): string => {
    const loc = location.split(',')[0].trim();
    if (isVenueType(loc)) {
      // Add article for venue types: "at a house party", "at the restaurant"
      const needsArticle = loc.toLowerCase().match(/^(house party|local restaurant|rooftop|backyard|beach|park)$/i);
      if (needsArticle) {
        return `at a ${loc.toLowerCase()}`;
      }
      return `at ${loc}`;
    }
    return `in ${loc}`;
  };

  // Tone-aware fallback descriptions for when LLM is unavailable
  const getFallbackDescription = () => {
    const location = state.locationText.split(',')[0];
    const locPhrase = formatLocationPhrase(state.locationText);
    const eventType = state.template?.label.toLowerCase() || 'event';
    const hostName = makePossessive(state.hostName || 'the host');
    const templateId = state.template?.id;
    
    // Tone-specific fallbacks based on event type
    const fallbacksByType: Record<string, string[]> = {
      bucks: [
        `${hostName} ${eventType} ${locPhrase} is going to be legendary. Clear the schedule and get ready for a proper send-off.`,
        `The crew is heading ${locPhrase} for ${hostName} ${eventType}. This is the kind of weekend you'll be talking about for years.`,
      ],
      hens: [
        `${hostName} ${eventType} ${locPhrase} is set to be unforgettable. Get ready for a weekend of celebrations with the girls.`,
        `Get ready for ${hostName} ${eventType} ${locPhrase}. A perfect escape with the best company.`,
      ],
      wedding: [
        `Join us ${locPhrase} for ${hostName} wedding celebration. A heartfelt gathering of loved ones to mark this special occasion.`,
        `${hostName} wedding ${locPhrase} promises to be a beautiful celebration of love and togetherness.`,
      ],
      birthday: [
        `${hostName} birthday celebration ${locPhrase}. Good friends, good times, and a night to remember.`,
        `Come celebrate ${hostName} birthday ${locPhrase}. An evening with the people who matter most.`,
      ],
      reunion: [
        `The ${state.hostName?.trim() || ''} family is coming together ${locPhrase}. A chance to reconnect, reminisce, and make new memories.`,
        `${makePossessive(state.hostName?.trim() || '')} family will gather ${locPhrase} for a meaningful reunion.`,
      ],
      trip: [
        `${hostName} group trip to ${location} is coming together. Adventure, great company, and unforgettable experiences await.`,
        `The destination is ${location}. ${hostName} trip is shaping up to be an incredible journey.`,
      ],
      offsite: [
        `${hostName} team offsite ${locPhrase}. A focused retreat designed to connect, collaborate, and move forward together.`,
        `The team is gathering ${locPhrase} for a productive offsite. Strategy sessions, team building, and meaningful conversations ahead.`,
      ],
      custom: [
        `${hostName} event ${locPhrase} is coming together. Mark your calendar for a gathering worth attending.`,
        `Join us ${locPhrase} for ${hostName} event. Details to follow, but you won't want to miss this.`,
      ],
    };
    
    const typeSpecificFallbacks = fallbacksByType[templateId || 'custom'] || fallbacksByType.custom;
    return typeSpecificFallbacks[Math.floor(Math.random() * typeSpecificFallbacks.length)];
  };

  const handleGenerateDescription = async () => {
    if (!state.template || !state.eventName || !state.dateRange || !state.locationText) {
      return;
    }

    setGeneratingDescription(true);

    try {
      // Try to call the edge function, fall back to template-based description
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          eventType: state.template.label,
          hostName: state.hostName,
          location: state.locationText,
          dateRange: `${state.dateRange.start.toISOString()} to ${state.dateRange.end.toISOString()}`,
          tone: state.template.tone,
        },
      });

      if (error || !data?.description) {
        // Fallback description with variety
        setAIDescription(getFallbackDescription());
      } else {
        setAIDescription(data.description);
      }
    } catch (err) {
      // Use fallback description on any error
      setAIDescription(getFallbackDescription());
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Core event creation logic - can be called with current state or restored state
  const createEventWithData = async (eventData: typeof state, userId: string): Promise<string | null> => {
    if (!eventData.template || !eventData.dateRange) return null;

    // Create event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        organiser_id: userId,
        title: eventData.eventName,
        description: eventData.aiDescription,
        location: eventData.locationText,
        start_date: eventData.dateRange.start.toISOString(),
        end_date: eventData.dateRange.end.toISOString(),
        status: "active",
        settings: {
          template: eventData.template.id,
          placeId: eventData.location?.placeId || null,
        },
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Generate and create blocks
    const blocks = generateBlocks(
      eventData.template,
      eventData.dateRange.start,
      eventData.dateRange.end
    );

    if (blocks.length > 0) {
      const { error: blocksError } = await supabase.from("blocks").insert(
        blocks.map((block, index) => ({
          event_id: event.id,
          name: block.name,
          start_time: block.startTime.toISOString(),
          end_time: block.endTime.toISOString(),
          order_index: index,
        }))
      );
      if (blocksError) throw blocksError;
    }

    // Create questions from template
    if (eventData.template.questions.length > 0) {
      const { error: questionsError } = await supabase.from("questions").insert(
        eventData.template.questions.map((q, index) => ({
          event_id: event.id,
          type: q.type,
          prompt: q.prompt,
          options: q.options || null,
          required: q.required ?? true,
          order_index: index,
        }))
      );
      if (questionsError) throw questionsError;
    }

    // Generate and create checkpoints
    const checkpoints = generateCheckpoints(eventData.template, eventData.dateRange.start);
    if (checkpoints.length > 0) {
      const { error: checkpointsError } = await supabase.from("checkpoints").insert(
        checkpoints.map((cp) => ({
          event_id: event.id,
          trigger_at: cp.triggerAt.toISOString(),
          type: cp.type,
          message: `Reminder: ${cp.name}`,
        }))
      );
      if (checkpointsError) throw checkpointsError;
    }

    // Create guests if any
    if (eventData.guests.length > 0) {
      const guestRecords = eventData.guests.map((g) => {
        // Check if it's a phone number or a name
        const isPhone = /^[+\d\s()-]+$/.test(g);
        return {
          event_id: event.id,
          name: isPhone ? 'Guest' : g,
          phone: isPhone ? g.replace(/\s/g, '') : null,
        };
      });

      const { error: guestsError } = await supabase.from("guests").insert(guestRecords);
      if (guestsError) throw guestsError;
    }

    return event.id;
  };

  // Handle event creation with saved state (for auto-create after auth)
  const handleCreateEventWithState = async (savedState: typeof state) => {
    if (!savedState.template || !savedState.dateRange) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Still not logged in, shouldn't happen but handle gracefully
        return;
      }

      const eventId = await createEventWithData(savedState, user.id);
      
      if (eventId) {
        // Clear saved state after successful creation
        clearWizardState();

        // Navigate to the specific event page
        navigate(`/events/${eventId}`);
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      setError(error.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!state.template || !state.dateRange) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Save wizard state before redirecting to auth
        saveWizardState(state);
        
        // Redirect to auth with return URL
        navigate("/auth?returnTo=/create");
        return;
      }

      const eventId = await createEventWithData(state, user.id);
      
      if (eventId) {
        // Clear any saved state
        clearWizardState();
        setError(null);

        // Navigate to the specific event page
        navigate(`/events/${eventId}`);
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      setError(error.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoBack = state.step !== 'type';

  const handleBack = () => {
    if (state.step === 'type') {
      navigate('/');
    } else {
      goBack();
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 'type':
        return (
          <EventTypeStep
            onSelect={selectTemplate}
          />
        );
      case 'host':
        return state.template ? (
          <HostNameStep
            template={state.template}
            hostName={state.hostName}
            eventName={state.eventName}
            isEventNameCustomized={state.isEventNameCustomized}
            onHostNameChange={setHostName}
            onEventNameChange={setEventName}
            onContinue={goNext}
          />
        ) : null;
      case 'date':
        return state.template ? (
          <DateStep
            template={state.template}
            eventName={state.eventName}
            dateRange={state.dateRange}
            onDateRangeChange={setDateRange}
            onContinue={goNext}
          />
        ) : null;
      case 'location':
        return state.template ? (
          <LocationStep
            template={state.template}
            eventName={state.eventName}
            locationText={state.locationText}
            location={state.location}
            onLocationChange={setLocation}
            onLocationTextChange={setLocationText}
            onContinue={goNext}
          />
        ) : null;
      case 'confirm':
        return state.template && state.dateRange ? (
          <ConfirmStep
            template={state.template}
            eventName={state.eventName}
            dateRange={state.dateRange}
            locationText={state.locationText}
            aiDescription={state.aiDescription}
            isGeneratingDescription={state.isGeneratingDescription}
            onRegenerateDescription={handleGenerateDescription}
            onCustomize={() => {
              // TODO: Open customization modal
            }}
            onConfirm={goNext}
          />
        ) : null;
      case 'guests':
        return (
          <GuestsStep
            eventName={state.eventName}
            guests={state.guests}
            onGuestsChange={setGuests}
            onSendInvites={handleCreateEvent}
            onSkip={handleCreateEvent}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  // Progress indicator
  const steps = ['type', 'host', 'date', 'location', 'confirm', 'guests'];
  const currentStepIndex = steps.indexOf(state.step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 relative z-10">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
        
        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{state.step === 'type' ? 'Home' : 'Back'}</span>
          </button>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/auth" 
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
            <span className="text-sm text-muted-foreground">
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Step content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default CreateWizard;


