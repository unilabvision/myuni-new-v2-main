'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import { useAuthUiReady } from './useAuthUiReady';
import { useSiteApplicationNavForms } from './useSiteApplicationNavForms';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import LanguageSwitcher from '../LanguageSwitcher';
import { getUnilabBlogPostBySlug, getUnilabBlogPostAlternateSlug } from '@/app/services/unilabBlogService';
import CartIconButton from '../cart/CartIconButton';

interface HeaderProps {
  primary?: string;
  locale: string;
}

type SupportedLocale = 'tr' | 'en';

export default function Header({ primary = '#a90013', locale }: HeaderProps) {
  const pathname = usePathname();
  const { isSignedIn, authReady } = useAuthUiReady();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/myuni-logo.png'); // Default logo for SSR
  const [blogPostAlternateSlug, setBlogPostAlternateSlug] = useState<string | null>(null);
  const siteForms = useSiteApplicationNavForms(locale);

  // Determine if the current path is under /tr/watch/ or /en/watch/
  const isWatchPage = pathname.startsWith(`/${locale}/watch/`);

  // Handle theme detection and logo update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const isDark =
        savedTheme === 'dark' ||
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
      setLogoSrc(isDark ? '/myuni-logo-dark.png' : '/myuni-logo.png');
    }
  }, []);


  // Handle scroll effect with debounce
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolled(window.scrollY > 20), 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  // Check if current page is a blog post and get alternate slug
  useEffect(() => {
    const checkBlogPostAlternate = async () => {
      try {
        const segments = pathname.split('/');
        const currentLocale = segments[1] as SupportedLocale;
        const isBlogPost = segments.length >= 4 && segments[2] === 'blog' && segments[3];

        if (isBlogPost) {
          const slug = segments[3];
          const currentPost = await getUnilabBlogPostBySlug(slug, currentLocale);

          if (currentPost) {
            const targetLocale = currentLocale === 'tr' ? 'en' : 'tr';
            const alternateSlug = await getUnilabBlogPostAlternateSlug(currentPost.id, targetLocale);
            setBlogPostAlternateSlug(alternateSlug);
          } else {
            setBlogPostAlternateSlug(null);
          }
        } else {
          setBlogPostAlternateSlug(null);
        }
      } catch (error) {
        console.error('Error checking blog post alternate:', error);
        setBlogPostAlternateSlug(null);
      }
    };

    checkBlogPostAlternate();
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  // Helper function to update theme and logo
  const updateTheme = (isDark: boolean) => {
    setLogoSrc(isDark ? '/myuni-logo-dark.png' : '/myuni-logo.png');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 min-h-[72px] border-b backdrop-blur-md transition-[background-color,box-shadow] duration-300
        ${isScrolled ? 'bg-white/95 dark:bg-neutral-900/95 shadow-sm' : 'bg-white/90 dark:bg-neutral-900/85'}
        border-b border-neutral-200 dark:border-neutral-800`}
      style={{ '--primary': primary } as React.CSSProperties}
    >
      {/* Campaign banner moved to LocaleLayout for independence from header */}
      <div
        className={`mx-auto flex min-h-[71px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8
          ${isWatchPage ? 'max-w-none' : 'max-w-[1600px]'}`}
      >
        {/* Logo */}
        <Link href={`/${locale}`} prefetch className="flex shrink-0 items-center transition-all duration-300">
          <Image
            src={logoSrc}
            alt="UNILAB Vision"
            width={150}
            height={40}
            sizes="(max-width: 640px) 96px, 120px"
            className="h-6 w-auto sm:h-8"
            priority
          />
        </Link>

        {/* Desktop Navigation and Actions */}
        <div className="flex min-w-0 items-center">
          <DesktopNav locale={locale} siteForms={siteForms} />
          <div className="hidden 2xl:ml-6 2xl:flex 2xl:items-center 2xl:gap-3">
            <SearchBar locale={locale} />
            <LanguageSwitcher blogPostAlternateSlug={blogPostAlternateSlug} />
            <ThemeToggle
              isDarkMode={logoSrc === '/myuni-logo-dark.png'}
              setIsDarkMode={updateTheme}
            />
            <CartIconButton />
            
            {/* Auth Section — only after mount + Clerk loaded to avoid hydration mismatch */}
            {authReady ? (
              <>
                {isSignedIn ? (
                  <div className="flex items-center justify-center space-x-3">
                    <Link
                      href={`/${locale}/dashboard`}
                      className="bg-[#990000] hover:bg-[#770000] text-white px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md flex items-center"
                    >
                      {locale === 'tr' ? 'Panelim' : 'Dashboard'}
                    </Link>
                    <div className="flex items-center justify-center">
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "w-8 h-8 flex items-center justify-center",
                            userButtonPopoverCard: "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
                            userButtonPopoverActionButton: "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          }
                        }}
                        userProfileProps={{
                          appearance: {
                            elements: {
                              rootBox: "bg-white dark:bg-neutral-900",
                              card: "bg-white dark:bg-neutral-900"
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <Link
                    href={locale === 'tr' ? '/tr/login' : '/en/login'}
                    className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-200 border-0 rounded-md flex items-center justify-center"
                  >
                    {locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="flex items-center gap-0 sm:gap-1 2xl:hidden">
            <div className="flex h-10 w-10 items-center justify-center">
              <LanguageSwitcher mobile blogPostAlternateSlug={blogPostAlternateSlug} />
            </div>
            <ThemeToggle
              isDarkMode={logoSrc === '/myuni-logo-dark.png'}
              setIsDarkMode={updateTheme}
            />
            <CartIconButton />
            
            {/* Mobile Auth */}
            {authReady ? (
              isSignedIn && (
                <div className="flex h-10 w-10 items-center justify-center">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-7 h-7 flex items-center justify-center",
                        userButtonPopoverCard: "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                      }
                    }}
                  />
                </div>
              )
            ) : (
              <div className="flex h-10 w-10 items-center justify-center">
                <div className="w-7 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
              </div>
            )}
            
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              onClick={toggleMobileMenu}
              aria-label={locale === 'tr' ? 'Menüyü aç/kapat' : 'Toggle menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <MobileNav 
          toggleMobileMenu={toggleMobileMenu} 
          locale={locale}
          siteForms={siteForms}
        />
      )}
    </header>
  );
}
