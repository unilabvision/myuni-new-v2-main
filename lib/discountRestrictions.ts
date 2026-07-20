/**
 * Yüksek tutarlı sabit indirim kodları (modül paketlerini bedava bırakmasın).
 * 2000 TL ve üzeri fixed kodlar otomatik olarak:
 * - yalnızca tam eğitim paketine uygulanır
 * - minimum sipariş tutarı en az (indirim + 1) olur
 */

export const HIGH_VALUE_FIXED_THRESHOLD = 2000;

export type DiscountRestrictionInput = {
  discount_type?: string | null;
  type?: string | null; // checkout client mapping
  discount_amount?: number | null;
  discountAmount?: number | null; // checkout client mapping
  has_balance_limit?: boolean | null;
  minimum_order_amount?: number | null;
  full_course_only?: boolean | null;
};

export function getDiscountAmount(code: DiscountRestrictionInput): number {
  return Number(code.discount_amount ?? code.discountAmount ?? 0) || 0;
}

export function getDiscountType(code: DiscountRestrictionInput): string {
  return String(code.discount_type ?? code.type ?? '').toLowerCase();
}

export function isHighValueFixedCode(code: DiscountRestrictionInput): boolean {
  if (code.has_balance_limit) return false;
  const type = getDiscountType(code);
  const amount = getDiscountAmount(code);
  return type === 'fixed' && amount >= HIGH_VALUE_FIXED_THRESHOLD;
}

/**
 * Kod üzerindeki bayraklar + 2000₺+ fixed otomatik kuralları birleştirir.
 */
export function resolveDiscountRestrictions(code: DiscountRestrictionInput): {
  isHighValueFixed: boolean;
  fullCourseOnly: boolean;
  minimumOrderAmount: number;
} {
  const isHighValueFixed = isHighValueFixedCode(code);
  const amount = getDiscountAmount(code);
  const explicitMin = Number(code.minimum_order_amount) || 0;

  // 2000+ fixed → her zaman tam eğitim; min tutar en az indirim+1
  const fullCourseOnly = Boolean(code.full_course_only) || isHighValueFixed;
  const minimumOrderAmount = isHighValueFixed
    ? Math.max(explicitMin, amount + 1)
    : explicitMin;

  return { isHighValueFixed, fullCourseOnly, minimumOrderAmount };
}

/**
 * Admin create/update: 2000+ fixed kodlarda alanları otomatik doldur.
 */
export function applyHighValueFixedDefaults<T extends Record<string, unknown>>(
  row: T & {
    discount_type?: string;
    discount_amount?: number;
    has_balance_limit?: boolean;
    minimum_order_amount?: number | null;
    full_course_only?: boolean;
  }
): T {
  if (!isHighValueFixedCode(row)) return row;

  const amount = Number(row.discount_amount) || 0;
  const explicitMin = row.minimum_order_amount == null ? 0 : Number(row.minimum_order_amount) || 0;

  return {
    ...row,
    full_course_only: true,
    minimum_order_amount: Math.max(explicitMin, amount + 1),
  };
}
