import React from 'react';
import { Code, Lightbulb, Share2, CalendarDays, Users } from 'lucide-react';

interface ServicesSectionProps {
  locale: string;
}

// Her bir hizmet kartı için tip tanımı
interface ServiceItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  highlightedText?: {
    text: string;
    highlight: string;
  };
}

// Gerçek uygulamada burada Supabase'den veri çekilecek
async function getServicesContent(locale: string): Promise<{
  title: string;
  subtitle: string;
  services: ServiceItem[];
}> {
  // Türkçe ve İngilizce içerikleri belirliyoruz
  const services: {
    [key: string]: {
      title: string;
      subtitle: string;
      services: ServiceItem[];
    };
  } = {
    tr: {
      title: "Neler yapıyoruz?",
      subtitle: "UNILAB olarak geleceği şekillendiren çalışmalarımız beş ana başlık altında toplanıyor.",
      services: [
        {
          id: "research",
          icon: <Lightbulb className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Ar-Ge",
          description: "Geleceğe kapılarını açan Ar-Ge platformumuz, yenilikçi fikirleri destekleyerek proje geliştirme becerilerine değer katma imkanı sunuyor."
        },
        {
          id: "software",
          icon: <Code className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Yazılım",
          description: "Ekibimiz olarak kendi yazılımlarımızı geliştiriyoruz. Yazılım dünyasında yenilikçi fikirlere kapılar açıyoruz."
        },
        {
          id: "media",
          icon: <Share2 className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Medya",
          description: "Sosyal medya platformlarımızda totalde 50.000'den fazla takipçiyle geniş bir kitleye ulaşıyoruz."
        },
        {
          id: "events",
          icon: <CalendarDays className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Etkinlik",
          description: "Etkinliklerimiz; online, webinar ve fiziki konferans formatlarında gerçekleşerek her yaştan katılımcıya bilgiye erişim ve küresel uzmanlarla etkileşim fırsatı sunar."
        },
        {
          id: "community",
          icon: <Users className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Topluluk",
          description: "Topluluklar, gençler arasında bilgi paylaşımı ve işbirliğini teşvik ederek, <strong className=\"text-[#990000] font-medium\">UNILAB Vision</strong>'ın bilim ve teknoloji vizyonuna katkı sağlar."
        }
      ]
    },
    en: {
      title: "What do we do?",
      subtitle: "At UNILAB, our future-shaping work is organized under five main categories.",
      services: [
        {
          id: "research",
          icon: <Lightbulb className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "R&D",
          description: "Our R&D platform, which opens its doors to the future, supports innovative ideas, providing opportunities to enhance project development skills."
        },
        {
          id: "software",
          icon: <Code className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Software",
          description: "As a team, we develop our own software. We open doors to innovative ideas in the software world."
        },
        {
          id: "media",
          icon: <Share2 className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Media",
          description: "We reach a wide audience with over 50,000 followers across our social media platforms."
        },
        {
          id: "events",
          icon: <CalendarDays className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Events",
          description: "Our events, held in online, webinar, and in-person conference formats, provide participants of all ages with access to knowledge and opportunities to interact with global experts."
        },
        {
          id: "community",
          icon: <Users className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />,
          title: "Community",
          description: "Our communities foster knowledge sharing and collaboration among young people, contributing to <strong className=\"text-[#990000] font-medium\">UNILAB Vision</strong>'s science and technology vision."
        }
      ]
    }
  };

  return services[locale] || services.tr;
}

export default async function ServicesSection({ locale }: ServicesSectionProps) {
  try {
    const content = await getServicesContent(locale);

    return (
      <section className="py-24 bg-white dark:bg-neutral-900">
        <div className="container mx-auto ">
          <div className="max-w-4xl mb-16">
            <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {content.title}
            </h2>
            <div className="w-16 h-px bg-[#990000] mb-6"></div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 max-w-3xl">
              {content.subtitle} UNILAB Vision, geleceği şekillendirme misyonuyla hareket eden bir platformdur. 
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.services.map((service) => (
              <div 
                key={service.id} 
                className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden transition-all duration-500 ease-in-out hover:shadow-md hover:border-[#990000]/20 dark:hover:border-[#990000]/20"
              >
                {/* Soft hover efekti için gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/0 to-[#990000]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ease-in-out pointer-events-none"></div>
                
                <div className="p-8">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-700/50 mb-6 transition-all duration-500 ease-in-out group-hover:bg-[#990000]/5">
                    {service.icon}
                  </div>
                  
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 transition-all duration-500 ease-in-out group-hover:text-[#990000]">
                    {service.title}
                  </h3>
                  
                  <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    <div dangerouslySetInnerHTML={{ __html: service.description }} />
                  </div>
                </div>
                
                {/* Soft slide-in line effect */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#990000]/30 group-hover:w-full transition-all duration-700 ease-in-out"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Failed to load services content:', error);
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto">
          <p>İçerik yüklenirken bir hata oluştu. Detaylar için konsolu kontrol edin.</p>
        </div>
      </section>
    );
  }
}