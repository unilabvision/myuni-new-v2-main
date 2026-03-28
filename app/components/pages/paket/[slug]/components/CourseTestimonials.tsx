"use client";

import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface CourseTestimonialsTexts {
  testimonialsTitle?: string;
}

interface CourseTestimonialsProps {
  texts?: CourseTestimonialsTexts;
  locale?: string;
}

const CourseTestimonials: React.FC<CourseTestimonialsProps> = ({ texts = {}, locale = 'tr' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const allTestimonials = [
    {
      id: 1,
      name: "Merve Çelik",
      title: "Katılımcımız",
      company: "MyUNI",
      rating: 5,
      comment: "Çok değerli ve faydalı bir eğitimdi; bu yüzden sizlere öncelikle emekleriniz ve yardımlarınız için çok teşekkür ederim. Eğitimde en çok ilgimi çeken konu yapay zeka-destekli multi-omik çalışmaların çeşitli hastalıkların tedavisinde yan etkileri çok büyük bir ölçüde azaltması ve karaciğer hastalarında %50'ye varan iyileşmeyi sağlamasıydı.",
      courseCompleted: "Sağlık Hizmetlerinde Yapay Zeka ve Büyük Veri Webinarı",
      salaryIncrease: null,
      featured: true
    },
    {
      id: 2,
      name: "Hacer Şule Kurtuluş",
      title: "Katılımcımız",
      company: "MyUNI",
      rating: 5,
      comment: "Sağlıkta yapay zekanın ilaç uygulamaları üzerine oldukça faydalı bilgilere ulaştım. Özellikle big data oluşturma ve klinik uygulamalar için faz çalışmaları hakkında detaylı bilgi edindim. Aklımda soru işareti oluşturan etik değerler hakkında da bilgi edindim. Emeğiniz için teşekkürler.",
      courseCompleted: "Sağlık Hizmetlerinde Yapay Zeka ve Büyük Veri Webinarı",
      salaryIncrease: null,
      featured: true
    },
    {
      id: 3,
      name: "Ahmet Kılıç",
      title: "Katılımcımız",
      company: "MyUNI",
      rating: 5,
      comment: "Biyoinformatik hep ilerlemek istediğim bir alandı. Python ile DNA dizi analizi konusunda temel ama sağlam bir giriş yaptım. Kendi başıma da çalışmaya devam edebileceğimi hissettiren bir eğitim oldu.",
      courseCompleted: "Python ile Biyoinformatikte DNA Dizi Analizi Eğitimi",
      salaryIncrease: null,
      featured: true
    },
    {
      id: 4,
      name: "Zeynep Aydın",
      title: "Katılımcımız",
      company: "MyUNI",
      rating: 5,
      comment: "R programlamaya açıkçası hep mesafeli yaklaşıyordum ama bu eğitim sayesinde basit ve anlaşılır bir başlangıç yapabildim diyebilirim. Özellikle verileri görselleştirme kısmı benim için çok keyifliydi. Teşekkür ederim.",
      courseCompleted: "R Programlamaya Giriş Eğitimi",
      salaryIncrease: null,
      featured: false
    }
  ];

  // Dil bazlı link belirleme
  const coursesLink = locale === 'en' ? '/en/course/' : '/tr/kurs/';
  const coursesText = locale === 'en' ? 'View Courses' : 'Kurslara Göz At';

  const featuredTestimonials = allTestimonials.filter(t => t.featured);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredTestimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, featuredTestimonials.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredTestimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredTestimonials.length) % featuredTestimonials.length);
  };

  return (
    <section className="relative py-16 lg:py-18 overflow-hidden">
      <div className="container mx-auto">
        {/* Header - Left Aligned */}
        <div className="text-left mb-12">
          <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {texts.testimonialsTitle || "Kursiyerlerimizin Gözünden MyUNI"}
          </h2>
          <div className="w-16 h-px bg-[#990000] mb-6"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Eğitimlerimizi tamamlayan öğrencilerimizin deneyimleri ve başarı hikayeleri
          </p>
        </div>

        {/* Main Testimonial Slider */}
        <div className="relative mb-16">
          <div 
            className="overflow-hidden"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {featuredTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0">
                  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-12 rounded-sm">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-12">
                      {/* Left side - Avatar and basic info */}
                      <div className="flex-shrink-0 text-left">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                          <span className="text-neutral-600 dark:text-neutral-400 font-medium text-lg">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          {testimonial.name}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          {testimonial.title}
                        </p>
                        <p className="text-sm text-[#990000] font-medium">
                          {testimonial.company}
                        </p>
                      </div>

                      {/* Right side - Quote and details */}
                      <div className="flex-1 text-left">
                        <Quote className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-4" />
                        
                        <blockquote className="text-xl font-light text-neutral-800 dark:text-neutral-200 leading-relaxed mb-6">
                          &ldquo;{testimonial.comment}&rdquo;
                        </blockquote>

                        <div className="flex items-center space-x-1 mb-6">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-neutral-400" fill="currentColor" />
                          ))}
                        </div>

                        <div className="text-sm">
                          <span className="text-neutral-500 dark:text-neutral-400">Tamamlanan Kurs: </span>
                          <span className="text-neutral-700 dark:text-neutral-300 font-medium">{testimonial.courseCompleted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation and Indicators - Bottom Left */}
          <div className="flex items-center space-x-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>

            <button
              onClick={nextSlide}
              className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </button>

            <div className="flex space-x-2 ml-4">
              {featuredTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-sm transition-colors ${
                    index === currentSlide
                      ? 'bg-neutral-800 dark:bg-neutral-100'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Additional Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {allTestimonials.slice(0, 2).map((testimonial) => (
            <div key={testimonial.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-neutral-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-4 leading-relaxed">
                    {testimonial.comment}
                  </p>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {testimonial.name}
                    </span>
                    {" • "}
                    {testimonial.title}
                    {" • "}
                    <span className="text-[#990000] font-medium">{testimonial.company}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-8 rounded-sm text-left">
          <h3 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            Başarı Hikayenizi Yazın
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-2xl leading-relaxed">
            Binlerce öğrencimiz gibi siz de kariyerinizde yeni adımlar atın. MyUNI ile potansiyelinizi keşfedin.
          </p>
          <a 
            href={coursesLink}
            className="inline-block bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-8 py-3 rounded-sm font-medium transition-colors"
          >
            {coursesText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default CourseTestimonials;