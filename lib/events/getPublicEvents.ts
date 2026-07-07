import 'server-only';

import { getAllEvents } from '@/lib/eventService';

/** Public site listings — visibility is is_active only (server-side). */
export async function getPublicEventsForSite(locale: string = 'tr') {
  return getAllEvents(locale);
}
