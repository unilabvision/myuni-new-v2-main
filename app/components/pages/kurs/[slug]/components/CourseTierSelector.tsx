'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  MessageCircle,
  Play,
  ShoppingCart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useCart } from '../../../../../context/CartContext';
import type { CartItem } from '../../../../../context/CartContext';
import type { CourseTier } from '@/lib/types/tier';

interface CoursePricing {
  activePrice: number;
  displayOriginalPrice: number | null;
  isEarlyBird: boolean;
  discountPercentage: number;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

interface CourseTierSelectorProps {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string;
    is_registration_open?: boolean;
    level?: string;
    duration?: string;
  };
  coursePricing: CoursePricing;
  tiers: CourseTier[];
  enrolledTierIds: string[];
  locale?: string;
  checkingEnrollment?: boolean;
}

function getTierActivePrice(tier: CourseTier): number {
  if (tier.early_bird_price != null && tier.early_bird_deadline) {
    const now = new Date();
    const deadline = new Date(tier.early_bird_deadline);
    if (now < deadline) return Number(tier.early_bird_price);
  }
  return Number(tier.price) || 0;
}

function isTierClosed(tier: CourseTier, courseRegistrationOpen?: boolean): boolean {
  return tier.is_registration_open === false || courseRegistrationOpen === false;
}

function isFullCourseTier(tier: CourseTier): boolean {
  return tier.is_full_course === true || tier.slug === 'tam-egitim';
}

export default function CourseTierSelector({
  course,
  coursePricing,
  tiers,
  enrolledTierIds,
  locale = 'tr',
  checkingEnrollment = false,
}: CourseTierSelectorProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { addItems, isInCart } = useCart();

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.order_index - b.order_index),
    [tiers]
  );

  const [selectedTierIds, setSelectedTierIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedTierIds((prev) => {
      const next = new Set([...prev].filter((id) => !enrolledTierIds.includes(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [enrolledTierIds]);

  const selectedTiers = sortedTiers.filter((t) => selectedTierIds.has(t.id));
  const hasSelection = selectedTiers.length > 0;

  const displayPrice = hasSelection
    ? selectedTiers.reduce((sum, t) => sum + getTierActivePrice(t), 0)
    : coursePricing.activePrice;

  const displayOriginal = hasSelection
    ? selectedTiers.reduce((sum, t) => {
        const op = t.original_price;
        const active = getTierActivePrice(t);
        return sum + (op != null && op > active ? op : active);
      }, 0)
    : coursePricing.displayOriginalPrice;

  const showStrikethrough =
    displayOriginal != null && displayOriginal > displayPrice;

  const selectionHasEarlyBird =
    hasSelection &&
    selectedTiers.some((t) => {
      if (t.early_bird_price == null || !t.early_bird_deadline) return false;
      return new Date() < new Date(t.early_bird_deadline);
    });

  const showEarlyBirdBanner =
    (!hasSelection && coursePricing.isEarlyBird) || selectionHasEarlyBird;

  const allSelectedClosed =
    hasSelection &&
    selectedTiers.every((t) => isTierClosed(t, course.is_registration_open));
  const allSelectedEnrolled =
    hasSelection && selectedTiers.every((t) => enrolledTierIds.includes(t.id));

  const buildCartItem = (tier: CourseTier): CartItem => ({
    id: tier.id,
    title: `${course.title} — ${tier.title}`,
    price: getTierActivePrice(tier),
    originalPrice: tier.original_price ?? undefined,
    thumbnailUrl: course.thumbnail_url,
    slug: course.slug,
    type: 'tier',
    courseId: course.id,
    tierId: tier.id,
    earlyBirdPrice: tier.early_bird_price,
    earlyBirdDeadline: tier.early_bird_deadline,
  });

  const toggleTier = (tier: CourseTier) => {
    if (enrolledTierIds.includes(tier.id)) return;

    setSelectedTierIds((prev) => {
      const next = new Set(prev);
      if (next.has(tier.id)) {
        next.delete(tier.id);
        return next;
      }
      if (isFullCourseTier(tier)) {
        return new Set([tier.id]);
      }
      sortedTiers.filter(isFullCourseTier).forEach((t) => next.delete(t.id));
      next.add(tier.id);
      return next;
    });
  };

  const handleBuySelected = () => {
    const purchasable = selectedTiers.filter(
      (t) =>
        !enrolledTierIds.includes(t.id) &&
        !isTierClosed(t, course.is_registration_open) &&
        !t.shopier_product_url
    );
    if (purchasable.length === 0) return;

    if (!isSignedIn) {
      router.push(
        `/${locale}/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    if (purchasable.length === 1) {
      const tier = purchasable[0];
      if (tier.shopier_product_url) {
        window.open(tier.shopier_product_url, '_blank', 'noopener,noreferrer');
        return;
      }
      let url = `/${locale}/checkout?id=${encodeURIComponent(course.id)}&tierId=${encodeURIComponent(tier.id)}&type=tier`;
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) url += `&ref=${encodeURIComponent(ref)}`;
      router.push(url);
      return;
    }

    addItems(purchasable.map(buildCartItem));
    const ids = purchasable.map((t) => t.id).join(',');
    router.push(`/${locale}/checkout?cartIds=${encodeURIComponent(ids)}&mode=cart`);
  };

  const handleAddSelectedToCart = () => {
    const toAdd = selectedTiers
      .filter(
        (t) =>
          !enrolledTierIds.includes(t.id) &&
          !isTierClosed(t, course.is_registration_open) &&
          !t.shopier_product_url &&
          !isInCart(t.id)
      )
      .map(buildCartItem);
    addItems(toAdd);
  };

  const selectedInCartCount = selectedTiers.filter((t) => isInCart(t.id)).length;
  const canAddToCart =
    hasSelection &&
    selectedTiers.some(
      (t) =>
        !enrolledTierIds.includes(t.id) &&
        !isTierClosed(t, course.is_registration_open) &&
        !t.shopier_product_url &&
        !isInCart(t.id)
    );

  const actionButtons = !hasSelection ? (
    <button
      type="button"
      disabled
      className="w-full bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-xl font-medium cursor-not-allowed text-center text-sm"
    >
      Satın almak için paket seçin
    </button>
  ) : allSelectedEnrolled ? (
    <button
      type="button"
      onClick={() => router.push(`/${locale}/watch/course/${course.slug}`)}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center text-sm"
    >
      <Play className="w-4 h-4 mr-2" fill="currentColor" />
      Kursa Git
    </button>
  ) : allSelectedClosed ? (
    <button
      type="button"
      disabled
      className="w-full bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-xl font-medium cursor-not-allowed flex items-center justify-center text-sm"
    >
      <AlertCircle className="w-4 h-4 mr-2" />
      Kayıt Kapalı
    </button>
  ) : (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <button
        type="button"
        onClick={handleBuySelected}
        className="w-full sm:flex-1 bg-[#990000] hover:bg-[#b30000] text-white py-3 px-6 rounded-xl font-medium transition-colors text-center text-sm"
      >
        {selectedTiers.length === 1 && selectedTiers[0].shopier_product_url
          ? "Shopier'da Satın Al"
          : selectedTiers.length > 1
            ? `${selectedTiers.length} Paketi Satın Al`
            : 'Hemen Satın Al'}
      </button>
      {canAddToCart && (
        <button
          type="button"
          onClick={handleAddSelectedToCart}
          className="w-full sm:w-auto sm:min-w-[10rem] flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 py-3 px-6 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors text-sm"
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {selectedTiers.length > 1
              ? `Sepete Ekle (${selectedTiers.length - selectedInCartCount})`
              : 'Sepete Ekle'}
          </span>
        </button>
      )}
    </div>
  );

  const mobileStickyBar = hasSelection ? (
    <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto w-full max-w-lg px-3 sm:px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-semibold leading-none text-neutral-900 dark:text-neutral-100">
              {displayPrice === 0 ? 'Ücretsiz' : `₺${displayPrice.toLocaleString('tr-TR')}`}
            </p>
            <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {selectedTiers.length} paket seçildi
            </p>
          </div>
          {showStrikethrough && displayOriginal != null && (
            <p className="text-xs text-neutral-400 line-through shrink-0">
              ₺{displayOriginal.toLocaleString('tr-TR')}
            </p>
          )}
        </div>

        {allSelectedEnrolled ? (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/watch/course/${course.slug}`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center"
          >
            <Play className="w-4 h-4 mr-1.5" fill="currentColor" />
            Kursa Git
          </button>
        ) : allSelectedClosed ? (
          <button
            type="button"
            disabled
            className="w-full bg-neutral-300 dark:bg-neutral-600 text-neutral-500 py-2.5 px-4 rounded-xl font-medium text-sm"
          >
            Kayıt Kapalı
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBuySelected}
              className="flex-1 min-w-0 bg-[#990000] hover:bg-[#b30000] text-white py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm truncate"
            >
              {selectedTiers.length > 1
                ? `${selectedTiers.length} Paketi Al`
                : 'Hemen Al'}
            </button>
            {canAddToCart && (
              <button
                type="button"
                onClick={handleAddSelectedToCart}
                aria-label="Sepete ekle"
                className="shrink-0 flex items-center justify-center w-11 h-11 border border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const mobileBottomSpacer = hasSelection
    ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0'
    : 'lg:pb-0';

  if (checkingEnrollment) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-sm text-neutral-500">Paketler yükleniyor...</span>
      </div>
    );
  }

  const getTierLabel = (tier: CourseTier, isFull: boolean) => {
    if (isFull) return 'Tam Eğitim';
    if (tier.slug.startsWith('modul-')) return `Modül ${tier.order_index}`;
    return `Paket ${tier.order_index}`;
  };

  return (
    <>
      {mobileStickyBar}

      <div className={`space-y-3 sm:space-y-4 overflow-x-hidden ${mobileBottomSpacer}`}>
        {/* Fiyat */}
        <div>
          <div className="flex items-baseline gap-2 sm:gap-3 mb-0.5">
            <div className="flex flex-col min-w-0">
              <span className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {displayPrice === 0 ? 'Ücretsiz' : `₺${displayPrice.toLocaleString('tr-TR')}`}
              </span>
              {showEarlyBirdBanner && (
                <span className="text-[11px] sm:text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5 flex items-center">
                  <span className="w-1 h-1 bg-orange-400 rounded-full mr-1 shrink-0" />
                  Erken kayıt fiyatı
                </span>
              )}
            </div>
            {showStrikethrough && displayOriginal != null && (
              <span className="text-base sm:text-lg text-neutral-400 line-through shrink-0">
                ₺{displayOriginal.toLocaleString('tr-TR')}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {hasSelection
              ? `${selectedTiers.length} paket seçildi`
              : 'Eğitim fiyatı — birden fazla paket seçebilirsiniz'}
          </p>
          <div className="w-12 h-px bg-[#990000] mt-2 mb-3" />

          {showEarlyBirdBanner && coursePricing.countdown && (
            <div className="mb-3 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-lg p-2.5 sm:p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">
                  Erken Kayıt İndirimi
                </span>
                {coursePricing.discountPercentage > 0 && (
                  <div className="bg-orange-500 text-white px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold">
                    %{coursePricing.discountPercentage} KAZANÇ
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit, i) => (
                  <div key={unit} className="text-center">
                    <div className="bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800 rounded-md py-1.5 sm:py-2 px-1">
                      <div className="text-sm sm:text-lg font-bold text-orange-600 dark:text-orange-400 leading-none">
                        {coursePricing.countdown![unit].toString().padStart(2, '0')}
                      </div>
                      <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">
                        {['Gün', 'Saat', 'Dk', 'Sn'][i]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Paket kartları — çoklu seçim, eski detaylı UI */}
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
            Paketinizi seçin
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Birden fazla paket seçebilir veya tam eğitimi alabilirsiniz.
          </p>

          <div
            className="space-y-2 max-h-[min(420px,52vh)] sm:max-h-[min(520px,65vh)] lg:max-h-none overflow-y-auto overscroll-contain pr-0.5 -mr-0.5 lg:overflow-visible touch-pan-y"
            role="listbox"
            aria-multiselectable="true"
          >
            {sortedTiers.map((tier) => {
              const isSelected = selectedTierIds.has(tier.id);
              const isEnrolled = enrolledTierIds.includes(tier.id);
              const isClosed = isTierClosed(tier, course.is_registration_open);
              const tierPrice = getTierActivePrice(tier);
              const isFull = isFullCourseTier(tier);
              const sessionCount =
                tier.sessions?.length ?? tier.session_labels?.length ?? 0;
              const label = getTierLabel(tier, isFull);

              return (
                <button
                  key={tier.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isEnrolled}
                  onClick={() => toggleTier(tier)}
                  className={`w-full text-left rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all duration-200 ${
                    isEnrolled
                      ? 'border-green-400 dark:border-green-600 bg-green-50/40 dark:bg-green-900/10 cursor-default'
                      : isSelected
                        ? 'border-[#990000] bg-[#990000]/5 dark:bg-[#990000]/10 shadow-sm ring-1 ring-[#990000]/20'
                        : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800/80 hover:border-neutral-400 dark:hover:border-neutral-500'
                  } ${isClosed && !isEnrolled ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div
                      className={`mt-0.5 flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center border-2 transition-colors ${
                        isEnrolled
                          ? 'rounded-full border-green-500 bg-green-500'
                          : isSelected
                            ? 'rounded-sm border-[#990000] bg-[#990000]'
                            : 'rounded-sm border-neutral-300 dark:border-neutral-500 bg-transparent'
                      }`}
                    >
                      {(isSelected || isEnrolled) && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <div className="min-w-0">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider ${
                              isFull ? 'text-amber-700 dark:text-amber-400' : 'text-[#990000]'
                            }`}
                          >
                            {label}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug mt-0.5 break-words">
                            {tier.title}
                          </h4>
                        </div>
                        <div className="sm:text-right shrink-0">
                          <span className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                            {tierPrice === 0 ? 'Ücretsiz' : `₺${tierPrice.toLocaleString('tr-TR')}`}
                          </span>
                          {tier.original_price != null &&
                            tier.original_price > tierPrice && (
                              <p className="text-xs text-neutral-400 line-through">
                                ₺{Number(tier.original_price).toLocaleString('tr-TR')}
                              </p>
                            )}
                        </div>
                      </div>

                      {tier.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2">
                          {tier.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {isFull && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                            4 paket dahil
                          </span>
                        )}
                        {sessionCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                            {sessionCount} içerik
                          </span>
                        )}
                        {tier.includes_qa && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            <MessageCircle className="w-2.5 h-2.5" />
                            Soru-Cevap
                          </span>
                        )}
                        {isEnrolled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            Satın alındı
                          </span>
                        )}
                        {isInCart(tier.id) && !isEnrolled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            Sepette
                          </span>
                        )}
                        {isClosed && !isEnrolled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-600 text-neutral-500">
                            Kayıt kapalı
                          </span>
                        )}
                      </div>

                      {(tier.session_labels?.length ?? 0) > 0 && isSelected && (
                        <ul className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-0.5">
                          {tier.session_labels!.map((labelText, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5"
                            >
                              <span className="text-[#990000] shrink-0">•</span>
                              {labelText}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {(course.duration || course.level) && (
          <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-700 pt-3">
            {course.duration && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Süre</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {course.duration}
                </span>
              </div>
            )}
            {course.level && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Seviye</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {course.level}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="hidden lg:block pt-1">{actionButtons}</div>

        {enrolledTierIds.length > 0 && (
          <p className="text-xs text-center text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
            <Check className="w-3 h-3" />
            {enrolledTierIds.length} paket satın alındı
          </p>
        )}
      </div>
    </>
  );
}
