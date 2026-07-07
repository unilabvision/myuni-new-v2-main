'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  FileText,
  Inbox,
} from 'lucide-react';
import {
  APPLICATION_STATUS_LABELS,
  CONTEXT_TYPE_LABELS,
  type ApplicationContextType,
} from '@/lib/types/application';

interface ApplicationRow {
  id: string;
  context_type: ApplicationContextType;
  context_slug: string | null;
  context_label?: string;
  status: string;
  applicant_email: string | null;
  created_at: string;
  admin_notes: string | null;
  submission_data: Record<string, unknown>;
  cv_file_name: string | null;
  cv_storage_path: string | null;
  opportunity?: {
    slug?: string;
    title?: { tr?: string };
    company_name?: string | null;
  };
}

const STATUSES = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'under_review', label: 'Değerlendiriliyor' },
  { value: 'accepted', label: 'Kabul' },
  { value: 'rejected', label: 'Red' },
];

const CONTEXT_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Tüm türler' },
  { value: 'opportunity', label: 'Staj & Kariyer' },
  { value: 'event', label: 'Etkinlik' },
  { value: 'club', label: 'Kulüp' },
  { value: 'campaign', label: 'Kampanya' },
  { value: 'generic', label: 'Genel' },
];

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function UnifiedAdminApplicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [contextCounts, setContextCounts] = useState<Record<string, number>>({});
  const [filterStatus, setFilterStatus] = useState('');
  const [filterContext, setFilterContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editStatus, setEditStatus] = useState<Record<string, string>>({});

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterStatus) qs.set('status', filterStatus);
      if (filterContext) qs.set('context_type', filterContext);
      const res = await fetch(`/api/admin/applications?${qs.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setApplications(json.applications || []);
        setStatusCounts(json.statusCounts || {});
        setContextCounts(json.contextCounts || {});
      }
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterContext]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleSave = async (app: ApplicationRow) => {
    setSavingId(app.id);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus[app.id] ?? app.status,
          admin_notes: editNotes[app.id] ?? app.admin_notes ?? '',
          notify_applicant: true,
        }),
      });
      if (res.ok) {
        await fetchApps();
        setExpandedId(null);
      }
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    const qs = new URLSearchParams();
    if (filterStatus) qs.set('status', filterStatus);
    if (filterContext) qs.set('context_type', filterContext);
    window.open(`/api/admin/applications/export?${qs.toString()}`, '_blank');
  };

  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/${locale}/dashboard/admin/internships`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin panele dön
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              Başvuru Merkezi
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Tüm başvurular burada toplanır · Toplam {totalCount} · Bekleyen{' '}
              {statusCounts.pending || 0}
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1 border px-3 py-2 rounded-lg text-sm dark:border-neutral-700"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </button>
        </div>

        <div className="rounded-lg border border-[#990000]/20 bg-[#990000]/5 p-4 mb-6 text-sm text-neutral-600 dark:text-neutral-400">
          <strong className="text-[#990000]">Başvurular nereye gidiyor?</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>
              <strong>Veritabanı:</strong> <code>myuni_applications</code> tablosu
            </li>
            <li>
              <strong>Admin:</strong> Bu sayfa (Panel → Başvuru Merkezi)
            </li>
            <li>
              <strong>E-posta:</strong> Aday onayı +{' '}
              <code>NOTIFICATION_EMAILS</code> / <code>ADMIN_EMAILS</code>
            </li>
            <li>
              <strong>Kullanıcı:</strong> Panel → Staj & Kariyer → Başvurularım
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {CONTEXT_FILTERS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilterContext(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                filterContext === c.value
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {c.label}
              {c.value && contextCounts[c.value]
                ? ` (${contextCounts[c.value]})`
                : ''}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setFilterStatus(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                filterStatus === s.value
                  ? 'bg-[#990000] text-white'
                  : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {s.label}
              {s.value && statusCounts[s.value]
                ? ` (${statusCounts[s.value]})`
                : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-neutral-500">Yükleniyor...</p>
        ) : applications.length === 0 ? (
          <p className="text-neutral-500">Başvuru bulunamadı.</p>
        ) : (
          <ul className="space-y-2">
            {applications.map((app) => {
              const typeLabel =
                CONTEXT_TYPE_LABELS[app.context_type]?.tr || app.context_type;
              const title =
                app.context_label ||
                app.opportunity?.title?.tr ||
                app.context_slug ||
                '—';
              const expanded = expandedId === app.id;
              const sub = app.submission_data || {};
              const name =
                [sub.first_name, sub.last_name].filter(Boolean).join(' ') ||
                String(sub.ad_soyad || '—');

              return (
                <li
                  key={app.id}
                  className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : app.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        <span className="text-[#990000]">{typeLabel}</span> ·{' '}
                        {title} · {app.applicant_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[app.status] || ''}`}
                      >
                        {APPLICATION_STATUS_LABELS[
                          app.status as keyof typeof APPLICATION_STATUS_LABELS
                        ]?.tr || app.status}
                      </span>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-700 pt-4 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <p className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-400" />
                          {name}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          {app.applicant_email}
                        </p>
                        {app.cv_file_name && (
                          <p className="flex items-center gap-2 sm:col-span-2">
                            <FileText className="w-4 h-4 text-neutral-400" />
                            {app.cv_storage_path ? (
                              <a
                                href={app.cv_storage_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#990000] underline"
                              >
                                {app.cv_file_name}
                              </a>
                            ) : (
                              app.cv_file_name
                            )}
                          </p>
                        )}
                      </div>

                      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 text-xs space-y-1 max-h-40 overflow-y-auto">
                        {Object.entries(sub).map(([k, v]) =>
                          v != null && v !== '' ? (
                            <p key={k}>
                              <strong>{k}:</strong> {String(v)}
                            </p>
                          ) : null
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-neutral-500">
                            Durum
                          </label>
                          <select
                            value={editStatus[app.id] ?? app.status}
                            onChange={(e) =>
                              setEditStatus((s) => ({
                                ...s,
                                [app.id]: e.target.value,
                              }))
                            }
                            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
                          >
                            {STATUSES.filter((s) => s.value).map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500">
                            Admin notu
                          </label>
                          <textarea
                            value={editNotes[app.id] ?? app.admin_notes ?? ''}
                            onChange={(e) =>
                              setEditNotes((n) => ({
                                ...n,
                                [app.id]: e.target.value,
                              }))
                            }
                            rows={2}
                            className="w-full mt-1 border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={savingId === app.id}
                        onClick={() => handleSave(app)}
                        className="bg-[#990000] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        {savingId === app.id ? 'Kaydediliyor...' : 'Kaydet & Bildir'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
