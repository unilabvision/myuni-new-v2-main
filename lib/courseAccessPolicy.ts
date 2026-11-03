export function isCourseAccessAllowed(params: {
  hasActiveEnrollment: boolean;
  hasMembershipAccess: boolean;
}): boolean {
  return params.hasActiveEnrollment || params.hasMembershipAccess;
}
