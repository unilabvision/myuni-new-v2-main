'use client';

import React, { useState } from 'react';
import { ChevronDown, Users, Briefcase, Calendar, Rocket } from 'lucide-react';

// Define a union type for valid locale values
type Locale = 'tr' | 'en';

interface FAQSectionProps {
  locale: string; // Accept string but validate internally
}

interface FAQItem {
  id: string;
  icon: React.ReactNode;
  question: string;
  answer: string;
}

// Type guard to check if a string is a valid locale
function isValidLocale(locale: string): locale is Locale {
  return locale === 'tr' || locale === 'en';
}

// Helper function to get a safe locale
function getSafeLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : 'tr';
}

function getFAQContent(locale: Locale): {
  title: string;
  subtitle: string;
  faqs: FAQItem[];
} {
  const content: Record<Locale, { title: string; subtitle: string; faqs: FAQItem[] }> = {
    tr: {
      title: 'Sıkça Sorulan Sorular',
      subtitle: 'UNILAB Vision hakkında merak edilen konulara yanıtlar bulabilirsiniz.',
      faqs: [
        {
          id: 'what-is-unilab',
          icon: <Rocket className="w-5 h-5" strokeWidth={1.5} />,
          question: 'UNILAB Vision nedir ve ne yapar?',
          answer:
            'UNILAB Vision, farklı disiplinlerden gelen yetenekleri bir araya getiren bir platformdur. Mühendislerden sanatçılara, bilim insanlarından tasarımcılara kadar çeşitli alanlardan gelen kişileri bir araya getirerek, sürdürülebilirlik, teknoloji, sanat, eğitim ve daha birçok alanda çeşitli projeler geliştirir. UNILAB, her fikrin değerli olduğu bir ortam sunarak ekiplerin kendi projelerini oluşturmasını ve birlikte geliştirmesini teşvik eder.',
        },
        {
          id: 'how-to-join',
          icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
          question: 'UNILAB Vision\'a nasıl katılabilirim?',
          answer:
            'UNILAB Vision, farklı disiplinlerden gelen yetenekli bireyleri bir araya getiren dinamik bir platformdur. UNILAB Vision olarak belirli dönemlerde hem websitemiz hem sosyal medya hesaplarımız hem de emailler üzerinden duyurular yapmaktayız.',
        },
        {
          id: 'mission',
          icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} />,
          question: 'UNILAB Vision\'ın misyonu nedir?',
          answer:
            'Misyonumuz, herkes için daha parlak bir geleceği şekillendiren kalıcı bir miras bırakarak ulaşılabilir olanın sınırlarını zorlamaktır. Bizler, bilim, teknoloji ve sanatı harmanlayarak bu vizyonu gerçekleştireceğimize inanıyoruz.',
        },
        {
          id: 'future-goals',
          icon: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
          question: 'UNILAB Vision\'ın gelecek hedefleri nelerdir?',
          answer:
            'UNILAB Vision, gelecekte daha fazla yenilikçi projeye imza atmayı, topluluğunu genişleterek daha fazla yetenekli bireyi bir araya getirmeyi ve dünya üzerinde daha büyük bir olumlu etki yaratmayı hedeflemektedir. Ayrıca uluslararası işbirliklerini artırarak küresel ölçekte sürdürülebilir kalkınmaya katkı sağlamayı amaçlamaktadır. UNILAB Vision\'ın öncelikli hedefi, çeşitli disiplinlerden gelen insanları bir araya getirerek inovasyon ve sürdürülebilir çözümler üretmeye devam etmektir.',
        },
      ],
    },
    en: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to the most commonly asked questions about UNILAB Vision.',
      faqs: [
        {
          id: 'what-is-unilab',
          icon: <Rocket className="w-5 h-5" strokeWidth={1.5} />,
          question: 'What is UNILAB Vision and what does it do?',
          answer:
            'UNILAB Vision is a platform that brings together talents from different disciplines. From engineers to artists, scientists to designers, it unites individuals from various fields to develop diverse projects in sustainability, technology, art, education, and more. UNILAB fosters an environment where every idea is valued, encouraging teams to create and develop projects collaboratively.',
        },
        {
          id: 'how-to-join',
          icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
          question: 'How can I join UNILAB Vision?',
          answer:
            'UNILAB Vision is a dynamic platform that brings together talented individuals from various disciplines. We announce opportunities periodically through our website, social media accounts, and email newsletters.',
        },
        {
          id: 'mission',
          icon: <Briefcase className="w-5 h-5" strokeWidth={1.5} />,
          question: 'What is UNILAB Vision\'s mission?',
          answer:
            'Our mission is to push the boundaries of what is possible, leaving a lasting legacy that shapes a brighter future for everyone. We believe in achieving this vision by blending science, technology, and art.',
        },
        {
          id: 'future-goals',
          icon: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
          question: 'What are UNILAB Vision\'s future goals?',
          answer:
            'UNILAB Vision aims to launch more innovative projects, expand its community by bringing together more talented individuals, and create a greater positive impact worldwide. It also seeks to increase international collaborations to contribute to sustainable development on a global scale. UNILAB Vision\'s primary goal is to continue fostering innovation and sustainable solutions by uniting people from diverse disciplines.',
        },
      ],
    },
  };

  return content[locale] || content.tr;
}

export default function FAQSection({ locale }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  
  // Convert string locale to safe Locale type
  const safeLocale = getSafeLocale(locale);
  const content = getFAQContent(safeLocale);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-neutral-900">
      <div className="container mx-auto">
        <div className="max-w-4xl mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            {content.title}
          </h2>
          <div className="w-16 h-px bg-[#990000] mb-6"></div>
          <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 mb-6 max-w-3xl">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Sol Sütun */}
          <div className="space-y-4">
            {content.faqs.slice(0, Math.ceil(content.faqs.length / 2)).map((faq) => {
              const isOpen = openItems.has(faq.id);

              return (
                <div
                  key={faq.id}
                  className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden transition-all duration-500 ease-in-out hover:shadow-md hover:border-[#990000]/20 dark:hover:border-[#990000]/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/0 to-[#990000]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ease-in-out pointer-events-none"></div>

                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-4 md:p-6 text-left flex items-start justify-between focus:outline-none focus:ring-2 focus:ring-[#990000]/20 focus:ring-inset"
                  >
                    <div className="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-700/50 transition-all duration-500 ease-in-out group-hover:bg-[#990000]/5 flex-shrink-0 mt-1">
                        <div className="text-[#990000] dark:text-white">{faq.icon}</div>
                      </div>
                      <h3 className="text-base md:text-lg font-medium text-neutral-900 dark:text-neutral-100 transition-all duration-500 ease-in-out group-hover:text-[#990000] break-words">
                        {faq.question}
                      </h3>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-all duration-300 ease-in-out flex-shrink-0 ml-2 mt-1 ${
                        isOpen ? 'transform rotate-180 text-[#990000]' : ''
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <div className="px-4 pb-4 pl-11 md:px-6 md:pb-6 md:pl-20 mt-4">
                      <div className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed break-words">
                        {faq.answer}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#990000]/30 transition-all duration-700 ease-in-out ${
                      isOpen ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Sağ Sütun */}
          <div className="space-y-4">
            {content.faqs.slice(Math.ceil(content.faqs.length / 2)).map((faq) => {
              const isOpen = openItems.has(faq.id);

              return (
                <div
                  key={faq.id}
                  className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden transition-all duration-500 ease-in-out hover:shadow-md hover:border-[#990000]/20 dark:hover:border-[#990000]/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/0 to-[#990000]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ease-in-out pointer-events-none"></div>

                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-4 md:p-6 text-left flex items-start justify-between focus:outline-none focus:ring-2 focus:ring-[#990000]/20 focus:ring-inset"
                  >
                    <div className="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-700/50 transition-all duration-500 ease-in-out group-hover:bg-[#990000]/5 flex-shrink-0 mt-1">
                        <div className="text-[#990000] dark:text-white">{faq.icon}</div>
                      </div>
                      <h3 className="text-base md:text-lg font-medium text-neutral-900 dark:text-neutral-100 transition-all duration-500 ease-in-out group-hover:text-[#990000] break-words">
                        {faq.question}
                      </h3>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-all duration-300 ease-in-out flex-shrink-0 ml-2 mt-1 ${
                        isOpen ? 'transform rotate-180 text-[#990000]' : ''
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <div className="px-4 pb-4 pl-11 md:px-6 md:pb-6 md:pl-20">
                      <div className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed break-words">
                        {faq.answer}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#990000]/30 transition-all duration-700 ease-in-out ${
                      isOpen ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}