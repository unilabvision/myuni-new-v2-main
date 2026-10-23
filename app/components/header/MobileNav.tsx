'use client';

import Link from "next/link";
import MobileSearchBar from './MobileSearchbar';
import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { getNavItems } from './navItems';
import { useAuthUiReady } from './useAuthUiReady';
import type { PublicSiteApplicationNavForm } from '@/app/types/siteApplicationForms';

interface MobileNavProps {
  toggleMobileMenu: () => void;
  locale: string;
  siteForms: PublicSiteApplicationNavForm[];
}

export default function MobileNav({ toggleMobileMenu, locale, siteForms }: MobileNavProps) {
  const { isSignedIn, authReady } = useAuthUiReady();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const items = useMemo(() => getNavItems(locale, siteForms), [locale, siteForms]);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <div
      id="mobile-navigation"
      className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain border-t border-neutral-200 bg-white/[0.98] shadow-xl backdrop-blur-md animate-slideDown dark:border-neutral-800 dark:bg-neutral-900/[0.98] 2xl:hidden"
    >
      <nav className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-6">
        {/* Mobile Search Bar */}
        <div className="mb-3">
          <MobileSearchBar locale={locale} />
        </div>

        {/* Menu Items */}
        {items.map((item) => (
          <div key={item.href} className="relative border-b border-neutral-100 py-1 last:border-0 dark:border-neutral-800">
            {item.children ? (
              <div>
                <button
                  onClick={() => handleDropdownToggle(item.label)}
                  className="flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-left text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-neutral-50 hover:text-primary dark:text-gray-200 dark:hover:bg-neutral-800 dark:hover:text-primary"
                  aria-expanded={openDropdown === item.label}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {openDropdown === item.label && (
                  <div className="mb-2 ml-3 border-l border-gray-200 pl-3 dark:border-gray-700">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex min-h-11 items-center rounded-r-lg px-3 text-sm text-gray-600 transition-colors duration-200 hover:bg-neutral-50 hover:text-primary dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-primary"
                        onClick={toggleMobileMenu}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className="flex min-h-12 items-center rounded-lg px-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-neutral-50 hover:text-primary dark:text-gray-200 dark:hover:bg-neutral-800 dark:hover:text-primary"
                onClick={toggleMobileMenu}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}

        {/* Giriş Yap Butonu - Sadece giriş yapmamış kullanıcılar için */}
        {authReady && !isSignedIn && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={locale === 'tr' ? '/tr/login' : '/en/login'}
              className="block w-full bg-black dark:bg-white text-white dark:text-black px-4 py-3 text-center text-base font-medium transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-200 border-0 rounded-md"
              onClick={toggleMobileMenu}
            >
              {locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
            </Link>
          </div>
        )}

        {/* Kurslarım Butonu - Sadece giriş yapmış kullanıcılar için */}
        {authReady && isSignedIn && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/${locale}/dashboard`}
              className="block w-full bg-[#990000] hover:bg-[#770000] text-white px-4 py-3 text-center text-base font-medium transition-colors duration-200 border-0 rounded-md"
              onClick={toggleMobileMenu}
            >
              {locale === 'tr' ? 'Kurslarım' : 'My Courses'}
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}
