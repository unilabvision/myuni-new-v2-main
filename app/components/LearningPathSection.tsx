// components/LearningPathSection.tsx
'use client';

import React, { useState } from "react";
import { 
  ArrowRight, 
  Play, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle,
  Star,
  TrendingUp
} from "lucide-react";

interface LearningPathSectionProps {
  locale?: string;
}

const LearningPathSection: React.FC<LearningPathSectionProps> = ({ locale = 'tr' }) => {
  const [activeTab, setActiveTab] = useState(0);

  const content = {
    tr: {
      badge: "🎯 Öğrenme Yolculuğu",
      title: "Kariyerinize uygun öğrenme yollarını keşfedin",
      description: "Hedeflerinize göre tasarlanmış öğrenme yolları ile sistematik bir şekilde ilerleyin ve uzmanlaşın.",
      tabs: [
        { name: "Başlangıç", icon: Play },
        { name: "Orta", icon: TrendingUp },
        { name: "İleri", icon: Star }
      ],
      paths: [
        {
          level: "Başlangıç Seviyesi",
          duration: "2-4 Hafta",
          courses: 12,
          students: "25,000+",
          description: "Programlama ve teknoloji dünyasına ilk adımlarınızı atın. Temel kavramları öğrenin ve sağlam bir foundation oluşturun.",
          features: [
            "Temel programlama kavramları",
            "HTML, CSS ve JavaScript temelleri",
            "Proje tabanlı öğrenme",
            "Mentörlük desteği"
          ],
          progress: 85,
          nextCourse: "Web Geliştirme Temelleri"
        },
        {
          level: "Orta Seviye",
          duration: "6-8 Hafta",
          courses: 18,
          students: "15,000+",
          description: "Mevcut bilgilerinizi derinleştirin ve profesyonel projelerde kullanabileceğiniz beceriler kazanın.",
          features: [
            "React ve Node.js geliştirme",
            "Veritabanı yönetimi",
            "API geliştirme ve entegrasyon",
            "Proje yönetimi"
          ],
          progress: 60,
          nextCourse: "Full Stack Geliştirme"
        },
        {
          level: "İleri Seviye",
          duration: "10-12 Hafta",
          courses: 24,
          students: "8,000+",
          description: "Uzman seviyesine çıkın ve endüstride lider olabilecek ileri seviye teknikleri öğrenin.",
          features: [
            "Mikroservis mimarisi",
            "DevOps ve CI/CD",
            "Machine Learning temelleri",
            "Sistem tasarımı"
          ],
          progress: 45,
          nextCourse: "Cloud Architecture"
        }
      ]
    },
    en: {
      badge: "🎯 Learning Journey",
      title: "Discover learning paths suitable for your career",
      description: "Progress systematically and specialize with learning paths designed according to your goals.",
      tabs: [
        { name: "Beginner", icon: Play },
        { name: "Intermediate", icon: TrendingUp },
        { name: "Advanced", icon: Star }
      ],
      paths: [
        {
          level: "Beginner Level",
          duration: "2-4 Weeks",
          courses: 12,
          students: "25,000+",
          description: "Take your first steps into the world of programming and technology. Learn basic concepts and build a solid foundation.",
          features: [
            "Basic programming concepts",
            "HTML, CSS and JavaScript fundamentals",
            "Project-based learning",
            "Mentorship support"
          ],
          progress: 85,
          nextCourse: "Web Development Fundamentals"
        },
        {
          level: "Intermediate Level",
          duration: "6-8 Weeks",
          courses: 18,
          students: "15,000+",
          description: "Deepen your existing knowledge and gain skills you can use in professional projects.",
          features: [
            "React and Node.js development",
            "Database management",
            "API development and integration",
            "Project management"
          ],
          progress: 60,
          nextCourse: "Full Stack Development"
        },
        {
          level: "Advanced Level",
          duration: "10-12 Weeks",
          courses: 24,
          students: "8,000+",
          description: "Reach expert level and learn advanced techniques that can make you a leader in the industry.",
          features: [
            "Microservice architecture",
            "DevOps and CI/CD",
            "Machine Learning fundamentals",
            "System design"
          ],
          progress: 45,
          nextCourse: "Cloud Architecture"
        }
      ]
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.tr;
  const currentPath = currentContent.paths[activeTab];

  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-neutral-900">
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

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            {currentContent.tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-300 ${
                    activeTab === index
                      ? 'bg-white dark:bg-neutral-700 text-[#990000] dark:text-[#ff4444] shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Path Details */}
          <div>
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 p-8 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#990000] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{activeTab + 1}</span>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
                    {currentPath.level}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {currentPath.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {currentPath.courses} Kurs
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {currentPath.students}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                {currentPath.description}
              </p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    İlerleme
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {currentPath.progress}%
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div 
                    className="bg-[#990000] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${currentPath.progress}%` }}
                  />
                </div>
              </div>

              {/* Next Course */}
              <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                      Sonraki Kurs
                    </p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {currentPath.nextCourse}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#990000] dark:text-[#ff4444]" />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {currentPath.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-[#990000]/5 to-[#990000]/10 dark:from-[#990000]/10 dark:to-[#990000]/20 p-8 rounded-lg">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= activeTab + 1 
                        ? 'bg-[#990000] text-white' 
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                    }`}>
                      {index <= activeTab + 1 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`h-2 rounded-full ${
                        index <= activeTab + 1 
                          ? 'bg-[#990000]' 
                          : 'bg-neutral-200 dark:bg-neutral-700'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningPathSection;