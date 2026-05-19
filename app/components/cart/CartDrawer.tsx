'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart, getActivePrice } from '../../context/CartContext';

interface CartDrawerProps {
  locale: string;
}

const t = {
  tr: {
    title: 'Sepetim',
    empty: 'Sepetiniz boş',
    emptyDesc: 'Eğitimleri keşfet ve sepetine ekle.',
    browse: 'Eğitimlere Göz At',
    total: 'Toplam',
    checkout: 'Ödemeye Geç',
    remove: 'Kaldır',
    items: 'ürün',
    vatNote: 'KDV dahildir',
    earlyBird: 'Erken Kayıt',
  },
  en: {
    title: 'My Cart',
    empty: 'Your cart is empty',
    emptyDesc: 'Explore courses and add them to your cart.',
    browse: 'Browse Courses',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    remove: 'Remove',
    items: 'items',
    vatNote: 'VAT included',
    earlyBird: 'Early Bird',
  },
};

export default function CartDrawer({ locale }: CartDrawerProps) {
  const { items, removeItem, totalPrice, totalItems, isDrawerOpen, closeDrawer } = useCart();
  const text = t[locale as keyof typeof t] || t.tr;
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    };
    if (isDrawerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDrawerOpen, closeDrawer]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    if (isDrawerOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const coursePath = locale === 'tr' ? 'kurs' : 'course';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-neutral-900 shadow-2xl z-[70] flex flex-col transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={text.title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {text.title}
            </h2>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#990000] text-white text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-5">
                <ShoppingBag size={32} className="text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-neutral-800 dark:text-neutral-200 font-medium text-base mb-2">
                {text.empty}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
                {text.emptyDesc}
              </p>
              <Link
                href={`/${locale}/${coursePath}`}
                onClick={closeDrawer}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
              >
                {text.browse}
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map(item => {
                const activePrice = getActivePrice(item);
                const isEarlyBird = activePrice !== item.price && item.earlyBirdPrice;
                return (
                  <li key={item.id} className="flex gap-4 px-6 py-4 group">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 mb-1">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isEarlyBird ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          {activePrice.toFixed(2)}₺
                        </span>
                        {isEarlyBird && (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">
                            {item.price.toFixed(2)}₺
                          </span>
                        )}
                        {isEarlyBird && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                            {text.earlyBird}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 self-start"
                      aria-label={text.remove}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with total + checkout */}
        {items.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 px-6 py-5 space-y-4 bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{text.vatNote}</p>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {totalItems} {text.items}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{text.total}</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {totalPrice.toFixed(2)}₺
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/cart`}
              onClick={closeDrawer}
              className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium text-sm hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-200 shadow-sm"
            >
              {text.checkout}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
