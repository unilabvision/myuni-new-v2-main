/** Event visibility vs registration — is_active controls listing; registration only blocks sign-up. */

export type EventRegistrationFields = {
  is_registration_open?: boolean;
  registration_deadline?: string | null;
};

export function isEventRegistrationOpen(event: EventRegistrationFields): boolean {
  if (event.is_registration_open === false) return false;
  if (!event.registration_deadline) return true;
  return new Date() < new Date(event.registration_deadline);
}
