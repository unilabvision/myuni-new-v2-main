/**
 * Shared legal consent helpers for application & payment APIs.
 * Client UI: LegalConsentFields. Server: assertLegalConsent / buildLegalConsentSnapshot.
 */

export type LegalConsentInput = {
  privacyAccepted?: unknown;
  termsAccepted?: unknown;
  privacy_consent?: unknown;
  terms_consent?: unknown;
};

export type LegalConsentSnapshot = {
  privacy_accepted: true;
  terms_accepted: true;
  privacy_accepted_at: string;
  terms_accepted_at: string;
  consent_source?: string;
  consent_locale?: string;
};

function isTruthyConsent(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function readLegalConsent(body: LegalConsentInput | null | undefined): {
  privacyAccepted: boolean;
  termsAccepted: boolean;
} {
  return {
    privacyAccepted: isTruthyConsent(
      body?.privacyAccepted ?? body?.privacy_consent
    ),
    termsAccepted: isTruthyConsent(body?.termsAccepted ?? body?.terms_consent),
  };
}

/**
 * Returns an error message if consent is missing, otherwise null.
 */
export function assertLegalConsent(
  body: LegalConsentInput | null | undefined,
  locale: string = 'tr'
): string | null {
  const { privacyAccepted, termsAccepted } = readLegalConsent(body);
  if (privacyAccepted && termsAccepted) return null;

  if (locale === 'en') {
    if (!privacyAccepted && !termsAccepted) {
      return 'You must accept the Privacy Policy and Terms of Use to continue.';
    }
    if (!privacyAccepted) {
      return 'You must accept the Privacy Policy to continue.';
    }
    return 'You must accept the Terms of Use to continue.';
  }

  if (!privacyAccepted && !termsAccepted) {
    return 'Devam etmek için Gizlilik Politikası ve Kullanım Koşullarını kabul etmelisiniz.';
  }
  if (!privacyAccepted) {
    return 'Devam etmek için Gizlilik Politikasını kabul etmelisiniz.';
  }
  return 'Devam etmek için Kullanım Koşullarını kabul etmelisiniz.';
}

export function buildLegalConsentSnapshot(
  options?: { source?: string; locale?: string }
): LegalConsentSnapshot {
  const now = new Date().toISOString();
  return {
    privacy_accepted: true,
    terms_accepted: true,
    privacy_accepted_at: now,
    terms_accepted_at: now,
    ...(options?.source ? { consent_source: options.source } : {}),
    ...(options?.locale ? { consent_locale: options.locale } : {}),
  };
}

export function getLegalPagePaths(locale: string): {
  privacyPath: string;
  termsPath: string;
} {
  if (locale === 'en') {
    return { privacyPath: '/en/privacy', termsPath: '/en/terms' };
  }
  return { privacyPath: '/tr/gizlilik', termsPath: '/tr/sartlar-ve-kosullar' };
}
