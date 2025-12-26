import type { EventTemplate } from './types';
import { makePossessive } from './index';

export const birthdayTemplate: EventTemplate = {
  id: 'birthday',
  icon: '🎂',
  label: 'Birthday',
  subtitle: 'Make it memorable',
  namePattern: (host) => `${makePossessive(host)} Birthday`,
  descriptionPrompt: `Generate a brief, celebratory description for a birthday gathering.
Style: Fun, warm, personal. One short paragraph. No emojis.`,
  tone: 'joyful and personal - like a gathering of close friends celebrating together',
  defaultDurationDays: 1,
  blocks: [
    { name: 'Pre-drinks', defaultDuration: 2, attendanceRequired: false },
    { name: 'Dinner', defaultDuration: 3, attendanceRequired: true },
    { name: 'Party/Drinks', defaultDuration: 4, attendanceRequired: false },
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
      prompt: 'Contribution for gift', 
      options: ['Yes, count me in', 'Already got something', 'Skip for me'],
      required: false,
    },
  ],
  checkpoints: [
    { offsetDays: -14, type: 'reminder', name: 'First invite' },
    { offsetDays: -7, type: 'reminder', name: 'Reminder' },
    { offsetDays: -3, type: 'deadline', name: 'Final headcount', autoResolveTo: 'out' },
  ],
  suggestedLocations: [
    'Melbourne CBD',
    'Sydney CBD',
    'Brisbane CBD',
    'Local restaurant',
    'House party',
  ],
};



