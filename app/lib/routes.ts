// app/lib/routes.ts

// Her sayfa için çeviriler
// app/lib/routes.ts - Kontrol edilmesi gereken dosya
export const pageRoutes = {
  about: {
    tr: 'hakkimizda',
    en: 'about'
  },
  kurs: {
    tr: 'kurs',
    en: 'course'
  },
  deneme: {
    tr: 'deneme',
    en: 'deneme'
  },
  projects: {
    tr: 'projelerimiz', 
    en: 'projects'
  },
  courses: {
    tr: 'kurs',
    en: 'course'
  },
  event: {
    tr: 'etkinlik',
    en: 'event'
  },
  campaigns: {
    tr: 'kampanyalar',
    en: 'campaigns'
  },
  blog: {
    tr: 'blog',
    en: 'blog'
  },
  careers: {
    tr: 'kariyer',
    en: 'career'
  },
  contact: {
    tr: 'iletisim',
    en: 'contact'
  },
  terms: {
    tr: 'sartlar-ve-kosullar',
    en: 'terms'
  },
  privacy: {
    tr: 'gizlilik',
    en: 'privacy'
  },
  newsletter: {
    tr: 'bultenimiz',
    en: 'newsletter'
  },
  egitmen: {
    tr: 'egitmen-ol',
    en: 'egitmen-ol'
  },
   kulup: {
    tr: 'kulup',
    en: 'kulup'
  }
};



// Blog yazıları için dil eşleştirmeleri - slug tabanlı
// NOT: Bu eşleştirmeler, content.ts'deki blog yazılarının id ve slug değerleriyle aynı olmalıdır
export const blogPostEquivalents: Record<string, { tr: string; en: string }> = {
  'ai-2024-1': {
    tr: '2024-yapay-zeka-trendleri',
    en: 'ai-trends-2024',
  },
  'web-performance-2': {
    tr: 'web-performansini-iyilestirme-yollari',
    en: 'ways-to-improve-web-performance',
  },
  'cloud-native-3': {
    tr: 'cloud-native-mimariye-gecis',
    en: 'transitioning-to-cloud-native',
  },
  'react-patterns-4': {
    tr: 'react-tasarim-desenleri',
    en: 'react-design-patterns',
  },
  'mobile-ux-5': {
    tr: 'mobil-ux-tasariminda-kullanici-odakli-yaklasimlar',
    en: 'user-centric-approaches-mobile-ux',
  },
  'data-privacy-6': {
    tr: 'veri-gizliligi-kvkk-rehberi',
    en: 'data-privacy-gdpr-guide',
  },
  'agile-teams-7': {
    tr: 'uzaktan-calisan-cevik-ekipler',
    en: 'managing-remote-agile-teams',
  },
  'cybersecurity-8': {
    tr: '2024-siber-guvenlik-tehditleri',
    en: '2024-cybersecurity-threats',
  },
};

// URL'den sayfa adını almak için (örn: /tr/hakkimizda -> about)
export function getPageFromSlug(locale: string, slug: string): string | null {
  for (const [page, translations] of Object.entries(pageRoutes)) {
    if (translations[locale as keyof typeof translations] === slug) {
      return page;
    }
  }
  return null;
}

// Blog yazısının ID'sini slug'dan bulmak için
export function getBlogPostIdFromSlug(slug: string, locale: string): string | null {
  for (const [postId, translations] of Object.entries(blogPostEquivalents)) {
    if (translations[locale as keyof typeof translations] === slug) {
      return postId;
    }
  }
  return null;
}

// Blog yazısının diğer dildeki karşılığını bulmak için
export function getBlogPostSlugForLocale(slug: string, currentLocale: string, targetLocale: string): string | null {
  // Önce mevcut yazının ID'sini bul
  const postId = getBlogPostIdFromSlug(slug, currentLocale);
  
  if (!postId) return null;
  
  // ID'den hedef dildeki slug'ı döndür
  return blogPostEquivalents[postId][targetLocale as keyof typeof blogPostEquivalents[typeof postId]];
}

// Alternatif dil URL'si oluşturmak için (örn: /tr/hakkimizda -> /en/about)
export function getAlternateLanguagePath(currentPath: string, currentLocale: string, targetLocale: string): string {
  // Yolu parçalara ayırıyoruz (örn: /tr/hakkimizda -> ['', 'tr', 'hakkimizda'])
  const pathParts = currentPath.split('/');
  
  // Eğer path geçerli bir format değilse ana sayfaya yönlendir
  if (pathParts.length < 3) {
    return `/${targetLocale}`;
  }
  
  const currentSlug = pathParts[2];
  
  // Blog yazısı durumunu kontrol et (örn: /tr/blog/yazinin-basligi)
  if (currentSlug === 'blog' && pathParts.length > 3) {
    const blogPostSlug = pathParts[3];
    const targetBlogPostSlug = getBlogPostSlugForLocale(blogPostSlug, currentLocale, targetLocale);
    
    // Eğer karşılık bulunamazsa, blog ana sayfasına yönlendir
    if (!targetBlogPostSlug) {
      return `/${targetLocale}/blog`;
    }
    
    return `/${targetLocale}/blog/${targetBlogPostSlug}`;
  }
  
  // Geçerli slug'dan sayfa adını bul
  const pageName = getPageFromSlug(currentLocale, currentSlug);
  
  // Sayfa adı bulunamadıysa, orijinal slug'ı kullan
  if (!pageName) {
    return `/${targetLocale}/${currentSlug}`;
  }
  
  // Hedef dilde karşılık gelen slug'ı bul
  const targetSlug = pageRoutes[pageName as keyof typeof pageRoutes]?.[targetLocale as 'tr' | 'en'] || currentSlug;
  
  // Alt sayfaları da dahil ederek yeni URL oluştur
  const restOfPath = pathParts.slice(3).join('/');
  return `/${targetLocale}/${targetSlug}${restOfPath ? `/${restOfPath}` : ''}`;
}