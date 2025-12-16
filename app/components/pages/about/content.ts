export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image?: string;
  bio: string;
}

export interface AboutContent {
  title: string;
  description: string;
  seoDescription?: string; // SEO için kısa description (150-160 karakter)
  mission: string;
  vision: string;
  values: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
  }>;
  history: Array<{
    year: string;
    title: string;
    description: string;
  }>;
  team: TeamMember[];
}

const content = {
  tr: {
    title: "Hakkımızda",
    description: "MyUNI, yapay zeka destekli, yenilikçi bir eğitim platformudur. Bireylere ve kurumlara yönelik dönüştürücü öğrenme deneyimleri sunar. Disiplinler arası yaklaşımı, en son teknolojileri ve yapay zeka destekli altyapısı sayesinde hem bireysel gelişim hem de kurumsal eğitim alanında yüksek etkili çözümler sunuyoruz. ",
    seoDescription: "MyUNI, yapay zeka destekli yenilikçi eğitim platformu. Bireysel ve kurumsal eğitim için dönüştürücü öğrenme deneyimleri sunuyoruz.",
    mission: "Gençlerin bilim ve teknoloji alanlarında potansiyellerini keşfetmelerine yardımcı olmak, yenilikçi projeler geliştirmek ve bilimsel farkındalığı artırarak toplumsal değişime katkıda bulunmak.",
    vision: "Bilim ve teknoloji odaklı bir topluluk olarak, genç yetenekleri destekleyerek inovasyonun öncüsü olmak ve küresel çapta tanınan bir platform haline gelmek.",
    values: [
      {
        id: "innovation",
        title: "İnovasyon",
        description: "Geleceği şekillendiren yenilikçi fikirler üretmek ve bunları hayata geçirmek için sürekli araştırma yapıyoruz.",
        icon: "Lightbulb"
      },
      {
        id: "collaboration",
        title: "İşbirliği",
        description: "Farklı disiplinlerden uzmanlar ve gençlerle birlikte çalışarak daha güçlü ve etkili çözümler geliştiriyoruz.",
        icon: "Users"
      },
      {
        id: "excellence",
        title: "Mükemmellik",
        description: "Her projede en yüksek kalite standartlarını hedefleyerek sürekli gelişim ve öğrenme kültürünü benimseriz.",
        icon: "Award"
      },
      {
        id: "impact",
        title: "Etki",
        description: "Toplumsal faydaya odaklanarak, projelerimizin gerçek dünyada pozitif değişim yaratmasını sağlıyoruz.",
        icon: "Target"
      },
      {
        id: "community",
        title: "Topluluk",
        description: "Gençleri destekleyen, kapsayıcı ve ilham verici bir topluluk atmosferi oluşturarak birlikte büyüyoruz.",
        icon: "Heart"
      }
    ],
    history: [
      {
        year: "2019",
        title: "Kuruluş",
        description: "UNILAB Vision, genç vizyonerler tarafından bilim ve teknoloji odaklı bir platform olarak kuruldu."
      },
      {
        year: "2020",
        title: "İlk Projeler",
        description: "Ar-Ge ve yazılım geliştirme alanlarında ilk projelerimizi hayata geçirdik ve topluluk büyümeye başladı."
      },
      {
        year: "2021",
        title: "Medya Platformu",
        description: "Sosyal medya platformlarımızda bilim ve teknoloji içerikleri paylaşmaya başlayarak geniş kitlelere ulaştık."
      },
      {
        year: "2022",
        title: "Etkinlik Düzenleme",
        description: "Online ve fiziki etkinlikler düzenleyerek bilgi paylaşımı ve networking imkanları sunduk."
      },
      {
        year: "2023",
        title: "50K+ Topluluk",
        description: "50.000'den fazla takipçiye ulaşarak Türkiye'nin önde gelen bilim topluluklarından biri olduk."
      },
      {
        year: "2024",
        title: "Küresel Vizyon",
        description: "Uluslararası projeler ve işbirlikleri ile küresel çapta tanınan bir platform haline geldik."
      }
    ],
    team: [
      {
        id: 1,
        name: "Yasin Polat",
        role: "Founder & Co-CEO",
        bio: "UNILAB Vision'ın kurucusu olarak, bilim ve teknoloji alanında gençlerin potansiyelini ortaya çıkarma vizyonuyla liderlik ediyor."
      },
      {
        id: 2,
        name: "Burcu Özmenteşe",
        role: "Co-CEO",
        bio: "Stratejik planlama ve operasyonel yönetimde uzmanlaşarak UNILAB Vision'ın büyümesine öncülük ediyor."
      },
      {
        id: 3,
        name: "Hatice Eliz Meraklı",
        role: "UNICOM Event Genel Koordinatörü",
        bio: "Etkinlik yönetimi alanındaki deneyimiyle, etkili ve ilham verici etkinlikler organize ediyor."
      },
      
    ]
  },
  en: {
    title: "About Us",
    description: "MyUNI is an AI-powered, innovative educational platform. It provides transformative learning experiences for individuals and institutions. Through its interdisciplinary approach, cutting-edge technologies, and AI-supported infrastructure, we offer highly effective solutions in both personal development and corporate education.",
    seoDescription: "MyUNI is an AI-powered innovative education platform. We provide transformative learning experiences for individuals and institutions.",
    mission: "To help young people discover their potential in science and technology, develop innovative projects, and contribute to social change by increasing scientific awareness.",
    vision: "As a science and technology-focused community, to be a pioneer of innovation by supporting young talents and become a globally recognized platform.",
    values: [
      {
        id: "innovation",
        title: "Innovation",
        description: "We continuously research to generate innovative ideas that shape the future and bring them to life.",
        icon: "Lightbulb"
      },
      {
        id: "collaboration",
        title: "Collaboration",
        description: "We develop stronger and more effective solutions by working with experts and young people from different disciplines.",
        icon: "Users"
      },
      {
        id: "excellence",
        title: "Excellence",
        description: "We aim for the highest quality standards in every project and embrace a culture of continuous improvement and learning.",
        icon: "Award"
      },
      {
        id: "impact",
        title: "Impact",
        description: "Focusing on social benefit, we ensure that our projects create positive change in the real world.",
        icon: "Target"
      },
      {
        id: "community",
        title: "Community",
        description: "We grow together by creating a supportive, inclusive and inspiring community atmosphere for young people.",
        icon: "Heart"
      }
    ],
    history: [
      {
        year: "2019",
        title: "Foundation",
        description: "UNILAB Vision was founded by young visionaries as a science and technology-focused platform."
      },
      {
        year: "2020",
        title: "First Projects",
        description: "We launched our first projects in R&D and software development, and the community began to grow."
      },
      {
        year: "2021",
        title: "Media Platform",
        description: "We started sharing science and technology content on our social media platforms, reaching wide audiences."
      },
      {
        year: "2022",
        title: "Event Organization",
        description: "We organized online and physical events, providing knowledge sharing and networking opportunities."
      },
      {
        year: "2023",
        title: "50K+ Community",
        description: "We reached over 50,000 followers, becoming one of Turkey's leading science communities."
      },
      {
        year: "2024",
        title: "Global Vision",
        description: "We became a globally recognized platform through international projects and collaborations."
      }
    ],
    team: [
      {
        id: 1,
        name: "Yasin Polat",
        role: "Founder & Co-CEO",
        bio: "As the founder of UNILAB Vision, he leads with a vision to unleash the potential of young people in science and technology."
      },
      {
        id: 2,
        name: "Burcu Özmenteşe",
        role: "Co-CEO",
        bio: "Specializing in strategic planning and operational management, she leads UNILAB Vision's growth."
      },
      {
        id: 3,
        name: "Hatice Eliz Meraklı",
        role: "UNICOM Event General Coordinator",
        bio: "With her experience in event management, she organizes effective and inspiring events."
      },
      {
        id: 4,
        name: "Helin Arıtürk",
        role: "Darkpost Media General Coordinator",
        bio: "Specializing in media and content strategies, she ensures effective communication with the community."
      },
      {
        id: 5,
        name: "Ecem Erbil",
        role: "BYM Turkey President",
        bio: "Leading the bioengineering community, she conducts scientific projects and educational programs."
      }
    ]
  }
};

export default content;