import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWizardState } from '@/hooks/use-wizard-state';
import { generateBlocks, generateCheckpoints } from '@/data/templates';

// Steps
import { EventTypeStep } from './steps/EventTypeStep';
import { HostNameStep } from './steps/HostNameStep';
import { DateStep } from './steps/DateStep';
import { LocationStep } from './steps/LocationStep';
import { ConfirmStep } from './steps/ConfirmStep';
import { GuestsStep } from './steps/GuestsStep';

export function CreateWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  } = useWizardState();

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
        },
      });

      if (error || !data?.description) {
        // Fallback description
        const fallbackDescription = `A ${state.template.label.toLowerCase()} in ${state.locationText.split(',')[0]}. Join us for an unforgettable experience.`;
        setAIDescription(fallbackDescription);
      } else {
        setAIDescription(data.description);
      }
    } catch (err) {
      // Use fallback description on any error
      const fallbackDescription = `A ${state.template.label.toLowerCase()} in ${state.locationText.split(',')[0]}. Join us for an unforgettable experience.`;
      setAIDescription(fallbackDescription);
    }
  };

  const handleCreateEvent = async () => {
    if (!state.template || !state.dateRange) return;

    setIsSubmitting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to create an event.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          organiser_id: user.id,
          title: state.eventName,
          description: state.aiDescription,
          location: state.locationText,
          start_date: state.dateRange.start.toISOString(),
          end_date: state.dateRange.end.toISOString(),
          status: "active",
          settings: {
            template: state.template.id,
            placeId: state.location?.placeId || null,
          },
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Generate and create blocks
      const blocks = generateBlocks(
        state.template,
        state.dateRange.start,
        state.dateRange.end
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
      if (state.template.questions.length > 0) {
        const { error: questionsError } = await supabase.from("questions").insert(
          state.template.questions.map((q, index) => ({
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
      const checkpoints = generateCheckpoints(state.template, state.dateRange.start);
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
      if (state.guests.length > 0) {
        const guestRecords = state.guests.map((g) => {
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

      toast({
        title: "Event created!",
        description: `${state.eventName} is ready. ${state.guests.length > 0 ? 'Invites will be sent shortly.' : ''}`,
      });

      navigate(`/dashboard`);
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
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
              toast({ title: "Customization coming soon!" });
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
          
          <span className="text-sm text-muted-foreground">
            {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
      </header>

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

