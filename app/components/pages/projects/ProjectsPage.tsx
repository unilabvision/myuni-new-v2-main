'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Dna, 
  Brain, 
  Code, 
  Microscope, 
  BookOpen, 
  Users, 
  Lightbulb, 
  Calendar,
  ArrowRight,
  FlaskConical,
  Cpu,
  Database,
  FileText,
  Play,
  Globe,
  Heart,
  Stethoscope,
  ExternalLink
} from 'lucide-react';

interface ProjectsPageProps {
  locale?: string;
}

interface Department {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  mission: string;
  vision: string;
  icon: string;
  logo: string;
  link: string;
  projects: Project[];
  events?: Event[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'development' | 'completed';
  technologies?: string[];
  link?: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'upcoming' | 'completed';
}

interface Community {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  mission?: string;
  vision?: string;
  icon: string;
  logo: string;
  link: string;
  subCommunities?: SubCommunity[];
}

interface SubCommunity {
  id: string;
  name: string;
  description: string;
  icon: string;
  logo?: string;
  link: string;
}

interface ProjectsContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  departmentsTitle: string;
  communitiesTitle: string;
  departments: Department[];
  communities: Community[];
}

// Icon mapping
const iconMap: { [key: string]: React.ReactNode } = {
  dna: <Dna className="w-5 h-5" strokeWidth={1.5} />,
  brain: <Brain className="w-5 h-5" strokeWidth={1.5} />,
  code: <Code className="w-5 h-5" strokeWidth={1.5} />,
  microscope: <Microscope className="w-5 h-5" strokeWidth={1.5} />,
  bookOpen: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
  users: <Users className="w-5 h-5" strokeWidth={1.5} />,
  lightbulb: <Lightbulb className="w-5 h-5" strokeWidth={1.5} />,
  calendar: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
  flaskConical: <FlaskConical className="w-5 h-5" strokeWidth={1.5} />,
  cpu: <Cpu className="w-5 h-5" strokeWidth={1.5} />,
  database: <Database className="w-5 h-5" strokeWidth={1.5} />,
  fileText: <FileText className="w-5 h-5" strokeWidth={1.5} />,
  play: <Play className="w-5 h-5" strokeWidth={1.5} />,
  globe: <Globe className="w-5 h-5" strokeWidth={1.5} />,
  heart: <Heart className="w-5 h-5" strokeWidth={1.5} />,
  stethoscope: <Stethoscope className="w-5 h-5" strokeWidth={1.5} />
};

// Projects data
const projectsData: { [key: string]: ProjectsContent } = {
  tr: {
    heroTitle: "Projelerimiz",
    heroSubtitle: "Bilim ve teknolojinin sınırlarını zorlayan yenilikçi projelerle geleceği şekillendiriyoruz.",
    heroDescription: "UNILAB Vision olarak, farklı disiplinlerdeki uzman ekiplerimizle sürdürülebilir çözümler geliştiriyor, bilimi topluma ulaştırıyor ve geleceğin teknolojilerini bugünden inşa ediyoruz.",
    departmentsTitle: "Araştırma ve Geliştirme Birimlerimiz",
    communitiesTitle: "Topluluklarımız",
    departments: [
      {
        id: "unird",
        name: "UNIR&D",
        subtitle: "Ar&Ge Birimimiz",
        description: "UNIR&D, biyoinformatik, kanser araştırmaları, sağlıkta yapay zeka, yazılım geliştirme ve yapay zeka destekli eğitim teknolojileri alanlarında öncü çalışmalar yürütmektedir. Hedefimiz, biyolojik bilimler ile yapay zekâ ve yazılım teknolojilerini bir araya getirerek, hem toplum sağlığına hem de dijital dönüşüme katkı sağlayan sürdürülebilir çözümler geliştirmektir. Kanser biyoinformatiği üzerine odaklanarak moleküler düzeyde hastalık mekanizmalarını anlamaya çalışıyor, yapay zeka destekli analizlerle tanı ve tedavi süreçlerine yenilikçi yaklaşımlar sunuyoruz. Aynı zamanda, kişiselleştirilmiş dijital öğrenme deneyimleri geliştirdiğimiz eğitim teknolojileri ile sağlık alanındaki bilgi paylaşımını daha erişilebilir ve etkili hale getiriyoruz. UNIR&D olarak, disiplinler arası yaklaşımımızla geleceğin sağlık ve eğitim çözümlerini bugünden inşa ediyoruz.",
        mission: "Biyoinformatik, sağlıkta yapay zeka, nadir genetik hastalıklar, yazılım geliştirme ve yapay zeka destekli eğitim platformları alanlarında öncü araştırmalar yaparak sürdürülebilir sağlık çözümleri ve teknolojik dönüşüme katkıda bulunmak.",
        vision: "Bilimsel araştırmalar, teknolojik yenilikler ve yazılım çözümleri aracılığıyla insan sağlığını ve refahını iyileştirmenin yanı sıra teknolojik dönüşüme de katkıda bulunmak.",
        icon: "dna",
        logo: "/tr/images/departments/unird.png",
        link: "https://research.unilabvision.com",
        projects: [
          {
            id: "myuni",
            name: "MyUNI",
            description: "Yapay Zeka Destekli Eğitim Platformu",
            icon: "bookOpen",
            status: "active",
            technologies: ["AI/ML", "Web Development", "Data Analytics"],
            link: "https://myunilab.net"
          },
          {
            id: "phylogenetica",
            name: "Phylogenetica",
            description: "Nadir Genetik Hastalıklar Araştırma Takımı",
            icon: "dna",
            status: "development",
            technologies: ["ALS", "Genetik"]
          }
        ]
      },
      {
        id: "unidev",
        name: "UNIDEV",
        subtitle: "Yazılım Birimimiz",
        description: "UNIDEV, yenilikçi yazılım çözümleri geliştiren, teknoloji odaklı bir birim olarak, yüksek kaliteli yazılım ve dijital çözümler sunmayı amaçlamaktadır. Birimimiz, farklı sektörlerdeki ihtiyaçlara yönelik özelleştirilmiş yazılım uygulamaları geliştirme konusunda uzmanlaşmaktadır. UNIDEV, genç ve dinamik bir ekip ile, kullanıcı dostu, verimli ve sürdürülebilir yazılım çözümleri üretmektedir. Yapay zeka ve veri analitiği gibi ileri teknolojileri entegre ederek, müşterilerimize yüksek verimlilik, otomasyon ve kullanıcı dostu deneyimler sağlamayı amaçlıyoruz.",
        mission: "Yenilikçi yazılım çözümleri ve yapay zeka tabanlı teknolojiler geliştirerek, teknoloji ve kullanıcı ihtiyaçlarını ön planda tutan sürdürülebilir dijital çözümler sunmak.",
        vision: "Yazılım ve yapay zeka alanlarında öncü çözümler geliştirerek, teknoloji dünyasında yenilikçi ve sürdürülebilir dijital dönüşüm süreçlerine liderlik etmek.",
        icon: "code",
        logo: "/tr/images/departments/unidev.png",
        link: "https://unidevsoftware.com/",
        projects: [
          {
            id: "darkscience",
            name: "Dark Science Dergisi",
            description: "Dijital Bilim Dergisi Platformu",
            icon: "fileText",
            status: "active",
            technologies: ["React", "Node.js"],
            link: "https://darkpost.net"
          },
          {
            id: "myuni-dev",
            name: "MyUNI",
            description: "Yapay Zeka Destekli Eğitim Platformu",
            icon: "bookOpen",
            status: "active",
            technologies: ["AI/ML", "Web Development", "Data Analytics"],
            link: "https://myunilab.net"
          },
          {
            id: "postozen",
            name: "Postozen",
            description: "Dijital Varlık Yönetim Platformu",
            icon: "globe",
            status: "development",
            technologies: ["API Integration", "Analytics"],
            link: "https://postozen.com"
          }
        ]
      },
      {
        id: "darkpost",
        name: "Darkpost Media",
        subtitle: "Medya Birimimiz",
        description: "UNILAB Vision'ın Medya Birimi olan Darkpost Media, bilimi dijital platformlar aracılığıyla geniş kitlelere ulaştırmayı hedefleyen yenilikçi bir birimdir. Dijital dergilerle bilimsel bilgiyi erişilebilir ve ilgi çekici hale getirirken, yapay zeka destekli araçlarla öğrenim süreçlerini kolaylaştırıyoruz. Biyoloji, fizik, uzay bilimi, mühendislik ve yapay zeka gibi pek çok alanda içerikler sunarak okuyuculara zengin bir bilgi kaynağı sunuyoruz. Dark Science dijital dergisi, her yaştan bilim meraklısı için hazırlanmış, animasyonlu görseller ve interaktif grafiklerle zenginleştirilmiş içeriğiyle bilimsel bilgiyi erişilebilir kılıyor.",
        mission: "Bilimi dijitalleşmenin gücünü kullanarak geniş kitlelere ulaştırmak ve öğrenimi kolaylaştırmak. Güvenilir ve doğru bilgi paylaşımıyla toplumda bilimsel farkındalık oluşturmak.",
        vision: "Bilimi dijital içeriklerle daha geniş kitlelere ulaştırarak bilimsel bilgiye erişimi kolaylaştırmak ve öğrenme süreçlerini daha etkili hale getirmek.",
        icon: "play",
        logo: "/tr/images/departments/darkpost.png",
        link: "https://darkpost.net/",
        projects: [
          {
            id: "darkscience-mag",
            name: "Dark Science",
            description: "İnteraktif Dijital Bilim Dergisi",
            icon: "fileText",
            status: "active",
            technologies: ["Digital Publishing", "AR/VR", "Interactive Media"],
            link: "https://darkpost.net"
          }
        ]
      },
      {
        id: "unicom",
        name: "UNICOM",
        subtitle: "Etkinlik Birimimiz",
        description: "UNICOM olarak, bilim ve teknoloji temelli bir etkinlik platformu olarak, öğrencileri, akademisyenleri ve girişimcileri bir araya getirmeyi hedefliyoruz. Amacımız, bilim ve teknolojiye ilgi duyan bireylerin hem akademik hem de kişisel gelişimlerine katkı sağlayacak bir ortam sunmaktır. UNICOM, katılımcıların bilimsel düşünceyi teşvik eden projelerde yer alabilecekleri, yenilikçi fikirler geliştirebilecekleri ve liderlik becerilerini güçlendirebilecekleri bir platform oluşturmayı amaçlar. Bu sayede, öğrenciler, akademisyenler ve girişimciler arasında bilgi paylaşımı ve iş birliğini destekleyen dinamik bir ekosistem yaratıyoruz.",
        mission: "Bilim ve teknoloji alanında öğrenciler, akademisyenler ve girişimciler arasında bilgi ve deneyim paylaşımını teşvik etmek ve katılımcıların potansiyellerini maksimize etmelerine yardımcı olmak.",
        vision: "UNICOM'u bilim ve teknolojiye ilgi duyan gençler için önde gelen bir buluşma noktası haline getirmek.",
        icon: "calendar",
        logo: "/tr/images/departments/unicom.png",
        link: "https://unicom.net.tr/",
        projects: [],
        events: [
          {
            id: "nadircom",
            name: "NADIRCOM",
            description: "Nadir Genetik Hastalıklar Farkındalık Etkinliği",
            icon: "heart",
            status: "active"
          },
          {
            id: "biocom",
            name: "BIOCOM",
            description: "Biyolojik Bilimlerin Buluşma Noktası Etkinliği",
            icon: "stethoscope",
            status: "active"
          }
        ]
      }
    ],
    communities: [
      {
        id: "unidc",
        name: "UNIDC",
        subtitle: "Keşif Topluluğumuz",
        description: "Gençlerin enerjisi ve yenilikçi fikirleriyle bir araya gelerek toplumda olumlu değişim yaratıyoruz.",
        mission: "Gençlerin bilim ve teknoloji alanlarında kendilerini geliştirmelerine olanak sağlayarak, yaratıcı düşünceyi ve inovasyonu teşvik etmek.",
        vision: "Bilim ve teknoloji meraklısı gençlerin buluşma noktası olarak, gelecekteki liderlerin yetişmesine katkıda bulunmak.",
        icon: "lightbulb",
        logo: "/tr/images/departments/unidc.png",
        link: "https://unidc.org/",
        subCommunities: [
          {
            id: "bym",
            name: "BYM Türkiye",
            description: "Biyomühendislik alanında kendini geliştirmeyi hedefleyen bireyler için özel topluluk",
            icon: "microscope",
            link: "https://biyomuhendislik.net.tr"
          },
          {
            id: "aidc",
            name: "AIDC",
            description: "Yapay zeka ve ileri teknoloji alanlarında tutkulu bireylerin buluşma noktası",
            icon: "cpu",
            link: "https://ai.unidc.org"
          }
        ]
      }
    ]
  },
  en: {
    heroTitle: "Our Projects",
    heroSubtitle: "We shape the future with innovative projects that push the boundaries of science and technology.",
    heroDescription: "As UNILAB Vision, with our expert teams in different disciplines, we develop sustainable solutions, bring science to society, and build tomorrow's technologies today.",
    departmentsTitle: "Our Research and Development Units",
    communitiesTitle: "Our Communities",
    departments: [
      {
        id: "unird",
        name: "UNIR&D",
        subtitle: "Our R&D Unit",
        description: "UNIR&D conducts pioneering studies in the fields of bioinformatics, cancer research, artificial intelligence in health, software development and artificial intelligence-supported educational technologies. Our goal is to bring together biological sciences with artificial intelligence and software technologies to develop sustainable solutions that contribute to both public health and digital transformation. Focusing on cancer bioinformatics, we try to understand disease mechanisms at the molecular level and offer innovative approaches to diagnosis and treatment processes with artificial intelligence-supported analysis. At the same time, we make knowledge sharing in the field of health more accessible and effective with educational technologies where we develop personalized digital learning experiences. As UNIR&D, we are building the health and education solutions of the future today with our interdisciplinary approach.",
        mission: "To contribute to sustainable health solutions and technological transformation by conducting pioneering research in bioinformatics, AI in healthcare, rare genetic diseases, software development, and AI-supported educational platforms.",
        vision: "To contribute to improving human health and welfare as well as technological transformation through scientific research, technological innovations, and software solutions.",
        icon: "dna",
        logo: "/tr/images/departments/unird.png",
        link: "https://research.unilabvision.com",
        projects: [
          {
            id: "myuni",
            name: "MyUNI",
            description: "AI-Powered Educational Platform",
            icon: "bookOpen",
            status: "active",
            technologies: ["AI/ML", "Web Development", "Data Analytics"],
            link: "https://myunilab.net"
          },
          {
            id: "phylogenetica",
            name: "Phylogenetica",
            description: "Rare Genetic Diseases Research Team",
            icon: "dna",
            status: "development",
            technologies: ["ALS", "Genetics"]
          }
        ]
      },
      {
        id: "unidev",
        name: "UNIDEV",
        subtitle: "Our Software Unit",
        description: "As a technology-focused unit that develops innovative software solutions, we aim to provide high-quality software and digital solutions. Our unit specializes in developing customized software applications for the needs of different sectors. UNIDEV produces user-friendly, efficient and sustainable software solutions with a young and dynamic team. By integrating advanced technologies such as artificial intelligence and data analytics, we aim to provide our customers with high efficiency, automation and user-friendly experiences.",
        mission: "To provide sustainable digital solutions that prioritize technology and user needs by developing innovative software solutions and AI-based technologies.",
        vision: "To lead innovative and sustainable digital transformation processes in the technology world by developing pioneering solutions in software and artificial intelligence fields.",
        icon: "code",
        logo: "/tr/images/departments/unidev.png",
        link: "https://unidevsoftware.com/",
        projects: [
          {
            id: "darkscience",
            name: "Dark Science Magazine",
            description: "Digital Science Magazine Platform",
            icon: "fileText",
            status: "active",
            technologies: ["React", "Node.js"],
            link: "https://darkpost.net"
          },
          {
            id: "myuni-dev",
            name: "MyUNI",
            description: "AI-Powered Educational Platform",
            icon: "bookOpen",
            status: "active",
            technologies: ["AI/ML", "Web Development", "Data Analytics"],
            link: "https://myunilab.net"
          },
          {
            id: "postozen",
            name: "Postozen",
            description: "Digital Asset Management Platform",
            icon: "globe",
            status: "development",
            technologies: ["API Integration", "Analytics"],
            link: "https://postozen.com"
          }
        ]
      },
      {
        id: "darkpost",
        name: "Darkpost Media",
        subtitle: "Our Media Unit",
        description: "Darkpost Media, the Media Unit of UNILAB Vision, is an innovative unit that aims to reach scientific knowledge to wide audiences through digital platforms. While making scientific knowledge accessible and engaging through digital magazines, we facilitate learning processes with AI-supported tools. We offer rich sources of knowledge to readers by providing content in many fields such as biology, physics, space science, engineering and artificial intelligence. Dark Science digital magazine makes scientific knowledge accessible with its content enriched with animated visuals and interactive graphics, prepared for science enthusiasts of all ages.",
        mission: "To reach science to wide audiences using the power of digitalization and facilitate learning. To create scientific awareness in society through reliable and accurate information sharing.",
        vision: "To facilitate access to scientific knowledge and make learning processes more effective by reaching science to wider audiences through digital content.",
        icon: "play",
        logo: "/tr/images/departments/darkpost.png",
        link: "https://darkpost.net/",
        projects: [
          {
            id: "darkscience-mag",
            name: "Dark Science",
            description: "Interactive Digital Science Magazine",
            icon: "fileText",
            status: "active",
            technologies: ["Digital Publishing", "AR/VR", "Interactive Media"],
            link: "https://darkpost.net"
          }
        ]
      },
      {
        id: "unicom",
        name: "UNICOM",
        subtitle: "Our Event Unit",
        description: "As UNICOM, as a science and technology-based event platform, we aim to bring together students, academics and entrepreneurs. Our goal is to provide an environment that will contribute to both academic and personal development of individuals interested in science and technology. UNICOM aims to create a platform where participants can take part in projects that encourage scientific thinking, develop innovative ideas and strengthen their leadership skills. In this way, we create a dynamic ecosystem that supports knowledge sharing and cooperation between students, academics and entrepreneurs.",
        mission: "To encourage knowledge and experience sharing among students, academics, and entrepreneurs in science and technology fields and help participants maximize their potential.",
        vision: "To make UNICOM a leading meeting point for young people interested in science and technology.",
        icon: "calendar",
        logo: "/tr/images/departments/unicom.png",
        link: "https://unicom.net.tr/",
        projects: [],
        events: [
          {
            id: "nadircom",
            name: "NADIRCOM",
            description: "Rare Genetic Diseases Awareness Event",
            icon: "heart",
            status: "active"
          },
          {
            id: "biocom",
            name: "BIOCOM",
            description: "Biological Sciences Meeting Point Event",
            icon: "stethoscope",
            status: "active"
          }
        ]
      }
    ],
    communities: [
      {
        id: "unidc",
        name: "UNIDC",
        subtitle: "Our Discovery Community",
        description: "We create positive change in society by bringing together the energy and innovative ideas of young people.",
        mission: "To encourage creative thinking and innovation by enabling young people to develop themselves in science and technology fields.",
        vision: "To contribute to the development of future leaders as a meeting point for young people interested in science and technology.",
        icon: "lightbulb",
        logo: "/tr/images/departments/unidc.png",
        link: "https://unidc.org/",
        subCommunities: [
          {
            id: "bym",
            name: "BYM Turkey",
            description: "Special community for individuals aiming to develop themselves in the field of bioengineering",
            icon: "microscope",
            link: "https://biyomuhendislik.net.tr"
          },
          {
            id: "aidc",
            name: "AIDC",
            description: "A meeting point for individuals passionate about artificial intelligence and advanced technology",
            icon: "cpu",
            link: "https://ai.unidc.org"
          }
        ]
      }
    ]
  }
};

// Status badge component
function StatusBadge({ status, locale, type = 'project' }: { status: 'active' | 'development' | 'completed' | 'upcoming', locale: string, type?: 'project' | 'event' }) {
  const statusText: { [key: string]: { [key: string]: string } } = {
    tr: {
      active: type === 'event' ? 'Düzenleniyor' : 'Aktif',
      development: 'Geliştirme Aşamasında',
      completed: 'Tamamlandı',
      upcoming: 'Yakında'
    },
    en: {
      active: type === 'event' ? 'Organizing' : 'Active',
      development: 'Development',
      completed: 'Completed',
      upcoming: 'Upcoming'
    }
  };

  const statusColors: { [key: string]: string } = {
    active: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    development: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    completed: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    upcoming: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  };

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
      {statusText[locale]?.[status] || status}
    </span>
  );
}

// Department Card Component
interface DepartmentCardProps {
  department: Department;
  locale: string;
}

function DepartmentCard({ department, locale }: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-red-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-gray-600 transition-all duration-300 p-8 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="flex-shrink-0 w-16 h-16 bg-white dark:bg-white rounded-xl flex items-center justify-center p-2">
          <Image 
            src={department.logo}
            alt={`${department.name} logo`}
            width={64}
            height={64}
            className="object-contain w-full h-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">
              {department.name}
            </h3>
            <a
              href={department.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#990000] dark:text-white hover:text-[#800000] dark:hover:text-gray-300 transition-colors duration-200"
              title={locale === 'en' ? 'Visit website' : 'Web sitesini ziyaret et'}
            >
              <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
            </a>
          </div>
          <p className="text-sm font-medium text-[#990000] dark:text-white mb-3">
            {department.subtitle}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
        {department.description}
      </p>

      {/* Projects */}
      {department.projects && department.projects.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'en' ? 'Projects' : 'Projeler'}
          </h4>
          <div className="space-y-4">
            {department.projects.map((project) => (
              <div key={project.id} className="flex items-start gap-4 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-red-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-gray-600 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                  {iconMap[project.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                      {project.name}
                    </h5>
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#990000] dark:text-white hover:text-[#800000] dark:hover:text-gray-300 transition-colors duration-200"
                        title={locale === 'en' ? 'Visit project' : 'Projeyi ziyaret et'}
                      >
                        <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                    )}
                    <StatusBadge status={project.status} locale={locale} />
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    {project.description}
                  </p>
                  {project.technologies && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <span key={index} className="inline-block px-3 py-1 text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-500">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events (for UNICOM) */}
      {department.events && department.events.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'en' ? 'Events' : 'Etkinlikler'}
          </h4>
          <div className="space-y-4">
            {department.events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-red-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-gray-600 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                  {iconMap[event.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                      {event.name}
                    </h5>
                    <StatusBadge status={event.status} locale={locale} type="event" />
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse for Mission & Vision */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#990000] dark:hover:text-white transition-colors duration-200 group"
      >
        <span className="font-medium">{locale === 'en' ? 'Learn More' : 'Daha Fazla Bilgi'}</span>
        <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} group-hover:text-[#990000]`} />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
          <div>
            <h4 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {locale === 'en' ? 'Mission' : 'Misyon'}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {department.mission}
            </p>
          </div>
          <div>
            <h4 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {locale === 'en' ? 'Vision' : 'Vizyon'}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {department.vision}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Community Card Component
interface CommunityCardProps {
  community: Community;
  locale: string;
}

function CommunityCard({ community, locale }: CommunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-red-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-gray-600 transition-all duration-300 p-8 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="flex-shrink-0 w-16 h-16 bg-white dark:bg-white rounded-xl flex items-center justify-center p-2">
          <Image 
            src={community.logo}
            alt={`${community.name} logo`}
            width={64}
            height={64}
            className="object-contain w-full h-full"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">
              {community.name}
            </h3>
            <a
              href={community.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#990000] dark:text-white hover:text-[#800000] dark:hover:text-gray-300 transition-colors duration-200"
              title={locale === 'en' ? 'Visit website' : 'Web sitesini ziyaret et'}
            >
              <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
            </a>
          </div>
          {community.subtitle && (
            <p className="text-sm font-medium text-[#990000] dark:text-white mb-3">
              {community.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
        {community.description}
      </p>

      {/* Sub Communities */}
      {community.subCommunities && community.subCommunities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'en' ? 'Sub Communities' : 'Alt Topluluklar'}
          </h4>
          <div className="space-y-4">
            {community.subCommunities.map((subCommunity) => (
              <div key={subCommunity.id} className="flex items-start gap-4 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-white rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
                  {iconMap[subCommunity.icon]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                      {subCommunity.name}
                    </h5>
                    <a
                      href={subCommunity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#990000] dark:text-white hover:text-[#800000] dark:hover:text-gray-300 transition-colors duration-200"
                      title={locale === 'en' ? 'Visit website' : 'Web sitesini ziyaret et'}
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                    </a>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {subCommunity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse for Mission & Vision */}
      {(community.mission || community.vision) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#990000] dark:hover:text-white transition-colors duration-200 group"
        >
          <span className="font-medium">{locale === 'en' ? 'Learn More' : 'Daha Fazla Bilgi'}</span>
          <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} group-hover:text-[#990000]`} />
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && (community.mission || community.vision) && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6">
          {community.mission && (
            <div>
              <h4 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {locale === 'en' ? 'Mission' : 'Misyon'}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {community.mission}
              </p>
            </div>
          )}
          {community.vision && (
            <div>
              <h4 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {locale === 'en' ? 'Vision' : 'Vizyon'}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {community.vision}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Projects Page Component
export default function ProjectsPage({ locale = 'tr' }: ProjectsPageProps) {
  const [content, setContent] = useState<ProjectsContent | null>(null);
  
  useEffect(() => {
    try {
      const currentContent = projectsData[locale as keyof typeof projectsData] || projectsData.tr;
      setContent(currentContent);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }, [locale]);
  
  if (!content) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-400">İçerik yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      
      {/* Departments Section */}
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-6">
              {content.departmentsTitle}
            </h2>
            <div className="w-20 h-px bg-[#990000]"></div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {content.departments.map((department) => (
              <DepartmentCard key={department.id} department={department} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Communities Section */}
      <section className="py-20 bg-gray-50 dark:bg-neutral-800/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-6">
              {content.communitiesTitle}
            </h2>
            <div className="w-20 h-px bg-[#990000]"></div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {content.communities.map((community) => (
              <CommunityCard key={community.id} community={community} locale={locale} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}