'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle } from "lucide-react";

interface HeroProps {
  locale?: string;
}

const Hero: React.FC<HeroProps> = ({ locale = 'tr' }) => {
  const content = {
    tr: {
      badge: "🎓 Geleceğinizi şekillendirin!",
      title: "Kariyerinize yeni bir yön verin ve potansiyelinizi keşfedin!",
      description: "İster yeni bir beceri öğrenmek isteyin, ister kariyerinizi geliştirmek, MyUNI'nin sunduğu esnek öğrenme seçenekleriyle hedeflerinize daha hızlı ulaşabilirsiniz.",
      features: [
        {
          title: "MyUNI ile Eğitimde Esneklik:",
          description: "Zaman ve mekân kısıtlamalarına takılmadan, istediğiniz yerden ve istediğiniz zamanda eğitim alabilirsiniz. "
        },
        {
          title: "MyUNI ile sınır tanımayan eğitim:",
          description: "Dünyanın herhangi bir köşesinden, sadece bir internet bağlantısıyla derslerinize kolayca erişebilir ve eğitim yolculuğunuza kesintisiz devam edebilirsiniz. "
        }
      ],
      cta: "Kursları Keşfet",
      ctaLink: "/tr/kurs"
    },
    en: {
      badge: "🎓 Shape your future!",
      title: "Give your career a new direction and discover your potential!",
      description: "MyUNI is a comprehensive education platform prepared for individuals who want to specialize in different fields. Whether you want to learn a new skill or develop your career, you can reach your goals faster with the flexible learning options offered by MyUNI.",
      features: [
        {
          title: "Flexibility in Education with MyUNI:",
          description: "You can receive education from wherever and whenever you want without being stuck with time and place restrictions. You can personalize your learning process by progressing at your own pace and deepen as much as you want."
        },
        {
          title: "Borderless education with MyUNI:",
          description: "From any corner of the world, you can easily access your lessons with just an internet connection and continue your educational journey uninterrupted. Whether at home, traveling or at the office, create opportunities to learn anytime, anywhere."
        }
      ],
      cta: "Explore Courses",
      ctaLink: "/en/courses"
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.tr;

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Image */}
          <div className="order-2 lg:order-1">
            <div className="relative h-[400px] lg:h-[530px] w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg group">
              <Image
                src="/tr/images/myuni-egitim-platformu-4.webp"
                alt="MyUNI Education Platform"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#990000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>

          {/* Right Content */}
          <div className="order-1 lg:order-2 text-left">
            
            {/* Badge */}
            <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
              {currentContent.badge}
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl xl:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
              {currentContent.title}
            </h1>

            {/* Divider */}
            <div className="w-16 h-px bg-[#990000] dark:bg-[#990000] mb-6" />

            {/* Description */}
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl">
              {currentContent.description}
            </p>

            {/* Features List */}
            <div className="space-y-6 mb-8">
              {currentContent.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#990000] dark:text-[#ff4444]" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link href={currentContent.ctaLink} className="inline-block">
              <button className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-2 border-transparent hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-900 dark:hover:border-neutral-100 px-8 py-3 text-sm font-medium transition-all duration-300 focus:outline-none rounded-md shadow-sm flex items-center gap-2">
                {currentContent.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;