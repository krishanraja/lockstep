import type { EventTemplate } from './types';
import { makePossessive } from './index';

export const bucksTemplate: EventTemplate = {
  id: 'bucks',
  icon: '🎉',
  label: 'Bucks Party',
  subtitle: 'Send him off in style',
  namePattern: (host) => `${makePossessive(host)} Bucks Weekend`,
  descriptionPrompt: `Generate a brief, confident description for a bucks party weekend.
Style: Mature, exciting but not cheesy. One short paragraph. No emojis.`,
  tone: 'fun, cheeky, and exciting - like a legendary send-off awaits',
  defaultDurationDays: 3,
  blocks: [
    { name: 'Friday Evening', defaultDuration: 4, attendanceRequired: false },
    { name: 'Saturday Day', defaultDuration: 6, attendanceRequired: true },
    { name: 'Saturday Dinner', defaultDuration: 3, attendanceRequired: true },
    { name: 'Saturday Night', defaultDuration: 5, attendanceRequired: true },
    { name: 'Sunday Recovery', defaultDuration: 4, attendanceRequired: false },
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
      prompt: 'Budget range', 
      options: ['$100-200', '$200-400', '$400-600', '$600+'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'How are you getting there?', 
      options: ['Driving myself', 'Flying in', 'Need a ride', 'Taking the train/bus'],
      required: true,
    },
  ],
  checkpoints: [
    { offsetDays: -21, type: 'reminder', name: 'First heads up' },
    { offsetDays: -14, type: 'reminder', name: 'Confirm attendance' },
    { offsetDays: -7, type: 'deadline', name: 'Final headcount', autoResolveTo: 'out' },
    { offsetDays: -2, type: 'final', name: 'Last call' },
  ],
  suggestedLocations: [
    'Byron Bay, Australia',
    'Hunter Valley, Australia',
    'Gold Coast, Australia',
    'Queenstown, New Zealand',
    'Bali, Indonesia',
    'Las Vegas, USA',
  ],
};



