// lib/eventUtils.ts
import { supabase } from './supabase';

// Etkinlik için katılımcı sayısını dinamik olarak hesapla
export async function getEventAttendeeCount(eventId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('myuni_event_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (error) {
      console.error('Error counting event attendees:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error counting event attendees:', error);
    return 0;
  }
}