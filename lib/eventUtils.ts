import { fetchEventEnrollmentCounts } from './publicApiClient';

// lib/eventUtils.ts — client-safe attendee count via API
export async function getEventAttendeeCount(eventId: string): Promise<number> {
  if (!eventId?.trim()) return 0;
  try {
    const json = await fetchEventEnrollmentCounts([eventId]);
    if (!json.success) return 0;
    return Number(json.counts?.[eventId] || 0);
  } catch (error) {
    console.error('Error counting event attendees:', error);
    return 0;
  }
}
