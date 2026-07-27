import type { SiteApplicationFormField } from '@/app/types/siteApplicationForms';
import { normalizeFieldOptions } from './forms';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeFieldValue(
  field: SiteApplicationFormField,
  raw: unknown
): string | number | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;

  if (field.field_type === 'number' || field.field_type === 'linear_scale' || field.field_type === 'rating') {
    const num = Number(str);
    return Number.isFinite(num) ? num : null;
  }

  return str;
}

export function validateSubmissionFields(
  fields: SiteApplicationFormField[],
  values: Record<string, unknown>
): { valid: boolean; errors: Record<string, string>; normalized: Record<string, unknown> } {
  const errors: Record<string, string> = {};
  const normalized: Record<string, unknown> = {};

  for (const field of fields) {
    // Admin resource files are download-only on the public form — never answered.
    if (field.field_type === 'resource') {
      continue;
    }

    const raw = values[field.field_key];

    if (field.field_type === 'checkbox') {
      let selected: string[] = [];
      if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed = JSON.parse(raw);
          selected = Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          selected = [];
        }
      } else if (Array.isArray(raw)) {
        selected = raw.map(String);
      }

      if (field.required && selected.length === 0) {
        errors[field.field_key] = 'required';
        continue;
      }

      const allowed = normalizeFieldOptions(field.options).map((o) => o.value);
      if (allowed.length > 0 && selected.some((v) => !allowed.includes(v))) {
        errors[field.field_key] = 'invalid_option';
        continue;
      }

      if (selected.length > 0) {
        normalized[field.field_key] = selected;
      }
      continue;
    }

    const value = normalizeFieldValue(field, raw);

    if (field.required && (value === null || value === '')) {
      errors[field.field_key] = 'required';
      continue;
    }

    if (value === null) continue;

    if (field.field_type === 'email' && typeof value === 'string' && !isValidEmail(value)) {
      errors[field.field_key] = 'invalid_email';
      continue;
    }

    if (field.field_type === 'url' && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors[field.field_key] = 'invalid_url';
        continue;
      }
    }

    if (
      (field.field_type === 'select' ||
        field.field_type === 'dropdown' ||
        field.field_type === 'linear_scale' ||
        field.field_type === 'rating') &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      const allowed = normalizeFieldOptions(field.options).map((o) => o.value);
      const asString = String(value);
      if (allowed.length > 0 && !allowed.includes(asString)) {
        errors[field.field_key] = 'invalid_option';
        continue;
      }
    }

    normalized[field.field_key] = value;
  }

  return { valid: Object.keys(errors).length === 0, errors, normalized };
}

export function extractContactFromSubmission(
  fields: SiteApplicationFormField[],
  values: Record<string, unknown>
): { firstName: string; lastName: string; email: string; phone: string | null } {
  const byKey = (key: string) => {
    const v = values[key];
    return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
  };

  const firstName = byKey('first_name') || byKey('firstName') || byKey('ad') || '—';
  const lastName = byKey('last_name') || byKey('lastName') || byKey('soyad') || '—';

  const emailField = fields.find((f) => f.field_type === 'email')?.field_key || 'email';
  const email = byKey(emailField).toLowerCase() || 'unknown@myunilab.net';

  const phoneField = fields.find((f) => f.field_type === 'tel')?.field_key || 'phone';
  const phone = byKey(phoneField) || null;

  return { firstName, lastName, email, phone };
}
