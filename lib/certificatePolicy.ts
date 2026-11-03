import type { CertificateData } from './certificateService';

export function buildTrustedCertificateData(params: {
  userId: string;
  itemId: string;
  itemType: 'course' | 'event';
  item: Record<string, unknown>;
  verifiedUserName: string;
}): CertificateData {
  return {
    userId: params.userId,
    itemId: params.itemId,
    itemType: params.itemType,
    itemName: String(params.item.title || ''),
    instructorName: String(
      params.item.instructor_name || params.item.organizer_name || 'MyUNI',
    ),
    duration: String(params.item.duration || ''),
    organization: 'MyUNI Eğitim Platformu',
    organizationDescription: '',
    instructorBio: String(params.item.instructor_description || ''),
    userFullName: params.verifiedUserName || 'Öğrenci',
  };
}
