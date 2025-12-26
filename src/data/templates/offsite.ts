import type { EventTemplate } from './types';

export const offsiteTemplate: EventTemplate = {
  id: 'offsite',
  icon: '💼',
  label: 'Team Offsite',
  subtitle: 'Connect and collaborate',
  namePattern: (host) => `${host} Team Offsite`,
  descriptionPrompt: `Generate a brief, professional description for a team offsite.
Style: Professional but warm, purposeful. One short paragraph. No emojis.
Tone: Like a productive retreat that builds connection.`,
  defaultDurationDays: 2,
  blocks: [
    { name: 'Day 1 - Kickoff', defaultDuration: 4, attendanceRequired: true },
    { name: 'Day 1 - Workshops', defaultDuration: 4, attendanceRequired: true },
    { name: 'Day 1 - Team Dinner', defaultDuration: 3, attendanceRequired: true },
    { name: 'Day 2 - Sessions', defaultDuration: 4, attendanceRequired: true },
    { name: 'Day 2 - Wrap-up', defaultDuration: 2, attendanceRequired: true },
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
      prompt: 'Travel arrangements', 
      options: ['Will book own travel', 'Need travel booked', 'Driving'],
      required: true,
    },
    { 
      type: 'single_select', 
      prompt: 'Arriving', 
      options: ['Night before', 'Morning of', 'Already in area'],
      required: true,
    },
  ],
  checkpoints: [
    { offsetDays: -21, type: 'reminder', name: 'Save the date' },
    { offsetDays: -14, type: 'reminder', name: 'Confirm attendance' },
    { offsetDays: -7, type: 'deadline', name: 'Final headcount', autoResolveTo: 'out' },
    { offsetDays: -3, type: 'final', name: 'Travel details' },
  ],
  suggestedLocations: [
    'Company office',
    'Conference center',
    'Retreat venue',
    'Coworking space',
  ],
};


