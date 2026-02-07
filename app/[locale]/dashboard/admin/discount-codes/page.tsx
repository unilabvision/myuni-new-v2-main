'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  Percent,
  Hash,
  Copy,
  CheckCircle,
  X,
} from 'lucide-react';

interface DiscountCodeRow {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  applicable_courses: string[] | null;
  is_referral: boolean;
  max_usage: number;
  usage_count: number;
  has_balance_limit: boolean;
  remaining_balance: number | null;
  initial_balance?: number | null;
  is_campaign: boolean;
  campaign_name: string | null;
  campaign_description: string | null;
  created_at: string | null;
}

const emptyForm = {
  code: '',
  discount_amount: 15,
  discount_type: 'percentage' as 'percentage' | 'fixed',
  valid_until: '',
  max_usage: 1,
  applicable_courses: '',
  has_balance_limit: false,
  remaining_balance: 0,
  initial_balance: 0,
  is_campaign: false,
  campaign_name: '',
  campaign_description: '',
};

export default function AdminDiscountCodesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [list, setList] = useState<DiscountCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/discount-codes');
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError('Bu sayfaya erişim yetkiniz yok. Giriş yapın veya admin e-postası ekleyin.');
        } else {
          setError(json.error || 'Liste alınamadı');
        }
        setList([]);
        return;
      }
      setList(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError('Bağlantı hatası');
      setList([]);
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
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (row: DiscountCodeRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      discount_amount: row.discount_amount,
      discount_type: (row.discount_type === 'fixed' ? 'fixed' : 'percentage') as 'percentage' | 'fixed',
      valid_until: row.valid_until || '',
      max_usage: row.max_usage,
      applicable_courses: Array.isArray(row.applicable_courses) ? row.applicable_courses.join(', ') : '',
      has_balance_limit: row.has_balance_limit,
      remaining_balance: row.remaining_balance ?? 0,
      initial_balance: row.initial_balance ?? 0,
      is_campaign: row.is_campaign,
      campaign_name: row.campaign_name || '',
      campaign_description: row.campaign_description || '',
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const applicableCourses = form.applicable_courses
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        code: form.code.trim(),
        discount_amount: Number(form.discount_amount),
        discount_type: form.discount_type,
        valid_until: form.valid_until.trim(),
        max_usage: Math.max(1, Number(form.max_usage) || 1),
        applicable_courses: applicableCourses.length ? applicableCourses : null,
        has_balance_limit: form.has_balance_limit,
        remaining_balance: form.has_balance_limit ? Number(form.remaining_balance) || 0 : null,
        initial_balance: form.has_balance_limit ? Number(form.initial_balance) || 0 : null,
        is_campaign: form.is_campaign,
        campaign_name: form.campaign_name.trim() || null,
        campaign_description: form.campaign_description.trim() || null,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/discount-codes/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setSubmitError(json.error || 'Güncellenemedi');
          return;
        }
      } else {
        const res = await fetch('/api/admin/discount-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          setSubmitError(json.error || 'Eklenemedi');
          return;
        }
      }
      closeModal();
      fetchList();
    } catch (err) {
      setSubmitError('İstek gönderilemedi');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`"${code}" kodunu silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/discount-codes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || 'Silinemedi');
        return;
      }
      fetchList();
    } catch {
      alert('İstek gönderilemedi');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 text-sm mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {locale === 'tr' ? 'Panele dön' : 'Back to dashboard'}
            </Link>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {locale === 'tr' ? 'İndirim Kodu Yönetimi' : 'Discount code management'}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {locale === 'tr'
                ? 'Yeni kod ekleyin veya mevcut kodları düzenleyin. Geçerlilik tarihi o gün 23:59 dahildir.'
                : 'Add new codes or edit existing ones. Valid until is end of that day (23:59).'}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#990000] text-white hover:bg-[#800000] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {locale === 'tr' ? 'Yeni kod' : 'New code'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#990000] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 && !error ? (
          <div className="text-center py-16 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <Tag className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {locale === 'tr' ? 'Henüz indirim kodu yok.' : 'No discount codes yet.'}
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="text-[#990000] hover:underline font-medium"
            >
              {locale === 'tr' ? 'İlk kodu ekleyin' : 'Add first code'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Kod
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Tip / Tutar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Geçerlilik
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Kullanım
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Bakiye
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {list.map((row) => {
                  const isExpired = row.valid_until && row.valid_until < today;
                  return (
                    <tr
                      key={row.id}
                      className={isExpired ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                            {row.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(row.code)}
                            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600"
                            title="Kopyala"
                          >
                            {copiedCode === row.code ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-neutral-500" />
                            )}
                          </button>
                        </div>
                        {isExpired && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            {locale === 'tr' ? 'Süresi dolmuş' : 'Expired'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.discount_type === 'percentage'
                          ? `%${row.discount_amount}`
                          : `${row.discount_amount} ₺`}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {row.valid_until}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.usage_count} / {row.max_usage}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {row.has_balance_limit ? (
                          <>
                            {row.remaining_balance != null ? `${Number(row.remaining_balance).toFixed(0)} ₺` : '–'}
                          </>
                        ) : (
                          '–'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          {row.is_referral && (
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Referans
                            </span>
                          )}
                          {row.is_campaign && (
                            <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Kampanya
                            </span>
                          )}
                          {!row.is_referral && !row.is_campaign && (
                            <span className="text-neutral-400 text-xs">İndirim</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                            title="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id, row.code)}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
          {locale === 'tr'
            ? 'Şema ve alan açıklamaları için docs/DISCOUNT_CODES_SCHEMA.md dosyasına bakın.'
            : 'See docs/DISCOUNT_CODES_SCHEMA.md for schema and field descriptions.'}
        </p>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {editingId
                  ? (locale === 'tr' ? 'Kodu düzenle' : 'Edit code')
                  : (locale === 'tr' ? 'Yeni indirim kodu' : 'New discount code')}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Kod *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="BIOCOMS-2"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  required
                  disabled={!!editingId}
                />
                {editingId && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {locale === 'tr' ? 'Kod adı değiştirilemez.' : 'Code cannot be changed.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    İndirim tipi
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit (₺)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {form.discount_type === 'percentage' ? 'Yüzde' : 'Tutar (₺)'} *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={form.discount_type === 'percentage' ? 1 : 0.01}
                    value={form.discount_amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount_amount: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Geçerlilik tarihi (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Maks. kullanım
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.max_usage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_usage: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Uygulanacak kurs ID’leri (virgül veya boşlukla ayırın; boş = tümü)
                </label>
                <input
                  type="text"
                  value={form.applicable_courses}
                  onChange={(e) => setForm((f) => ({ ...f, applicable_courses: e.target.value }))}
                  placeholder="uuid-1, uuid-2"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="has_balance_limit"
                  checked={form.has_balance_limit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, has_balance_limit: e.target.checked }))
                  }
                  className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                />
                <label htmlFor="has_balance_limit" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Çek / bakiye kodu (kalan bakiye kadar indirim)
                </label>
              </div>
              {form.has_balance_limit && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      Kalan bakiye (₺)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.remaining_balance}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          remaining_balance: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      Başlangıç bakiyesi (₺)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.initial_balance}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          initial_balance: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_campaign"
                  checked={form.is_campaign}
                  onChange={(e) => setForm((f) => ({ ...f, is_campaign: e.target.checked }))}
                  className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                />
                <label htmlFor="is_campaign" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Kampanya sayfasında listelensin
                </label>
              </div>
              {form.is_campaign && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      Kampanya adı
                    </label>
                    <input
                      type="text"
                      value={form.campaign_name}
                      onChange={(e) => setForm((f) => ({ ...f, campaign_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      Kampanya açıklaması
                    </label>
                    <textarea
                      value={form.campaign_description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, campaign_description: e.target.value }))
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2 rounded-lg bg-[#990000] text-white hover:bg-[#800000] disabled:opacity-50 font-medium"
                >
                  {submitLoading
                    ? (locale === 'tr' ? 'Kaydediliyor...' : 'Saving...')
                    : editingId
                    ? (locale === 'tr' ? 'Güncelle' : 'Update')
                    : (locale === 'tr' ? 'Ekle' : 'Add')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  {locale === 'tr' ? 'İptal' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
