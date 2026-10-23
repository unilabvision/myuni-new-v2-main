import {
  Award,
  Clock,
  GraduationCap,
  Shield,
  Users,
  Zap,
} from 'lucide-react';

interface WhyChooseSectionProps {
  locale?: string;
}

const content = {
  tr: {
    label: 'MyUNI ile öğrenmek',
    title: 'Öğrenmeye ayırdığınız zamanı daha anlamlı hale getirin.',
    description:
      'İçeriği çoğaltmak yerine doğru sıraya koyuyoruz. Hedefinize uygun eğitim, uzman desteği ve esnek çalışma düzeni aynı deneyimde buluşuyor.',
    features: [
      {
        icon: GraduationCap,
        title: 'Size uygun öğrenme yolu',
        description:
          'Seviyenize ve hedefinize göre hangi eğitimle başlayacağınızı netleştirin.',
      },
      {
        icon: Users,
        title: 'Uzmanlarla doğrudan temas',
        description:
          'Eğitmen ve mentörlerin deneyiminden yararlanarak sorularınıza yön bulun.',
      },
      {
        icon: Award,
        title: 'Görünür kazanımlar',
        description:
          'Tamamladığınız programları sertifika ve gelişim kayıtlarıyla belgeleyin.',
      },
      {
        icon: Clock,
        title: 'Kendi temponuzda ilerleme',
        description:
          'İşinize, okulunuza ve günlük düzeninize uyum sağlayan esnek erişim kullanın.',
      },
      {
        icon: Shield,
        title: 'Güvenilir altyapı',
        description:
          'Eğitimlerinize ve ödemelerinize güvenli bir platform üzerinden erişin.',
      },
      {
        icon: Zap,
        title: 'Kolay başlangıç',
        description:
          'Gereksiz adımlarla uğraşmadan hesabınızı oluşturun ve öğrenmeye başlayın.',
      },
    ],
  },
  en: {
    label: 'Learning with MyUNI',
    title: 'Make the time you spend learning more meaningful.',
    description:
      'We focus on putting the right content in the right order. Goal-oriented courses, expert support, and flexible study come together in one experience.',
    features: [
      {
        icon: GraduationCap,
        title: 'A path that fits you',
        description:
          'Clarify where to begin based on your current level and goal.',
      },
      {
        icon: Users,
        title: 'Direct access to experts',
        description:
          'Use instructor and mentor experience to find direction for your questions.',
      },
      {
        icon: Award,
        title: 'Progress you can show',
        description:
          'Document completed programs through certificates and learning records.',
      },
      {
        icon: Clock,
        title: 'Progress at your pace',
        description:
          'Learn with flexible access that works around your job, school, and routine.',
      },
      {
        icon: Shield,
        title: 'Reliable infrastructure',
        description:
          'Access your learning and payments through a secure platform.',
      },
      {
        icon: Zap,
        title: 'A simple start',
        description:
          'Create your account and start learning without unnecessary steps.',
      },
    ],
  },
};

export default function WhyChooseSection({
  locale = 'tr',
}: WhyChooseSectionProps) {
  const currentContent = content[locale as keyof typeof content] || content.tr;

  return (
    <section className="bg-neutral-950 py-16 text-white sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:px-8">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-3 text-sm font-medium text-[#e08b94]">
            <span className="h-px w-8 bg-current" aria-hidden="true" />
            <span>{currentContent.label}</span>
          </div>
          <h2 className="mt-7 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
            {currentContent.title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg sm:leading-8">
            {currentContent.description}
          </p>
        </div>

        <div className="grid border-t border-neutral-800 sm:grid-cols-2">
          {currentContent.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="border-b border-neutral-800 py-7 sm:min-h-56 sm:px-7 sm:py-8 sm:odd:border-r"
              >
                <Icon className="h-5 w-5 text-[#e08b94]" aria-hidden="true" />
                <h3 className="mt-6 text-lg font-semibold tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
