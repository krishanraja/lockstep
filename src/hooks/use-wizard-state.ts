import { useState, useCallback } from 'react';
import type { 
  WizardState, 
  WizardStep, 
  EventTemplate, 
  GooglePlaceResult 
} from '@/data/templates/types';
import { initialWizardState, generateEventName } from '@/data/templates';

export function useWizardState() {
  const [state, setState] = useState<WizardState>(initialWizardState);

  const setStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const selectTemplate = useCallback((template: EventTemplate) => {
    setState((prev) => ({
      ...prev,
      template,
      step: 'host',
    }));
  }, []);

  const setHostName = useCallback((hostName: string) => {
    setState((prev) => {
      const newEventName = prev.isEventNameCustomized 
        ? prev.eventName 
        : prev.template 
          ? generateEventName(prev.template, hostName)
          : '';
      return {
        ...prev,
        hostName,
        eventName: newEventName,
      };
    });
  }, []);

  const setEventName = useCallback((eventName: string, isCustomized = true) => {
    setState((prev) => ({
      ...prev,
      eventName,
      isEventNameCustomized: isCustomized,
    }));
  }, []);

  const setDateRange = useCallback((dateRange: { start: Date; end: Date } | null) => {
    setState((prev) => ({
      ...prev,
      dateRange,
    }));
  }, []);

  const setLocation = useCallback((location: GooglePlaceResult | null, locationText = '') => {
    setState((prev) => ({
      ...prev,
      location,
      locationText: locationText || location?.formattedAddress || '',
    }));
  }, []);

  const setLocationText = useCallback((locationText: string) => {
    setState((prev) => ({
      ...prev,
      locationText,
    }));
  }, []);

  const setAIDescription = useCallback((aiDescription: string) => {
    setState((prev) => ({
      ...prev,
      aiDescription,
      isGeneratingDescription: false,
    }));
  }, []);

  const setGeneratingDescription = useCallback((isGenerating: boolean) => {
    setState((prev) => ({
      ...prev,
      isGeneratingDescription: isGenerating,
    }));
  }, []);

  const setGuests = useCallback((guests: string[]) => {
    setState((prev) => ({
      ...prev,
      guests,
    }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setStep(step);
  }, [setStep]);

  const goNext = useCallback(() => {
    const stepOrder: WizardStep[] = ['type', 'host', 'date', 'location', 'confirm', 'guests'];
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  }, [state.step, setStep]);

  const goBack = useCallback(() => {
    const stepOrder: WizardStep[] = ['type', 'host', 'date', 'location', 'confirm', 'guests'];
    const currentIndex = stepOrder.indexOf(state.step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  }, [state.step, setStep]);

  const reset = useCallback(() => {
    setState(initialWizardState);
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (state.step) {
      case 'type':
        return state.template !== null;
      case 'host':
        return state.hostName.trim().length > 0;
      case 'date':
        return state.dateRange !== null;
      case 'location':
        return state.locationText.trim().length > 0;
      case 'confirm':
        return true;
      case 'guests':
        return true; // Guests are optional
      default:
        return false;
    }
  }, [state]);

  return {
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
    goToStep,
    goNext,
    goBack,
    canProceed,
    reset,
  };
}

export type WizardActions = ReturnType<typeof useWizardState>;


