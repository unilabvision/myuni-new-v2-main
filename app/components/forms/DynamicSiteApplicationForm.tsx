'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Loader,
  Paperclip,
  Shield,
  Sparkles,
  Send,
  FileText,
  Mail,
  Phone,
  Link2,
  Hash,
  Calendar,
  AlignLeft,
  List,
  PartyPopper,
  Heart,
  Clock,
  Star,
  Check,
  CheckSquare,
  Circle,
  CloudUpload,
  Download,
} from 'lucide-react';
import type { RegistrationTier } from '@/lib/siteApplications/packages';
import type { PublicSiteApplicationForm } from '@/app/types/siteApplicationForms';
import type { SiteApplicationFieldType } from '@/app/types/siteApplicationForms';
import { SITE_APPLICATION_MAX_FILE_BYTES, SITE_APPLICATION_FILE_RETENTION_DAYS } from '@/lib/siteApplications/config';
import { formatFileSize, validateAttachmentFile } from '@/lib/siteApplications/files';

interface DynamicSiteApplicationFormProps {
  locale: string;
  formSlug?: string;
  eventSlug?: string;
  courseSlug?: string;
  variant?: 'page' | 'sidebar';
  initialForm?: PublicSiteApplicationForm;
  registrationTier?: RegistrationTier;
  /** After successful course application, redirect to checkout */
  checkoutNext?: {
    courseId?: string;
    tierId?: string;
    type?: string;
    ref?: string;
    cartIds?: string;
    mode?: string;
  };
}

const ui = {
  tr: {
    loading: 'Form hazırlanıyor...',
    notFound: 'Bu başvuru formu bulunamadı veya yayında değil.',
    submit: 'Başvuruyu Gönder',
    submitting: 'Gönderiliyor...',
    success: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    eventSuccessFallback: 'Etkinliğe kaydınız başarıyla alınmıştır.',
    error: 'Başvuru gönderilirken bir hata oluştu.',
    required: 'Bu alan zorunludur',
    invalidEmail: 'Geçerli bir e-posta giriniz',
    captcha: 'Lütfen robot olmadığınızı doğrulayın.',
    spamNote: 'Bu form spam koruması içerir.',
    select: 'Seçiniz',
    attachment: 'Ek Dosya (isteğe bağlı)',
    attachmentHint: `PDF, Word, görsel vb. — en fazla ${formatFileSize(SITE_APPLICATION_MAX_FILE_BYTES)}. Dosyalar ${SITE_APPLICATION_FILE_RETENTION_DAYS} gün sonra otomatik silinir.`,
    attachmentDrop: 'Dosyayı buraya bırakın veya tıklayın',
    uploadFailed: 'Dosya yüklenemedi.',
    resourceDownload: 'Dosyayı indir',
    resourceDownloading: 'Hazırlanıyor…',
    resourceMissing: 'Dosya henüz yüklenmemiş.',
    resourceHint: 'Önce dosyayı indirin, ardından cevabınızı aşağıdaki dosya alanına yükleyin.',
    sideTitle: 'Başvurun için hazır mısın?',
    sideSubtitle: 'Birkaç dakikada tamamla — sana döneceğiz.',
    step1: 'Bilgilerini doldur',
    step2: 'Gerekirse dosya ekle',
    step3: 'Gönder ve rahatla',
    progress: 'İlerleme',
    badge: 'Açık başvuru',
    secure: 'Verilerin güvende',
    response: 'Genelde 3–5 iş günü içinde dönüş',
  },
  en: {
    loading: 'Preparing your form...',
    notFound: 'This application form was not found or is not published.',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Your application has been received. We will contact you soon.',
    eventSuccessFallback: 'Your event registration has been successfully received.',
    error: 'An error occurred while submitting your application.',
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email',
    captcha: 'Please verify you are not a robot.',
    spamNote: 'This form includes spam protection.',
    select: 'Select',
    attachment: 'Attachment (optional)',
    attachmentHint: `PDF, Word, images, etc. — max ${formatFileSize(SITE_APPLICATION_MAX_FILE_BYTES)}. Files are automatically deleted after ${SITE_APPLICATION_FILE_RETENTION_DAYS} days.`,
    attachmentDrop: 'Drop a file here or click to browse',
    uploadFailed: 'File upload failed.',
    resourceDownload: 'Download file',
    resourceDownloading: 'Preparing…',
    resourceMissing: 'File has not been uploaded yet.',
    resourceHint: 'Download the file first, then upload your answer in the file field below.',
    sideTitle: 'Ready to apply?',
    sideSubtitle: 'Takes just a few minutes — we will get back to you.',
    step1: 'Fill in your details',
    step2: 'Attach a file if needed',
    step3: 'Submit and relax',
    progress: 'Progress',
    badge: 'Open application',
    secure: 'Your data is secure',
    response: 'We usually respond within 3–5 business days',
  },
};

const fieldIcon: Record<SiteApplicationFieldType, React.ElementType> = {
  text: FileText,
  email: Mail,
  tel: Phone,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  time: Clock,
  url: Link2,
  select: Circle,
  checkbox: CheckSquare,
  dropdown: List,
  linear_scale: Hash,
  rating: Star,
  file: CloudUpload,
  resource: Download,
};

const inputClass =
  'w-full rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white/90 dark:bg-neutral-900/80 px-4 py-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all duration-200 focus:ring-2 focus:ring-[#990000]/30 focus:border-[#990000] focus:outline-none hover:border-neutral-300 dark:hover:border-neutral-500';

function isFileFieldType(fieldType: string | null | undefined): boolean {
  const t = String(fieldType || '').trim().toLowerCase();
  return t === 'file' || t === 'upload' || t === 'attachment';
}

function FormShell({
  children,
  variant = 'page',
}: {
  children: React.ReactNode;
  variant?: 'page' | 'sidebar';
}) {
  if (variant === 'sidebar') {
    return <div className="relative">{children}</div>;
  }

  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#990000]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl"
      />
      {children}
    </div>
  );
}

export default function DynamicSiteApplicationForm({
  locale,
  formSlug,
  eventSlug,
  courseSlug,
  variant = 'page',
  initialForm,
  registrationTier = 'free',
  checkoutNext,
}: DynamicSiteApplicationFormProps) {
  const router = useRouter();
  const isSidebar = variant === 'sidebar';
  const t = ui[locale as keyof typeof ui] || ui.tr;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formConfig, setFormConfig] = useState<PublicSiteApplicationForm | null>(initialForm ?? null);
  const [loading, setLoading] = useState(!initialForm);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [fieldFiles, setFieldFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [resourceDownloading, setResourceDownloading] = useState<string | null>(null);

  const isEventForm = Boolean(
    eventSlug ||
      formConfig?.event_slug ||
      formConfig?.event_id ||
      formConfig?.form_type === 'event'
  );
  const isCourseForm = Boolean(
    courseSlug ||
      (formConfig as { course_slug?: string } | null)?.course_slug ||
      formConfig?.form_type === 'course'
  );

  const mapServerFieldError = (code: string) => {
    switch (code) {
      case 'invalid_email':
        return t.invalidEmail;
      case 'invalid_url':
        return locale === 'tr' ? 'Geçerli bir URL giriniz' : 'Please enter a valid URL';
      case 'invalid_option':
        return locale === 'tr' ? 'Geçersiz seçim' : 'Invalid selection';
      case 'required':
      default:
        return t.required;
    }
  };

  useEffect(() => {
    // SSR may pass a cached initialForm — show it immediately, then always
    // re-fetch with no-store so Uniboard publish updates appear on the live site.
    if (initialForm) {
      setFormConfig(initialForm);
      setLoading(false);
      if (initialForm.event_title) {
        setValues((prev) => ({
          ...prev,
          event_name: prev.event_name || initialForm.event_title || '',
        }));
      }
    }

    let cancelled = false;

    const load = async () => {
      if (!eventSlug && !formSlug && !courseSlug) {
        if (!initialForm && !cancelled) {
          setFormConfig(null);
          setLoading(false);
        }
        return;
      }

      if (!initialForm) setLoading(true);
      try {
        const url = courseSlug
          ? `/api/site-applications/public/forms/by-course/${encodeURIComponent(courseSlug)}?locale=${locale}`
          : eventSlug
          ? `/api/site-applications/public/forms/by-event/${encodeURIComponent(eventSlug)}?locale=${locale}`
          : `/api/site-applications/public/forms/${encodeURIComponent(formSlug || '')}?locale=${locale}`;

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled && !initialForm) setFormConfig(null);
          return;
        }
        const data = await res.json();
        const loaded = data.form as PublicSiteApplicationForm;
        if (cancelled) return;

        setFormConfig(loaded);

        if (loaded.event_title) {
          setValues((prev) => ({
            ...prev,
            event_name: prev.event_name || loaded.event_title || '',
          }));
        }
      } catch {
        if (!cancelled && !initialForm) setFormConfig(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [formSlug, eventSlug, courseSlug, locale, initialForm]);

  const progress = useMemo(() => {
    if (!formConfig) return 0;
    const required = formConfig.fields.filter((f) => f.required);
    if (required.length === 0) return 100;
    const filled = required.filter((f) => {
      const raw = values[f.field_key]?.trim() || '';
      if (f.field_type === 'file' || isFileFieldType(f.field_type)) {
        return Boolean(fieldFiles[f.field_key] || raw);
      }
      if (!raw) return false;
      if (f.field_type === 'checkbox') {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return false;
        }
      }
      return true;
    }).length;
    return Math.round((filled / required.length) * 100);
  }, [formConfig, values, fieldFiles]);

  const updateValue = (fieldKey: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const downloadResource = async (fieldKey: string) => {
    if (!formConfig) return;
    setResourceDownloading(fieldKey);
    setGeneralError(null);
    try {
      const params = new URLSearchParams({ locale });
      if (eventSlug || formConfig.event_slug) {
        params.set('eventSlug', eventSlug || formConfig.event_slug || '');
      }
      const res = await fetch(
        `/api/site-applications/public/forms/${encodeURIComponent(formConfig.slug)}/resources/${encodeURIComponent(fieldKey)}?${params.toString()}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.resourceMissing);
      const a = document.createElement('a');
      a.href = data.url;
      a.download = data.fileName || 'download';
      a.rel = 'noopener';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t.resourceMissing);
    } finally {
      setResourceDownloading(null);
    }
  };

  const validateClient = () => {
    if (!formConfig) return false;
    const nextErrors: Record<string, string> = {};

    for (const field of formConfig.fields) {
      if (field.field_type === 'resource') continue;

      const value = values[field.field_key]?.trim() || '';
      if (field.field_type === 'checkbox') {
        let selected: string[] = [];
        try {
          const parsed = JSON.parse(values[field.field_key] || '[]');
          selected = Array.isArray(parsed) ? parsed : [];
        } catch {
          selected = [];
        }
        if (field.required && selected.length === 0) {
          nextErrors[field.field_key] = t.required;
        }
        continue;
      }
      if (field.field_type === 'file' || isFileFieldType(field.field_type)) {
        if (field.required && !fieldFiles[field.field_key] && !value) {
          nextErrors[field.field_key] = t.required;
        }
        continue;
      }
      if (field.required && !value) {
        nextErrors[field.field_key] = t.required;
      }
      if (field.field_type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        nextErrors[field.field_key] = t.invalidEmail;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    const err = validateAttachmentFile(file);
    if (err) {
      setGeneralError(err);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setAttachment(file);
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formConfig || !validateClient()) return;

    setSubmitting(true);
    setGeneralError(null);

    try {
      let attachmentMeta: Record<string, unknown> = {};
      const submissionFields: Record<string, string> = { ...values };

      if (attachment && formConfig.allows_attachment) {
        const uploadRes = await fetch('/api/site-applications/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formSlug: formConfig.slug,
            eventSlug: eventSlug || formConfig.event_slug || undefined,
            locale,
            fileName: attachment.name,
            fileSize: attachment.size,
            mimeType: attachment.type,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || t.uploadFailed);

        const putRes = await fetch(uploadData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': uploadData.mimeType || attachment.type },
          body: attachment,
        });
        if (!putRes.ok) throw new Error(t.uploadFailed);

        attachmentMeta = {
          attachmentStoragePath: uploadData.storageRef,
          attachmentFileName: attachment.name,
          attachmentMimeType: attachment.type,
          attachmentFileSize: attachment.size,
        };
      }

      for (const [fieldKey, file] of Object.entries(fieldFiles)) {
        const uploadRes = await fetch('/api/site-applications/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formSlug: formConfig.slug,
            eventSlug: eventSlug || formConfig.event_slug || undefined,
            locale,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || t.uploadFailed);
        const putRes = await fetch(uploadData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': uploadData.mimeType || file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error(t.uploadFailed);
        submissionFields[fieldKey] = JSON.stringify({
          storagePath: uploadData.storageRef,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      }

      const res = await fetch('/api/site-applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSlug: formConfig.slug,
          eventSlug: eventSlug || formConfig.event_slug || undefined,
          courseSlug: courseSlug || (formConfig as { course_slug?: string }).course_slug || undefined,
          locale,
          registrationTier,
          fields: submissionFields,
          honeypot,
          checkoutNext: checkoutNext || undefined,
          ...attachmentMeta,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          const mapped: Record<string, string> = {};
          for (const [key, code] of Object.entries(data.fieldErrors as Record<string, string>)) {
            mapped[key] = mapServerFieldError(code);
          }
          setErrors(mapped);
        }
        throw new Error(data.error || t.error);
      }

      if (data.requiresPayment && data.checkoutUrl) {
        router.push(data.checkoutUrl);
        return;
      }

      // Course flow: application first, then purchase
      if (data.checkoutUrl || (isCourseForm && checkoutNext?.courseId)) {
        const url =
          data.checkoutUrl ||
          (() => {
            if (checkoutNext?.mode === 'cart' && checkoutNext?.cartIds) {
              const qs = new URLSearchParams();
              qs.set('cartIds', checkoutNext.cartIds);
              qs.set('mode', 'cart');
              if (data.applicationId || data.submissionId) {
                qs.set('applicationId', String(data.applicationId || data.submissionId));
              }
              if (checkoutNext?.ref) qs.set('ref', checkoutNext.ref);
              return `/${locale}/checkout?${qs.toString()}`;
            }
            const qs = new URLSearchParams();
            qs.set('id', String(checkoutNext!.courseId));
            if (checkoutNext?.tierId) qs.set('tierId', checkoutNext.tierId);
            if (checkoutNext?.type) qs.set('type', checkoutNext.type);
            if (checkoutNext?.ref) qs.set('ref', checkoutNext.ref);
            if (data.applicationId || data.submissionId) {
              qs.set('applicationId', String(data.applicationId || data.submissionId));
            }
            return `/${locale}/checkout?${qs.toString()}`;
          })();
        router.push(url);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FormShell variant={variant}>
        <div
          className={
            isSidebar
              ? 'flex items-center justify-center py-6 text-neutral-600 dark:text-neutral-400'
              : 'rounded-3xl border border-neutral-200/80 bg-white/70 dark:bg-neutral-800/50 backdrop-blur-sm p-10 shadow-lg shadow-neutral-200/40 dark:shadow-none'
          }
        >
          <div className={`flex flex-col items-center gap-4 ${isSidebar ? '' : 'py-8'} text-neutral-600 dark:text-neutral-400`}>
            <div className="relative">
              <div
                className={`${isSidebar ? 'h-10 w-10 rounded-xl' : 'h-14 w-14 rounded-2xl'} bg-gradient-to-br from-[#990000] to-rose-600 flex items-center justify-center shadow-lg shadow-[#990000]/25`}
              >
                <Loader className={`${isSidebar ? 'w-5 h-5' : 'w-7 h-7'} text-white animate-spin`} />
              </div>
            </div>
            {!isSidebar && <p className="text-sm font-medium animate-pulse">{t.loading}</p>}
          </div>
        </div>
      </FormShell>
    );
  }

  if (!formConfig) {
    if (isSidebar) return null;

    return (
      <FormShell variant={variant}>
        <div className="rounded-3xl border border-red-200 bg-red-50/90 dark:bg-red-950/30 p-8 text-center text-red-700 dark:text-red-300">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
          {t.notFound}
        </div>
      </FormShell>
    );
  }

  if (success) {
    return (
      <FormShell variant={variant}>
        <div
          className={
            isSidebar
              ? 'rounded-sm border border-emerald-200/80 bg-emerald-50 dark:bg-emerald-950/30 p-6 text-center'
              : 'rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-teal-950/30 p-10 md:p-14 text-center shadow-xl shadow-emerald-100/50 dark:shadow-none'
          }
        >
          <div
            className={`inline-flex items-center justify-center ${isSidebar ? 'w-12 h-12 mb-4' : 'w-20 h-20 mb-6'} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-300/40`}
          >
            <PartyPopper className={isSidebar ? 'w-6 h-6' : 'w-10 h-10'} />
          </div>
          <h2
            className={`${isSidebar ? 'text-lg' : 'text-2xl'} font-bold text-emerald-900 dark:text-emerald-100 mb-3`}
          >
            {locale === 'tr' ? 'Harika, gönderildi!' : 'Awesome, sent!'}
          </h2>
          <p
            className={`${isSidebar ? 'text-sm' : 'text-lg'} text-emerald-800/90 dark:text-emerald-200/90 max-w-md mx-auto leading-relaxed`}
          >
            {isEventForm
              ? (formConfig.event_title
                  ? (locale === 'tr'
                      ? `${formConfig.event_title} etkinliğe kaydınız başarıyla alınmıştır.`
                      : `Your registration for ${formConfig.event_title} has been successfully received.`)
                  : (formConfig.success_message || t.eventSuccessFallback))
              : (formConfig.success_message || t.success)}
          </p>
          {!isSidebar && !isEventForm && (
            <div className="mt-8 inline-flex items-center gap-2 text-sm text-emerald-700/80 dark:text-emerald-300/80">
              <Heart className="w-4 h-4" />
              {t.response}
            </div>
          )}
        </div>
      </FormShell>
    );
  }

  const steps = [
    { icon: Sparkles, text: t.step1 },
    { icon: Paperclip, text: t.step2 },
    { icon: Send, text: t.step3 },
  ];

  return (
    <FormShell variant={variant}>
      <div
        className={
          isSidebar
            ? 'space-y-4'
            : 'grid lg:grid-cols-12 gap-8 lg:gap-10 items-start'
        }
      >
        {!isSidebar && (
        <aside className="lg:col-span-4 space-y-5 order-1">
          <div className="rounded-3xl bg-gradient-to-br from-[#990000] via-[#b30000] to-rose-700 p-6 md:p-8 text-white shadow-xl shadow-[#990000]/20">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 rounded-full px-3 py-1 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {t.badge}
            </span>
            <h2 className="text-2xl font-bold leading-snug mb-2">{t.sideTitle}</h2>
            <p className="text-white/85 text-sm leading-relaxed">{t.sideSubtitle}</p>
          </div>

          <ul className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.text}
                className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/60 backdrop-blur-sm p-4 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#990000]/10 text-[#990000] font-bold text-sm">
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 pt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <step.icon className="w-4 h-4 text-[#990000] shrink-0" />
                  {step.text}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 text-[#990000]" />
              {t.secure}
            </span>
            {!isEventForm && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-[#990000]" />
              {t.response}
            </span>
            )}
          </div>
        </aside>
        )}

        <div className={isSidebar ? '' : 'lg:col-span-8 order-2'}>
          <form
            onSubmit={handleSubmit}
            className={
              isSidebar
                ? 'space-y-4'
                : 'rounded-3xl border border-neutral-200/80 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/70 backdrop-blur-sm shadow-xl shadow-neutral-200/30 dark:shadow-none overflow-hidden'
            }
          >
            <div
              className={
                isSidebar
                  ? 'pb-4 border-b border-neutral-100 dark:border-neutral-700'
                  : 'px-6 md:px-10 pt-8 pb-6 border-b border-neutral-100 dark:border-neutral-700/80 bg-gradient-to-r from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-800/30'
              }
            >
              <h1
                className={`${isSidebar ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-neutral-900 dark:text-neutral-50 mb-2`}
              >
                {formConfig.title}
              </h1>
              {formConfig.subtitle && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {formConfig.subtitle}
                </p>
              )}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  <span>{t.progress}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200/80 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#990000] to-rose-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className={isSidebar ? 'space-y-4' : 'px-6 md:px-10 py-8 space-y-6'}>
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {formConfig.fields.map((field) => {
                const Icon = fieldIcon[field.field_type] || FileText;
                const inputId = `field-${field.field_key}`;
                const isFileField = isFileFieldType(field.field_type);
                const isResourceField = field.field_type === 'resource';
                return (
                  <div key={field.field_key} className="group">
                    <label
                      htmlFor={isResourceField ? undefined : inputId}
                      className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#990000]/8 text-[#990000] group-focus-within:bg-[#990000]/15 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {field.label}
                      {field.required && !isResourceField && (
                        <span className="text-[#990000]">*</span>
                      )}
                    </label>

                    {isResourceField ? (
                      <div className="rounded-2xl border border-[#990000]/25 bg-[#990000]/[0.04] px-4 py-5 space-y-3">
                        <p className="text-sm text-neutral-700 dark:text-neutral-200">
                          {field.resource_file_name || field.options?.[0]?.label || t.resourceMissing}
                        </p>
                        <p className="text-xs text-neutral-500">{t.resourceHint}</p>
                        <button
                          type="button"
                          disabled={!field.has_resource || resourceDownloading === field.field_key}
                          onClick={() => downloadResource(field.field_key)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#990000] text-white text-sm font-medium disabled:opacity-50 hover:bg-[#7a0000] transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {resourceDownloading === field.field_key
                            ? t.resourceDownloading
                            : t.resourceDownload}
                        </button>
                      </div>
                    ) : isFileField ? (
                      <label
                        htmlFor={inputId}
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-600 px-4 py-8 hover:border-[#990000]/50 hover:bg-[#990000]/[0.03] transition-colors"
                      >
                        <CloudUpload className="w-8 h-8 text-[#990000]" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 text-center">
                          {fieldFiles[field.field_key]?.name || t.attachmentDrop}
                        </span>
                        <span className="text-xs text-neutral-400 text-center max-w-sm">
                          {t.attachmentHint}
                        </span>
                        <input
                          id={inputId}
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                              setFieldFiles((prev) => {
                                const next = { ...prev };
                                delete next[field.field_key];
                                return next;
                              });
                              updateValue(field.field_key, '');
                              return;
                            }
                            const err = validateAttachmentFile(file);
                            if (err) {
                              setGeneralError(err);
                              e.target.value = '';
                              return;
                            }
                            setFieldFiles((prev) => ({ ...prev, [field.field_key]: file }));
                            updateValue(field.field_key, file.name);
                            setGeneralError(null);
                          }}
                        />
                      </label>
                    ) : field.field_type === 'textarea' ? (
                      <textarea
                        id={inputId}
                        rows={4}
                        value={values[field.field_key] || ''}
                        onChange={(e) => updateValue(field.field_key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={inputClass}
                      />
                    ) : field.field_type === 'select' ? (
                      <div className="space-y-2" role="radiogroup" aria-labelledby={inputId}>
                        {(field.options || []).map((opt) => {
                          const checked = values[field.field_key] === opt.value;
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-[#990000] bg-[#990000]/5'
                                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={field.field_key}
                                className="sr-only"
                                checked={checked}
                                onChange={() => updateValue(field.field_key, opt.value)}
                              />
                              <span
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  checked ? 'border-[#990000]' : 'border-neutral-300'
                                }`}
                              >
                                {checked && <span className="w-2 h-2 rounded-full bg-[#990000]" />}
                              </span>
                              <span className="text-sm text-neutral-800 dark:text-neutral-200">
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.field_type === 'checkbox' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt) => {
                          let selected: string[] = [];
                          try {
                            const parsed = JSON.parse(values[field.field_key] || '[]');
                            selected = Array.isArray(parsed) ? parsed : [];
                          } catch {
                            selected = [];
                          }
                          const checked = selected.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-[#990000] bg-[#990000]/5'
                                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? selected.filter((v) => v !== opt.value)
                                    : [...selected, opt.value];
                                  updateValue(field.field_key, JSON.stringify(next));
                                }}
                              />
                              <span
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  checked ? 'border-[#990000] bg-[#990000]' : 'border-neutral-300'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 text-white" />}
                              </span>
                              <span className="text-sm text-neutral-800 dark:text-neutral-200">
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.field_type === 'dropdown' ? (
                      <select
                        id={inputId}
                        value={values[field.field_key] || ''}
                        onChange={(e) => updateValue(field.field_key, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">{t.select}</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.field_type === 'linear_scale' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                          <span>{locale === 'en' ? 'Low' : 'Düşük'}</span>
                          <span>{locale === 'en' ? 'High' : 'Yüksek'}</span>
                        </div>
                        <div className="relative flex items-center justify-between gap-1 px-1 py-1">
                          <div
                            aria-hidden
                            className="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-neutral-200 dark:bg-neutral-600 rounded-full"
                          />
                          {(field.options?.length
                            ? field.options
                            : [1, 2, 3, 4, 5].map((n) => ({
                                value: String(n),
                                label: String(n),
                              }))
                          ).map((opt) => {
                            const active = values[field.field_key] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateValue(field.field_key, opt.value)}
                                className={`relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                  active
                                    ? 'border-[#990000] bg-[#990000] text-white scale-105 shadow-md'
                                    : 'border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:border-[#990000]/60'
                                }`}
                                aria-pressed={active}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : field.field_type === 'rating' ? (
                      <div className="flex items-center gap-1" role="radiogroup">
                        {(field.options?.length
                          ? field.options
                          : [1, 2, 3, 4, 5].map((n) => ({
                              value: String(n),
                              label: String(n),
                            }))
                        ).map((opt) => {
                          const selected = Number(values[field.field_key] || 0);
                          const valueNum = Number(opt.value);
                          const filled = selected > 0 && valueNum <= selected;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateValue(field.field_key, opt.value)}
                              className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#990000]/40"
                              aria-label={`${opt.label} / ${(field.options?.length || 5)}`}
                              aria-pressed={values[field.field_key] === opt.value}
                            >
                              <Star
                                className={`w-8 h-8 transition-colors ${
                                  filled
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-neutral-300 dark:text-neutral-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        id={inputId}
                        type={
                          field.field_type === 'email'
                            ? 'email'
                            : field.field_type === 'tel'
                              ? 'tel'
                              : field.field_type === 'number'
                                ? 'number'
                                : field.field_type === 'date'
                                  ? 'date'
                                  : field.field_type === 'time'
                                    ? 'time'
                                    : field.field_type === 'url'
                                      ? 'url'
                                      : 'text'
                        }
                        value={values[field.field_key] || ''}
                        onChange={(e) => updateValue(field.field_key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={inputClass}
                      />
                    )}

                    {errors[field.field_key] && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors[field.field_key]}
                      </p>
                    )}
                  </div>
                );
              })}

              {formConfig.allows_attachment && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Paperclip className="w-4 h-4 text-[#990000]" />
                    {t.attachment}
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
                      dragOver
                        ? 'border-[#990000] bg-[#990000]/5 scale-[1.01]'
                        : attachment
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-neutral-200 dark:border-neutral-600 hover:border-[#990000]/40 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                    {attachment ? (
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {attachment.name}
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t.attachmentDrop}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">{t.attachmentHint}</p>
                </div>
              )}

              {generalError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full inline-flex items-center justify-center gap-2 ${isSidebar ? 'px-4 py-3 rounded-sm' : 'sm:w-auto px-10 py-3.5 rounded-2xl'} bg-gradient-to-r from-[#990000] to-rose-700 text-white font-semibold shadow-lg shadow-[#990000]/25 hover:shadow-xl hover:shadow-[#990000]/30 ${isSidebar ? '' : 'hover:scale-[1.02] active:scale-[0.98]'} disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200`}
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t.submit}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FormShell>
  );
}
