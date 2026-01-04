/**
 * Question Library - Predefined templated questions for data quality
 * 
 * All questions are structured and validated to ensure AI can process responses
 * No free-form text inputs allowed - all data is structured for magic AI experiences
 */

import type { QuestionTemplate } from './templates/types';

// ============================================
// QUESTION CATEGORIES
// ============================================

export type QuestionCategory = 
  | 'attendance'
  | 'logistics'
  | 'dietary'
  | 'budget'
  | 'preferences'
  | 'transport'
  | 'accommodation';

// ============================================
// PREDEFINED QUESTIONS LIBRARY
// ============================================

export interface LibraryQuestion extends QuestionTemplate {
  id: string;
  category: QuestionCategory;
  description: string;
  applicableEventTypes: string[]; // Which event types this question suits
}

export const QUESTION_LIBRARY: LibraryQuestion[] = [
  // ATTENDANCE
  {
    id: 'attendance-full',
    category: 'attendance',
    type: 'boolean',
    prompt: 'Can you make it?',
    required: true,
    description: 'Basic attendance confirmation',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'birthday', 'reunion', 'trip', 'offsite', 'custom'],
  },
  {
    id: 'attendance-partial',
    category: 'attendance',
    type: 'single_select',
    prompt: 'How much of the event can you attend?',
    options: ['The whole thing', 'Most of it', 'Part of it', 'Just dropping by', 'Can\'t make it'],
    required: true,
    description: 'Partial attendance options',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'reunion', 'offsite'],
  },
  {
    id: 'attendance-days',
    category: 'attendance',
    type: 'multi_select',
    prompt: 'Which days can you attend?',
    options: ['Friday', 'Saturday', 'Sunday', 'All days'],
    required: true,
    description: 'Multi-day event attendance',
    applicableEventTypes: ['bucks', 'hens', 'trip', 'offsite', 'reunion'],
  },

  // DIETARY
  {
    id: 'dietary-requirements',
    category: 'dietary',
    type: 'multi_select',
    prompt: 'Dietary requirements',
    options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Dairy-free', 'Nut allergy', 'None'],
    required: true,
    description: 'Food restrictions and allergies',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'birthday', 'reunion', 'trip', 'offsite', 'custom'],
  },
  {
    id: 'dietary-allergies',
    category: 'dietary',
    type: 'multi_select',
    prompt: 'Do you have any food allergies?',
    options: ['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Other allergies', 'No allergies'],
    required: true,
    description: 'Specific allergy information',
    applicableEventTypes: ['wedding', 'offsite', 'custom'],
  },
  {
    id: 'dietary-alcohol',
    category: 'dietary',
    type: 'single_select',
    prompt: 'What\'s your drink preference?',
    options: ['Beer', 'Wine', 'Spirits', 'Cocktails', 'Non-alcoholic only', 'Whatever\'s going'],
    required: false,
    description: 'Alcohol preferences',
    applicableEventTypes: ['bucks', 'hens', 'birthday', 'wedding'],
  },

  // BUDGET
  {
    id: 'budget-range',
    category: 'budget',
    type: 'single_select',
    prompt: 'Budget range',
    options: ['$100-200', '$200-400', '$400-600', '$600-800', '$800+'],
    required: true,
    description: 'Personal budget for the event',
    applicableEventTypes: ['bucks', 'hens', 'trip'],
  },
  {
    id: 'budget-contribution',
    category: 'budget',
    type: 'single_select',
    prompt: 'Are you happy to contribute to shared costs?',
    options: ['Yes, happy to chip in', 'Depends on the amount', 'Prefer to pay my own way', 'Need to keep costs minimal'],
    required: true,
    description: 'Shared cost preferences',
    applicableEventTypes: ['bucks', 'hens', 'trip', 'reunion'],
  },

  // TRANSPORT
  {
    id: 'transport-method',
    category: 'transport',
    type: 'single_select',
    prompt: 'How are you getting there?',
    options: ['Driving myself', 'Flying in', 'Need a ride', 'Taking the train/bus', 'Getting a taxi/Uber', 'Not sure yet'],
    required: true,
    description: 'Travel method to event',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'trip', 'reunion'],
  },
  {
    id: 'transport-carpool',
    category: 'transport',
    type: 'single_select',
    prompt: 'Can you help with transport?',
    options: ['I can drive others', 'I need a ride', 'I\'m sorted', 'Happy to coordinate'],
    required: false,
    description: 'Carpooling coordination',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'reunion'],
  },
  {
    id: 'transport-arrival',
    category: 'transport',
    type: 'single_select',
    prompt: 'When are you planning to arrive?',
    options: ['Early (day before)', 'Morning of', 'Afternoon', 'Evening', 'Not sure yet'],
    required: false,
    description: 'Arrival timing',
    applicableEventTypes: ['bucks', 'hens', 'trip', 'wedding'],
  },

  // ACCOMMODATION
  {
    id: 'accommodation-type',
    category: 'accommodation',
    type: 'single_select',
    prompt: 'Accommodation preference',
    options: ['Sharing a room', 'Private room', 'Staying nearby', 'Just there for the day', 'Need help finding a place'],
    required: true,
    description: 'Where they\'ll stay',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'trip', 'reunion'],
  },
  {
    id: 'accommodation-nights',
    category: 'accommodation',
    type: 'multi_select',
    prompt: 'Which nights do you need accommodation?',
    options: ['Friday night', 'Saturday night', 'Sunday night', 'None needed'],
    required: false,
    description: 'Nights requiring accommodation',
    applicableEventTypes: ['bucks', 'hens', 'trip', 'wedding'],
  },

  // PREFERENCES
  {
    id: 'activity-interests',
    category: 'preferences',
    type: 'multi_select',
    prompt: 'What activities interest you?',
    options: ['Adventure/Outdoors', 'Relaxation/Spa', 'Food & Dining', 'Nightlife', 'Sports', 'Sightseeing', 'Shopping', 'Whatever the group wants'],
    required: false,
    description: 'Activity preferences',
    applicableEventTypes: ['bucks', 'hens', 'trip'],
  },
  {
    id: 'energy-level',
    category: 'preferences',
    type: 'single_select',
    prompt: 'What\'s your vibe for this event?',
    options: ['Let\'s go all out!', 'Keen but not crazy', 'Taking it easy', 'Just there for the company'],
    required: false,
    description: 'Participation energy level',
    applicableEventTypes: ['bucks', 'hens', 'trip'],
  },
  {
    id: 'plus-one',
    category: 'preferences',
    type: 'single_select',
    prompt: 'Are you bringing a plus one?',
    options: ['Yes', 'No', 'Maybe', 'Need to check if I can'],
    required: true,
    description: 'Plus one attendance',
    applicableEventTypes: ['wedding', 'birthday', 'reunion'],
  },
  {
    id: 'special-requests',
    category: 'preferences',
    type: 'single_select',
    prompt: 'Any special requirements we should know about?',
    options: ['Accessibility needs', 'Early departure required', 'Late arrival', 'Bringing kids', 'Quiet accommodation preferred', 'Nothing special'],
    required: false,
    description: 'Special accommodations needed',
    applicableEventTypes: ['wedding', 'reunion', 'offsite', 'custom'],
  },

  // LOGISTICS
  {
    id: 'contact-method',
    category: 'logistics',
    type: 'single_select',
    prompt: 'Best way to reach you with updates?',
    options: ['WhatsApp', 'SMS', 'Email', 'Any of the above'],
    required: false,
    description: 'Communication preference',
    applicableEventTypes: ['bucks', 'hens', 'wedding', 'birthday', 'reunion', 'trip', 'offsite', 'custom'],
  },
  {
    id: 'emergency-contact',
    category: 'logistics',
    type: 'boolean',
    prompt: 'Do you have an emergency contact on file?',
    required: false,
    description: 'Emergency contact confirmation',
    applicableEventTypes: ['trip', 'offsite'],
  },
];

// ============================================
// CHECKPOINT TEMPLATES
// ============================================

export interface CheckpointPreset {
  id: string;
  name: string;
  offsetDays: number;
  type: 'reminder' | 'deadline' | 'final';
  description: string;
}

export const CHECKPOINT_PRESETS: CheckpointPreset[] = [
  // Early reminders
  { id: 'first-heads-up', name: 'First heads up', offsetDays: -21, type: 'reminder', description: '3 weeks before - initial notice' },
  { id: 'save-the-date', name: 'Save the date', offsetDays: -30, type: 'reminder', description: '1 month before - early warning' },
  
  // Mid-timeline
  { id: 'confirm-attendance', name: 'Confirm attendance', offsetDays: -14, type: 'reminder', description: '2 weeks before - get confirmations' },
  { id: 'payment-reminder', name: 'Payment reminder', offsetDays: -14, type: 'reminder', description: '2 weeks before - collect payments' },
  { id: 'details-update', name: 'Details update', offsetDays: -10, type: 'reminder', description: '10 days before - share logistics' },
  
  // Final countdown
  { id: 'final-headcount', name: 'Final headcount', offsetDays: -7, type: 'deadline', description: '1 week before - lock in numbers' },
  { id: 'last-call', name: 'Last call', offsetDays: -2, type: 'final', description: '2 days before - final reminder' },
  { id: 'day-before', name: 'Day before reminder', offsetDays: -1, type: 'final', description: 'Day before - get ready!' },
  { id: 'event-day', name: 'Event day', offsetDays: 0, type: 'final', description: 'Day of - it\'s happening!' },
];

// ============================================
// OPTION PRESETS FOR SELECT QUESTIONS
// ============================================

export const OPTION_PRESETS: Record<string, string[]> = {
  dietary: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Dairy-free', 'Nut allergy', 'None'],
  budget: ['$50-100', '$100-200', '$200-400', '$400-600', '$600+'],
  transport: ['Driving myself', 'Flying in', 'Need a ride', 'Taking the train/bus', 'Getting a taxi/Uber'],
  accommodation: ['Sharing a room', 'Private room', 'Staying nearby', 'Just there for the day'],
  days: ['Friday', 'Saturday', 'Sunday', 'All days'],
  attendance: ['The whole thing', 'Most of it', 'Part of it', 'Just dropping by', 'Can\'t make it'],
  yesno: ['Yes', 'No'],
  yesnomaybe: ['Yes', 'No', 'Maybe'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get questions suitable for a specific event type
 */
export function getQuestionsForEventType(eventType: string): LibraryQuestion[] {
  return QUESTION_LIBRARY.filter(q => 
    q.applicableEventTypes.includes(eventType) || q.applicableEventTypes.includes('custom')
  );
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: QuestionCategory): LibraryQuestion[] {
  return QUESTION_LIBRARY.filter(q => q.category === category);
}

/**
 * Convert library question to template question (strip metadata)
 */
export function toQuestionTemplate(question: LibraryQuestion): QuestionTemplate {
  const { id, category, description, applicableEventTypes, ...template } = question;
  return template;
}

