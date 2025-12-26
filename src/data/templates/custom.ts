import type { EventTemplate } from './types';
import { makePossessive } from './index';

export const customTemplate: EventTemplate = {
  id: 'custom',
  icon: '✨',
  label: 'Something Else',
  subtitle: 'Create your own',
  namePattern: (host) => `${makePossessive(host)} Event`,
  descriptionPrompt: `Generate a brief, versatile description for a group gathering.
Style: Flexible, warm, inviting. One short paragraph. No emojis.`,
  tone: 'warm and inviting - like a thoughtfully planned get-together',
  defaultDurationDays: 1,
  blocks: [
    { name: 'Main Event', defaultDuration: 4, attendanceRequired: true },
  ],
  questions: [
    { 
      type: 'multi_select', 
      prompt: 'Dietary requirements', 
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'None'],
      required: true,
    },
  ],
  checkpoints: [
    { offsetDays: -7, type: 'reminder', name: 'First reminder' },
    { offsetDays: -3, type: 'deadline', name: 'Final headcount', autoResolveTo: 'out' },
  ],
  suggestedLocations: [],
};



