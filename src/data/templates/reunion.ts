import type { EventTemplate } from './types';

export const reunionTemplate: EventTemplate = {
  id: 'reunion',
  icon: '👨‍👩‍👧‍👦',
  label: 'Reunion',
  subtitle: 'Bring everyone together',
  namePattern: (host) => `${host} Family Reunion`,
  descriptionPrompt: `Generate a brief, warm description for a family or friends reunion.
Style: Nostalgic, warm, inclusive. One short paragraph. No emojis.
Tone: Like reconnecting with people who matter.`,
  defaultDurationDays: 2,
  blocks: [
    { name: 'Arrival & Catch-up', defaultDuration: 3, attendanceRequired: false },
    { name: 'Main Event', defaultDuration: 6, attendanceRequired: true },
    { name: 'Dinner', defaultDuration: 3, attendanceRequired: true },
    { name: 'Farewell Breakfast', defaultDuration: 2, attendanceRequired: false },
  ],
  questions: [
    { 
      type: 'multi_select', 
      prompt: 'Dietary requirements', 
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'None'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'Will you need accommodation?', 
      options: ['Yes, please help arrange', 'Booking my own', 'Staying locally'],
      required: true,
    },
    { 
      type: 'number', 
      prompt: 'How many in your group?', 
      required: true,
    },
  ],
  checkpoints: [
    { offsetDays: -30, type: 'reminder', name: 'Save the date' },
    { offsetDays: -14, type: 'reminder', name: 'RSVP reminder' },
    { offsetDays: -7, type: 'deadline', name: 'Final headcount', autoResolveTo: 'out' },
  ],
  suggestedLocations: [
    'Family home',
    'Local park/reserve',
    'Winery',
    'Beach house',
    'Country retreat',
  ],
};


