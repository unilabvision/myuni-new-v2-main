'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import CareersForm from '@/app/components/pages/careers/CareersForm';

interface OpportunityApplySectionProps {
  opportunitySlug: string;
  formConfigId: string | null;
  canApply: boolean;
  hasApplied: boolean;
  matchReasons: string[];
  locale?: string;
  loginRedirectPath: string;
}

export default function OpportunityApplySection({
  opportunitySlug,
  formConfigId,
  canApply,
  hasApplied,
  matchReasons,
  locale = 'tr',
  loginRedirectPath,
}: OpportunityApplySectionProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (hasApplied) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-300">
        Bu staja başvurunuz alındı. Değerlendirme sürecinde size e-posta ile dönüş yapılacaktır.
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Başvuru yapmak için giriş yapmalısınız.
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/${locale}/login?redirect=${encodeURIComponent(loginRedirectPath)}`
            )
          }
          className="bg-[#990000] hover:bg-[#b30000] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  if (!canApply) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-900 dark:text-amber-200">
        <p className="font-medium mb-1">Bu staj için henüz başvuramazsınız</p>
        <p className="text-amber-800/90 dark:text-amber-300/90">
          İlgili eğitimi tamamladığınızda (sertifika veya %100 ilerleme) başvuru
          açılacaktır.
        </p>
      </div>
    );
  }

  if (!formConfigId) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-sm text-neutral-500">
        Bu ilan için başvuru formu henüz yapılandırılmamış.
      </div>
    );
  }

  if (!ready) return null;

  return (
    <div className="space-y-4">
      {matchReasons.length > 0 && (
        <div className="rounded-lg bg-[#990000]/5 border border-[#990000]/20 p-3 text-sm">
          <p className="font-medium text-[#990000] mb-1">Eğitimine uygun</p>
          <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400">
            {matchReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-sm text-neutral-500">
        Başvuru formu aşağıdadır. Bilgilerinizi doldurup gönderin.
      </p>
      <CareersForm
        formName="myuni_internship"
        locale={locale}
        opportunitySlug={opportunitySlug}
        formConfigId={formConfigId || undefined}
      />
    </div>
  );
}
