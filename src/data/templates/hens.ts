import type { EventTemplate } from './types';

export const hensTemplate: EventTemplate = {
  id: 'hens',
  icon: '💅',
  label: 'Hens Party',
  subtitle: 'Celebrate the bride-to-be',
  namePattern: (host) => `${host}'s Hens Weekend`,
  descriptionPrompt: `Generate a brief, confident description for a hens party weekend.
Style: Elegant, fun, celebrating friendship. One short paragraph. No emojis.
Tone: Like a luxurious girls' getaway.`,
  defaultDurationDays: 3,
  blocks: [
    { name: 'Friday Evening', defaultDuration: 4, attendanceRequired: false },
    { name: 'Saturday Spa/Day', defaultDuration: 6, attendanceRequired: true },
    { name: 'Saturday Dinner', defaultDuration: 3, attendanceRequired: true },
    { name: 'Saturday Night', defaultDuration: 5, attendanceRequired: true },
    { name: 'Sunday Brunch', defaultDuration: 3, attendanceRequired: false },
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
    'Yarra Valley, Australia',
    'Hunter Valley, Australia',
    'Noosa, Australia',
    'Bali, Indonesia',
    'Queenstown, New Zealand',
  ],
};

