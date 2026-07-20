// global.d.ts
declare global {
  interface Window {
    grecaptcha?: {
      ready: () => Promise<void>;
      execute: (siteKey: string, options: { action?: string }) => Promise<string>;
    };
  }
}

export {};
