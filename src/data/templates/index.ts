// Event Templates Registry

import { bucksTemplate } from './bucks';
import { hensTemplate } from './hens';
import { weddingTemplate } from './wedding';
import { birthdayTemplate } from './birthday';
import { reunionTemplate } from './reunion';
import { tripTemplate } from './trip';
import { offsiteTemplate } from './offsite';
import { customTemplate } from './custom';
import type { EventTemplate, EventTemplateId } from './types';

// Export all types
export * from './types';

// Helper for possessive names (e.g., "Charles'" vs "John's")
export function makePossessive(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  // Names ending in 's' get just an apostrophe
  if (trimmed.toLowerCase().endsWith('s')) {
    return `${trimmed}'`;
  }
  return `${trimmed}'s`;
}

// All templates in display order
export const templates: EventTemplate[] = [
  bucksTemplate,
  hensTemplate,
  weddingTemplate,
  birthdayTemplate,
  reunionTemplate,
  tripTemplate,
  offsiteTemplate,
  customTemplate,
];

// Template lookup by ID
export const templateById: Record<EventTemplateId, EventTemplate> = {
  bucks: bucksTemplate,
  hens: hensTemplate,
  wedding: weddingTemplate,
  birthday: birthdayTemplate,
  reunion: reunionTemplate,
  trip: tripTemplate,
  offsite: offsiteTemplate,
  custom: customTemplate,
};

// Get template by ID
export function getTemplate(id: EventTemplateId): EventTemplate {
  return templateById[id];
}

// Generate event name from template and host
export function generateEventName(template: EventTemplate, hostName: string): string {
  if (!hostName.trim()) return '';
  return template.namePattern(hostName.trim());
}

// Calculate checkpoints from event start date and template
export function generateCheckpoints(
  template: EventTemplate,
  eventStartDate: Date
): Array<{ name: string; triggerAt: Date; type: string; autoResolveTo?: string }> {
  return template.checkpoints.map((cp) => {
    const triggerAt = new Date(eventStartDate);
    triggerAt.setDate(triggerAt.getDate() + cp.offsetDays);
    return {
      name: cp.name,
      triggerAt,
      type: cp.type,
      autoResolveTo: cp.autoResolveTo,
    };
  });
}

// Generate blocks with times based on event dates
export function generateBlocks(
  template: EventTemplate,
  startDate: Date,
  endDate: Date
): Array<{ name: string; startTime: Date; endTime: Date; attendanceRequired: boolean }> {
  const blocks = template.blocks;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const blocksPerDay = Math.ceil(blocks.length / totalDays);
  
  return blocks.map((block, index) => {
    const dayOffset = Math.floor(index / blocksPerDay);
    const blockDate = new Date(startDate);
    blockDate.setDate(blockDate.getDate() + dayOffset);
    
    // Set reasonable default times based on block name
    const blockName = block.name.toLowerCase();
    let startHour = 10;
    if (blockName.includes('morning') || blockName.includes('breakfast') || blockName.includes('brunch')) {
      startHour = 9;
    } else if (blockName.includes('afternoon') || blockName.includes('day')) {
      startHour = 12;
    } else if (blockName.includes('dinner')) {
      startHour = 18;
    } else if (blockName.includes('evening') || blockName.includes('night')) {
      startHour = 20;
    } else if (blockName.includes('arrival')) {
      startHour = 14;
    } else if (blockName.includes('departure') || blockName.includes('recovery')) {
      startHour = 10;
    }
    
    const startTime = new Date(blockDate);
    startTime.setHours(startHour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + block.defaultDuration);
    
    return {
      name: block.name,
      startTime,
      endTime,
      attendanceRequired: block.attendanceRequired ?? false,
    };
  });
}



