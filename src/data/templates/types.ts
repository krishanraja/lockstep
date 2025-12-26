// Event Template Type Definitions

export type EventTemplateId = 
  | 'bucks' 
  | 'hens'
  | 'wedding' 
  | 'birthday' 
  | 'reunion' 
  | 'trip' 
  | 'offsite' 
  | 'custom';

export interface BlockTemplate {
  name: string;
  defaultDuration: number; // hours
  attendanceRequired?: boolean;
}

export interface QuestionTemplate {
  type: 'boolean' | 'single_select' | 'multi_select' | 'text' | 'number';
  prompt: string;
  options?: string[];
  required?: boolean;
}

export interface CheckpointTemplate {
  offsetDays: number; // negative = before event
  type: 'reminder' | 'deadline' | 'final';
  name: string;
  autoResolveTo?: 'out' | 'maybe';
}

export interface EventTemplate {
  id: EventTemplateId;
  icon: string;
  label: string;
  subtitle: string;
  namePattern: (hostName: string) => string;
  descriptionPrompt: string;
  blocks: BlockTemplate[];
  questions: QuestionTemplate[];
  checkpoints: CheckpointTemplate[];
  suggestedLocations: string[];
  defaultDurationDays: number;
}

// Result of Google Places autocomplete
export interface GooglePlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  types?: string[];
}

// Wizard state
export type WizardStep = 'type' | 'host' | 'date' | 'location' | 'confirm' | 'guests';

export interface WizardState {
  step: WizardStep;
  template: EventTemplate | null;
  hostName: string;
  eventName: string;
  isEventNameCustomized: boolean;
  dateRange: { start: Date; end: Date } | null;
  location: GooglePlaceResult | null;
  locationText: string;
  aiDescription: string;
  isGeneratingDescription: boolean;
  guests: string[]; // Phone numbers or names
}

export const initialWizardState: WizardState = {
  step: 'type',
  template: null,
  hostName: '',
  eventName: '',
  isEventNameCustomized: false,
  dateRange: null,
  location: null,
  locationText: '',
  aiDescription: '',
  isGeneratingDescription: false,
  guests: [],
};


