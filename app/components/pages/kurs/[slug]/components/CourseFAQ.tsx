"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';
import { useParams } from 'next/navigation';

interface CourseFAQTexts {
  faqTitle?: string;
  [key: string]: string | undefined;
}

interface CourseFAQProps {
  texts?: CourseFAQTexts;
  hideHeader?: boolean;
}

const CourseFAQ: React.FC<CourseFAQProps> = ({
  texts = {},
  hideHeader = false
}) => {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const [openFAQ, setOpenFAQ] = useState<{ [key: number]: boolean }>({ 0: true });

  const toggleFAQ = (index: number) => {
    setOpenFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleContactRedirect = () => {
    window.location.href = `/${locale}/iletisim`;
  };

  const textsEn = {
    faqTitle: "Frequently Asked Questions",
    description: "You can find all your questions here. If you can't find what you are looking for, contact us.",
    notHereTitle: "Question not here?",
    notHereDesc: "You can contact us about any topic you are curious about. Our support team is happy to help you.",
    supportBtn: "Support",
    askBtn: "Ask a Question",
    avgResponseTime: "Avg. Response Time",
    uninterruptedSupport: "Uninterrupted Support",
    satisfactionRate: "Satisfaction Rate"
  };

  const textsTr = {
    faqTitle: "Sıkça Sorulan Sorular",
    description: "Aklınıza takılan tüm soruları burada bulabilirsiniz. Bulamadığınız bir şey varsa bizimle iletişime geçin.",
    notHereTitle: "Sorunuz burada yok mu?",
    notHereDesc: "Merak ettiğiniz herhangi bir konu hakkında bizimle iletişime geçebilirsiniz. Destek ekibimiz size yardımcı olmaktan mutluluk duyar.",
    supportBtn: "Destek",
    askBtn: "Soru Sor",
    avgResponseTime: "Ortalama Yanıt Süresi",
    uninterruptedSupport: "Kesintisiz Destek",
    satisfactionRate: "Memnuniyet Oranı"
  };

  const currentTexts = locale === 'en' ? textsEn : textsTr;
  const displayTexts = { ...currentTexts, ...texts } as typeof textsTr;

  const faqs = locale === 'en' ? [
    {
      question: "Is there any specific time for the courses?",
      answer: "No, our courses are completely flexible. You can start anytime and progress at your own pace with 24/7 access."
    },
    {
      question: "Will I get a certificate after completing the courses?",
      answer: "Yes, you will receive a valid digital certificate upon successful completion of the course. The certificate is secured in our database."
    },
    {
      question: "Can I get technical support during the training?",
      answer: "Absolutely! You can get help from our 24/7 support team for any technical issues you encounter during the training process."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept credit card, debit card, and digital wallet options."
    },
    {
      question: "How long will I have access after enrolling in the course?",
      answer: "You have lifetime access after enrolling in the course. You will automatically have access to new content when the course is updated."
    },
    {
      question: "Can I communicate with the instructor?",
      answer: "Yes, our instructors are regularly available in our community. You can contact them via email."
    }
  ] : [
    {
      question: "Kursların herhangi bir zamanı var mıdır?",
      answer: "Hayır, kurslarımız tamamen esnek zamanlı olup istediğiniz zaman başlayabilir ve kendi hızınızda ilerleyebilirsiniz. 7/24 erişim imkanı vardır."
    },
    {
      question: "Kursları bitirdikten sonra sertifika alacak mıyım?",
      answer: "Evet, kursu başarıyla tamamladığınızda geçerli bir dijital sertifika alacaksınız. Sertifika veri tabanımızda güvence altına alınır."
    },
    {
      question: "Eğitim sırasında teknik destek alabilir miyim?",
      answer: "Elbette! Eğitim sürecinde karşılaştığınız tüm teknik sorunlar için 7/24 destek ekibimizden yardım alabilirsiniz."
    },
    {
      question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
      answer: "Kredi kartı, banka kartı ve dijital cüzdan seçeneklerini kabul ediyoruz. "
    },
    {
      question: "Kursa kaydolduktan sonra ne kadar süre erişimim olacak?",
      answer: "Kursa kayıt olduktan sonra ömür boyu erişim hakkınız bulunmaktadır. Kurs güncellendiğinde de otomatik olarak yeni içeriklere erişebilirsiniz."
    },
    {
      question: "Eğitmen ile iletişim kurabilir miyim?",
      answer: "Evet, toplululuğumuzda eğitmenlerimiz düzenli olarak bulunur. Mail adresi üzerinden iletişime geçebilirsiniz."
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      {!hideHeader && (
        <div className="mb-16 max-w-4xl text-left">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 dark:text-neutral-100 mb-4 tracking-tight text-left">
            {displayTexts.faqTitle}
          </h2>
          <div className="w-16 h-px bg-[#990000] dark:bg-white mb-8"></div>
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed text-left">
            {displayTexts.description}
          </p>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
            >
              <div className="flex-1 pr-4">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {faq.question}
                </h3>
              </div>
              <div className="flex-shrink-0 ml-4">
                {openFAQ[index] ? (
                  <ChevronUp className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                )}
              </div>
            </button>

            {openFAQ[index] && (
              <div className="px-6 pb-6 border-t border-neutral-200 dark:border-neutral-700">
                <div className="pt-4">
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="p-8 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
        <div className="text-left">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {displayTexts.notHereTitle}
          </h3>
          <div className="w-16 h-px bg-[#990000] mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-2xl leading-relaxed">
            {displayTexts.notHereDesc}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleContactRedirect}
            className="flex items-center justify-center space-x-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-6 py-3 rounded-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{displayTexts.supportBtn}</span>
          </button>

          <button
            onClick={handleContactRedirect}
            className="flex items-center justify-center space-x-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 px-6 py-3 rounded-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{displayTexts.askBtn}</span>
          </button>
        </div>

        {/* Support Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-left">
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              &lt; 15{locale === 'en' ? 'min' : 'dk'}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {displayTexts.avgResponseTime}
            </div>
          </div>

          <div className="text-left">
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              7/24
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {displayTexts.uninterruptedSupport}
            </div>
          </div>

          <div className="text-left">
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              98%
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {displayTexts.satisfactionRate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFAQ;