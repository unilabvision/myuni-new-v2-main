'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface CartIconButtonProps {
  locale: string;
}

export default function CartIconButton({ locale: _locale }: CartIconButtonProps) {
  const { totalItems, openDrawer } = useCart();

  return (
    <button
      onClick={openDrawer}
      aria-label="Sepeti aç"
      className="relative flex items-center justify-center w-9 h-9 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
    >
      <ShoppingCart size={18} />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-[#990000] text-white text-[9px] font-bold leading-none">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}
