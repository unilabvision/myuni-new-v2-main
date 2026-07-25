/**
 * Yüksek tutarlı sabit indirim kodları (ucuz tek modülü bedava bırakmasın).
 * 2000 TL ve üzeri fixed kodlar otomatik olarak:
 * - minimum sipariş tutarı en az (indirim + 1) olur
 *
 * full_course_only yalnızca DB / admin bayrağından gelir; sepette modül
 * paketlerine (ör. SONGUN) uygulanabilmesi için 2000+ fixed otomatik
 * tam-eğitim kilidi uygulanmaz.
 *
 * maximum_order_amount: eligible sepet/ürün üst sınırı (null/0 = tavan yok).
 */

export const HIGH_VALUE_FIXED_THRESHOLD = 2000;

export type DiscountRestrictionInput = {
  discount_type?: string | null;
  type?: string | null; // checkout client mapping
  discount_amount?: number | null;
  discountAmount?: number | null; // checkout client mapping
  has_balance_limit?: boolean | null;
  minimum_order_amount?: number | null;
  maximum_order_amount?: number | null;
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
  maximumOrderAmount: number;
} {
  const isHighValueFixed = isHighValueFixedCode(code);
  const amount = getDiscountAmount(code);
  const explicitMin = Number(code.minimum_order_amount) || 0;
  const explicitMax = Number(code.maximum_order_amount) || 0;

  // Tam eğitim kilidi yalnızca açık bayraktan; 2000+ fixed otomatik kilitlemez
  const fullCourseOnly = Boolean(code.full_course_only);
  // 2000+ fixed → min tutar en az indirim+1 (tek ucuz modülü engeller)
  const minimumOrderAmount = isHighValueFixed
    ? Math.max(explicitMin, amount + 1)
    : explicitMin;
  const maximumOrderAmount = explicitMax > 0 ? explicitMax : 0;

  return { isHighValueFixed, fullCourseOnly, minimumOrderAmount, maximumOrderAmount };
}

/**
 * Admin create/update: 2000+ fixed kodlarda minimum tutarı otomatik doldur.
 * full_course_only'yi zorlamaz — sepette modül paketlerine izin verilir.
 */
export function applyHighValueFixedDefaults<T extends Record<string, unknown>>(
  row: T & {
    discount_type?: string;
    discount_amount?: number;
    has_balance_limit?: boolean;
    minimum_order_amount?: number | null;
    maximum_order_amount?: number | null;
    full_course_only?: boolean;
  }
): T {
  if (!isHighValueFixedCode(row)) return row;

  const amount = Number(row.discount_amount) || 0;
  const explicitMin = row.minimum_order_amount == null ? 0 : Number(row.minimum_order_amount) || 0;

  return {
    ...row,
    minimum_order_amount: Math.max(explicitMin, amount + 1),
  };
}

/**
 * Sepet / ödeme kaleminin indirim kodu applicable_courses listesine uyup uymadığını kontrol eder.
 * Tier ve package için hem kendi id hem courseId eşleşmesi kabul edilir.
 */
export function itemMatchesApplicableCourses(
  item: { id?: string | null; type?: string | null; courseId?: string | null },
  applicableCourses: string[]
): boolean {
  if (!applicableCourses.length) return true;
  const ids = [item.id, item.courseId].filter(Boolean).map(String);
  return ids.some((id) => applicableCourses.includes(id));
}
