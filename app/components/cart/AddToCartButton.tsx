'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCart, CartItem } from '../../context/CartContext';

interface AddToCartButtonProps {
  item: CartItem;
  locale?: string;
  variant?: 'default' | 'outline' | 'compact';
  className?: string;
}

const textMap = {
  tr: {
    add: 'Sepete Ekle',
    added: 'Sepette',
    adding: 'Ekleniyor...',
    remove: 'Sepetten Çıkar',
  },
  en: {
    add: 'Add to Cart',
    added: 'In Cart',
    adding: 'Adding...',
    remove: 'Remove from Cart',
  },
};

export default function AddToCartButton({
  item,
  locale,
  variant = 'default',
  className = '',
}: AddToCartButtonProps) {
  const { addItem, removeItem, isInCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Resolve locale automatically from router params if not provided
  const params = useParams();
  const activeLocale = locale || (params?.locale as string) || 'tr';
  
  const text = textMap[activeLocale as keyof typeof textMap] || textMap.tr;
  const inCart = isInCart(item.id);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (adding) return;

    if (inCart) {
      // Toggle logic: Remove from cart if already added
      removeItem(item.id);
      setIsHovered(false);
      return;
    }

    setAdding(true);
    // Micro-delay for UX feedback
    await new Promise(r => setTimeout(r, 400));
    addItem(item);
    setAdding(false);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={adding}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={inCart ? (isHovered ? text.remove : text.added) : text.add}
        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 ${
          inCart
            ? isHovered
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-900 hover:border-neutral-900 dark:hover:border-white'
        } ${className}`}
      >
        {adding ? (
          <Loader2 size={14} className="animate-spin" />
        ) : inCart ? (
          isHovered ? (
            <Trash2 size={14} className="text-red-500 animate-pulse" />
          ) : (
            <Check size={14} />
          )
        ) : (
          <ShoppingCart size={14} />
        )}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handleClick}
        disabled={adding}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
          inCart
            ? isHovered
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:scale-[1.01]'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
            : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-neutral-900 hover:border-neutral-900 dark:hover:border-white'
        } ${className}`}
      >
        {adding ? (
          <Loader2 size={14} className="animate-spin" />
        ) : inCart ? (
          isHovered ? (
            <Trash2 size={14} className="text-red-500 animate-pulse" />
          ) : (
            <Check size={14} />
          )
        ) : (
          <ShoppingCart size={14} />
        )}
        <span>{adding ? text.adding : inCart ? (isHovered ? text.remove : text.added) : text.add}</span>
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={handleClick}
      disabled={adding}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm ${
        inCart
          ? isHovered
            ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md hover:scale-[1.01]'
            : 'bg-green-500 dark:bg-green-600 text-white'
          : adding
          ? 'bg-neutral-700 text-white cursor-wait'
          : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-100 hover:shadow-md active:scale-[0.98]'
      } ${className}`}
    >
      {adding ? (
        <Loader2 size={16} className="animate-spin" />
      ) : inCart ? (
        isHovered ? (
          <Trash2 size={16} className="text-white animate-pulse" />
        ) : (
          <Check size={16} />
        )
      ) : (
        <ShoppingCart size={16} />
      )}
      <span>{adding ? text.adding : inCart ? (isHovered ? text.remove : text.added) : text.add}</span>
    </button>
  );
}
