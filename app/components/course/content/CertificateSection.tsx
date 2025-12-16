// components/course/content/CertificateSection.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Award, Download, ExternalLink, CheckCircle, Calendar, User, BookOpen, Clock } from 'lucide-react';
import { generateCertificate, checkCertificateEligibility } from '../../../../lib/certificateService';

interface CertificateSectionProps {
  courseId: string;
  userId?: string;
  courseName: string;
  instructorName: string;
  duration?: string;
  onCertificateGenerated?: (certificateNumber: string) => void;
}

// Updated Certificate interface to match the service
interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id: string;
  student_full_name: string;
  course_name: string;
  instructor_name: string;
  course_duration: string;
  organization_name: string;
  organization_description: string;
  instructor_bio: string;
  certificate_url: string | null;
  certificate_metadata: object;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Helper property for display
  issue_date?: string;
}

// Import the types from the service to avoid conflicts
import type { EligibilityCheck, CourseCertificate, EventCertificate } from '../../../../lib/certificateService';

export function CertificateSection({ 
  courseId, 
  userId, 
  courseName, 
  instructorName, 
  duration,
  onCertificateGenerated 
}: CertificateSectionProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<Certificate | CourseCertificate | EventCertificate | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityCheck | null>(null);

  // Helper functions to handle different certificate types
  const getCertificateName = (cert: Certificate | CourseCertificate | EventCertificate) => {
    if ('course_name' in cert) return cert.course_name;
    if ('event_name' in cert) return cert.event_name;
    return '';
  };

  const getInstructorName = (cert: Certificate | CourseCertificate | EventCertificate) => {
    if ('instructor_name' in cert) return cert.instructor_name;
    if ('organizer_name' in cert) return cert.organizer_name;
    return '';
  };

  const getDuration = (cert: Certificate | CourseCertificate | EventCertificate) => {
    if ('course_duration' in cert) return cert.course_duration;
    if ('event_duration' in cert) return cert.event_duration;
    return '';
  };

  const getIssueDate = (cert: Certificate | CourseCertificate | EventCertificate) => {
    if ('issue_date' in cert && cert.issue_date) return cert.issue_date;
    return cert.created_at;
  };

  const checkEligibility = useCallback(async () => {
    if (!userId || !courseId) return;

    try {
      setLoading(true);
      setError(null);
      
      const eligibilityData = await checkCertificateEligibility(userId, courseId);
      setEligibility(eligibilityData);

      // Eğer zaten sertifika alınmışsa, sertifikayı getir
      if (eligibilityData.isEligible && eligibilityData.existingCertificate) {
        // Add issue_date from created_at for display purposes
        const certificateWithIssueDate = {
          ...eligibilityData.existingCertificate,
          issue_date: eligibilityData.existingCertificate.created_at
        };
        setCertificate(certificateWithIssueDate);
      }

    } catch (err) {
      console.error('Sertifika uygunluk kontrolü hatası:', err);
      setError('Sertifika uygunluğu kontrol edilemedi');
    } finally {
      setLoading(false);
    }
  }, [userId, courseId]);

  const handleGenerateCertificate = async () => {
    if (!userId || !eligibility?.isEligible) return;

    try {
      setGenerating(true);
      setError(null);

      const newCertificate = await generateCertificate({
        userId,
        itemId: courseId,
        itemType: 'course',
        itemName: courseName,
        instructorName,
        duration: duration || '4 hafta',
        organization: 'MyUNI Eğitim Platformu',
        organizationDescription: 'Dijital eğitim platformu ile kaliteli ve erişilebilir online eğitim hizmetleri sunan öncü eğitim kurumu.',
        instructorBio: `${instructorName} - Alanında uzman eğitmen ve sektör profesyoneli.`
      });

      // Add issue_date from created_at for display purposes
      const certificateWithIssueDate = {
        ...newCertificate,
        issue_date: newCertificate.created_at
      };
      
      setCertificate(certificateWithIssueDate);
      
      if (onCertificateGenerated) {
        onCertificateGenerated(newCertificate.certificate_number);
      }

    } catch (err) {
      console.error('Sertifika oluşturma hatası:', err);
      setError('Sertifika oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setGenerating(false);
    }
  };

  const openCertificate = () => {
    if (certificate?.certificate_url) {
      window.open(certificate.certificate_url, '_blank', 'noopener,noreferrer');
    } else if (certificate?.certificate_number) {
      const certificateUrl = `https://certificates.myunilab.net/${certificate.certificate_number}`;
      window.open(certificateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto mb-4 flex items-center justify-center">
            <Award className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500">Sertifika durumu kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded mx-auto flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">Hata Oluştu</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
            <button
              onClick={checkEligibility}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!eligibility) {
    return null;
  }

  // Sertifika mevcut - göster
  if (certificate) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                Tebrikler! Sertifikanız Hazır
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Kursu başarıyla tamamladınız
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={openCertificate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Sertifikayı Görüntüle</span>
            </button>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-neutral-800">
          <div className="max-w-2xl mx-auto">
            {/* Certificate Preview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Başarı Sertifikası
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  Bu sertifika, aşağıdaki kursu başarıyla tamamladığınızı belgeler
                </p>
                
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                    {getCertificateName(certificate)}
                  </h5>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {getInstructorName(certificate)} tarafından verilmiştir
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                Sertifika Bilgileri
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <User className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Sertifika Sahibi
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {certificate.student_full_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Veriliş Tarihi
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDate(getIssueDate(certificate))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <BookOpen className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Kurs Adı
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {getCertificateName(certificate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <Clock className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Kurs Süresi
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {getDuration(certificate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Number */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Sertifika Numarası
                    </p>
                    <p className="text-lg font-mono text-yellow-800 dark:text-yellow-200">
                      {certificate.certificate_number}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(certificate.certificate_number)}
                    className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-900 dark:text-yellow-100 rounded text-sm transition-colors"
                  >
                    Kopyala
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={openCertificate}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Sertifikayı Görüntüle</span>
                </button>
                
                <button
                  onClick={() => {
                    const shareUrl = certificate.certificate_url || `https://certificates.myunilab.net/${certificate.certificate_number}`;
                    navigator.clipboard.writeText(shareUrl);
                    // Toast mesajı gösterilebilir
                  }}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Linki Paylaş</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sertifika uygunluk durumu
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            eligibility.isEligible 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : 'bg-amber-100 dark:bg-amber-900/20'
          }`}>
            <Award className={`w-6 h-6 ${
              eligibility.isEligible 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-amber-600 dark:text-amber-400'
            }`} />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              {eligibility.isEligible ? 'Sertifika Almaya Hazırsınız!' : 'Sertifika İlerlemesi'}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {eligibility.isEligible 
                ? 'Tüm gereksinimleri tamamladınız' 
                : 'Sertifika alabilmek için kalan gereksinimler'
              }
            </p>
          </div>
        </div>
        
        {eligibility.isEligible && (
          <button
            onClick={handleGenerateCertificate}
            disabled={generating}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                <span>Sertifikamı Al</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Progress Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-neutral-800">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Overall Progress */}
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-6">
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              Genel İlerleme
            </h4>
            
            <div className="space-y-4">
              {/* Lessons Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    eligibility.completedLessons === eligibility.totalLessons
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-amber-100 dark:bg-amber-900/20'
                  }`}>
                    <BookOpen className={`w-4 h-4 ${
                      eligibility.completedLessons === eligibility.totalLessons
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Ders Tamamlama
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {eligibility.completedLessons} / {eligibility.totalLessons} ders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {Math.round((eligibility.completedLessons / eligibility.totalLessons) * 100)}%
                  </p>
                  {eligibility.completedLessons === eligibility.totalLessons && (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-auto" />
                  )}
                </div>
              </div>

              {/* Quiz Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    eligibility.completedQuizzes === eligibility.totalQuizzes && eligibility.averageQuizScore >= 70
                      ? 'bg-green-100 dark:bg-green-900/20'
                      : 'bg-amber-100 dark:bg-amber-900/20'
                  }`}>
                    <Award className={`w-4 h-4 ${
                      eligibility.completedQuizzes === eligibility.totalQuizzes && eligibility.averageQuizScore >= 70
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Sınav Başarısı
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {eligibility.completedQuizzes} / {eligibility.totalQuizzes} sınav • Ortalama: {eligibility.averageQuizScore}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {eligibility.averageQuizScore}%
                  </p>
                  {eligibility.completedQuizzes === eligibility.totalQuizzes && eligibility.averageQuizScore >= 70 && (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 ml-auto" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Missing Requirements */}
          {!eligibility.isEligible && eligibility.missingRequirements.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-3">
                Tamamlanması Gerekenler
              </h4>
              <ul className="space-y-2">
                {eligibility.missingRequirements.map((requirement: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-amber-800 dark:text-amber-200">
                    <div className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certificate Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              Sertifika Hakkında
            </h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• Sertifikanız MyUNI Eğitim Platformu tarafından verilecektir</p>
              <p>• Sertifika numaranız benzersiz olacak ve doğrulanabilir olacaktır</p>
              <p>• Sertifikanıza certificates.myunilab.net adresinden ulaşabilirsiniz</p>
              <p>• Sertifikanızı LinkedIn ve diğer platformlarda paylaşabilirsiniz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}