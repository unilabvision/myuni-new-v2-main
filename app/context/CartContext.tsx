'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string;
  slug: string;
  type: 'course' | 'product' | 'package' | 'tier';
  earlyBirdPrice?: number | null;
  earlyBirdDeadline?: string | null;
  /** tier satışında ana kurs ID */
  courseId?: string;
  /** tier satışında paket ID */
  tierId?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'myuni_cart';

function getActivePrice(item: CartItem): number {
  if (item.earlyBirdPrice && item.earlyBirdDeadline) {
    const now = new Date();
    const deadline = new Date(item.earlyBirdDeadline);
    if (now < deadline) return item.earlyBirdPrice;
  }
  return item.price;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsDrawerOpen(true);
  }, []);

  const addItems = useCallback((newItems: CartItem[]) => {
    if (newItems.length === 0) return;
    setItems(prev => {
      const existing = new Set(prev.map((i) => i.id));
      const toAdd = newItems.filter((i) => !existing.has(i.id));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });
    setIsDrawerOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((id: string) => {
    return items.some(i => i.id === id);
  }, [items]);

  const totalItems = items.length;

  const totalPrice = items.reduce((sum, item) => sum + getActivePrice(item), 0);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      addItems,
      removeItem,
      clearCart,
      isInCart,
      totalItems,
      totalPrice,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export { getActivePrice };
