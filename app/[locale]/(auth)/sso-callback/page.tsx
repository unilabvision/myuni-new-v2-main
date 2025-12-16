"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface SSOCallbackProps {
  params: Promise<{ locale: string }>;
}

export default function SSOCallback({ params }: SSOCallbackProps) {
  const [resolvedParams, setResolvedParams] = useState<{ locale: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-900">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-600 dark:text-neutral-400" />
      </div>
    );
  }

  const { locale } = resolvedParams;

  const t = {
    signingIn: locale === 'tr' ? 'Giriş Yapılıyor...' : 'Signing In...',
    pleaseWait: locale === 'tr' 
      ? 'Google hesabınızla giriş yapılıyor, lütfen bekleyin.'
      : 'Signing in with your Google account, please wait.',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-900">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-neutral-600 dark:text-neutral-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
          {t.signingIn}
        </h2>
        
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {t.pleaseWait}
        </p>

        {/* Clerk's OAuth callback handler */}
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl={`/${locale}/login?tab=signin&error=oauth_failed`}
          signUpFallbackRedirectUrl={`/${locale}/login?tab=signup&error=oauth_failed`}
        />
      </div>
    </div>
  );
}