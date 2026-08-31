'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { getLegalPagePaths } from '@/lib/legalConsent';

export type LegalConsentValues = {
  privacyAccepted: boolean;
  termsAccepted: boolean;
};

export type LegalConsentErrors = {
  privacyAccepted?: string;
  termsAccepted?: string;
};

type LegalConsentFieldsProps = {
  locale: string;
  value: LegalConsentValues;
  onChange: (next: LegalConsentValues) => void;
  errors?: LegalConsentErrors;
  idPrefix?: string;
  className?: string;
  /** Compact layout for checkout sidebars */
  compact?: boolean;
};

const copy = {
  tr: {
    privacyTitle: 'Gizlilik Politikası',
    termsTitle: 'Kullanım Koşulları',
    privacyLabel: 'Gizlilik Politikasını okudum ve kabul ediyorum.',
    termsLabel: 'Kullanım Koşullarını okudum ve kabul ediyorum.',
    privacyLink: 'Gizlilik Politikasını oku',
    termsLink: 'Kullanım Koşullarını oku',
    privacyError: 'Devam etmek için gizlilik politikasını kabul etmelisiniz.',
    termsError: 'Devam etmek için kullanım koşullarını kabul etmelisiniz.',
  },
  en: {
    privacyTitle: 'Privacy Policy',
    termsTitle: 'Terms of Use',
    privacyLabel: 'I have read and accept the Privacy Policy.',
    termsLabel: 'I have read and accept the Terms of Use.',
    privacyLink: 'Read the Privacy Policy',
    termsLink: 'Read the Terms of Use',
    privacyError: 'You must accept the Privacy Policy to continue.',
    termsError: 'You must accept the Terms of Use to continue.',
  },
};

export function validateLegalConsentClient(
  value: LegalConsentValues,
  locale: string
): LegalConsentErrors {
  const t = locale === 'en' ? copy.en : copy.tr;
  const errors: LegalConsentErrors = {};
  if (!value.privacyAccepted) errors.privacyAccepted = t.privacyError;
  if (!value.termsAccepted) errors.termsAccepted = t.termsError;
  return errors;
}

export default function LegalConsentFields({
  locale,
  value,
  onChange,
  errors,
  idPrefix = 'legal',
  className = '',
  compact = false,
}: LegalConsentFieldsProps) {
  const t = locale === 'en' ? copy.en : copy.tr;
  const { privacyPath, termsPath } = getLegalPagePaths(locale);
  const privacyId = `${idPrefix}-privacy`;
  const termsId = `${idPrefix}-terms`;

  const boxClass = compact
    ? 'space-y-3'
    : 'space-y-4';

  const panelClass = compact
    ? 'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 p-3'
    : 'rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 p-4 sm:p-5';

  return (
    <div className={`${boxClass} ${className}`.trim()} data-field="legal-consent">
      <div className={panelClass} data-field="privacyAccepted">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {t.privacyTitle}
        </p>
        <div className="flex items-start gap-3">
          <input
            id={privacyId}
            type="checkbox"
            checked={value.privacyAccepted}
            onChange={(e) =>
              onChange({ ...value, privacyAccepted: e.target.checked })
            }
            className={`mt-0.5 h-4 w-4 rounded border-neutral-300 text-[#990000] focus:ring-[#990000] ${
              errors?.privacyAccepted ? 'border-red-500' : ''
            }`}
          />
          <label
            htmlFor={privacyId}
            className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            {t.privacyLabel}{' '}
            <Link
              href={privacyPath}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#990000] dark:text-[#ff6666] hover:opacity-80"
            >
              {t.privacyLink}
            </Link>
          </label>
        </div>
        {errors?.privacyAccepted && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.privacyAccepted}
          </p>
        )}
      </div>

      <div className={panelClass} data-field="termsAccepted">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {t.termsTitle}
        </p>
        <div className="flex items-start gap-3">
          <input
            id={termsId}
            type="checkbox"
            checked={value.termsAccepted}
            onChange={(e) =>
              onChange({ ...value, termsAccepted: e.target.checked })
            }
            className={`mt-0.5 h-4 w-4 rounded border-neutral-300 text-[#990000] focus:ring-[#990000] ${
              errors?.termsAccepted ? 'border-red-500' : ''
            }`}
          />
          <label
            htmlFor={termsId}
            className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer"
          >
            {t.termsLabel}{' '}
            <Link
              href={termsPath}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[#990000] dark:text-[#ff6666] hover:opacity-80"
            >
              {t.termsLink}
            </Link>
          </label>
        </div>
        {errors?.termsAccepted && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errors.termsAccepted}
          </p>
        )}
      </div>
    </div>
  );
}
