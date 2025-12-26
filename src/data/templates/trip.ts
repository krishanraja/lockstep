import type { EventTemplate } from './types';

export const tripTemplate: EventTemplate = {
  id: 'trip',
  icon: '✈️',
  label: 'Trip',
  subtitle: 'Adventure awaits',
  namePattern: (host) => `${host}'s Group Trip`,
  descriptionPrompt: `Generate a brief, exciting description for a group trip.
Style: Adventurous, organized, enticing. One short paragraph. No emojis.
Tone: Like a well-planned adventure with friends.`,
  defaultDurationDays: 5,
  blocks: [
    { name: 'Day 1 - Arrival', defaultDuration: 8, attendanceRequired: false },
    { name: 'Day 2 - Explore', defaultDuration: 10, attendanceRequired: true },
    { name: 'Day 3 - Adventure', defaultDuration: 10, attendanceRequired: true },
    { name: 'Day 4 - Leisure', defaultDuration: 10, attendanceRequired: true },
    { name: 'Day 5 - Departure', defaultDuration: 6, attendanceRequired: false },
  ],
  questions: [
    { 
      type: 'multi_select', 
      prompt: 'Dietary requirements', 
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'None'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'Budget range for the trip', 
      options: ['$500-1000', '$1000-2000', '$2000-3000', '$3000+'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'Passport status', 
      options: ['Valid passport', 'Need to renew', 'N/A - domestic trip'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'Accommodation preference', 
      options: ['Share room to save', 'Own room please', 'Flexible'],
      required: true,
    },
  ],
  checkpoints: [
    { offsetDays: -60, type: 'reminder', name: 'Gauge interest' },
    { offsetDays: -45, type: 'reminder', name: 'Confirm interest' },
    { offsetDays: -30, type: 'deadline', name: 'Book or bail', autoResolveTo: 'out' },
    { offsetDays: -14, type: 'reminder', name: 'Final details' },
    { offsetDays: -3, type: 'final', name: 'Pre-trip checklist' },
  ],
  suggestedLocations: [
    'Bali, Indonesia',
    'Tokyo, Japan',
    'Queenstown, New Zealand',
    'Vietnam',
    'Thailand',
    'Europe',
  ],
};


