// app/components/pages/about/MissionVision.tsx
'use client';

import React, { useState } from 'react';
import { Target, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';

interface MissionVisionProps {
  missionTitle: string;
  mission: string;
  visionTitle: string;
  vision: string;
  locale: string; // Add locale prop
}

const MissionVision: React.FC<MissionVisionProps> = ({ 
  missionTitle, 
  mission, 
  visionTitle, 
  vision,
  locale
}) => {
  const [activeSection, setActiveSection] = useState<'mission' | 'vision'>('mission');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Translations
  const t = {
    missionButton: locale === 'tr' ? 'Misyonumuz' : 'Our Mission',
    visionButton: locale === 'tr' ? 'Vizyonumuz' : 'Our Vision',
    goalsTitle: locale === 'tr' ? '2025 Hedeflerimiz' : 'Our 2025 Goals',
    missionCards: locale === 'tr' ? [
      { id: 1, title: 'Araştırma', desc: 'Disiplinler arası bilimsel projeler' },
      { id: 2, title: 'Eğitim', desc: 'Seminerler ve mentorluk programları' },
      { id: 3, title: 'İnovasyon', desc: 'Yenilikçi biyomühendislik çözümleri' },
      { id: 4, title: 'Topluluk', desc: 'İş birliği ve network fırsatları' }
    ] : [
      { id: 1, title: 'Research', desc: 'Interdisciplinary scientific projects' },
      { id: 2, title: 'Education', desc: 'Seminars and mentorship programs' },
      { id: 3, title: 'Innovation', desc: 'Innovative bioengineering solutions' },
      { id: 4, title: 'Community', desc: 'Collaboration and networking opportunities' }
    ],
    visionGoals: locale === 'tr' ? [
      { id: 1, text: 'Uluslararası biyomühendislik projelerinde lider rol', achieved: false },
      { id: 2, text: '10+ üniversite ile aktif iş birliği', achieved: true },
      { id: 3, text: '1000+ aktif topluluk üyesi', achieved: false },
      { id: 4, text: '50+ bilimsel yayın ve araştırma', achieved: true }
    ] : [
      { id: 1, text: 'Leading role in international bioengineering projects', achieved: false },
      { id: 2, text: 'Active collaboration with 10+ universities', achieved: true },
      { id: 3, text: '1000+ active community members', achieved: false },
      { id: 4, text: '50+ scientific publications and research', achieved: true }
    ]
  };

  return (
    <section className="py-20">
      <div className=" mx-auto">
        {/* Toggle Buttons */}
        <div className="flex mb-12">
          <button
            onClick={() => setActiveSection('mission')}
            className={`px-6 py-3 rounded-l-lg transition-all duration-300 ${
              activeSection === 'mission'
                ? 'bg-[#a90013] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.missionButton}
          </button>
          <button
            onClick={() => setActiveSection('vision')}
            className={`px-6 py-3 rounded-r-lg transition-all duration-300 ${
              activeSection === 'vision'
                ? 'bg-[#a90013] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.visionButton}
          </button>
        </div>

        {/* Content Container with Animation */}
        <div className="relative overflow-hidden">
          <div
            className={`transition-all duration-500 transform ${
              activeSection === 'mission' ? 'translate-x-0' : '-translate-x-full absolute'
            }`}
          >
            {/* Mission Section */}
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-16 bg-[#a90013] animate-pulse"></div>
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-[#a90013] animate-spin-slow" />
                  <h2 className="text-3xl font-semibold text-[#141414] dark:text-white">
                    {missionTitle}
                  </h2>
                </div>
                <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">
                  {mission}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {t.missionCards.map((card) => (
                  <div
                    key={card.id}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="relative group"
                  >
                    <div
                      className={`p-6 bg-white dark:bg-neutral-800 rounded-lg border-2 transition-all duration-300 cursor-pointer transform ${
                        hoveredCard === card.id
                          ? 'border-[#a90013] -translate-y-2 shadow-lg'
                          : 'border-transparent hover:border-[#a90013]/20'
                      }`}
                    >
                      <h4 className="font-medium text-lg text-[#141414] dark:text-white mb-2">
                        {card.title}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {card.desc}
                      </p>
                      <div
                        className={`absolute bottom-4 right-4 transform transition-all duration-300 ${
                          hoveredCard === card.id
                            ? 'translate-x-0 opacity-100'
                            : 'translate-x-4 opacity-0'
                        }`}
                      >
                        <ArrowRight className="w-5 h-5 text-[#a90013]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-500 transform ${
              activeSection === 'vision' ? 'translate-x-0' : 'translate-x-full absolute'
            }`}
          >
            {/* Vision Section */}
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-16 bg-[#a90013] animate-pulse"></div>
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-[#a90013]" />
                  <h2 className="text-3xl font-semibold text-[#141414] dark:text-white">
                    {visionTitle}
                  </h2>
                </div>
                <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">
                  {vision}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-xl text-[#141414] dark:text-white mb-6">
                  {t.goalsTitle}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {t.visionGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                        goal.achieved
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-[#a90013]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {goal.achieved ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                        <p className={goal.achieved ? 'text-green-700 dark:text-green-400' : 'text-neutral-600 dark:text-neutral-400'}>
                          {goal.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionVision;