/**
 * Client-safe certificate helpers. Clerk cookie auth via Next.js APIs.
 * userId args kept for call-site compatibility and ignored.
 */

export type CertificateData = {
  userId: string;
  itemId: string;
  itemType: 'course' | 'event';
  itemName: string;
  instructorName: string;
  duration: string;
  organization: string;
  organizationDescription: string;
  instructorBio: string;
  userFullName?: string;
};

export type EligibilityCheck = {
  isEligible: boolean;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  averageQuizScore: number;
  missingRequirements: string[];
  existingCertificate?: unknown;
  hasException?: boolean;
  completionPercentage?: number;
};

async function parseJson(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed (${res.status})`);
  }
  return json;
}

export async function checkCertificateEligibility(_userId: string, courseId: string) {
  const res = await fetch(
    `/api/certificates/eligibility?courseId=${encodeURIComponent(courseId)}`
  );
  const json = await parseJson(res);
  return json.data as EligibilityCheck;
}

export async function checkEventCertificateEligibility(_userId: string, eventId: string) {
  const res = await fetch(
    `/api/certificates/eligibility?eventId=${encodeURIComponent(eventId)}`
  );
  const json = await parseJson(res);
  return json.data as EligibilityCheck;
}

export async function getUserCertificate(_userId: string, courseId: string) {
  const res = await fetch(
    `/api/certificates/mine?courseId=${encodeURIComponent(courseId)}`
  );
  const json = await parseJson(res);
  return json.data ?? null;
}

export async function getUserEventCertificate(_userId: string, eventId: string) {
  const res = await fetch(
    `/api/certificates/mine?eventId=${encodeURIComponent(eventId)}`
  );
  const json = await parseJson(res);
  return json.data ?? null;
}

export async function generateCertificate(data: CertificateData, forceGenerate = false) {
  const res = await fetch('/api/certificates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId: data.itemId,
      itemType: data.itemType,
      itemName: data.itemName,
      instructorName: data.instructorName,
      duration: data.duration,
      organization: data.organization,
      organizationDescription: data.organizationDescription,
      instructorBio: data.instructorBio,
      userFullName: data.userFullName,
      forceGenerate,
    }),
  });
  const json = await parseJson(res);
  return json.data;
}

export async function generateCertificateWithProgress(data: CertificateData) {
  const eligibility =
    data.itemType === 'event'
      ? await checkEventCertificateEligibility(data.userId, data.itemId)
      : await checkCertificateEligibility(data.userId, data.itemId);

  if (!eligibility.isEligible) {
    throw new Error(
      eligibility.missingRequirements?.join(', ') || 'Not eligible for certificate'
    );
  }

  if (eligibility.existingCertificate) {
    return eligibility.existingCertificate;
  }

  return generateCertificate(data, true);
}

export async function getMyCertificates() {
  const res = await fetch('/api/certificates/me');
  const json = await parseJson(res);
  return {
    courseCertificates: json.courseCertificates || [],
    eventCertificates: json.eventCertificates || [],
  };
}
