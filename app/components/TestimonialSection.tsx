// components/TestimonialSection.tsx
'use client';

import React, { useState, useEffect } from "react";
import { Star, Quote, ArrowLeft, ArrowRight, Play } from "lucide-react";

interface TestimonialSectionProps {
  locale?: string;
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ locale = 'tr' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const content = {
    tr: {
      badge: "💬 Öğrenci Hikayeleri",
      title: "Başarı hikayelerini keşfedin",
      description: "MyUNI ile hayallerine ulaşan öğrencilerimizin deneyimlerini dinleyin.",
      testimonials: [
        {
          id: 1,
          name: "Ahmet Yılmaz",
          role: "Frontend Developer",
          company: "TechCorp",
          image: "/api/placeholder/80/80",
          rating: 5,
          text: "MyUNI sayesinde 6 ayda sıfırdan full-stack developer oldum. Esnek eğitim sistemi işimle eğitimi mükemmel şekilde dengelememizi sağladı. Şimdi hayalinimdeki işte çalışıyorum.",
          videoUrl: "#",
          course: "Full Stack Web Development",
          achievement: "6 ayda kariyer değişimi"
        },
        {
          id: 2,
          name: "Elif Kaya",
          role: "Data Scientist",
          company: "DataTech",
          image: "/api/placeholder/80/80",
          rating: 5,
          text: "MyUNI'nin veri bilimi kursları gerçekten kapsamlı ve güncel. Projeler sayesinde portföyümü güçlendirdim ve dream job'ımı buldum. Eğitmenler her zaman destek oldu.",
          videoUrl: "#",
          course: "Data Science & Analytics",
          achievement: "Maaşımda %150 artış"
        },
        {
          id: 3,
          name: "Mehmet Öztürk",
          role: "DevOps Engineer",
          company: "CloudFirst",
          image: "/api/placeholder/80/80",
          rating: 5,
          text: "DevOps alanında kendimi geliştirmek istiyordum. MyUNI'nin hands-on yaklaşımı ve real-world projeleri sayesinde hızla uzmanlaştım. Topluluk desteği de mükemmeldi.",
          videoUrl: "#",
          course: "DevOps & Cloud Computing",
          achievement: "Senior pozisyona terfi"
        }
      ],
      stats: {
        successRate: "94%",
        avgSalaryIncrease: "+65%",
        jobPlacement: "87%"
      }
    },
    en: {
      badge: "💬 Student Stories",
      title: "Discover success stories",
      description: "Listen to the experiences of our students who reached their dreams with MyUNI.",
      testimonials: [
        {
          id: 1,
          name: "John Smith",
          role: "Frontend Developer",
          company: "TechCorp",
          image: "/api/placeholder/80/80",
          rating: 5,
          text: "Thanks to MyUNI, I became a full-stack developer from scratch in 6 months. The flexible education system allowed me to perfectly balance work and education. Now I work in my dream job.",
          videoUrl: "#",
          course: "Full Stack Web Development",
          achievement: "Career change in 6 months"
        },
        {
          id: 2,
          name: "Sarah Johnson",
          role: "Data Scientist",
          company: "DataTech",
          image: "/api/placeholder/80/80",
          rating: 5,
          text: "MyUNI's data science courses are really comprehensive and up-to-date. Thanks to the projects, I strengthened my portfolio and found my dream job. The instructors were always supportive.",
          videoUrl: "#",
          course: "Data Science & Analytics",
          achievement: "150% salary increase"
        },
        {
          id: 3,
          name: "Mike Wilson",
          role: "DevOps Engineer",
          company: "CloudFirst",
          image: "/api/placeholder/80/80",
          rating: 5,
          text: "I wanted to improve myself in the DevOps field. Thanks to MyUNI's hands-on approach and real-world projects, I quickly specialized. Community support was also excellent.",
          videoUrl: "#",
          course: "DevOps & Cloud Computing",
          achievement: "Promoted to senior position"
        }
      ],
      stats: {
        successRate: "94%",
        avgSalaryIncrease: "+65%",
        jobPlacement: "87%"
      }
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.tr;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % currentContent.testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentContent.testimonials.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % currentContent.testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? currentContent.testimonials.length - 1 : prev - 1
    );
  };

  const currentTestimonial = currentContent.testimonials[currentSlide];

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-neutral-50/50 to-white dark:from-neutral-900/50 dark:to-neutral-900">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
            {currentContent.badge}
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6 max-w-4xl mx-auto">
            {currentContent.title}
          </h2>
          
          <div className="w-16 h-px bg-[#990000] mx-auto mb-6" />
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            {currentContent.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Left - Stats */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="text-4xl font-bold text-[#990000] dark:text-[#ff4444] mb-2">
                {currentContent.stats.successRate}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Başarı Oranı
              </div>
            </div>
            
            <div className="text-center lg:text-left">
              <div className="text-4xl font-bold text-[#990000] dark:text-[#ff4444] mb-2">
                {currentContent.stats.avgSalaryIncrease}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Ortalama Maaş Artışı
              </div>
            </div>
            
            <div className="text-center lg:text-left">
              <div className="text-4xl font-bold text-[#990000] dark:text-[#ff4444] mb-2">
                {currentContent.stats.jobPlacement}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                İş Bulma Oranı
              </div>
            </div>
          </div>

          {/* Center - Main Testimonial */}
          <div className="relative">
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg">
              <Quote className="w-8 h-8 text-[#990000] dark:text-[#ff4444] mb-6" />
              
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6 italic">
                &ldquo;{currentTestimonial.text}&rdquo;
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#990000] to-[#cc0000] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {currentTestimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">
                    {currentTestimonial.name}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">
                    {currentTestimonial.role} - {currentTestimonial.company}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                    Tamamlanan Kurs
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {currentTestimonial.course}
                  </div>
                </div>
                <button className="flex items-center gap-2 text-[#990000] dark:text-[#ff4444] hover:text-[#cc0000] dark:hover:text-[#ff6666] transition-colors duration-200">
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Video İzle</span>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={prevSlide}
                className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </button>
              
              <div className="flex gap-2">
                {currentContent.testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-[#990000] dark:bg-[#ff4444] w-6' 
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextSlide}
                className="w-10 h-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
              >
                <ArrowRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Right - Achievement */}
          <div className="text-center lg:text-right">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                🏆
              </div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                Başarı Hikayesi
              </div>
              <div className="text-lg font-semibold text-green-800 dark:text-green-200">
                {currentTestimonial.achievement}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;