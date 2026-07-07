'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Tag } from 'lucide-react';

interface TagRow {
  id: string;
  slug: string;
  name: { tr?: string; en?: string };
}

interface CourseRow {
  id: string;
  title: string;
  slug: string;
}

const emptyForm = {
  slug: '',
  name_tr: '',
  name_en: '',
  course_ids: [] as string[],
};

export default function AdminCareerTagsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [tags, setTags] = useState<TagRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseLinks, setCourseLinks] = useState<
    { course_id: string; tag_id: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/career-tags');
      const json = await res.json();
      if (res.ok) {
        setTags(json.tags || []);
        setCourses(json.courses || []);
        setCourseLinks(json.course_links || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tag: TagRow) => {
    const linked = courseLinks
      .filter((l) => l.tag_id === tag.id)
      .map((l) => l.course_id);
    setEditingId(tag.id);
    setForm({
      slug: tag.slug,
      name_tr: tag.name?.tr || '',
      name_en: tag.name?.en || '',
      course_ids: linked,
    });
    setModalOpen(true);
  };

  const toggleCourse = (courseId: string) => {
    setForm((f) => ({
      ...f,
      course_ids: f.course_ids.includes(courseId)
        ? f.course_ids.filter((id) => id !== courseId)
        : [...f.course_ids, courseId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      slug: form.slug.trim(),
      name: { tr: form.name_tr, en: form.name_en || form.name_tr },
      course_ids: form.course_ids,
    };

    const url = editingId
      ? `/api/admin/career-tags/${editingId}`
      : '/api/admin/career-tags';
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
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu etiketi silmek istediğinize emin misiniz?')) return;
    await fetch(`/api/admin/career-tags/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const courseCount = (tagId: string) =>
    courseLinks.filter((l) => l.tag_id === tagId).length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/${locale}/dashboard/admin/internships`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          İlan yönetimine dön
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Kariyer etiketleri & kurs eşleştirme
          </h1>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1 bg-[#990000] text-white px-3 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni etiket
          </button>
        </div>

        <p className="text-sm text-neutral-500 mb-6">
          Kurslara etiket atayın; staj ilanları aynı etiketle otomatik eşleşir.
        </p>

        {loading ? (
          <p className="text-neutral-500">Yükleniyor...</p>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-800 border rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium">{tag.name?.tr || tag.slug}</p>
                  <p className="text-xs text-neutral-500">
                    {tag.slug} · {courseCount(tag.id)} kurs bağlı
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(tag)}>
                    <Pencil className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button type="button" onClick={() => handleDelete(tag.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-neutral-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
            >
              <h2 className="text-lg font-medium">
                {editingId ? 'Etiket düzenle' : 'Yeni etiket'}
              </h2>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <input
                required
                placeholder="slug (biyoinformatik)"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />
              <input
                required
                placeholder="Ad (TR)"
                value={form.name_tr}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name_tr: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-neutral-900"
              />
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2">
                  Bağlı kurslar
                </p>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {courses.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={form.course_ids.includes(c.id)}
                        onChange={() => toggleCourse(c.id)}
                      />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
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
