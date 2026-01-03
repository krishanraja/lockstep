import { useState, useCallback } from 'react';
import type { 
  WizardState, 
  WizardStep, 
  EventTemplate, 
  GooglePlaceResult,
  EventTemplateId,
  BlockTemplate,
  CheckpointTemplate,
  QuestionTemplate,
} from '@/data/templates/types';
import { initialWizardState, generateEventName, templateById } from '@/data/templates';

// Storage key for persisting wizard state
const WIZARD_STORAGE_KEY = 'lockstep_wizard_state';

// Serializable version of wizard state (dates as ISO strings, template as ID)
interface SerializableWizardState {
  step: WizardStep;
  templateId: EventTemplateId | null;
  hostName: string;
  eventName: string;
  isEventNameCustomized: boolean;
  dateRange: { start: string; end: string } | null;
  location: GooglePlaceResult | null;
  locationText: string;
  aiDescription: string;
  guests: string[];
  // Custom edits to template defaults
  customBlocks?: BlockTemplate[];
  customCheckpoints?: CheckpointTemplate[];
  customQuestions?: QuestionTemplate[];
  coverImageUrl?: string;
}

/**
 * Save wizard state to localStorage for persistence across auth flow
 */
export function saveWizardState(state: WizardState): void {
  try {
    const serializable: SerializableWizardState = {
      step: state.step,
      templateId: state.template?.id || null,
      hostName: state.hostName,
      eventName: state.eventName,
      isEventNameCustomized: state.isEventNameCustomized,
      dateRange: state.dateRange
        ? {
            start: state.dateRange.start.toISOString(),
            end: state.dateRange.end.toISOString(),
          }
        : null,
      location: state.location,
      locationText: state.locationText,
      aiDescription: state.aiDescription,
      guests: state.guests,
      customBlocks: state.customBlocks,
      customCheckpoints: state.customCheckpoints,
      customQuestions: state.customQuestions,
      coverImageUrl: state.coverImageUrl,
    };
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save wizard state:', error);
  }
}

/**
 * Load wizard state from localStorage
 * Returns null if no saved state exists or if parsing fails
 */
export function loadWizardState(): WizardState | null {
  try {
    const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!saved) return null;

    const parsed: SerializableWizardState = JSON.parse(saved);
    
    // Restore the template from ID
    const template = parsed.templateId ? templateById[parsed.templateId] : null;
    
    // Restore dates from ISO strings
    const dateRange = parsed.dateRange
      ? {
          start: new Date(parsed.dateRange.start),
          end: new Date(parsed.dateRange.end),
        }
      : null;

    return {
      step: parsed.step,
      template,
      hostName: parsed.hostName,
      eventName: parsed.eventName,
      isEventNameCustomized: parsed.isEventNameCustomized,
      dateRange,
      location: parsed.location,
      locationText: parsed.locationText,
      aiDescription: parsed.aiDescription,
      isGeneratingDescription: false,
      guests: parsed.guests,
      customBlocks: parsed.customBlocks,
      customCheckpoints: parsed.customCheckpoints,
      customQuestions: parsed.customQuestions,
      coverImageUrl: parsed.coverImageUrl,
    };
  } catch (error) {
    console.error('Failed to load wizard state:', error);
    return null;
  }
}

/**
 * Clear saved wizard state from localStorage
 */
export function clearWizardState(): void {
  try {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wizard state:', error);
  }
}

/**
 * Check if there's a saved wizard state that's ready to create an event
 * (has all required data to complete event creation)
 */
export function hasPendingWizardState(): boolean {
  const state = loadWizardState();
  if (!state) return false;
  
  return !!(
    state.template &&
    state.eventName &&
    state.dateRange &&
    state.locationText &&
    state.step === 'guests' // Was at the final step before auth
  );
}

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

  const setCustomBlocks = useCallback((customBlocks: BlockTemplate[]) => {
    setState((prev) => ({
      ...prev,
      customBlocks,
    }));
  }, []);

  const setCustomCheckpoints = useCallback((customCheckpoints: CheckpointTemplate[]) => {
    setState((prev) => ({
      ...prev,
      customCheckpoints,
    }));
  }, []);

  const setCustomQuestions = useCallback((customQuestions: QuestionTemplate[]) => {
    setState((prev) => ({
      ...prev,
      customQuestions,
    }));
  }, []);

  const setCoverImageUrl = useCallback((coverImageUrl: string) => {
    setState((prev) => ({
      ...prev,
      coverImageUrl,
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

  const restoreState = useCallback((savedState: WizardState) => {
    setState(savedState);
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
    setCustomBlocks,
    setCustomCheckpoints,
    setCustomQuestions,
    setCoverImageUrl,
    goToStep,
    goNext,
    goBack,
    canProceed,
    reset,
    restoreState,
  };
}

export type WizardActions = ReturnType<typeof useWizardState>;






