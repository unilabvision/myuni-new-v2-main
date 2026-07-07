'use client';

import { useEffect, useState } from 'react';
import type { PublicSiteApplicationNavForm } from '@/app/types/siteApplicationForms';

export function useSiteApplicationNavForms(locale: string): PublicSiteApplicationNavForm[] {
  const [forms, setForms] = useState<PublicSiteApplicationNavForm[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/site-applications/public/forms?locale=${locale}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setForms(data.forms ?? []);
        }
      } catch {
        if (!cancelled) setForms([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return forms;
}
