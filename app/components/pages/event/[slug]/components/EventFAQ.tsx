"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';

interface EventFAQTexts {
  faqTitle?: string;
  [key: string]: string | undefined;
}

interface EventFAQProps {
  texts?: EventFAQTexts;
}

const EventFAQ: React.FC<EventFAQProps> = ({ 
  texts = {
    faqTitle: "Sıkça Sorulan Sorular"
  }
}) => {
  const [openFAQ, setOpenFAQ] = useState<{ [key: number]: boolean }>({ 0: true });

  const toggleFAQ = (index: number) => {
    setOpenFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // İletişim sayfasına yönlendirme fonksiyonu
  const handleContactRedirect = () => {
    window.location.href = '/tr/iletisim';
  };

  // Etkinlik odaklı FAQ listesi
  const faqs = [
    {
      question: "Etkinliklere katılım ücretsiz mi?",
      answer: "Etkinliklerimizin çoğu ücretsizdir. Ücretli etkinlikler için fiyat bilgisi etkinlik sayfasında belirtilir."
    },
    {
      question: "Etkinlik sonrası sertifika alabilir miyim?",
      answer: "Evet, etkinliği başarıyla tamamladığınızda dijital katılım sertifikası alabilirsiniz. Sertifika veri tabanımızda güvence altına alınır."
    },
    {
      question: "Online etkinliklere nasıl katılırım?",
      answer: "Kayıt olduktan sonra etkinlik linkini email ile alacaksınız. Etkinlik saatinde linke tıklayarak katılabilirsiniz."
    },
    {
      question: "Etkinlik iptal olursa ne olur?",
      answer: "Etkinlik iptal durumunda tüm katılımcılar email ile bilgilendirilir. Ücretli etkinlikler için tam iade yapılır."
    },
    {
      question: "Etkinlik kaydı nasıl yapılır?",
      answer: "Çoğu etkinliğimiz kayda alınır ve sonrasında izleyebilirsiniz. Kayıt linki etkinlik sonrası paylaşılır."
    },
    {
      question: "Konuşmacılar ile iletişim kurabilir miyim?",
      answer: "Evet, etkinlik sonrası konuşmacılarımızla iletişim kurma fırsatınız olur. Networking oturumlarında doğrudan soru sorabilirsiniz."
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-left">
        <h2 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {texts.faqTitle}
        </h2>
        <div className="w-16 h-px bg-[#990000] mb-6"></div>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Etkinliklerimiz hakkında aklınıza takılan tüm soruları burada bulabilirsiniz. Bulamadığınız bir şey varsa bizimle iletişime geçin.
        </p>
      </div>

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
            Sorunuz burada yok mu?
          </h3>
          <div className="w-16 h-px bg-[#990000] mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-2xl leading-relaxed">
            Etkinliklerimiz hakkında merak ettiğiniz herhangi bir konu için bizimle iletişime geçebilirsiniz. 
            Destek ekibimiz size yardımcı olmaktan mutluluk duyar.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleContactRedirect}
            className="flex items-center justify-center space-x-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-6 py-3 rounded-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Destek</span>
          </button>
          
          <button 
            onClick={handleContactRedirect}
            className="flex items-center justify-center space-x-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 px-6 py-3 rounded-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Soru Sor</span>
          </button>
        </div>
        
        {/* Support Stats */}
        <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-left">
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              &lt; 15dk
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Ortalama Yanıt Süresi
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              7/24
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Kesintisiz Destek
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              98%
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Memnuniyet Oranı
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFAQ;