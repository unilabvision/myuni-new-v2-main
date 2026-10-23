'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartIconButton() {
  const { totalItems, openDrawer } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={openDrawer}
      aria-label="Sepeti aç"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      <ShoppingCart size={18} />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-[#990000] text-white text-[9px] font-bold leading-none">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}
