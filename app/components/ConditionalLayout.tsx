'use client';

import { usePathname } from 'next/navigation';
import Header from "./header/Header";
import Footer from "./Footer";
import BackToTop from "./BackToTop";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export default function ConditionalLayout({ children, locale }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  const isAdminPage = 
    pathname?.includes(`/${locale}/dashboards/signup`) ||
    pathname?.includes(`/${locale}/dashboards/login`) ||
    pathname?.includes(`/${locale}/dashboards`);
    
  const isWatchPage = pathname?.includes(`/${locale}/watch/`);

  const shouldShowFooter = !isAdminPage && !isWatchPage;

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Header locale={locale} />}
      <div className={`flex-grow ${isAdminPage ? '' : 'mt-[75px]'}`}>
        {children}
      </div>
      {shouldShowFooter && <Footer locale={locale} />}
      {!isAdminPage && <BackToTop />}
    </div>
  );
}