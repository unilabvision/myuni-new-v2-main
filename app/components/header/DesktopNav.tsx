'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getNavItems, navLinkClassName } from './navItems';
import { useSiteApplicationNavForms } from './useSiteApplicationNavForms';

interface DesktopNavProps {
  locale: string;
}

export default function DesktopNav({ locale }: DesktopNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const siteForms = useSiteApplicationNavForms(locale);
  const items = useMemo(() => getNavItems(locale, siteForms), [locale, siteForms]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown((current) => (current === label ? null : label));
  };

  const handleMouseEnter = (label: string, hasChildren: boolean) => {
    if (hasChildren) setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      if (!dropdownRef.current?.matches(':hover')) {
        setOpenDropdown(null);
      }
    }, 100);
  };

  return (
    <div ref={dropdownRef}>
      <nav className="hidden lg:flex items-center space-x-10">
        {items.map((item) =>
          item.children ? (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => handleMouseEnter(item.label, true)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => handleDropdownToggle(item.label)}
                className={`flex items-center ${navLinkClassName}`}
                aria-expanded={openDropdown === item.label}
                aria-haspopup="true"
              >
                {item.label}
                <ChevronDown
                  className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                    openDropdown === item.label ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={item.href} href={item.href} className={navLinkClassName}>
              {item.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
