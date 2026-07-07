'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Briefcase } from 'lucide-react';

interface OpportunityRow {
  id: string;
  slug: string;
  title: { tr?: string; en?: string };
  company_name: string | null;
  is_active: boolean;
  is_featured: boolean;
  application_deadline: string | null;
}

interface TagRow {
  id: string;
  slug: string;
  name: { tr?: string };
}

interface CourseRow {
  id: string;
  title: string;
  slug: string;
}

interface FormRow {
  id: string;
  form_name: string;
  title: Record<string, string>;
}

const emptyForm = {
  slug: '',
  title_tr: '',
  title_en: '',
  description_tr: '',
  company_name: '',
  location: '',
  work_mode: '' as '' | 'remote' | 'hybrid' | 'onsite',
  application_deadline: '',
  form_config_id: '',
  is_active: true,
  is_featured: false,
  tag_ids: [] as string[],
  course_ids: [] as string[],
};

export default function AdminInternshipsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [list, setList] = useState<OpportunityRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [forms, setForms] = useState<FormRow[]>([]);
  const [tagLinks, setTagLinks] = useState<
    { opportunity_id: string; tag_id: string }[]
  >([]);
  const [courseLinks, setCourseLinks] = useState<
    { opportunity_id: string; course_id: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/opportunities');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Liste alınamadı');
        return;
      }
      setList(json.opportunities || []);
      setTags(json.tags || []);
      setCourses(json.courses || []);
      setForms(json.forms || []);
      setTagLinks(json.tag_links || []);
      setCourseLinks(json.course_links || []);
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: OpportunityRow) => {
    const oppTags = tagLinks
      .filter((l) => l.opportunity_id === row.id)
      .map((l) => l.tag_id);
    const oppCourses = courseLinks
      .filter((l) => l.opportunity_id === row.id)
      .map((l) => l.course_id);
    setEditingId(row.id);
    setForm({
      slug: row.slug,
      title_tr: row.title?.tr || '',
      title_en: row.title?.en || '',
      description_tr: '',
      company_name: row.company_name || '',
      location: '',
      work_mode: '',
      application_deadline: row.application_deadline || '',
      form_config_id: '',
      is_active: row.is_active,
      is_featured: row.is_featured,
      tag_ids: oppTags,
      course_ids: oppCourses,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      slug: form.slug.trim(),
      title: { tr: form.title_tr, en: form.title_en || form.title_tr },
      description: { tr: form.description_tr },
      company_name: form.company_name || null,
      location: form.location || null,
      work_mode: form.work_mode || null,
      application_deadline: form.application_deadline || null,
      form_config_id: form.form_config_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      tag_ids: form.tag_ids,
      course_ids: form.course_ids,
    };

    const url = editingId
      ? `/api/admin/opportunities/${editingId}`
      : '/api/admin/opportunities';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Kayıt başarısız');
      return;
    }
    setModalOpen(false);
    fetchList();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/opportunities/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) fetchList();
  };

  const toggleArray = (key: 'tag_ids' | 'course_ids', id: string) => {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Panele dön
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Staj ilanları
          </h1>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1 bg-[#990000] text-white px-3 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni ilan
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/${locale}/dashboard/admin/applications`}
            className="text-sm px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#990000]/40"
          >
            Başvuru Merkezi
          </Link>
          <Link
            href={`/${locale}/dashboard/admin/career-tags`}
            className="text-sm px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#990000]/40"
          >
            Kariyer etiketleri
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-neutral-500">Yükleniyor...</p>
        ) : list.length === 0 ? (
          <p className="text-neutral-500">Henüz ilan yok.</p>
        ) : (
          <div className="space-y-2">
            {list.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium">{row.title?.tr || row.slug}</p>
                  <p className="text-xs text-neutral-500">
                    /{row.slug} · {row.company_name || '—'} ·{' '}
                    {row.is_active ? 'Aktif' : 'Pasif'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="p-2 text-neutral-500 hover:text-neutral-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-neutral-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
            >
              <h2 className="text-lg font-medium">
                {editingId ? 'İlan düzenle' : 'Yeni staj ilanı'}
              </h2>

              <input
                required
                placeholder="slug (ornek-staj)"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />
              <input
                required
                placeholder="Başlık (TR)"
                value={form.title_tr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title_tr: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />
              <textarea
                placeholder="Açıklama (TR)"
                value={form.description_tr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description_tr: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
                rows={3}
              />
              <input
                placeholder="Firma adı"
                value={form.company_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, company_name: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />
              <input
                placeholder="Konum"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />
              <input
                type="date"
                value={form.application_deadline}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    application_deadline: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />

              <div>
                <label className="text-xs font-medium text-neutral-500">
                  Başvuru formu
                </label>
                <select
                  value={form.form_config_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, form_config_id: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 dark:bg-neutral-900"
                >
                  <option value="">Seçin</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.form_name} — {f.title?.tr || f.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2">
                  Kariyer etiketleri (otomatik eşleşme)
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <label
                      key={t.id}
                      className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={form.tag_ids.includes(t.id)}
                        onChange={() => toggleArray('tag_ids', t.id)}
                      />
                      {t.name?.tr || t.slug}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2">
                  Manuel kurs eşleştirme (override)
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {courses.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={form.course_ids.includes(c.id)}
                        onChange={() => toggleArray('course_ids', c.id)}
                      />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_featured: e.target.checked }))
                  }
                />
                Öne çıkan
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#990000] text-white py-2 rounded-lg text-sm"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
