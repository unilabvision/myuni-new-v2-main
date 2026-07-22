'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, X, Package } from 'lucide-react';
import { formatMoneyTr, type OrderLineItem, type OrderSnapshot } from '@/lib/orderSnapshot';

export type DashboardOrder = {
  orderId: string;
  status: string;
  paymentMethod: string;
  discountCode: string;
  discountAmount: number;
  amount: number;
  courseName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  snapshot: OrderSnapshot;
};

interface DashboardOrdersTabProps {
  locale: string;
  texts: {
    emptyTitle: string;
    emptySubtitle: string;
    orderNo: string;
    listTotal: string;
    discount: string;
    paidTotal: string;
    free: string;
    details: string;
    paymentMethod: string;
    close: string;
    status: {
      completed: string;
      pending: string;
      failed: string;
      free: string;
    };
    types: {
      course: string;
      product: string;
      package: string;
      tier: string;
    };
  };
}

function typeLabel(
  type: string,
  texts: DashboardOrdersTabProps['texts']
): string {
  if (type === 'product') return texts.types.product;
  if (type === 'package') return texts.types.package;
  if (type === 'tier') return texts.types.tier;
  if (type === 'course') return texts.types.course;
  return type;
}

function statusBadgeClass(status: string, paymentMethod: string): string {
  if (paymentMethod === 'free_discount' || status === 'free') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  if (status === 'completed') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
  if (status === 'pending') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  }
  if (status === 'failed') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
  return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200';
}

function statusLabel(
  status: string,
  paymentMethod: string,
  texts: DashboardOrdersTabProps['texts']
): string {
  if (paymentMethod === 'free_discount') return texts.status.free;
  if (status === 'completed') return texts.status.completed;
  if (status === 'pending') return texts.status.pending;
  if (status === 'failed') return texts.status.failed;
  return status;
}

function itemHref(locale: string, item: OrderLineItem): string | null {
  const slug = item.slug?.trim();
  if (!slug) {
    if (item.type === 'course' || item.type === 'tier' || item.type === 'package') {
      return `/${locale}/dashboard?tab=courses`;
    }
    if (item.type === 'product') {
      return `/${locale}/collection`;
    }
    return null;
  }

  if (item.type === 'product') {
    return `/${locale}/collection/${slug}`;
  }
  if (item.type === 'package') {
    return locale === 'tr' ? `/${locale}/paket/${slug}` : `/${locale}/package/${slug}`;
  }
  // course / tier / default
  return `/${locale}/watch/course/${slug}`;
}

function Money({
  amount,
  locale,
  freeLabel,
}: {
  amount: number;
  locale: string;
  freeLabel: string;
}) {
  if (amount <= 0.009) {
    return <span>{freeLabel}</span>;
  }
  const formatted = locale === 'tr' ? formatMoneyTr(amount) : amount.toFixed(2);
  return <span>{formatted} ₺</span>;
}

function OrderSummary({
  snapshot,
  texts,
  locale,
}: {
  snapshot: OrderSnapshot;
  texts: DashboardOrdersTabProps['texts'];
  locale: string;
}) {
  return (
    <div className="mt-4 space-y-1.5 border-t border-neutral-200 dark:border-neutral-700 pt-3 text-sm">
      <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
        <span>{texts.listTotal}</span>
        <Money amount={snapshot.listTotal} locale={locale} freeLabel={texts.free} />
      </div>
      {(snapshot.discountAmount > 0.009 || snapshot.discountCodes) && (
        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
          <span>
            {texts.discount}
            {snapshot.discountCodes ? ` (${snapshot.discountCodes})` : ''}
          </span>
          <span>
            −
            <Money
              amount={snapshot.discountAmount}
              locale={locale}
              freeLabel={texts.free}
            />
          </span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-neutral-900 dark:text-neutral-100">
        <span>{texts.paidTotal}</span>
        <Money amount={snapshot.paidTotal} locale={locale} freeLabel={texts.free} />
      </div>
    </div>
  );
}

function LineItems({
  items,
  locale,
  texts,
}: {
  items: OrderLineItem[];
  locale: string;
  texts: DashboardOrdersTabProps['texts'];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const href = itemHref(locale, item);
        const showStrike = item.paidPrice < item.listPrice - 0.009;
        const content = (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {item.title}
                </span>
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                  {typeLabel(item.type, texts)}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {showStrike && (
                <div className="text-xs text-neutral-400 line-through">
                  <Money amount={item.listPrice} locale={locale} freeLabel={texts.free} />
                </div>
              )}
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                <Money amount={item.paidPrice} locale={locale} freeLabel={texts.free} />
              </div>
            </div>
          </>
        );

        return (
          <li key={`${item.id}-${index}`}>
            {href ? (
              <Link
                href={href}
                className="flex items-start justify-between gap-3 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700/40 -mx-1 px-1 py-1 transition-colors"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-start justify-between gap-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function DashboardOrdersTab({
  locale,
  texts,
}: DashboardOrdersTabProps) {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DashboardOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/orders/me?limit=20&offset=0');
      const json = await res.json().catch(() => ({ success: false }));
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setOrders(json.data || []);
    } catch (err) {
      console.error('Orders fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {texts.emptyTitle}
        </h3>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          {texts.emptySubtitle}
        </p>
      </div>
    );
  }

  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-US';

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {orders.map((order) => {
          const dateValue = order.createdAt || order.updatedAt;
          return (
            <div
              key={order.orderId}
              className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {texts.orderNo}
                  </p>
                  <p className="font-mono text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {order.orderId}
                  </p>
                  {dateValue && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {new Date(dateValue).toLocaleString(dateLocale)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-md ${statusBadgeClass(
                      order.status,
                      order.paymentMethod
                    )}`}
                  >
                    {statusLabel(order.status, order.paymentMethod, texts)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(order)}
                    className="text-xs px-2.5 py-1 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {texts.details}
                  </button>
                </div>
              </div>

              <LineItems items={order.snapshot.items} locale={locale} texts={texts} />
              <OrderSummary snapshot={order.snapshot} texts={texts} locale={locale} />
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-neutral-800 rounded-t-xl sm:rounded-xl border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-500" />
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {selected.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label={texts.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`px-2 py-1 rounded-md font-medium ${statusBadgeClass(
                    selected.status,
                    selected.paymentMethod
                  )}`}
                >
                  {statusLabel(selected.status, selected.paymentMethod, texts)}
                </span>
                <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {texts.paymentMethod}: {selected.paymentMethod || 'iyzico'}
                </span>
              </div>
              {(selected.createdAt || selected.updatedAt) && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(
                    selected.createdAt || selected.updatedAt || ''
                  ).toLocaleString(dateLocale)}
                </p>
              )}
              <LineItems
                items={selected.snapshot.items}
                locale={locale}
                texts={texts}
              />
              <OrderSummary
                snapshot={selected.snapshot}
                texts={texts}
                locale={locale}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
