"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Award, Download, Share2, CheckCircle, Shield, Eye } from 'lucide-react';

// Types
interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  organizer_name: string | null;
  start_date: string;
  end_date: string | null;
  duration_minutes: number | null;
  category: string | null;
  tags: string[] | null;
}

interface ComponentTexts {
  [key: string]: string;
}

interface EventCertificateProps {
  event?: Event;
  userId?: string;
  texts?: ComponentTexts;
}

const EventCertificate: React.FC<EventCertificateProps> = ({ 
  event = {
    id: '',
    title: '',
    description: null,
    event_type: 'webinar',
    organizer_name: null,
    start_date: new Date().toISOString(),
    end_date: null,
    duration_minutes: null,
    category: null,
    tags: null
  },
  userId = 'guest',
  texts = {}
}) => {
  // Helper function to get text with fallback
  const getText = (key: string, fallback: string): string => {
    return texts[key] || fallback;
  };

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'preview'>('overview');

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="text-left">
        <h2 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {getText('certificateTitle', 'Katılım Sertifikası')}
        </h2>
        <div className="w-16 h-px bg-[#990000] mb-6"></div>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          {getText('certificateDesc', 'Bu etkinlik programı, konuyla ilgili temel bilgileri öğrenmenize ve kendinizi geliştirmenize yardımcı olur. Etkinliği başarıyla tamamladığınızda')}{" "}
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {getText('certificateEarn', 'katılım sertifikası almaya hak kazanırsınız.')}
          </span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex">
        <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 rounded-sm p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-sm text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Sertifika Hakkında</span>
          </button>
          
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-sm text-sm font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Önizleme</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-left p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {getText('certificateSecurity', 'Sertifika Güvenliği')}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('securityDesc', 'Sertifikanız veri tabanımızda güvenle korunur ve değiştirilemez')}
                </p>
              </div>

              <div className="text-left p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                  <Share2 className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {getText('linkedinIntegration', 'LinkedIn Entegrasyonu')}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('linkedinDesc', 'Tek tıkla LinkedIn profilinize ekleyin')}
                </p>
              </div>

              <div className="text-left p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {getText('pdfDownload', 'PDF İndirme')}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('downloadDesc', 'Yüksek kalitede PDF, PNG, JPG formatında')}
                </p>
              </div>
            </div>

            {/* Event Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-left p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  {getText('totalCertificates', '700+')}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('certificatesIssued', 'Verilen Sertifika')}
                </div>
              </div>

              <div className="text-left p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  {getText('completionRate', '89%')}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('participationRate', 'Katılım Oranı')}
                </div>
              </div>

              <div className="text-left p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  {getText('partnerships', '3+')}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('partnersCount', 'İş Birliği Yapılan Kurum')}
                </div>
              </div>

              <div className="text-left p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                  {getText('satisfaction', '94%')}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('satisfactionRate', 'Memnuniyet Oranı')}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-8">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <span>{getText('requirements', 'Sertifika Alma Koşulları')}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {getText('attendEvent', 'Etkinliğe tam katılım sağlama')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {getText('activeParticipation', 'Aktif katılım ve etkileşim')}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {getText('sessionCompletion', 'Tüm oturumları tamamlama')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {getText('feedbackSubmission', 'Geri bildirim formunu doldurma')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-sm">
                <div className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {getText('autoGeneration', 'Koşulları sağladığınızda sertifikanız otomatik olarak hazırlanır!')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-8">
            {/* Certificate Preview Image */}
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-white dark:bg-neutral-100 rounded-sm border border-neutral-200 dark:border-neutral-300 overflow-hidden aspect-[16/9] group cursor-pointer">
                <Image
                  src="/tr/images/myuni-certificate.png"
                  alt="Etkinlik Sertifikası Önizlemesi"
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-hover:rotate-1"
                  priority
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500"></div>
              </div>
            </div>

            {/* Certificate Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-left p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {getText('certificateSecurity', 'Sertifika Güvenliği')}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('securityDesc', 'Sertifikalar veri tabanımızda güvenle korunur')}
                </p>
              </div>

              <div className="text-left p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {getText('instantVerification', 'Anında Doğrulama')}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('verificationDesc', 'Sertifika geçerliliği saniyeler içinde doğrulanabilir')}
                </p>
              </div>

              <div className="text-left p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {getText('globalRecognition', 'Global Tanınırlık')}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {getText('recognitionDesc', 'Dünya çapında işverenler tarafından tanınan sertifikalar')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCertificate;