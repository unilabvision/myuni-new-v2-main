'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function MentorshipApplyForm({
  locale,
  slug,
  title,
}: {
  locale: string;
  slug: string;
  title: string;
}) {
  const tr = locale === 'tr';
  const listHref = `/${locale}/${tr ? 'mentorluk' : 'mentorship'}`;
  const detailHref = `${listHref}/${slug}`;

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    school: '',
    department: '',
    grade: '',
    linkedin_url: '',
    motivation: '',
    goals: '',
    experience: '',
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/public/mentorships/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorship_slug: slug,
          ...form,
          locale,
          source: 'website',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">
          {tr ? 'Başvurunuz alındı' : 'Application received'}
        </h1>
        <p className="text-neutral-600 mb-6">
          {tr
            ? 'En kısa sürede sizinle iletişime geçeceğiz.'
            : 'We will contact you shortly.'}
        </p>
        <Link href={detailHref} className="text-[#990000] hover:underline">
          {tr ? 'Duyuruya dön' : 'Back to listing'}
        </Link>
      </div>
    );
  }

  const field =
    'w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Link
        href={detailHref}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {title}
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {tr ? 'Mentörlük Başvurusu' : 'Mentorship Application'}
      </h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            className={field}
            required
            placeholder={tr ? 'Ad' : 'First name'}
            value={form.first_name}
            onChange={(e) => update('first_name', e.target.value)}
          />
          <input
            className={field}
            required
            placeholder={tr ? 'Soyad' : 'Last name'}
            value={form.last_name}
            onChange={(e) => update('last_name', e.target.value)}
          />
        </div>
        <input
          className={field}
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <input
          className={field}
          placeholder={tr ? 'Telefon' : 'Phone'}
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
        <input
          className={field}
          placeholder={tr ? 'Okul' : 'School'}
          value={form.school}
          onChange={(e) => update('school', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={field}
            placeholder={tr ? 'Bölüm' : 'Department'}
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
          />
          <input
            className={field}
            placeholder={tr ? 'Sınıf' : 'Grade'}
            value={form.grade}
            onChange={(e) => update('grade', e.target.value)}
          />
        </div>
        <input
          className={field}
          placeholder="LinkedIn"
          value={form.linkedin_url}
          onChange={(e) => update('linkedin_url', e.target.value)}
        />
        <textarea
          className={field}
          rows={3}
          placeholder={tr ? 'Motivasyon' : 'Motivation'}
          value={form.motivation}
          onChange={(e) => update('motivation', e.target.value)}
        />
        <textarea
          className={field}
          rows={3}
          placeholder={tr ? 'Hedefler' : 'Goals'}
          value={form.goals}
          onChange={(e) => update('goals', e.target.value)}
        />
        <textarea
          className={field}
          rows={3}
          placeholder={tr ? 'Deneyim' : 'Experience'}
          value={form.experience}
          onChange={(e) => update('experience', e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-3 bg-[#990000] text-white rounded-lg disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : tr ? (
            'Başvuruyu Gönder'
          ) : (
            'Submit Application'
          )}
        </button>
      </form>
    </div>
  );
}
