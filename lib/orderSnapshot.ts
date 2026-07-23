/**
 * Canonical purchase snapshot for orders.custom_data + confirmation emails.
 * listPrice = catalog/early-bird unit price; paidPrice = share of actual charged amount.
 */

export type OrderLineItemInput = {
  id: string;
  title: string;
  price: number;
  type: string;
  slug?: string;
  courseId?: string;
  tierId?: string;
  course_type?: string;
  fullData?: unknown;
};

export type OrderLineItem = {
  id: string;
  title: string;
  type: string;
  slug?: string;
  courseId?: string;
  tierId?: string;
  course_type?: string;
  listPrice: number;
  paidPrice: number;
};

export type OrderSnapshot = {
  items: OrderLineItem[];
  listTotal: number;
  discountAmount: number;
  paidTotal: number;
  discountCodes: string;
  /**
   * Extra amount charged on top of the originally quoted paidTotal — e.g. a
   * bank's installment commission/interest added when the buyer pays in
   * multiple installments. The merchant never receives this portion, so it
   * must stay separate from discountAmount/listTotal bookkeeping.
   */
  commissionAmount?: number;
};

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function buildOrderSnapshot(
  items: OrderLineItemInput[],
  opts: {
    paidTotal: number;
    discountAmount?: number;
    discountCodes?: string;
  }
): OrderSnapshot {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const listTotal = roundMoney(
    safeItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
  );
  const paidTotal = roundMoney(Math.max(0, Number(opts.paidTotal) || 0));
  const discountAmount = roundMoney(
    Math.max(
      0,
      opts.discountAmount != null
        ? Number(opts.discountAmount) || 0
        : Math.max(0, listTotal - paidTotal)
    )
  );

  let allocated = 0;
  const lines: OrderLineItem[] = safeItems.map((item, index) => {
    const listPrice = roundMoney(Number(item.price) || 0);
    let paidPrice = 0;

    if (safeItems.length === 0) {
      paidPrice = 0;
    } else if (listTotal <= 0) {
      paidPrice = index === 0 ? paidTotal : 0;
    } else if (index === safeItems.length - 1) {
      paidPrice = roundMoney(paidTotal - allocated);
    } else {
      paidPrice = roundMoney((listPrice / listTotal) * paidTotal);
      allocated = roundMoney(allocated + paidPrice);
    }

    return {
      id: item.id,
      title: item.title,
      type: item.type,
      slug: item.slug,
      courseId: item.courseId,
      tierId: item.tierId,
      course_type: item.course_type,
      listPrice,
      paidPrice,
    };
  });

  return {
    items: lines,
    listTotal,
    discountAmount,
    paidTotal,
    discountCodes: String(opts.discountCodes || '').trim(),
  };
}

/**
 * Reconciles an already-persisted snapshot (built at checkout-initiation
 * time, before the amount actually charged is known) with the ACTUAL amount
 * charged by the payment gateway. When the buyer pays in installments, the
 * issuing bank can add its own commission on top of the quoted paidTotal —
 * this rescales every line item's paidPrice proportionally so
 * `sum(items[].paidPrice) === actualPaidTotal` always holds, and records the
 * surplus as `commissionAmount` for transparent display/bookkeeping.
 * listTotal/discountAmount are left untouched — they describe catalog price
 * and the discount actually granted, independent of bank fees.
 */
export function rescaleSnapshotForActualPaid(
  snapshot: OrderSnapshot,
  actualPaidTotal: number
): OrderSnapshot {
  const targetPaid = roundMoney(Math.max(0, actualPaidTotal));
  const originalPaid = roundMoney(snapshot.paidTotal);
  const commissionAmount = roundMoney(Math.max(0, targetPaid - originalPaid));

  if (Math.abs(targetPaid - originalPaid) < 0.01 || snapshot.items.length === 0) {
    return { ...snapshot, paidTotal: targetPaid, commissionAmount };
  }

  let allocated = 0;
  const items = snapshot.items.map((item, index) => {
    let paidPrice: number;
    if (originalPaid <= 0) {
      paidPrice = index === 0 ? targetPaid : 0;
    } else if (index === snapshot.items.length - 1) {
      paidPrice = roundMoney(targetPaid - allocated);
    } else {
      paidPrice = roundMoney((item.paidPrice / originalPaid) * targetPaid);
      allocated = roundMoney(allocated + paidPrice);
    }
    return { ...item, paidPrice };
  });

  return { ...snapshot, items, paidTotal: targetPaid, commissionAmount };
}

export function resolveEmailCourseType(
  snapshot: OrderSnapshot,
  cartMode: boolean
): string {
  if (cartMode || snapshot.items.length > 1) return 'cart';
  const item = snapshot.items[0];
  if (!item) return 'online';
  if (item.type === 'product') return 'product';
  if (item.type === 'package') return 'package';
  if (item.type === 'tier') return item.course_type || 'live';
  return item.course_type || 'online';
}

export function formatMoneyTr(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (Number.isNaN(n)) return String(amount);
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
