'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

const CLERK_LOAD_TIMEOUT_MS = 2000;

/** Show sign-in UI even if Clerk never becomes isLoaded (e.g. pk_live on localhost). */
export function useAuthUiReady() {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded) return;
    const id = window.setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [isLoaded]);

  return {
    isSignedIn: !!isSignedIn,
    authReady: mounted && (isLoaded || timedOut),
  };
}
