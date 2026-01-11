import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, User, LogOut, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  useWizardState, 
  saveWizardState, 
  loadWizardState, 
  clearWizardState,
  hasPendingWizardState,
} from '@/hooks/use-wizard-state';
import { generateBlocks, generateCheckpoints, makePossessive } from '@/data/templates';
import { 
  withTimeout, 
  withRetry, 
  TimeoutError,
  type OperationProgress,
  progressMessages,
  DEFAULT_RETRY_CONFIG,
} from '@/lib/async-utils';

// Steps
import { EventTypeStep } from './steps/EventTypeStep';
import { HostNameStep } from './steps/HostNameStep';
import { DateStep } from './steps/DateStep';
import { LocationStep } from './steps/LocationStep';
import { ConfirmStep } from './steps/ConfirmStep';
import { GuestsStep } from './steps/GuestsStep';

// Timeout constants (in milliseconds)
const OPERATION_TIMEOUT = 10000; // 10 seconds per operation
const SESSION_CHECK_TIMEOUT = 5000; // 5 seconds for session check

export function CreateWizard() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<OperationProgress>('idle');
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Abort controller for cancelling operations on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  
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
    setDescriptionError,
    setGuests,
    setCustomBlocks,
    setCustomCheckpoints,
    setCustomQuestions,
    setCoverImageUrl,
    goNext,
    goBack,
    goToStep,
    restoreState,
  } = useWizardState();
  
  // Track if we've already attempted auto-creation (to prevent loops)
  const hasAttemptedAutoCreate = useRef(false);
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for search (if we add search later)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Future: open search
      }
      
      // Arrow keys for navigation in wizard
      if (e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        handleBack();
      }
      if (e.key === 'ArrowRight' && state.step !== 'guests') {
        e.preventDefault();
        // Only continue if current step is valid
        if (state.step === 'type' && state.template) {
          goNext();
        } else if (state.step === 'host' && state.hostName.trim()) {
          goNext();
        } else if (state.step === 'date' && state.dateRange) {
          goNext();
        } else if (state.step === 'location' && state.locationText.trim()) {
          goNext();
        } else if (state.step === 'confirm') {
          goNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.step, state.template, state.hostName, state.dateRange, state.locationText, canGoBack, goNext, handleBack]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Check authentication state on mount and subscribe to changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!isMountedRef.current) return;
      
      setUser(authUser);
      console.log('[CreateWizard] Auth state checked:', authUser ? 'logged in' : 'logged out');
    };

    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMountedRef.current) return;
      
      console.log('[CreateWizard] Auth state changed:', event, session ? 'logged in' : 'logged out');
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
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
    setDescriptionError(null);

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
        // Show error but still use fallback
        setDescriptionError('AI description generation failed. Using a default description.');
        setAIDescription(getFallbackDescription());
      } else {
        setAIDescription(data.description);
      }
    } catch (err: any) {
      // Show error but still use fallback
      setDescriptionError('AI description generation failed. Using a default description.');
      setAIDescription(getFallbackDescription());
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Helper function to check if error is a schema cache error
  const isSchemaCacheError = (error: any): boolean => {
    if (!error) return false;
    const errorMessage = error.message || error.toString() || '';
    const errorCode = error.code || '';
    
    return (
      errorMessage.includes('schema cache') ||
      errorMessage.includes('Could not find the table') ||
      errorCode === 'PGRST116' || // PostgREST schema cache error
      errorCode === '42P01' // PostgreSQL undefined_table error
    );
  };

  // Retry config optimized for fast failure
  const retryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    maxRetries: 2, // Reduced from 5 - fail faster
    baseDelayMs: 1000,
    maxDelayMs: 3000,
  };

  // Core event creation logic - can be called with current state or restored state
  const createEventWithData = async (eventData: typeof state, userId: string): Promise<string | null> => {
    if (!eventData.template || !eventData.dateRange) {
      console.error('[createEventWithData] Missing required data:', {
        hasTemplate: !!eventData.template,
        hasDateRange: !!eventData.dateRange,
      });
      throw new Error('Missing required event data. Please go back and complete all steps.');
    }

    console.log('[createEventWithData] Starting event creation', {
      userId,
      eventName: eventData.eventName,
      template: eventData.template.id,
      hasLocation: !!eventData.locationText,
    });

    // Update progress: Connecting
    if (isMountedRef.current) setProgress('connecting');

    // Verify Supabase connection with timeout
    try {
      const sessionResult = await withTimeout(
        supabase.auth.getSession(),
        SESSION_CHECK_TIMEOUT,
        'Connection check timed out'
      );
      if (!sessionResult.data.session) {
        throw new Error('No active session');
      }
      console.log('[createEventWithData] Supabase connection verified, session active');
    } catch (connectionError: any) {
      console.error('[createEventWithData] Supabase connection check failed:', {
        error: connectionError.message,
        code: connectionError.code,
      });
      if (connectionError instanceof TimeoutError) {
        throw new Error('Connection timed out. Please check your internet and try again.');
      }
      throw new Error('Database connection failed. Please try again.');
    }

    // Update progress: Creating
    if (isMountedRef.current) setProgress('creating');

    // Create event with retry logic and timeout
    const event = await withRetry(async () => {
      console.log('[createEventWithData] Inserting event into database...');
      
      const eventPayload = {
        organiser_id: userId,
        title: eventData.eventName,
        description: eventData.aiDescription,
        location: eventData.locationText,
        start_date: eventData.dateRange!.start.toISOString(),
        end_date: eventData.dateRange!.end.toISOString(),
        status: "active",
        cover_image_url: eventData.coverImageUrl || null,
        settings: {
          template: eventData.template!.id,
          placeId: eventData.location?.placeId || null,
        },
      };
      
      console.log('[createEventWithData] Event payload:', {
        ...eventPayload,
        settings: eventPayload.settings,
      });

      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert(eventPayload)
        .select()
        .single();

      if (eventError) {
        console.error('[createEventWithData] Event insert error:', {
          message: eventError.message,
          code: eventError.code,
          details: eventError.details,
          hint: eventError.hint,
          fullError: eventError,
        });
        throw eventError;
      }

      if (!event) {
        throw new Error('Event creation returned no data');
      }

      console.log('[createEventWithData] Event created successfully:', event.id);
      return event;
    }, retryConfig, OPERATION_TIMEOUT);

    // Update progress: Adding details
    if (isMountedRef.current) setProgress('adding-details');

    // Use custom blocks if provided, otherwise generate from template
    const blocks = eventData.customBlocks 
      ? eventData.customBlocks.map((block, index) => {
          // Convert BlockTemplate to the format expected by generateBlocks output
          const blockDate = new Date(eventData.dateRange!.start);
          blockDate.setDate(blockDate.getDate() + Math.floor(index / 4)); // Spread across days
          const startTime = new Date(blockDate);
          startTime.setHours(10 + (index % 4) * 3, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + block.defaultDuration);
          return {
            name: block.name,
            startTime,
            endTime,
            attendanceRequired: block.attendanceRequired ?? false,
          };
        })
      : generateBlocks(
          eventData.template!,
          eventData.dateRange!.start,
          eventData.dateRange!.end
        );

    if (blocks.length > 0) {
      console.log(`[createEventWithData] Creating ${blocks.length} blocks...`);
      const blocksResult = await withTimeout(
        supabase.from("blocks").insert(
          blocks.map((block, index) => ({
            event_id: event.id,
            name: block.name,
            start_time: block.startTime.toISOString(),
            end_time: block.endTime.toISOString(),
            order_index: index,
          }))
        ),
        OPERATION_TIMEOUT,
        'Adding time blocks timed out'
      );
      if (blocksResult.error) {
        console.error('[createEventWithData] Blocks insert error:', blocksResult.error);
        throw blocksResult.error;
      }
      console.log('[createEventWithData] Blocks created successfully');
    }

    // Use custom questions if provided, otherwise use template
    const questions = eventData.customQuestions || eventData.template!.questions;
    if (questions.length > 0) {
      console.log(`[createEventWithData] Creating ${questions.length} questions...`);
      const questionsResult = await withTimeout(
        supabase.from("questions").insert(
          questions.map((q, index) => ({
            event_id: event.id,
            type: q.type,
            prompt: q.prompt,
            options: q.options || null,
            required: q.required ?? true,
            order_index: index,
          }))
        ),
        OPERATION_TIMEOUT,
        'Adding questions timed out'
      );
      if (questionsResult.error) {
        console.error('[createEventWithData] Questions insert error:', questionsResult.error);
        throw questionsResult.error;
      }
      console.log('[createEventWithData] Questions created successfully');
    }

    // Use custom checkpoints if provided, otherwise generate from template
    const checkpointTemplates = eventData.customCheckpoints || eventData.template!.checkpoints;
    const checkpoints = checkpointTemplates.map((cp) => {
      const triggerAt = new Date(eventData.dateRange!.start);
      triggerAt.setDate(triggerAt.getDate() + cp.offsetDays);
      return {
        name: cp.name,
        triggerAt,
        type: cp.type,
        autoResolveTo: cp.autoResolveTo,
      };
    });
    if (checkpoints.length > 0) {
      console.log(`[createEventWithData] Creating ${checkpoints.length} checkpoints...`);
      const checkpointsResult = await withTimeout(
        supabase.from("checkpoints").insert(
          checkpoints.map((cp) => ({
            event_id: event.id,
            trigger_at: cp.triggerAt.toISOString(),
            type: cp.type,
            message: `Reminder: ${cp.name}`,
          }))
        ),
        OPERATION_TIMEOUT,
        'Adding checkpoints timed out'
      );
      if (checkpointsResult.error) {
        console.error('[createEventWithData] Checkpoints insert error:', checkpointsResult.error);
        throw checkpointsResult.error;
      }
      console.log('[createEventWithData] Checkpoints created successfully');
    }

    // Update progress: Finalizing
    if (isMountedRef.current) setProgress('finalizing');

    // Create guests if any with timeout
    if (eventData.guests.length > 0) {
      console.log(`[createEventWithData] Creating ${eventData.guests.length} guests...`);
      const guestRecords = eventData.guests.map((g) => {
        // Check if it's a phone number or a name
        const isPhone = /^[+\d\s()-]+$/.test(g);
        return {
          event_id: event.id,
          name: isPhone ? 'Guest' : g,
          phone: isPhone ? g.replace(/\s/g, '') : null,
        };
      });

      const guestsResult = await withTimeout(
        supabase.from("guests").insert(guestRecords),
        OPERATION_TIMEOUT,
        'Adding guests timed out'
      );
      if (guestsResult.error) {
        console.error('[createEventWithData] Guests insert error:', guestsResult.error);
        throw guestsResult.error;
      }
      console.log('[createEventWithData] Guests created successfully');
    }

    // Update progress: Complete
    if (isMountedRef.current) setProgress('complete');

    console.log('[createEventWithData] Event creation completed successfully:', event.id);
    return event.id;
  };

  // Handle event creation with saved state (for auto-create after auth)
  const handleCreateEventWithState = async (savedState: typeof state) => {
    if (!savedState.template || !savedState.dateRange) return;

    // Cancel any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSubmitting(true);
    setProgress('idle');
    setError(null);
    
    try {
      const userResult = await withTimeout(
        supabase.auth.getUser(),
        SESSION_CHECK_TIMEOUT,
        'Authentication check timed out'
      );
      
      if (!userResult.data.user) {
        // Still not logged in, shouldn't happen but handle gracefully
        setIsSubmitting(false);
        setProgress('idle');
        return;
      }

      const eventId = await createEventWithData(savedState, userResult.data.user.id);
      
      if (eventId) {
        // Clear saved state after successful creation
        clearWizardState();

        // Navigate to the specific event page
        navigate(`/events/${eventId}`);
      }
    } catch (error: any) {
      // Don't show errors if we're unmounting
      if (!isMountedRef.current) return;
      if (error.name === 'AbortError') return;
      
      console.error("[handleCreateEventWithState] Error creating event:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error,
      });
      
      setProgress('error');
      setCanRetry(true);
      
      // Provide user-friendly error messages
      let userMessage = "Failed to create event. Please try again.";
      if (error instanceof TimeoutError) {
        userMessage = "Request timed out. Please check your connection and try again.";
      } else if (isSchemaCacheError(error)) {
        userMessage = "Database connection issue. Please refresh and try again.";
      } else if (error.message) {
        userMessage = error.message;
      }
      
      setError(userMessage);
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleCreateEvent = async () => {
    if (!state.template || !state.dateRange) return;

    // Cancel any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsSubmitting(true);
    setProgress('idle');
    setError(null);
    setCanRetry(false);
    
    try {
      // Get current user with timeout
      const userResult = await withTimeout(
        supabase.auth.getUser(),
        SESSION_CHECK_TIMEOUT,
        'Authentication check timed out'
      );
      
      if (userResult.error) {
        console.error("[handleCreateEvent] Error getting user:", userResult.error);
        throw new Error("Authentication error. Please sign in again.");
      }
      
      if (!userResult.data.user) {
        // Save wizard state before redirecting to auth
        saveWizardState(state);
        
        // Reset submitting state before redirect
        setIsSubmitting(false);
        setProgress('idle');
        
        // Redirect to auth with return URL
        navigate("/auth?returnTo=/create");
        return;
      }

      console.log("[handleCreateEvent] Creating event for user:", userResult.data.user.id);
      const eventId = await createEventWithData(state, userResult.data.user.id);
      
      if (eventId) {
        // Clear any saved state
        clearWizardState();
        setError(null);
        setCanRetry(false);

        // Navigate to the specific event page
        navigate(`/events/${eventId}`);
      } else {
        throw new Error("Event creation returned no ID");
      }
    } catch (error: any) {
      // Don't show errors if we're unmounting or abort was triggered
      if (!isMountedRef.current) return;
      if (error.name === 'AbortError') return;
      
      console.error("[handleCreateEvent] Error creating event:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error,
      });
      
      // Check if this error is retryable
      const isRetryable = 
        error instanceof TimeoutError ||
        isSchemaCacheError(error) || 
        error.message?.includes('fetch failed') ||
        error.message?.includes('network') ||
        error.message?.includes('timed out') ||
        error.message?.includes('connection') ||
        error.code === 'NETWORK_ERROR';
      
      setCanRetry(isRetryable);
      setProgress('error');
      
      // Provide user-friendly error messages
      let userMessage = "Failed to create event. Please try again.";
      if (error instanceof TimeoutError) {
        userMessage = "Request timed out. Please check your connection and try again.";
      } else if (isSchemaCacheError(error)) {
        userMessage = "Database connection issue. Please try again or refresh the page.";
      } else if (error.message) {
        userMessage = error.message;
      }
      
      setError(userMessage);
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
            descriptionError={state.descriptionError}
            onRegenerateDescription={handleGenerateDescription}
            onCustomize={() => {
              // Navigate back to host step to allow editing all details
              goToStep('host');
            }}
            onConfirm={goNext}
            customBlocks={state.customBlocks}
            customCheckpoints={state.customCheckpoints}
            customQuestions={state.customQuestions}
            onBlocksChange={setCustomBlocks}
            onCheckpointsChange={setCustomCheckpoints}
            onQuestionsChange={setCustomQuestions}
            coverImageUrl={state.coverImageUrl}
            onCoverImageChange={setCoverImageUrl}
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
            progress={progress}
            error={error}
            canRetry={canRetry}
            onRetry={handleCreateEvent}
          />
        );
      default:
        return null;
    }
  };

  // Progress indicator
  const steps = ['type', 'host', 'date', 'location', 'confirm', 'guests'];
  const currentStepIndex = steps.indexOf(state.step);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 relative z-10">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
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
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="p-2 rounded-full text-muted-foreground hover:text-primary
                    hover:bg-primary/10 transition-colors"
                  title="Profile"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground
                    hover:bg-muted transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
        </div>
      </header>

      {/* Error message with retry option and recovery suggestions */}
      {error && (
        <div className="px-4 py-3 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium mb-1">{error}</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium">What you can do:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  {error.includes('timeout') || error.includes('connection') ? (
                    <>
                      <li>Check your internet connection</li>
                      <li>Try refreshing the page</li>
                      <li>Wait a moment and try again</li>
                    </>
                  ) : error.includes('Database') || error.includes('schema') ? (
                    <>
                      <li>Refresh the page to reload</li>
                      <li>Clear your browser cache if the issue persists</li>
                    </>
                  ) : (
                    <>
                      <li>Check that all required fields are filled</li>
                      <li>Try again in a moment</li>
                      {canRetry && <li>Click Retry to attempt again</li>}
                    </>
                  )}
                </ul>
              </div>
            </div>
            {canRetry && (
              <button
                onClick={handleCreateEvent}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  bg-destructive/20 text-destructive text-sm font-medium
                  hover:bg-destructive/30 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step content */}
      <main className="flex-1 overflow-y-auto">
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


