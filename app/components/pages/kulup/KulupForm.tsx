'use client';

import React, { useState, useEffect } from 'react';
import { Send, User, Phone, MessageSquare, AlertCircle, CheckCircle, Mail, Building, Heart, Share2 } from 'lucide-react';

interface KulupFormProps {
  locale?: string;
}

interface FormConfig {
  id: string;
  form_name: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  submit_button_text: Record<string, string>;
  success_message: Record<string, string>;
  privacy_notice: Record<string, string>;
  terms_and_conditions?: Record<string, string>;
}

interface FormField {
  id: string;
  field_key: string;
  field_type: string;
  label: Record<string, string>;
  placeholder?: Record<string, string>;
  is_required: boolean;
  validation_rules?: Record<string, unknown>;
  options?: Record<string, string[]>;
  sort_order: number;
  grid_columns: number;
}

interface FormData {
  [key: string]: string | boolean;
}

// Icon mapping for field types
const getFieldIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'email': return Mail;
    case 'tel': return Phone;
    case 'textarea': return MessageSquare;
    case 'checkbox': return CheckCircle;
    default: return User;
  }
};

export default function KulupForm({ locale = 'tr' }: KulupFormProps) {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch form configuration
  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        console.log('Fetching form configuration...');
        const response = await fetch('/api/kulup-form-config');
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Form config data:', data);
          setFormConfig(data.config);
          setFormFields(data.fields);
          
          // Initialize form data
          const initialData: FormData = {};
          data.fields.forEach((field: FormField) => {
            if (field.field_type === 'checkbox') {
              initialData[field.field_key] = false;
            } else {
              initialData[field.field_key] = '';
            }
          });
          // Initialize privacy consent
          initialData.privacy_consent = false;
          // Initialize terms consent
          initialData.terms_consent = false;
          setFormData(initialData);
          
          // Scroll to form after it's loaded
          setTimeout(() => {
            const formElement = document.querySelector('[data-form-section]');
            if (formElement) {
              formElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }
          }, 100);
        } else {
          const errorData = await response.json();
          console.error('API error:', errorData);
        }
      } catch (error) {
        console.error('Error fetching form config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormConfig();
  }, []);
  
  const handleInputChange = (fieldKey: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };
  
  const validateField = (field: FormField, value: unknown): string => {
    if (field.is_required && (!value || (typeof value === 'string' && !value.trim()))) {
      return locale === 'en' ? 'This field is required' : 'Bu alan zorunludur';
    }

    if (field.validation_rules && typeof value === 'string') {
      const rules = field.validation_rules;
      
      if (typeof rules.minLength === 'number' && value.length < rules.minLength) {
        return locale === 'en' 
          ? `Minimum ${rules.minLength} characters required`
          : `En az ${rules.minLength} karakter gerekli`;
      }
      
      if (typeof rules.maxLength === 'number' && value.length > rules.maxLength) {
        return locale === 'en' 
          ? `Maximum ${rules.maxLength} characters allowed`
          : `En fazla ${rules.maxLength} karakter olabilir`;
      }
      
      if (typeof rules.pattern === 'string' && !new RegExp(rules.pattern).test(value)) {
        return locale === 'en' ? 'Invalid format' : 'Geçersiz format';
      }
    }

    return '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    formFields.forEach(field => {
      const error = validateField(field, formData[field.field_key]);
      if (error) {
        newErrors[field.field_key] = error;
      }
    });
    
    // Validate privacy consent if privacy notice exists
    if (formConfig?.privacy_notice && !formData.privacy_consent) {
      newErrors.privacy_consent = locale === 'en' 
        ? 'You must accept the privacy policy to continue' 
        : 'Devam etmek için gizlilik politikasını kabul etmelisiniz';
    }
    
    // Validate terms consent if terms and conditions exist
    if (formConfig?.terms_and_conditions && !formData.terms_consent) {
      newErrors.terms_consent = locale === 'en' 
        ? 'You must accept the terms and conditions to continue' 
        : 'Devam etmek için kullanım şartlarını kabul etmelisiniz';
    }
    
    setErrors(newErrors);
    
    // If there are errors, scroll to the first error
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const firstErrorField = Object.keys(newErrors)[0];
        const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', formData);
      console.log('Privacy consent:', formData.privacy_consent);
      console.log('Terms consent:', formData.terms_consent);
      
      const response = await fetch('/api/kulup-basvuru', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Form submitted successfully:', result);
        setIsSubmitted(true);
      } else {
        console.error('Form submission error:', result);
        setErrors(prev => ({ 
          ...prev, 
          form: result.error || (locale === 'en' ? 'An error occurred while submitting the form' : 'Form gönderilirken hata oluştu')
        }));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors(prev => ({ 
        ...prev, 
        form: locale === 'en' ? 'An error occurred while submitting the form' : 'Form gönderilirken hata oluştu' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'textarea': return MessageSquare;
      default: return User;
    }
  };
  
  const renderField = (field: FormField) => {
    const Icon = getFieldIcon(field.field_type);
    const hasError = !!errors[field.field_key];
    const value = formData[field.field_key] as string | boolean;
    const label = field.label[locale] || field.label['tr'];
    const placeholder = field.placeholder?.[locale] || field.placeholder?.['tr'] || '';
    const options = field.options?.[locale] || field.options?.['tr'] || [];

    const inputClassName = `w-full px-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
      hasError ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
    }`;

    const iconInputClassName = `w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
      hasError ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
    }`;

    return (
      <div key={field.id} className={field.grid_columns === 2 ? 'md:col-span-2' : 'md:col-span-1'} data-field={field.field_key}>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label} {field.is_required && <span className="text-red-500">*</span>}
        </label>
        
        {field.field_type === 'textarea' ? (
          <textarea
            value={value as string}
            onChange={(e) => handleInputChange(field.field_key, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={inputClassName}
          />
        ) : field.field_type === 'select' ? (
          <div className="relative">
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select
              value={value as string}
              onChange={(e) => handleInputChange(field.field_key, e.target.value)}
              className={iconInputClassName}
            >
              <option value="">{placeholder}</option>
              {options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
        ) : field.field_type === 'checkbox' ? (
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id={field.field_key}
                checked={value as boolean}
                onChange={(e) => handleInputChange(field.field_key, e.target.checked)}
                className={`w-4 h-4 text-[#990000] bg-gray-100 rounded focus:ring-[#990000] focus:ring-2 ${
                  hasError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            <div className="text-sm">
              <label htmlFor={field.field_key} className="font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                {label}
              </label>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type={field.field_type}
              value={value as string}
              onChange={(e) => handleInputChange(field.field_key, e.target.value)}
              placeholder={placeholder}
              className={iconInputClassName}
            />
          </div>
        )}
        
        {hasError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors[field.field_key]}
          </p>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#990000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">
              {locale === 'en' ? 'Loading form...' : 'Form yükleniyor...'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!formConfig || !formFields.length) {
    return (
      <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                {locale === 'en' ? 'Form Configuration Not Found' : 'Form Yapılandırması Bulunamadı'}
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">
                {locale === 'en' 
                  ? 'The form configuration could not be loaded. Please check the following:'
                  : 'Form yapılandırması yüklenemedi. Lütfen aşağıdakileri kontrol edin:'}
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 text-left space-y-1">
                <li>• {locale === 'en' ? 'Database tables exist' : 'Veritabanı tabloları mevcut'}</li>
                <li>• {locale === 'en' ? 'SQL script has been executed' : 'SQL scripti çalıştırıldı'}</li>
                <li>• {locale === 'en' ? 'API endpoint is accessible' : 'API endpoint erişilebilir'}</li>
              </ul>
              <p className="text-xs text-red-500 dark:text-red-400 mt-4">
                {locale === 'en' 
                  ? 'Check browser console for detailed error information.'
                  : 'Detaylı hata bilgisi için tarayıcı konsolunu kontrol edin.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isSubmitted) {
    return (
      <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-left max-w-2xl">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-medium text-green-900 dark:text-green-100 mb-2">
              {formConfig.success_message[locale] || formConfig.success_message['tr']}
            </h3>
          </div>
        </div>
      </section>
    );
  }
  
  const title = formConfig.title[locale] || formConfig.title['tr'];
  const subtitle = formConfig.subtitle[locale] || formConfig.subtitle['tr'];
  const submitButtonText = formConfig.submit_button_text[locale] || formConfig.submit_button_text['tr'];
  
  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20" data-form-section>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-left">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
            {title}
          </h2>
          <div className="w-16 h-px bg-[#990000] dark:bg-white mb-6"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {subtitle}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Group fields by sections based on sort_order */}
          {(() => {
            const sections = [
              { start: 1, end: 6, title: locale === 'en' ? '1. Club Information' : '1. Kulüp Bilgileri', icon: Building },
              { start: 7, end: 11, title: locale === 'en' ? '2. Representative Information' : '2. Temsilci Bilgileri', icon: User },
              { start: 12, end: 14, title: locale === 'en' ? '3. About the Club' : '3. Kulüp Hakkında', icon: Heart },
              { start: 15, end: 17, title: locale === 'en' ? '4. Collaboration & Expectations' : '4. İş Birliği & Beklentiler', icon: Share2 },
              { start: 18, end: 18, title: locale === 'en' ? '5. Consent & Attachments' : '5. Onay & Ekler', icon: CheckCircle }
            ];

            return sections.map((section, sectionIndex) => {
              const sectionFields = formFields.filter(field => 
                field.sort_order >= section.start && field.sort_order <= section.end
              );
              
              if (sectionFields.length === 0) return null;
              
              // Remove duplicates based on field_key
              const uniqueFields = sectionFields.filter((field, index, self) => 
                index === self.findIndex(f => f.field_key === field.field_key)
              );
              
              const SectionIcon = section.icon;
              
              return (
                <div key={sectionIndex} className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                    <SectionIcon className="w-5 h-5 text-[#990000] dark:text-white" />
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {uniqueFields.map(field => renderField(field))}
                  </div>
                </div>
              );
            });
          })()}
          
          {/* Privacy Notice (KVKK) */}
          {formConfig.privacy_notice && (
            <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-3">
                {locale === 'en' ? 'Personal Data Protection Information' : 'Kişisel Verilerin Korunması Hakkında Bilgilendirme'}
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed mb-4">
                {formConfig.privacy_notice[locale] || formConfig.privacy_notice['tr']}
                <br />
                <a 
                  href={locale === 'en' ? '/en/privacy' : '/tr/gizlilik'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#990000] dark:text-[#ff6666] hover:underline font-medium"
                >
                  {locale === 'en' ? 'Read our full Privacy Policy' : 'Gizlilik Politikamızı okuyun'}
                </a>
              </p>
              
              {/* Consent Checkbox */}
              <div className="flex items-start gap-3" data-field="privacy_consent">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="privacy_consent"
                    checked={formData.privacy_consent as boolean || false}
                    onChange={(e) => handleInputChange('privacy_consent', e.target.checked)}
                    className={`w-4 h-4 text-[#990000] bg-gray-100 rounded focus:ring-[#990000] focus:ring-2 ${
                      errors.privacy_consent ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="privacy_consent" className="font-medium text-green-900 dark:text-green-100 cursor-pointer">
                    {locale === 'en' 
                      ? 'I have read and accept the privacy policy.' 
                      : 'Gizlilik politikasını okudum ve kabul ediyorum.'}
                  </label>
                </div>
              </div>
              
              {/* Privacy Consent Error */}
              {errors.privacy_consent && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.privacy_consent}
                </p>
              )}
            </div>
          )}
          
          {/* Terms and Conditions */}
          {formConfig.terms_and_conditions && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {locale === 'en' ? 'Terms and Conditions' : 'Kullanım Şartları ve Koşulları'}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                {formConfig.terms_and_conditions[locale] || formConfig.terms_and_conditions['tr']}
                <br />
                <a 
                  href={locale === 'en' ? '/en/terms' : '/tr/sartlar-ve-kosullar'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#990000] dark:text-[#ff6666] hover:underline font-medium"
                >
                  {locale === 'en' ? 'Read our full Terms and Conditions' : 'Kullanım Şartları ve Koşullarını okuyun'}
                </a>
              </p>
              
              {/* Terms Consent Checkbox */}
              <div className="flex items-start gap-3" data-field="terms_consent">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="terms_consent"
                    checked={formData.terms_consent as boolean || false}
                    onChange={(e) => handleInputChange('terms_consent', e.target.checked)}
                    className={`w-4 h-4 text-[#990000] bg-gray-100 rounded focus:ring-[#990000] focus:ring-2 ${
                      errors.terms_consent ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="terms_consent" className="font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer">
                    {locale === 'en' 
                      ? 'I have read and accept the terms and conditions.' 
                      : 'Kullanım şartları ve koşullarını okudum ve kabul ediyorum.'}
                  </label>
                </div>
              </div>
              
              {/* Terms Consent Error */}
              {errors.terms_consent && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.terms_consent}
                </p>
              )}
            </div>
          )}
          
          {/* Form Error */}
          {errors.form && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.form}
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="text-left">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#990000] dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-[#800000] dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>{locale === 'en' ? 'Submitting...' : 'Gönderiliyor...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitButtonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
