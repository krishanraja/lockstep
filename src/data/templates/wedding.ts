import type { EventTemplate } from './types';
import { makePossessive } from './index';

export const weddingTemplate: EventTemplate = {
  id: 'wedding',
  icon: '💒',
  label: 'Wedding',
  subtitle: 'Gather your loved ones',
  namePattern: (host) => `${makePossessive(host)} Wedding`,
  descriptionPrompt: `Generate a brief, warm description for a wedding celebration.
Style: Elegant, heartfelt, inclusive. One short paragraph. No emojis.`,
  tone: 'warm, heartfelt, and celebratory - like an intimate celebration of love',
  defaultDurationDays: 2,
  blocks: [
    { name: 'Ceremony', defaultDuration: 2, attendanceRequired: true },
    { name: 'Reception', defaultDuration: 5, attendanceRequired: true },
    { name: 'After Party', defaultDuration: 4, attendanceRequired: false },
    { name: 'Next Day Brunch', defaultDuration: 3, attendanceRequired: false },
  ],
  questions: [
    { 
      type: 'multi_select', 
      prompt: 'Dietary requirements', 
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Allergies (specify in notes)', 'None'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'Will you need accommodation?', 
      options: ['Yes, please recommend', 'Already booked', 'Staying locally'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'How are you getting there?', 
      options: ['Driving', 'Flying in', 'Need shuttle info', 'Local'],
      required: true,
    },
    {
      type: 'text',
      prompt: 'Song request for the dance floor',
      required: false,
    },
  ],
  checkpoints: [
    { offsetDays: -60, type: 'reminder', name: 'Save the date reminder' },
    { offsetDays: -30, type: 'reminder', name: 'RSVP reminder' },
    { offsetDays: -14, type: 'deadline', name: 'Final RSVP', autoResolveTo: 'out' },
    { offsetDays: -7, type: 'final', name: 'Last details' },
  ],
  suggestedLocations: [
    'Yarra Valley, Australia',
    'Hunter Valley, Australia',
    'Byron Bay, Australia',
    'Mornington Peninsula, Australia',
    'Tuscany, Italy',
    'Provence, France',
  ],
};



