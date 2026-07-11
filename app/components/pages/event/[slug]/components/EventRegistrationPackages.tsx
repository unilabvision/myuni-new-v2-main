'use client';

import { Check } from 'lucide-react';
import type { PublicRegistrationPackage } from '@/app/types/siteApplicationForms';

interface EventRegistrationPackagesProps {
  locale: string;
  packages: PublicRegistrationPackage[];
  selectedTier: 'free' | 'certificate';
  onSelectTier: (tier: 'free' | 'certificate') => void;
}

export default function EventRegistrationPackages({
  locale,
  packages,
  selectedTier,
  onSelectTier,
}: EventRegistrationPackagesProps) {
  if (packages.length <= 1) return null;

  const title = locale === 'tr' ? 'Kayıt paketi' : 'Registration package';
  const freeLabel = locale === 'tr' ? 'Ücretsiz' : 'Free';

  return (
    <div className="space-y-2 mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </p>
      <div className="space-y-2">
        {packages.map((pkg) => {
          const isSelected = selectedTier === pkg.tier;
          return (
            <button
              key={pkg.tier}
              type="button"
              onClick={() => onSelectTier(pkg.tier)}
              className={`relative w-full rounded-sm border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-[#990000] bg-[#990000]/5'
                  : 'border-neutral-200 dark:border-neutral-600 hover:border-[#990000]/40'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#990000] text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 pr-6">
                {pkg.title}
              </p>
              {pkg.description && (
                <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {pkg.description}
                </p>
              )}
              <p className="mt-2 text-base font-bold text-[#990000]">
                {pkg.price > 0 ? `₺${pkg.price}` : freeLabel}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
