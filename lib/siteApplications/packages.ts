export type RegistrationTier = 'free' | 'certificate';
export type ApplicationPaymentStatus = 'none' | 'pending' | 'paid';

export interface EventFormPackageSettings {
  certificate_enabled?: boolean;
  certificate_price?: number;
  certificate_title_tr?: string;
  certificate_title_en?: string;
  certificate_description_tr?: string;
  certificate_description_en?: string;
  free_title_tr?: string;
  free_title_en?: string;
  free_description_tr?: string;
  free_description_en?: string;
  shopier_product_url?: string | null;
}

export interface PublicRegistrationPackage {
  tier: RegistrationTier;
  title: string;
  description: string;
  price: number;
  requiresPayment: boolean;
}

export function parsePackageSettings(raw: unknown): EventFormPackageSettings {
  if (!raw) return {};
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    try {
      return parsePackageSettings(JSON.parse(trimmed));
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as EventFormPackageSettings;
  }
  return {};
}

export function getCertificatePrice(settings: EventFormPackageSettings): number {
  if (settings.certificate_enabled !== true) return 0;
  return Math.max(0, Number(settings.certificate_price) || 0);
}

export function getPublicRegistrationPackages(
  settings: EventFormPackageSettings,
  locale: string
): PublicRegistrationPackage[] {
  const isEn = locale === 'en';
  const packages: PublicRegistrationPackage[] = [
    {
      tier: 'free',
      title: isEn
        ? settings.free_title_en || 'Free Registration'
        : settings.free_title_tr || 'Ücretsiz Kayıt',
      description: isEn
        ? settings.free_description_en || ''
        : settings.free_description_tr || '',
      price: 0,
      requiresPayment: false,
    },
  ];

  const certificatePrice = getCertificatePrice(settings);
  if (certificatePrice > 0) {
    packages.push({
      tier: 'certificate',
      title: isEn
        ? settings.certificate_title_en || 'Certificate Package'
        : settings.certificate_title_tr || 'Sertifika Paketi',
      description: isEn
        ? settings.certificate_description_en || ''
        : settings.certificate_description_tr || '',
      price: certificatePrice,
      requiresPayment: true,
    });
  }

  return packages;
}

export function isValidRegistrationTier(
  tier: string,
  settings: EventFormPackageSettings
): tier is RegistrationTier {
  if (tier === 'free') return true;
  if (tier === 'certificate') return getCertificatePrice(settings) > 0;
  return false;
}

export function getEventApplicationCheckoutPath(
  locale: string,
  applicationId: string,
  eventSlug: string
): string {
  const params = new URLSearchParams({
    applicationId,
    eventSlug,
  });
  return `/${locale}/checkout/event-application?${params.toString()}`;
}
