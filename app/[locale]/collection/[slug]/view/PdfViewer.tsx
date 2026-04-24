'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Next.js (App Router) ile ilgili olası worker sorunlarını aşmak için standart tanımlama
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScrollUpdate = useCallback(() => {
    if (!containerRef.current) return;
    
    // Toolbarı göster
    setIsToolbarVisible(true);
    // Timeout logic'i aşağıda tekrar ediliyor, burada sadece scroll page update
    
    let closestPage = pageNumber;
    let minDistance = Infinity;

    pageRefs.current.forEach((page, index) => {
      if (!page) return;
      const rect = page.getBoundingClientRect();
      
      // Rect.top bize ekranın en üstünden (top) olan pozisyonu verir.
      // Ekranda merkeze (veya biraz üstüne) en yakın olanı bulalım. (örneğin ekranın üstünden 200px altı)
      const distance = Math.abs(rect.top - 200); 
      if (distance < minDistance) {
        minDistance = distance;
        closestPage = index + 1;
      }
    });

    if (closestPage !== pageNumber) {
      setPageNumber(closestPage);
    }
  }, [pageNumber]);

  // Mouse hareketlerine göre toolbar'ı göster/gizle
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleUserInteraction = () => {
      setIsToolbarVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsToolbarVisible(false);
      }, 2500);
    };

    const handleScrollWrapper = () => {
      handleUserInteraction();
      handleScrollUpdate();
    };

    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('scroll', handleScrollWrapper, { passive: true });
    // İlk açılışta zamanlayıcıyı başlat
    timeout = setTimeout(() => setIsToolbarVisible(false), 2500);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('scroll', handleScrollWrapper);
    };
  }, [handleScrollUpdate]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  }

  const scrollToPage = (p: number) => {
    const pageNode = pageRefs.current[p - 1];
    if (pageNode) {
      // Doğrudan sayfaya smooth scroll yap
      pageNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPageNumber(p);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 w-full relative bg-gray-100 dark:bg-neutral-950 overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 select-none" 
      onContextMenu={(e) => e.preventDefault()} // Etrafındaki sağ tık işlemini de engelle
    >
      {/* Autohide Toolbar */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4 sm:gap-6 z-50 border border-gray-200/50 dark:border-neutral-700/50 transition-all duration-500 ease-in-out ${
          isToolbarVisible 
            ? 'opacity-100 transform translate-y-0' 
            : 'opacity-0 transform translate-y-10 pointer-events-none'
        }`}
      >
          <button onClick={() => scrollToPage(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
            {pageNumber} / {numPages || '-'}
          </span>
          <button onClick={() => scrollToPage(Math.min(numPages || 1, pageNumber + 1))} disabled={pageNumber >= (numPages || 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full disabled:opacity-50 text-gray-700 dark:text-gray-300 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-neutral-600 mx-2" />
          
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full text-gray-700 dark:text-gray-300 transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium w-12 text-center text-gray-700 dark:text-gray-300">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full text-gray-700 dark:text-gray-300 transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
      </div>

      <div className="flex flex-col items-center w-full pb-24">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center w-full"
          loading={
            <div className="w-[800px] max-w-full h-[1000px] flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-sm text-neutral-500">Yükleniyor...</span>
            </div>
          }
          error={
            <div className="w-[800px] max-w-full h-[1000px] flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-red-500 border border-neutral-200 dark:border-neutral-800 shadow-xl">
                <AlertCircle className="w-8 h-8 mb-2" />
                <span className="text-sm">Döküman yüklenemedi. Format desteklenmiyor olabilir.</span>
            </div>
          }
        >
          {numPages && Array.from(new Array(numPages), (el, index) => {
             const pageNum = index + 1;
             return (
               <div 
                 key={`page_${pageNum}`} 
                 data-page-number={pageNum}
                 ref={(node) => {
                    pageRefs.current[index] = node;
                 }}
                 className="shadow-2xl mb-8 flex justify-center w-full min-h-[800px]"
                 style={{ contentVisibility: 'auto', containIntrinsicSize: '800px 1131px' }} // Tarayıcıyı şoka sokan hızlandırma! Görünmeyen sayfaların render'ını iptal eder.
               >
                 <Page 
                   pageNumber={pageNum} 
                   scale={scale} 
                   renderTextLayer={false} 
                   renderAnnotationLayer={false}
                   className="bg-white pointer-events-none" // Kanvasın üzerindeki tüm fare etkileşimlerini iptal eder (ekstra güvenlik)
                 />
               </div>
             );
          })}
        </Document>
      </div>
    </div>
  );
}
