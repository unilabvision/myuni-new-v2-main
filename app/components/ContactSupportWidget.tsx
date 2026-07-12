'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';

const texts = {
  tr: {
    title: 'Bize yazın',
    subtitleSignedIn: 'Mesajınız e-posta olarak ekibimize iletilir. Yanıtı mailinize gelir.',
    subtitleGuest: 'Mesaj göndermek için MyUNI hesabınıza giriş yapmanız veya kayıt olmanız gerekir.',
    placeholder: 'Mesajınızı yazın...',
    send: 'Gönder',
    sending: 'Gönderiliyor...',
    login: 'Giriş Yap',
    signup: 'Kayıt Ol',
    success: 'Mesajınız gönderildi. En kısa sürede e-posta ile dönüş yapacağız.',
    emailFailed:
      'Mesaj kaydedildi ancak e-posta şu an gönderilemiyor. Lütfen daha sonra tekrar deneyin veya iletisim@myunilab.net adresine yazın.',
    error: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.',
    as: 'Gönderen',
  },
  en: {
    title: 'Message us',
    subtitleSignedIn: 'Your message is emailed to our team. We reply to your email.',
    subtitleGuest: 'You need to sign in or create a MyUNI account to send a message.',
    placeholder: 'Type your message...',
    send: 'Send',
    sending: 'Sending...',
    login: 'Sign In',
    signup: 'Sign Up',
    success: 'Your message was sent. We will reply by email soon.',
    emailFailed:
      'Your message was saved but email could not be sent right now. Please try again later or write to iletisim@myunilab.net.',
    error: 'Could not send message. Please try again.',
    as: 'From',
  },
};

export default function ContactSupportWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  const locale = pathname?.startsWith('/en') ? 'en' : 'tr';
  const t = texts[locale];

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'email_failed'>('idle');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    setStatus('idle');
    setErrorText('');
  }, [open]);

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    '';

  const goAuth = (mode: 'login' | 'signup') => {
    const redirect = encodeURIComponent(pathname || `/${locale}`);
    if (mode === 'signup') {
      router.push(`/${locale}/sign-up?redirect_url=${redirect}`);
      return;
    }
    router.push(`/${locale}/login?redirect=${redirect}`);
  };

  const handleSend = async () => {
    if (!isSignedIn) {
      goAuth('login');
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 3) return;

    setSending(true);
    setStatus('idle');
    setErrorText('');

    try {
      const res = await fetch('/api/support-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.error);
      }
      if (data.emailsSent === false) {
        setStatus('email_failed');
        setErrorText(data.warning || t.emailFailed);
        setMessage('');
        return;
      }
      setStatus('success');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorText(err instanceof Error ? err.message : t.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 md:bottom-6 md:right-6">
      {open && (
        <div className="mb-3 w-[min(100vw-2.5rem,22rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-start justify-between bg-[#990000] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-1 text-xs text-white/85">
                {isSignedIn ? t.subtitleSignedIn : t.subtitleGuest}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/15"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {!isLoaded ? (
              <div className="flex justify-center py-8 text-neutral-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !isSignedIn ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => goAuth('login')}
                  className="w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-[#990000]"
                >
                  {t.login}
                </button>
                <button
                  type="button"
                  onClick={() => goAuth('signup')}
                  className="w-full rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-800 hover:border-[#990000] hover:text-[#990000] dark:border-neutral-600 dark:text-neutral-100"
                >
                  {t.signup}
                </button>
              </div>
            ) : status === 'success' ? (
              <p className="py-4 text-sm text-emerald-700 dark:text-emerald-400">{t.success}</p>
            ) : status === 'email_failed' ? (
              <p className="py-4 text-sm text-amber-700 dark:text-amber-400">
                {errorText || t.emailFailed}
              </p>
            ) : (
              <div className="space-y-3">
                {email && (
                  <p className="text-xs text-neutral-500">
                    {t.as}: <span className="font-medium text-neutral-800 dark:text-neutral-200">{email}</span>
                  </p>
                )}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={t.placeholder}
                  className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#990000] dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
                />
                {status === 'error' && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errorText || t.error}</p>
                )}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || message.trim().length < 3}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#990000] py-2.5 text-sm font-semibold text-white hover:bg-[#770000] disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t.send}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.title}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#990000] text-white shadow-lg transition hover:bg-[#770000] focus:outline-none focus:ring-2 focus:ring-[#990000]/40"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
