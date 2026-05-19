// app/[locale]/cart/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  ShoppingBag, Trash2, ArrowRight, ShoppingCart,
  Tag, Shield, X, ChevronRight, ArrowLeft
} from 'lucide-react';
import { useCart, getActivePrice } from '../../context/CartContext';

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

const texts = {
  tr: {
    pageTitle: 'Sepetim',
    cartEmpty: 'Sepetiniz Boş',
    cartEmptyDesc: 'Henüz sepetinize ürün eklemediniz. Eğitimlerimizi keşfedin!',
    browseCourses: 'Eğitimlere Göz At',
    remove: 'Kaldır',
    clearCart: 'Sepeti Temizle',
    orderSummary: 'Sipariş Özeti',
    subtotal: 'Ara Toplam',
    vatNote: '%20 KDV dahildir',
    total: 'Toplam',
    proceedToCheckout: 'Ödemeye Geç',
    items: 'ürün',
    earlyBird: 'Erken Kayıt',
    normalPrice: 'Normal Fiyat',
    continueShopping: 'Alışverişe Devam Et',
    securePayment: 'Güvenli Ödeme',
    paymentInfo: 'Ödemeniz iyzico güvenli altyapısı üzerinden gerçekleştirilecektir.',
    signInRequired: 'Ödemeye geçmek için giriş yapmalısınız.',
    signIn: 'Giriş Yap',
  },
  en: {
    pageTitle: 'My Cart',
    cartEmpty: 'Your Cart is Empty',
    cartEmptyDesc: 'You haven\'t added any items yet. Explore our courses!',
    browseCourses: 'Browse Courses',
    remove: 'Remove',
    clearCart: 'Clear Cart',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    vatNote: '20% VAT included',
    total: 'Total',
    proceedToCheckout: 'Proceed to Checkout',
    items: 'items',
    earlyBird: 'Early Bird',
    normalPrice: 'Regular Price',
    continueShopping: 'Continue Shopping',
    securePayment: 'Secure Payment',
    paymentInfo: 'Your payment is processed through the secure iyzico infrastructure.',
    signInRequired: 'You must sign in to proceed to checkout.',
    signIn: 'Sign In',
  },
};

export default function CartPage({ params }: CartPageProps) {
  const { locale } = use(params);
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { items, removeItem, clearCart, totalPrice } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const coursePath = locale === 'tr' ? 'kurs' : 'course';

  const handleCheckout = () => {
    if (!isSignedIn) {
      router.push(`/${locale}/sign-in?redirect_url=/${locale}/cart`);
      return;
    }
    // Pass cart items via query param (base64 encoded IDs) to checkout
    const ids = items.map(i => i.id).join(',');
    router.push(`/${locale}/checkout?cartIds=${encodeURIComponent(ids)}&mode=cart`);
  };

  const handleClear = () => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          {/* Animated empty state */}
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag size={52} className="text-neutral-300 dark:text-neutral-600" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t.cartEmpty}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8 max-w-sm leading-relaxed">
            {t.cartEmptyDesc}
          </p>
          <Link
            href={`/${locale}/${coursePath}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-200 shadow-sm"
          >
            <ShoppingCart size={16} />
            {t.browseCourses}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/${locale}/${coursePath}`}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.pageTitle}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {items.length} {t.items}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {/* Clear button */}
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClear}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  confirmClear
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent'
                }`}
              >
                {confirmClear ? <X size={12} /> : <Trash2 size={12} />}
                {confirmClear ? 'Emin misiniz?' : t.clearCart}
              </button>
            </div>

            {items.map((item, idx) => {
              const activePrice = getActivePrice(item);
              const isEarlyBird = item.earlyBirdPrice && activePrice !== item.price;

              const itemDetailPath = item.type === 'package'
                ? `/${locale}/${locale === 'tr' ? 'paket' : 'package'}/${item.slug}`
                : item.type === 'product'
                  ? `/${locale}/collection/${item.slug}`
                  : `/${locale}/${locale === 'tr' ? 'kurs' : 'course'}/${item.slug}`;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 flex gap-4 group hover:border-neutral-200 dark:hover:border-neutral-700 transition-all duration-200"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <Link href={itemDetailPath} className="flex gap-4 flex-1 min-w-0 group/link">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 transition-transform duration-200 group-hover/link:scale-[1.02]">
                      {item.thumbnailUrl ? (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={24} className="text-neutral-400" />
                        </div>
                      )}
                      {isEarlyBird && (
                        <div className="absolute top-1 left-1">
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full font-bold leading-none">
                            {t.earlyBird}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        {item.type === 'course' 
                          ? (locale === 'tr' ? 'Eğitim' : 'Course') 
                          : item.type === 'package'
                            ? (locale === 'tr' ? 'Eğitim Paketi' : 'Training Package')
                            : (locale === 'tr' ? 'Ürün' : 'Product')}
                      </span>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug mt-0.5 line-clamp-2 group-hover/link:text-[#990000] dark:group-hover/link:text-red-400 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-base font-bold ${isEarlyBird ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          {activePrice.toFixed(2)}₺
                        </span>
                        {isEarlyBird && (
                          <span className="text-sm text-neutral-400 dark:text-neutral-500 line-through">
                            {item.price.toFixed(2)}₺
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex-shrink-0 p-2 rounded-xl text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 self-center ml-2 mr-1"
                    aria-label={t.remove}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}

            {/* Continue shopping */}
            <Link
              href={`/${locale}/${coursePath}`}
              className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors py-2 w-fit"
            >
              <ArrowLeft size={14} />
              {t.continueShopping}
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 sticky top-24">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
                <Tag size={14} className="text-neutral-400" />
                {t.orderSummary}
              </h2>

              {/* Item breakdown */}
              <div className="space-y-2 mb-4">
                {items.map(item => {
                  const price = getActivePrice(item);
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400 line-clamp-1 flex-1 mr-2 text-xs">
                        {item.title}
                      </span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium text-xs flex-shrink-0">
                        {price.toFixed(2)}₺
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {t.total}
                  </span>
                  <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {totalPrice.toFixed(2)}₺
                  </span>
                </div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{t.vatNote}</p>
              </div>

              {/* CTA */}
              {!isLoaded ? (
                <div className="w-full h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ) : !isSignedIn ? (
                <div className="space-y-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    {t.signInRequired}
                  </p>
                  <Link
                    href={`/${locale}/sign-in?redirect_url=/${locale}/cart`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-200"
                  >
                    {t.signIn}
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  {t.proceedToCheckout}
                  <ArrowRight size={16} />
                </button>
              )}

              {/* Trust badge */}
              <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3">
                <Shield size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                  {t.paymentInfo}
                </p>
              </div>

              {/* Accepted cards */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                <span>Visa</span>
                <span>•</span>
                <span>Mastercard</span>
                <span>•</span>
                <span>Troy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
