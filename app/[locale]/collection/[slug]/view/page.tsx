'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full bg-gray-100 dark:bg-neutral-950 flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <span className="text-sm text-neutral-500">PDF Okuyucu Yükleniyor...</span>
    </div>
  )
});

interface ProductBasic {
  id: string;
  title: string;
  slug: string;
  is_free: boolean;
  product_content: string | null;
}

export default function CollectionViewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = use(params);

  const [product, setProduct] = useState<ProductBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Güvenlik Korumaları (Katman 1)
  useEffect(() => {
    // Sağ tık engelleme
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Klavye kısayolları (Ctrl+P, Ctrl+S, F12 vb.) engelleme
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.metaKey && e.altKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 's' || e.key === 'p' || e.key === 'c')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    async function loadAndAuthorize() {
      try {
        setLoading(true);

        // Ürünü çek
        const { data, error: prodError } = await supabase
          .from('myuni_products')
          .select('id, title, slug, is_free, product_content')
          .eq('is_active', true)
          .eq('slug', slug)
          .single();

        if (prodError || !data) { notFound(); return; }
        setProduct(data as ProductBasic);

        // Ücretsizse herkese açık
        if (data.is_free) {
          setAuthorized(true);
          return;
        }

        // Satın alım kontrolü — service role API üzerinden
        const purchaseRes = await fetch(`/api/collection/check-purchase?product_id=${data.id}`);
        const purchaseJson = await purchaseRes.json();

        if (purchaseJson.hasPurchased) {
          setAuthorized(true);
        } else {
          setError(
            locale === 'tr'
              ? 'Bu içeriğe erişmek için önce satın almanız gerekiyor.'
              : 'You need to purchase this product to access its content.'
          );
        }
      } catch (err) {
        console.error(err);
        setError('Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    loadAndAuthorize();
  }, [slug, locale]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erişim Yok</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{error}</p>
        <Link
          href={`/${locale}/collection/${slug}`}
          className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {locale === 'tr' ? 'Ürüne Geri Dön' : 'Back to Product'}
        </Link>
      </div>
    );
  }

  if (!product?.product_content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 px-4 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {locale === 'tr' ? 'İçerik Hazır Değil' : 'Content Not Available'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {locale === 'tr' ? 'Bu ürünün içeriği henüz yüklenmemiştir.' : 'Content for this product has not been uploaded yet.'}
        </p>
        <Link
          href={`/${locale}/collection/${slug}`}
          className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {locale === 'tr' ? 'Ürüne Geri Dön' : 'Back to Product'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Link
          href={`/${locale}/collection/${slug}`}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {locale === 'tr' ? 'Geri' : 'Back'}
        </Link>
        <span className="text-sm font-semibold text-gray-800 dark:text-white truncate flex-1">
          {product.title}
        </span>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
          {locale === 'tr' ? 'İçerik Görüntüleyici' : 'Content Viewer'}
        </span>
      </div>

      {/* PDF Viewer */}
      <PdfViewer url={`/api/collection/pdf-proxy?product_id=${product.id}`} />
    </div>
  );
}
