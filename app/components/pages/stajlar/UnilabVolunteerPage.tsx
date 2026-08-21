'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Handshake,
  MapPin,
  Users,
} from 'lucide-react';
import {
  EVENT_BANNER_ASPECT_CLASS,
  EVENT_BANNER_HEIGHT,
  EVENT_BANNER_WIDTH,
} from '@/lib/events/banner';
import {
  getUnilabApplyPath,
  UNILAB_VOLUNTEER_SLUG,
} from '@/lib/unilabVolunteer';

interface UnilabVolunteerPageProps {
  locale?: string;
}

const FALLBACK_BANNER = '/unilab-vision-banner.png';

type OppMeta = {
  is_active: boolean;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  company_name?: string | null;
  application_deadline?: string | null;
  work_mode?: string | null;
  location?: string | null;
};

function getCopy(locale: string) {
  if (locale === 'en') {
    return {
      back: 'Back to Internships & Career',
      typeLabel: 'Volunteer',
      statusOpen: 'Applications open',
      mode: 'Hybrid / Remote',
      location: 'Remote / Hybrid',
      company: 'UNILAB Vision',
      title: 'Join the UNILAB Vision volunteer team',
      subtitle:
        'UNILAB Vision is a pioneering initiative dedicated to shaping the future through groundbreaking innovations. We harness interdisciplinary collaboration and cutting-edge technology to develop transformative products for a better tomorrow.',
      overviewTitle: 'About UNILAB Vision',
      overview: [
        'UNILAB Vision brings together people from different disciplines to develop projects in sustainability, technology, art, education, and health. It fosters an environment where every idea matters, encouraging teams to create and grow their own projects together.',
        'Its mission is to push the boundaries of what is achievable by blending science, technology, and art, leaving a lasting legacy that shapes a brighter future for everyone.',
        'As a volunteer you join one of the five units below, work on real initiatives with a project-based team, and grow alongside people from very different backgrounds.',
      ],
      statsTitle: 'At a glance',
      stats: [
        { value: '5', label: 'Specialist units' },
        { value: '50K+', label: 'Community reach' },
        { value: 'Global', label: 'Collaboration' },
      ],
      unitsTitle: 'Units you can volunteer for',
      unitsHint:
        'Five specialist units at UNILAB Vision lead pioneering work in science and technology.',
      units: [
        {
          title: 'R&D',
          text: 'An R&D platform that supports innovative ideas and adds value to project development skills.',
        },
        {
          title: 'Software',
          text: 'The team builds its own software, opening doors for new ideas in the software world.',
        },
        {
          title: 'Media',
          text: 'Reaching a wide audience with more than 50,000 followers across social platforms.',
        },
        {
          title: 'Events',
          text: 'Online sessions, webinars, and in-person conferences connecting participants with global experts.',
        },
        {
          title: 'Community',
          text: 'Communities that encourage knowledge sharing and collaboration among young people.',
        },
      ],
      benefitsTitle: 'What you get',
      benefits: [
        {
          title: 'Real projects',
          text: 'Contribute to interdisciplinary initiatives with tangible outcomes.',
        },
        {
          title: 'Interdisciplinary team',
          text: 'Work with engineers, scientists, designers, and artists in one team.',
        },
        {
          title: 'Flexible format',
          text: 'Hybrid and remote-friendly volunteer roles depending on the project.',
        },
      ],
      detailsTitle: 'Opportunity details',
      detailOrg: 'Organization',
      detailType: 'Type',
      detailTypeValue: 'Volunteer team application',
      detailMode: 'Work mode',
      detailModeValue: 'Hybrid / Remote',
      detailStatus: 'Status',
      detailStatusValue: 'Open',
      sidebarTitle: 'Apply now',
      sidebarPrice: 'Free',
      sidebarNote: 'Hosted on MyUNI · UNILAB Vision',
      sidebarCta: 'Go to application form',
      sidebarHint: 'You will continue to the UNILAB Vision team application form.',
      faqTitle: 'Frequently asked questions',
      faqs: [
        {
          q: 'What is UNILAB Vision and what does it do?',
          a: 'UNILAB Vision is a platform that brings together talents from different disciplines. From engineers to artists, scientists to designers, it unites people from various fields to develop projects in sustainability, technology, art, education, and more. It fosters an environment where every idea is valued, encouraging teams to create and develop projects collaboratively.',
        },
        {
          q: 'Is this an internship?',
          a: 'No. This is a volunteer team application. Selected volunteers join project-based teams rather than a formal internship programme.',
        },
        {
          q: 'How can I join UNILAB Vision?',
          a: 'UNILAB Vision announces openings periodically through its website, social media accounts, and email newsletters. You can also apply directly using the form on this page.',
        },
        {
          q: 'What is the mission of UNILAB Vision?',
          a: 'To push the boundaries of what is achievable and leave a lasting legacy that shapes a brighter future for everyone — by blending science, technology, and art.',
        },
        {
          q: 'How do I apply?',
          a: 'Use the application button on this page. You will be taken to the UNILAB Vision team form to submit your details.',
        },
      ],
      mobileCta: 'Apply',
    };
  }

  return {
    back: 'Staj & Kariyer’e dön',
    typeLabel: 'Gönüllü',
    statusOpen: 'Başvuru açık',
    mode: 'Hibrit / Uzaktan',
    location: 'Uzaktan / Hibrit',
    company: 'UNILAB Vision',
    title: 'UNILAB Vision gönüllü ekibine katılın',
    subtitle:
      'UNILAB Vision, çığır açan yeniliklerle geleceği şekillendirmeye adanmış öncü bir girişimdir. Daha iyi bir yarın için dönüştürücü ürünler geliştirmek üzere disiplinler arası işbirliğinin ve en son teknolojinin gücünden yararlanıyoruz.',
    overviewTitle: 'UNILAB Vision hakkında',
    overview: [
      'UNILAB Vision, farklı disiplinlerden gelen kişileri bir araya getirerek sürdürülebilirlik, teknoloji, sanat, eğitim ve sağlık alanlarında projeler geliştirir. Her fikrin değerli olduğu bir ortam sunarak ekiplerin kendi projelerini oluşturmasını ve birlikte geliştirmesini teşvik eder.',
      'Misyonu; bilim, teknoloji ve sanatı harmanlayarak ulaşılabilir olanın sınırlarını zorlamak ve herkes için daha parlak bir geleceği şekillendiren kalıcı bir miras bırakmaktır.',
      'Gönüllü olarak aşağıdaki beş birimden birine katılır, proje bazlı bir ekiple gerçek çalışmalarda yer alır ve çok farklı alanlardan insanlarla birlikte gelişirsiniz.',
    ],
    statsTitle: 'Kısaca',
    stats: [
      { value: '5', label: 'Uzmanlık birimi' },
      { value: '50B+', label: 'Topluluk erişimi' },
      { value: 'Küresel', label: 'İş birliği' },
    ],
    unitsTitle: 'Gönüllü olabileceğiniz birimler',
    unitsHint:
      'UNILAB Vision bünyesindeki 5 uzmanlık birimi, bilim ve teknoloji alanlarında öncü çalışmalar yürütür.',
    units: [
      {
        title: 'Ar-Ge',
        text: 'Yenilikçi fikirleri destekleyerek proje geliştirme becerilerine değer katan Ar-Ge platformu.',
      },
      {
        title: 'Yazılım',
        text: 'Ekip kendi yazılımlarını geliştirir; yazılım dünyasında yenilikçi fikirlere kapı açar.',
      },
      {
        title: 'Medya',
        text: 'Sosyal medya platformlarında toplam 50.000’den fazla takipçiyle geniş bir kitleye ulaşır.',
      },
      {
        title: 'Etkinlik',
        text: 'Online, webinar ve fiziki konferans formatlarında etkinlikler; küresel uzmanlarla etkileşim fırsatı.',
      },
      {
        title: 'Topluluk',
        text: 'Gençler arasında bilgi paylaşımını ve iş birliğini teşvik eden topluluklar.',
      },
    ],
    benefitsTitle: 'Neler sunuyor?',
    benefits: [
      {
        title: 'Gerçek projeler',
        text: 'Somut çıktıları olan disiplinler arası çalışmalara katkı verin.',
      },
      {
        title: 'Disiplinler arası ekip',
        text: 'Mühendis, bilim insanı, tasarımcı ve sanatçılarla aynı ekipte çalışın.',
      },
      {
        title: 'Esnek format',
        text: 'Projeye göre hibrit veya uzaktan gönüllü roller.',
      },
    ],
    detailsTitle: 'Fırsat detayları',
    detailOrg: 'Kurum',
    detailType: 'Tür',
    detailTypeValue: 'Gönüllü ekip başvurusu',
    detailMode: 'Çalışma biçimi',
    detailModeValue: 'Hibrit / Uzaktan',
    detailStatus: 'Durum',
    detailStatusValue: 'Açık',
    sidebarTitle: 'Başvuru',
    sidebarPrice: 'Ücretsiz',
    sidebarNote: 'MyUNI’de yayınlanır · UNILAB Vision',
    sidebarCta: 'Başvuru formuna git',
    sidebarHint: 'UNILAB Vision ekip başvuru formuna yönlendirileceksiniz.',
    faqTitle: 'Sık sorulan sorular',
    faqs: [
      {
        q: 'UNILAB Vision nedir ve ne yapar?',
        a: 'UNILAB Vision, farklı disiplinlerden gelen yetenekleri bir araya getiren bir platformdur. Mühendislerden sanatçılara, bilim insanlarından tasarımcılara kadar çeşitli alanlardan gelen kişileri bir araya getirerek sürdürülebilirlik, teknoloji, sanat ve eğitim gibi birçok alanda projeler geliştirir.',
      },
      {
        q: 'Bu bir staj ilanı mı?',
        a: 'Hayır. Bu bir gönüllü ekip başvurusudur. Seçilen gönüllüler resmi bir staj programı yerine proje bazlı ekiplere katılır.',
      },
      {
        q: 'UNILAB Vision’a nasıl katılabilirim?',
        a: 'UNILAB Vision belirli dönemlerde web sitesi, sosyal medya hesapları ve e-postalar üzerinden duyuru yapar. Ayrıca bu sayfadaki form üzerinden doğrudan başvurabilirsiniz.',
      },
      {
        q: 'UNILAB Vision’ın misyonu nedir?',
        a: 'Bilim, teknoloji ve sanatı harmanlayarak ulaşılabilir olanın sınırlarını zorlamak ve herkes için daha parlak bir geleceği şekillendiren kalıcı bir miras bırakmaktır.',
      },
      {
        q: 'Nasıl başvururum?',
        a: 'Bu sayfadaki başvuru butonunu kullanın. UNILAB Vision ekip başvuru formuna yönlendirilirsiniz.',
      },
    ],
    mobileCta: 'Başvur',
  };
}

export default function UnilabVolunteerPage({
  locale = 'tr',
}: UnilabVolunteerPageProps) {
  const copy = getCopy(locale);
  const listPath =
    locale === 'en' ? `/${locale}/internships` : `/${locale}/stajlar`;
  const applyPath = getUnilabApplyPath(locale);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [opp, setOpp] = useState<OppMeta | null>(null);

  useEffect(() => {
    const slug =
      locale === 'en' ? UNILAB_VOLUNTEER_SLUG.en : UNILAB_VOLUNTEER_SLUG.tr;
    fetch(
      `/api/opportunities/${slug}?locale=${locale}&includeInactive=1`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.opportunity) setOpp(json.opportunity as OppMeta);
      })
      .catch(() => undefined);
  }, [locale]);

  const bannerSrc =
    opp?.banner_url?.trim() ||
    opp?.thumbnail_url?.trim() ||
    FALLBACK_BANNER;
  const isExternalBanner = /^https?:\/\//i.test(bannerSrc);
  const company = opp?.company_name?.trim() || copy.company;
  const isOpen = opp ? Boolean(opp.is_active) : true;
  const deadline = opp?.application_deadline || null;
  const statusLabel = isOpen
    ? copy.statusOpen
    : locale === 'en'
      ? 'Applications closed'
      : 'Başvuru kapalı';
  const statusDetail = isOpen
    ? copy.detailStatusValue
    : locale === 'en'
      ? 'Closed'
      : 'Kapalı';
  const deadlineLabel = deadline
    ? new Date(deadline).toLocaleDateString(
        locale === 'tr' ? 'tr-TR' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 pb-24 lg:pb-0">
      {/* Back nav */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-3 sm:py-4">
          <Link
            href={listPath}
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>{copy.back}</span>
          </Link>
        </div>
      </div>

      {/* Status strip — event-like */}
      <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 lg:gap-6">
              <span className="inline-flex items-center gap-1.5 bg-[#990000]/10 text-[#990000] px-2.5 py-1 rounded-full text-xs font-medium border border-[#990000]/20">
                <Handshake className="w-3.5 h-3.5" />
                {copy.typeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {company}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {copy.mode}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                <Users className="w-4 h-4" />
                {copy.location}
              </span>
              {deadlineLabel && (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {locale === 'en' ? 'Deadline: ' : 'Son başvuru: '}
                  {deadlineLabel}
                </span>
              )}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium w-fit ${
                isOpen
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">
        {/* Hero banner — panel banner_url öncelikli */}
        <div className="mb-8 sm:mb-10">
          <div
            className={`relative w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white flex items-center justify-center ${EVENT_BANNER_ASPECT_CLASS}`}
          >
            <Image
              src={bannerSrc}
              alt={copy.title}
              width={EVENT_BANNER_WIDTH}
              height={EVENT_BANNER_HEIGHT}
              className={
                isExternalBanner
                  ? 'absolute inset-0 h-full w-full object-cover'
                  : 'w-[55%] max-h-[46%] object-contain'
              }
              sizes="(max-width: 1280px) 90vw, 1100px"
              priority
              unoptimized={isExternalBanner}
            />
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
              <span className="inline-flex items-center gap-1.5 bg-neutral-900/85 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                <Building2 className="w-3.5 h-3.5" />
                {company}
              </span>
            </div>
          </div>
        </div>

        {/* Detail cards */}
        <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
            {copy.detailsTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: copy.detailOrg, value: company },
              { label: copy.detailType, value: copy.detailTypeValue },
              { label: copy.detailMode, value: copy.detailModeValue },
              { label: copy.detailStatus, value: statusDetail },
              ...(deadlineLabel
                ? [
                    {
                      label: locale === 'en' ? 'Deadline' : 'Son başvuru',
                      value: deadlineLabel,
                    },
                  ]
                : []),
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8 sm:space-y-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {copy.title}
              </h1>
              <div className="w-16 h-px bg-[#990000] mt-3 mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {copy.subtitle}
              </p>
            </div>

            <section>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {copy.overviewTitle}
              </h2>
              <div className="space-y-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {copy.overview.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6">
                {copy.stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 text-center"
                  >
                    <p className="text-xl sm:text-2xl font-medium text-[#990000]">
                      {s.value}
                    </p>
                    <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {copy.unitsTitle}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {copy.unitsHint}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {copy.units.map((u, i) => (
                  <div
                    key={u.title}
                    className="rounded-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-medium text-[#990000] tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {u.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {u.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                {copy.benefitsTitle}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {copy.benefits.map((b) => (
                  <div
                    key={b.title}
                    className="rounded-sm border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-[#990000] shrink-0" />
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {b.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      {b.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                {copy.faqTitle}
              </h2>
              <div className="space-y-3">
                {copy.faqs.map((faq, i) => {
                  const open = openFaq === i;
                  return (
                    <div
                      key={faq.q}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden bg-white dark:bg-neutral-800"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="w-full flex items-start justify-between gap-3 p-4 text-left"
                      >
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
                            open ? 'rotate-180 text-[#990000]' : ''
                          }`}
                        />
                      </button>
                      {open && (
                        <div className="px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-400">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sticky sidebar CTA */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                  {copy.sidebarTitle}
                </p>
                <p className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                  {copy.sidebarPrice}
                </p>
                <div className="w-12 h-px bg-[#990000] my-4" />
                <div className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400 mb-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 shrink-0" />
                    {company}
                  </div>
                  <div className="flex items-center gap-2">
                    <Handshake className="w-4 h-4 shrink-0" />
                    {copy.detailTypeValue}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {copy.detailModeValue}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mb-4">{copy.sidebarNote}</p>
                {isOpen ? (
                  <>
                    <Link
                      href={applyPath}
                      className="flex items-center justify-center gap-2 w-full bg-[#990000] hover:bg-[#7a0000] text-white text-sm font-medium py-3 px-4 rounded-sm transition-colors"
                    >
                      {copy.sidebarCta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-[11px] text-neutral-500 mt-3 text-center">
                      {copy.sidebarHint}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-center text-amber-700 dark:text-amber-300 font-medium py-2">
                    {statusLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {isOpen && (
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm p-3 safe-area-pb">
        <Link
          href={applyPath}
          className="flex items-center justify-center gap-2 w-full bg-[#990000] hover:bg-[#7a0000] text-white text-sm font-medium py-3 px-4 rounded-sm"
        >
          {copy.mobileCta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      )}
    </div>
  );
}
