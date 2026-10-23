// app/components
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Instagram, Mail } from 'lucide-react';
import XIcon from './XIcon';

interface FooterProps {
  locale: string;
}

const Footer = ({ locale }: FooterProps) => {
  // Language-based content
  const content = {
    tr: {
      description: "MyUNI, yapay zeka destekli, yenilikçi bir eğitim platformudur. Bireylere ve kurumlara yönelik dönüştürücü öğrenme deneyimleri sunar. Disiplinler arası yaklaşımı, en son teknolojileri ve yapay zeka destekli altyapısı sayesinde hem bireysel gelişim hem de kurumsal eğitim alanında yüksek etkili çözümler sunuyoruz.",
      copyright: `© ${new Date().getFullYear()} MyUNI. Tüm hakları saklıdır.`,
      privacyPolicy: "Gizlilik Politikası",
      termsOfService: "Kullanım Koşulları",
      mainLinks: [
        {
          title: 'MyUNI',
          items: [
            { label: 'Hakkımızda', href: `/${locale}/hakkimizda` },
            { label: 'Gizlilik Politikası', href: `/${locale}/gizlilik` },
            { label: 'Kullanım Koşulları', href: `/${locale}/sartlar-ve-kosullar` },
            { label: 'İptal ve İade Politikası', href: `/${locale}/iptal-iade` },
          ],
        },
        {
          title: 'Eğitim',
          items: [
            { label: 'Kurslar', href: `/${locale}/kurs` },
            { label: 'Etkinlikler', href: `/${locale}/etkinlik` },
            { label: 'Sertifikalar', href: 'https://certificates.myunilab.net' },
          ],
        },
        {
          title: 'Destek',
          items: [
            { label: 'Sık Sorulan Sorular', href: `/${locale}/sss` },
            { label: 'İletişim', href: `/${locale}/iletisim` },
          ],
        },
      ],
    },
    en: {
      description: "MyUNI is an AI-powered, innovative educational platform. It offers transformative learning experiences for individuals and institutions. Through our interdisciplinary approach, latest technologies, and AI-driven infrastructure, we provide highly effective solutions for both personal development and corporate education.",
      copyright: `© ${new Date().getFullYear()} MyUNI. All rights reserved.`,
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      mainLinks: [
        {
          title: 'MyUNI',
          items: [
            { label: 'About Us', href: `/${locale}/about` },
            { label: 'Privacy Policy', href: `/${locale}/privacy` },
            { label: 'Terms of Service', href: `/${locale}/terms` },
            { label: 'Cancellation & Refund', href: `/${locale}/iptal-iade` },
          ],
        },
        {
          title: 'Education',
          items: [
            { label: 'Courses', href: `/${locale}/course` },
            { label: 'Events', href: `/${locale}/event` },
            { label: 'Certificates', href: 'https://certificates.myunilab.net' },
          ],
        },
        {
          title: 'Support',
          items: [
            { label: 'FAQ', href: `/${locale}/sss` },
            { label: 'Contact', href: `/${locale}/contact` },
          ],
        },
      ],
    },
  };

  // Safely retrieve content (fall back to Turkish if locale is unsupported)
  const t = locale in content ? content[locale as keyof typeof content] : content.tr;

  // Social media links with locale-based handles
  const socialLinks = [
    { icon: Mail, href: 'mailto:info@myunilab.net', label: 'Email' },
    {
      icon: Instagram,
      href: locale === 'tr' ? 'https://instagram.com/myuniturkiye' : 'https://instagram.com/myuniturkiye',
      label: 'Instagram',
    },
    {
      icon: Linkedin,
      href: locale === 'tr' ? 'https://linkedin.com/company/myuniturkiye' : 'https://linkedin.com/company/myuniturkiye',
      label: 'LinkedIn',
    },
    {
      icon: XIcon,
      href: locale === 'tr' ? 'https://x.com/myuniturkiye' : 'https://x.com/myuniturkiye',
      label: 'X',
    },
  ];

  return (
    <footer className="bg-black px-4 py-12 text-neutral-300 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-12">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-2 lg:pr-6">
            <Link href={`/${locale}`} className="inline-flex min-h-11 items-center">
              <Image
                src="/myuni-logo-dark.png"
                alt="MyUNI"
                width={180}
                height={60}
                sizes="(max-width: 640px) 140px, 160px"
                className="h-9 w-auto sm:h-10"
              />
            </Link>
            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-400 sm:text-base">
              {t.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition-colors duration-300 hover:border-[#a90013] hover:text-[#e08b94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e08b94]"
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          {t.mainLinks.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-neutral-100 sm:mb-4">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-10 items-center text-sm leading-5 text-neutral-400 transition-colors duration-200 hover:text-[#e08b94] focus-visible:outline-none focus-visible:text-[#e08b94]"
                      {...(item.href.startsWith('http') && {
                        target: '_blank',
                        rel: 'noopener noreferrer'
                      })}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-10 flex justify-start border-t border-neutral-800 pt-8 sm:mt-12 lg:justify-end">
          <div className="relative h-12 w-full max-w-80 overflow-hidden rounded-md bg-transparent sm:h-14 sm:max-w-96">
            <Image
              src="/iyzico_dark.jpg"
              alt="iyzico payment methods"
              fill
              sizes="(max-width: 640px) 320px, 384px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-neutral-800 pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-8">
              <p className="text-left text-sm leading-6 text-neutral-500">
                {t.copyright}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
