'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Database, Code, Shield, Globe, Lock, BarChart, Cpu, Server, Cloud } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
// These should be defined in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Project arayüzü
interface Project {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  link: string;
}

// ProjectsContent arayüzü
interface ProjectsContent {
  title_span: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
  projects: Project[];
}

// Component props
interface ProjectsShowcaseProps {
  locale: string;
}

const ProjectsShowcase: React.FC<ProjectsShowcaseProps> = ({ locale }) => {
  const [content, setContent] = useState<ProjectsContent | null>(null);
  // error değişkeni kullanılmıyor, bu yüzden kaldırıldı
  const [loading, setLoading] = useState<boolean>(true);

  // Supabase'den içerik getirme fonksiyonu
  const fetchProjectsContent = useCallback(async (locale: string) => {
    try {
      setLoading(true);
      
      // Database sorgusu
      const { data, error } = await supabase
        .from('projects_content')
        .select('*')
        .eq('locale', locale)
        .single();

      if (error) {
        console.error('Error fetching projects content:', error);
        // Hata durumunda varsayılan içeriğe geç
        setContent(getDefaultProjectsContent(locale));
        return;
      }

      // JSONB veri tipini işle
      let parsedProjects = data.projects;
      
      // Eğer projects bir string ise, parse et
      if (typeof data.projects === 'string') {
        try {
          parsedProjects = JSON.parse(data.projects);
        } catch (e) {
          console.error('Error parsing projects JSON:', e);
          parsedProjects = getDefaultProjectsContent(locale).projects;
        }
      }

      // İçeriği state'e kaydet
      setContent({
        title_span: data.title_span,
        title: data.title,
        description: data.description,
        cta_text: data.cta_text,
        cta_link: data.cta_link,
        projects: parsedProjects
      });
      
    } catch (error) {
      console.error('Failed to fetch projects content:', error);
      setContent(getDefaultProjectsContent(locale));
    } finally {
      setLoading(false);
    }
  }, []);

  // Varsayılan içerik sağlayan fonksiyon
  const getDefaultProjectsContent = (locale: string): ProjectsContent => {
    // Farklı diller için varsayılan içerik
    const defaultContent: Record<string, ProjectsContent> = {
      tr: {
        title_span: 'UNIDEV Software',
        title: 'Projelerimiz',
        description: 'UNIDEV Software platformu altında geliştirdiğimiz çözümlerimizden bazıları',
        cta_text: 'Tüm projelerimizi keşfedin',
        cta_link: '/tr/projeler',
        projects: [
          {
            id: 1,
            title: "UNILAB Vision Analytics",
            description: "Veri analizi ve görselleştirme araçları ile şirketinizin performansını izleyin.",
            icon: "Database",
            category: "Veri Analizi",
            link: "/tr/projeler/1"
          },
          {
            id: 2,
            title: "UNILAB Enterprise Management",
            description: "Tüm işletme süreçlerinizi tek bir platformdan yönetin ve optimize edin.",
            icon: "Code",
            category: "İşletme Yönetimi",
            link: "/tr/projeler/2"
          },
          {
            id: 3,
            title: "UNILAB Security Suite",
            description: "Gelişmiş güvenlik protokolleri ile verilerinizi koruma altına alın.",
            icon: "Shield",
            category: "Güvenlik",
            link: "/tr/projeler/3"
          }
        ]
      },
      en: {
        title_span: 'UNIDEV Software',
        title: 'Our Projects',
        description: 'Some of the solutions we have developed under the UNIDEV Software platform',
        cta_text: 'Explore all our projects',
        cta_link: '/en/projects',
        projects: [
          {
            id: 1,
            title: "UNILAB Vision Analytics",
            description: "Monitor your company's performance with data analysis and visualization tools.",
            icon: "Database",
            category: "Data Analysis",
            link: "/en/projects/1"
          },
          {
            id: 2,
            title: "UNILAB Enterprise Management",
            description: "Manage and optimize all your business processes from a single platform.",
            icon: "Code",
            category: "Business Management",
            link: "/en/projects/2"
          },
          {
            id: 3,
            title: "UNILAB Security Suite",
            description: "Secure your data with advanced security protocols.",
            icon: "Shield",
            category: "Security",
            link: "/en/projects/3"
          }
        ]
      },
      de: {
        title_span: 'UNIDEV Software',
        title: 'Unsere Projekte',
        description: 'Einige der Lösungen, die wir unter der UNIDEV Software-Plattform entwickelt haben',
        cta_text: 'Entdecken Sie alle unsere Projekte',
        cta_link: '/de/projekte',
        projects: [
          {
            id: 1,
            title: "UNILAB Vision Analytics",
            description: "Überwachen Sie die Leistung Ihres Unternehmens mit Datenanalyse- und Visualisierungstools.",
            icon: "Database",
            category: "Datenanalyse",
            link: "/de/projekte/1"
          },
          {
            id: 2,
            title: "UNILAB Enterprise Management",
            description: "Verwalten und optimieren Sie alle Ihre Geschäftsprozesse von einer einzigen Plattform aus.",
            icon: "Code",
            category: "Geschäftsführung",
            link: "/de/projekte/2"
          },
          {
            id: 3,
            title: "UNILAB Security Suite",
            description: "Sichern Sie Ihre Daten mit fortschrittlichen Sicherheitsprotokollen.",
            icon: "Shield",
            category: "Sicherheit",
            link: "/de/projekte/3"
          }
        ]
      }
    };

    // Eğer belirtilen locale için içerik yoksa, varsayılan olarak Türkçe içeriği kullan
    return defaultContent[locale] || defaultContent['tr'];
  };

  // icon string değerine göre ilgili icon'u döndüren fonksiyon
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Database':
        return <Database className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Code':
        return <Code className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Shield':
        return <Shield className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Globe':
        return <Globe className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Lock':
        return <Lock className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'BarChart':
        return <BarChart className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Cpu':
        return <Cpu className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Server':
        return <Server className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      case 'Cloud':
        return <Cloud className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
      default:
        return <Database className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
    }
  };

  // Komponent yüklendiğinde içeriği getir
  useEffect(() => {
    const safeLocale = locale || 'tr';
    fetchProjectsContent(safeLocale);
  }, [locale, fetchProjectsContent]); // fetchProjectsContent bağımlılığı eklendi

  // Yükleme durumunda loading göster
  if (loading) {
    return (
      <section className="py-4 pb-14">
        <div className="container mx-auto">
          <div className="text-center">
            <p>Loading projects...</p>
          </div>
        </div>
      </section>
    );
  }

  // Eğer içerik yoksa (bu durumda varsayılan içerik kullanılacak ama yine de kontrol edelim)
  if (!content) {
    return (
      <section className="py-4 pb-14">
        <div className="container mx-auto">
          <div className="text-center">
            <p>No content available.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 pb-14">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-left mb-16">
          <span className="text-md font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {content.title_span}
          </span>
          <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mt-2 mb-3">
            {content.title}
          </h2>
          <div className="w-16 h-px bg-neutral-300 dark:bg-neutral-700 mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 text-base max-w-2xl">
            {content.description}
          </p>
        </div>
        
        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content.projects.map((project) => (
            <div 
              key={project.id}
              className="p-8 bg-neutral-50 dark:bg-neutral-800 border-l-2 border-neutral-200 dark:border-neutral-700 hover:border-l-2 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all duration-300"
            >
              <div className="mb-4 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-sm w-fit">
                {renderIcon(project.icon)}
              </div>
              <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {project.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-md mb-6">
                {project.description}
              </p>
              <div className="flex items-center text-md font-medium text-neutral-700 dark:text-neutral-300">
                <span className="text-xs py-1 px-3 bg-neutral-200 dark:bg-neutral-700 rounded-sm mr-4">
                  {project.category}
                </span>
                <Link 
                  href={project.link}
                  className="flex items-center hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-300"
                >
                  {locale === 'tr' ? 'Detayları görüntüle' : 
                   locale === 'de' ? 'Details anzeigen' : 'View details'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 text-left">
          <Link 
            href={content.cta_link}
            className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white py-3 px-8 rounded-sm text-md font-medium transition-all duration-300 flex items-center w-fit"
          >
            {content.cta_text}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProjectsShowcase;