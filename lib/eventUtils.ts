// lib/eventUtils.ts — client-safe attendee count via API
export async function getEventAttendeeCount(eventId: string): Promise<number> {
  try {
    const response = await fetch(
      `/api/event-enrollments/counts?eventIds=${encodeURIComponent(eventId)}`
    );
    if (!response.ok) return 0;
    const json = await response.json();
    if (!json.success) return 0;
    return Number(json.counts?.[eventId] || 0);
  } catch (error) {
    console.error('Error counting event attendees:', error);
    return 0;
  }
}
