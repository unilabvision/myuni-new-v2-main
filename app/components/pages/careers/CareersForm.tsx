'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import {
  Send, Upload, FileText, User, Mail, Phone, Briefcase,
  FileUp, X, CheckCircle, Calendar, MessageSquare, AlertCircle,
  ChevronDown, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DynamicFormProps {
  formName: string;
  locale?: string;
}

interface FieldValidationRules {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  maxFileSizeBytes?: number;
  allowedMimeTypes?: string[];
}

// Define interfaces locally
interface FormConfig {
  id: string;
  form_name: string;
  title: Record<string, string>;
  subtitle?: Record<string, string>;
  is_active: boolean;
  success_message: Record<string, string>;
  submit_button_text: Record<string, string>;
  terms_and_conditions?: Record<string, string>;
  privacy_notice?: Record<string, string>;
}

interface FormField {
  id: string;
  field_key: string;
  field_type: string;
  label: Record<string, string>;
  placeholder?: Record<string, string>;
  is_required: boolean;
  grid_columns: number;
  options?: Record<string, string[] | string> | null;
  sort_order: number;
  validation_rules?: FieldValidationRules | null;
}

// Upload file function
async function uploadFile(file: File, fileName: string) {
  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('form-uploads')
      .upload(`uploads/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('form-uploads')
      .getPublicUrl(data.path);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

// Get form config function
async function getFormConfig(formName: string): Promise<FormConfig | null> {
  try {
    const { data, error } = await supabase
      .from('unilab_vision_form_configs')
      .select('*')
      .eq('form_name', formName)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Form config error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get form config error:', error);
    return null;
  }
}

// Get form fields function
async function getFormFields(configId: string): Promise<FormField[]> {
  try {
    const { data, error } = await supabase
      .from('unilab_vision_form_fields')
      .select('*')
      .eq('form_config_id', configId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Form fields error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get form fields error:', error);
    return [];
  }
}

// Define proper types for form data values
type FormDataValue = string | number | boolean | string[] | File | null | undefined;

// Define the submit result interface
interface SubmitResult {
  success: boolean;
  error?: string;
  submissionId?: string;
  formTitle?: string;
  emailSent?: boolean;
  emailError?: string;
  emailErrors?: string[];
  message?: string;
}

// Define FileUpload interface to match Supabase expectations
interface FileUpload {
  name: string;
  size: number;
  type: string;
  data: string | Buffer;
  lastModified?: number;
}

// Helper function to convert File to FileUpload
const fileToFileUpload = async (file: File): Promise<FileUpload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
        lastModified: file.lastModified,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const DEFAULT_ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || Number.isNaN(bytes)) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
};

const extractAllowedMimeTypes = (field?: FormField): string[] => {
  const allowed = field?.validation_rules?.allowedMimeTypes;
  return Array.isArray(allowed) && allowed.length > 0
    ? allowed.filter((type): type is string => typeof type === 'string')
    : DEFAULT_ALLOWED_FILE_TYPES;
};

const getMaxFileSize = (field?: FormField): number => {
  const value = field?.validation_rules?.maxFileSizeBytes;
  return typeof value === 'number' && value > 0 ? value : DEFAULT_MAX_FILE_SIZE;
};

const describeAllowedTypes = (types: string[]): string => {
  if (!types.length) return 'PDF, DOC, DOCX';
  return types
    .map(type => MIME_LABELS[type] || type.split('/').pop()?.toUpperCase() || type)
    .join(', ');
};

const buildAcceptValue = (types: string[]): string => {
  if (!types.length) return '.pdf,.doc,.docx';
  return types.join(',');
};

const legacyBrandPatterns: [RegExp, string][] = [
  [/un[\u0131iIİ]lab[\s-]*v[\u0131iIİ]s[\u0131iIİ]on/giu, 'MyUNI'],
  [/v[\u0131iIİ]s[\u0131iIİ]on[\s-]*un[\u0131iIİ]lab/giu, 'MyUNI'],
  [/un[\u0131iIİ]lab/giu, 'MyUNI'],
  [/MyUni/g, 'MyUNI'],
];

const replaceLegacyBranding = (text?: string | null): string => {
  if (!text) return '';
  return legacyBrandPatterns.reduce(
    (updatedText, [pattern, replacement]) => updatedText.replace(pattern, replacement),
    text
  );
};

const getLocalizedCopy = (
  value: Record<string, string> | undefined | null,
  locale: string,
  fallback = ''
): string => {
  if (!value) return fallback;
  const localized = value[locale] ?? value['tr'] ?? Object.values(value).find(Boolean) ?? fallback;
  return replaceLegacyBranding(localized);
};

// Multi-Select Component
interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  hasError: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  hasError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newValues);
  };

  const removeOption = (option: string) => {
    const newValues = selectedValues.filter(v => v !== option);
    onChange(newValues);
  };

  const displayText = selectedValues.length > 0 
    ? `${selectedValues.length} seçenek seçildi`
    : placeholder;

  if (options.length === 0) {
    return (
      <div className="p-3 text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-md">
        Seçenek bulunamadı
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected items display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#990000] text-white text-sm rounded-full"
            >
              {value}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(value);
                }}
                className="hover:bg-[#800000] rounded-full p-1 transition-colors"
                title="Kaldır"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative" ref={dropdownRef}>
        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 z-10" />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={`w-full pl-10 pr-10 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-left focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
            hasError ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
          }`}
        >
          <span className={selectedValues.length > 0 ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}>
            {displayText}
          </span>
        </button>
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />

        {/* Dropdown menu - moved inside relative container */}
        {isOpen && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-xl max-h-60 overflow-y-auto z-[9999]"
            style={{ zIndex: 9999 }}
          >
            {options.map((option, index) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleOption(option);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 ${
                    isSelected ? 'bg-[#990000]/10 text-[#990000] dark:bg-[#990000]/20' : 'text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#990000]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// User info fields translations
const userInfoTranslations = {
  tr: {
    firstName: 'Ad',
    firstNamePlaceholder: 'Adınızı girin',
    lastName: 'Soyad',
    lastNamePlaceholder: 'Soyadınızı girin',
    email: 'E-posta',
    emailPlaceholder: 'E-posta adresinizi girin',
    school: 'Okul / Üniversite',
    schoolPlaceholder: 'Örn: İstanbul Üniversitesi',
    grade: 'Sınıf',
    gradePlaceholder: 'Sınıfınızı seçin',
    gradeOptions: {
      university_1: 'Üniversite 1. Sınıf',
      university_2: 'Üniversite 2. Sınıf',
      university_3: 'Üniversite 3. Sınıf',
      university_4: 'Üniversite 4. Sınıf',
      graduate: 'Mezun',
      other: 'Diğer'
    }
  },
  en: {
    firstName: 'First Name',
    firstNamePlaceholder: 'Enter your first name',
    lastName: 'Last Name',
    lastNamePlaceholder: 'Enter your last name',
    email: 'Email',
    emailPlaceholder: 'Enter your email address',
    school: 'School / University',
    schoolPlaceholder: 'e.g. Harvard University',
    grade: 'Grade / Year',
    gradePlaceholder: 'Select your grade',
    gradeOptions: {
      university_1: 'University - Freshman',
      university_2: 'University - Sophomore',
      university_3: 'University - Junior',
      university_4: 'University - Senior',
      graduate: 'Graduate',
      other: 'Other'
    }
  }
};

export default function DynamicForm({ formName, locale = 'tr' }: DynamicFormProps) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, FormDataValue>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  
  // User info state
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    school: '',
    grade: ''
  });
  
  const userInfoT = userInfoTranslations[locale as keyof typeof userInfoTranslations] || userInfoTranslations.tr;
  
  // Ref'ler her field için - Fixed ref callback
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadFormData = useCallback(async () => {
    setIsLoading(true);
    try {
      const formConfig = await getFormConfig(formName);
      if (!formConfig) {
        console.error(`No form config found for formName: ${formName}`);
        setConfig(null);
        setFields([]);
        return;
      }
      setConfig(formConfig);
      const formFields = await getFormFields(formConfig.id);
      setFields(formFields);

      // Initialize form data with default values
      const initialData: Record<string, FormDataValue> = {};
      formFields.forEach(field => {
        if (field.field_type === 'checkbox') {
          initialData[field.field_key] = false;
        } else if (field.field_type === 'multiselect') {
          initialData[field.field_key] = [];
        } else {
          initialData[field.field_key] = '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error loading form data:', error);
      setConfig(null);
      setFields([]);
    } finally {
      setIsLoading(false);
    }
  }, [formName]);

  useEffect(() => {
    if (!formName) {
      console.error('DynamicForm: formName tanımsız veya boş!');
      setIsLoading(false);
      setConfig(null);
      setFields([]);
      return;
    }
    loadFormData();
  }, [formName, loadFormData]);

  const handleInputChange = (fieldKey: string, value: FormDataValue) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  const handleFileUpload = async (fieldKey: string, file: File) => {
    const field = fields.find(f => f.field_key === fieldKey);
    const maxSize = getMaxFileSize(field);
    const allowedTypes = extractAllowedMimeTypes(field);

    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: `Dosya boyutu ${formatFileSize(maxSize)} sınırını aşamaz`
      }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: `Sadece ${describeAllowedTypes(allowedTypes)} formatları kabul edilir`
      }));
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [fieldKey]: true }));

    const fileName = `${Date.now()}_${file.name}`;
    const uploadResult = await uploadFile(file, fileName);

    setUploadingFiles(prev => ({ ...prev, [fieldKey]: false }));

    if (uploadResult.success) {
      setFiles(prev => ({ ...prev, [fieldKey]: file }));
      setFormData(prev => ({ ...prev, [fieldKey]: uploadResult.url }));
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    } else {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: uploadResult.error || 'Dosya yükleme hatası'
      }));
    }
  };

  const scrollToFirstError = (newErrors: Record<string, string>) => {
    const firstErrorField = Object.keys(newErrors)[0];
    if (firstErrorField && fieldRefs.current[firstErrorField]) {
      const element = fieldRefs.current[firstErrorField];
      const yOffset = -100; // Header için boşluk
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
      
      // Alanı vurgula (opsiyonel)
      element.style.transform = 'scale(1.02)';
      element.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 500);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate user info fields
    if (!userInfo.firstName.trim()) {
      newErrors['user_firstName'] = locale === 'tr' ? 'Ad alanı zorunludur' : 'First name is required';
    }
    if (!userInfo.lastName.trim()) {
      newErrors['user_lastName'] = locale === 'tr' ? 'Soyad alanı zorunludur' : 'Last name is required';
    }
    if (!userInfo.email.trim()) {
      newErrors['user_email'] = locale === 'tr' ? 'E-posta alanı zorunludur' : 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(userInfo.email.trim())) {
        newErrors['user_email'] = locale === 'tr' ? 'Geçerli bir e-posta adresi girin' : 'Enter a valid email address';
      }
    }
    if (!userInfo.school.trim()) {
      newErrors['user_school'] = locale === 'tr' ? 'Okul/Üniversite alanı zorunludur' : 'School/University is required';
    }
    if (!userInfo.grade) {
      newErrors['user_grade'] = locale === 'tr' ? 'Sınıf seçimi zorunludur' : 'Grade selection is required';
    }

    fields.forEach(field => {
      if (field.is_required) {
        const value = formData[field.field_key];

        if (field.field_type === 'checkbox') {
          if (!value) {
            newErrors[field.field_key] = 'Bu alan zorunludur';
          }
        } else if (field.field_type === 'multiselect') {
          if (!Array.isArray(value) || value.length === 0) {
            newErrors[field.field_key] = 'En az bir seçenek seçmelisiniz';
          }
        } else if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field.field_key] = 'Bu alan zorunludur';
        }
      }

      // Email validation
      if (field.field_type === 'email' && formData[field.field_key]) {
        const emailValue = formData[field.field_key];
        if (typeof emailValue === 'string') {
          const email = emailValue.trim();
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          
          if (!emailRegex.test(email)) {
            newErrors[field.field_key] = 'Geçerli bir e-posta adresi girin (örn: kullanici@example.com)';
          } else if (email.length > 254) {
            newErrors[field.field_key] = 'E-posta adresi çok uzun';
          } else if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
            newErrors[field.field_key] = 'E-posta adresi geçersiz format içeriyor';
          }
        }
      }

      // Phone validation
      if (field.field_type === 'tel' && formData[field.field_key]) {
        const phoneValue = formData[field.field_key];
        if (typeof phoneValue === 'string') {
          const phone = phoneValue.replace(/\s/g, '');
          
          // Türkiye telefon formatları için regex
          const phoneRegex = /^(\+90|0)?(5\d{2})\s?(\d{3})\s?(\d{2})\s?(\d{2})$/;
          const internationalRegex = /^\+[1-9]\d{1,14}$/;
          
          if (!phoneRegex.test(phone) && !internationalRegex.test(phone)) {
            newErrors[field.field_key] = 'Geçerli bir telefon numarası girin (örn: 0555 123 45 67 veya +90 555 123 45 67)';
          } else if (phone.length < 10) {
            newErrors[field.field_key] = 'Telefon numarası çok kısa';
          } else if (phone.length > 15) {
            newErrors[field.field_key] = 'Telefon numarası çok uzun';
          }
        }
      }

      // Textarea minLength/maxLength validation
      if (field.field_type === 'textarea' && formData[field.field_key]) {
        const textValue = formData[field.field_key];
        if (typeof textValue === 'string') {
          const textLength = textValue.trim().length;
          const minLength = field.validation_rules?.minLength;
          const maxLength = field.validation_rules?.maxLength;
          
          if (minLength && textLength < minLength) {
            newErrors[field.field_key] = `Bu alan en az ${minLength} karakter olmalıdır (şu an: ${textLength})`;
          } else if (maxLength && textLength > maxLength) {
            newErrors[field.field_key] = `Bu alan en fazla ${maxLength} karakter olabilir`;
          }
        }
      }
    });

    setErrors(newErrors);
     // HCAPTCHA validation
    if (!captchaToken) {
      newErrors['captcha'] = 'Lütfen robot olmadığınızı doğrulayın';
    }
    
    // Eğer hata varsa ilk hatalı alana kaydır
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => scrollToFirstError(newErrors), 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !config) return;

    setIsSubmitting(true);

    try {
      // CV dosyası için storage path al
      let cvStoragePath: string | undefined;
      let cvFileName: string | undefined;
      let cvFileSize: number | undefined;
      let cvMimeType: string | undefined;

      // Eğer CV dosyası yüklendiyse
      const cvFile = files['cv_file'];
      if (cvFile) {
        cvFileName = cvFile.name;
        cvFileSize = cvFile.size;
        cvMimeType = cvFile.type;
        // formData'dan storage URL'i al (handleFileUpload'da set edildi)
        cvStoragePath = formData['cv_file'] as string;
      }

      // Başvuru verilerini hazırla
      const applicationData = {
        first_name: userInfo.firstName.trim(),
        last_name: userInfo.lastName.trim(),
        email: userInfo.email.trim(),
        school: userInfo.school.trim(),
        grade: userInfo.grade,
        // Başvuru soruları (ayrı alanlar)
        motivation: formData['motivation'] as string || '',
        communication: formData['communication'] as string || '',
        team_experience: formData['team_experience'] as string || '',
        // CV dosyası
        cv_storage_path: cvStoragePath,
        cv_file_name: cvFileName,
        cv_file_size: cvFileSize,
        cv_mime_type: cvMimeType,
        user_agent: navigator.userAgent,
      };

      // Yeni internship_applications tablosuna kaydet
      const response = await fetch('/api/internship-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setSubmitResult({
        success: true,
        submissionId: result.applicationId,
        message: result.message
      } as SubmitResult);

      if (result.success) {
        // Reset captcha after successful submission
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        setCaptchaToken(null);
        setIsSubmitted(true);
        
        // Email durumunu daha detaylı logla
        if (result.emailSent) {
        } else {
          console.warn('⚠️ Email gönderilemedi:', {
            emailError: result.emailError,
            emailErrors: result.emailErrors,
            message: result.message
          });
        }
      } else {
        console.error('❌ Form submission error:', result.error);
        setErrors(prev => ({ 
          ...prev, 
          form: result.error || 'Başvuru gönderilirken hata oluştu' 
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('💥 Form submission error:', {
        message: errorMessage,
        stack: errorStack,
        name: errorName
      });
      setErrors(prev => ({ 
        ...prev, 
        form: `Başvuru gönderilirken beklenmeyen bir hata oluştu: ${errorMessage}` 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'email': return Mail;
      case 'tel': return Phone;
      case 'date': return Calendar;
      case 'textarea': return MessageSquare;
      default: return User;
    }
  };

  // Fixed ref callback function
  const setFieldRef = (fieldKey: string) => (el: HTMLDivElement | null) => {
    fieldRefs.current[fieldKey] = el;
  };

  const renderField = (field: FormField) => {
    const Icon = getFieldIcon(field.field_type);
    const label = replaceLegacyBranding(field.label[locale] || field.label['tr'] || field.field_key);
    const placeholder = replaceLegacyBranding(field.placeholder?.[locale] || field.placeholder?.['tr'] || '');
    const hasError = !!errors[field.field_key];
    const value = formData[field.field_key] || '';
    const localizedOptions = field.options?.[locale] ?? field.options?.['tr'];
    const optionList = Array.isArray(localizedOptions)
      ? localizedOptions
          .filter((option): option is string => typeof option === 'string')
          .map(option => replaceLegacyBranding(option))
      : [];
    const columnSpanClass = field.grid_columns && field.grid_columns > 1 ? 'md:col-span-2' : 'md:col-span-1';

    const inputClassName = `w-full px-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
      hasError ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
    }`;

    const iconInputClassName = `w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
      hasError ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
    }`;

    const containerClassName = `${columnSpanClass} ${
      hasError ? 'bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800' : ''
    }`;

    switch (field.field_type) {
      case 'select':
        return (
          <div 
            key={field.id} 
            className={containerClassName}
            ref={setFieldRef(field.field_key)}
          >
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <select
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                className={iconInputClassName}
              >
                <option value="">{placeholder}</option>
                {optionList.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {hasError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.field_key]}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div 
            key={field.id} 
            className={containerClassName}
            ref={setFieldRef(field.field_key)}
          >
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <MultiSelect
              options={optionList}
              selectedValues={Array.isArray(value) ? value : []}
              onChange={(values) => handleInputChange(field.field_key, values)}
              placeholder={placeholder || 'Seçenekleri seçin...'}
              hasError={hasError}
            />
            {hasError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.field_key]}
              </p>
            )}
          </div>
        );

      case 'textarea': {
        const minLength = field.validation_rules?.minLength;
        const maxLength = field.validation_rules?.maxLength;
        const currentLength = typeof value === 'string' ? value.length : 0;
        return (
          <div 
            key={field.id} 
            className={`${columnSpanClass} ${hasError ? 'bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800' : ''}`}
            ref={setFieldRef(field.field_key)}
          >
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <textarea
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                placeholder={placeholder}
                rows={5}
                maxLength={maxLength}
                className={`${inputClassName} resize-none min-h-[120px] sm:min-h-[140px]`}
              />
              {(minLength || maxLength) && (
                <div className="absolute bottom-2 right-2 text-xs text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-1 rounded">
                  <span className={currentLength < (minLength || 0) ? 'text-amber-500' : 'text-neutral-400'}>
                    {currentLength}
                  </span>
                  {maxLength && <span>/{maxLength}</span>}
                  {minLength && currentLength < minLength && (
                    <span className="ml-1 text-amber-500">
                      ({locale === 'en' ? `min ${minLength}` : `min ${minLength}`})
                    </span>
                  )}
                </div>
              )}
            </div>
            {hasError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.field_key]}
              </p>
            )}
          </div>
        );
      }

      case 'file': {
        const allowedMimeTypes = extractAllowedMimeTypes(field);
        const acceptValue = buildAcceptValue(allowedMimeTypes);
        const maxFileSize = getMaxFileSize(field);
        const allowedTypesDescription = describeAllowedTypes(allowedMimeTypes);
        return (
          <div 
            key={field.id} 
            className={`${columnSpanClass} ${hasError ? 'bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800' : ''}`}
            ref={setFieldRef(field.field_key)}
          >
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 transition-all duration-200 ${
              hasError 
                ? 'border-red-500 bg-red-100 dark:bg-red-900/20' 
                : 'border-neutral-300 dark:border-neutral-600 hover:border-[#990000] dark:hover:border-[#990000] bg-neutral-50 dark:bg-neutral-800/50'
            }`}>
              {files[field.field_key] ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#990000]/10 dark:bg-[#990000]/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#990000]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{files[field.field_key].name}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {locale === 'en' ? 'File uploaded successfully' : 'Dosya başarıyla yüklendi'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFiles(prev => {
                        const newFiles = { ...prev };
                        delete newFiles[field.field_key];
                        return newFiles;
                      });
                      setFormData(prev => ({ ...prev, [field.field_key]: '' }));
                    }}
                    className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title={locale === 'en' ? 'Remove file' : 'Dosyayı kaldır'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  {uploadingFiles[field.field_key] ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-10 h-10 border-3 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                        {locale === 'en' ? 'Uploading...' : 'Yükleniyor...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                        <FileUp className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm sm:text-base">
                        {placeholder || (locale === 'en' ? 'Drag and drop your file here or click to browse' : 'Dosyanızı sürükleyip bırakın veya tıklayarak seçin')}
                      </p>
                      <input
                        type="file"
                        accept={acceptValue}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(field.field_key, file);
                        }}
                        className="hidden"
                        id={`file-${field.field_key}`}
                      />
                      <label
                        htmlFor={`file-${field.field_key}`}
                        className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#990000] text-white rounded-lg hover:bg-[#800000] transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{locale === 'en' ? 'Choose File' : 'Dosya Seç'}</span>
                      </label>
                      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs text-neutral-500 mb-1">
                          {locale === 'en' ? 'Maximum file size:' : 'Maksimum dosya boyutu:'} {formatFileSize(maxFileSize)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {locale === 'en' ? 'Accepted formats:' : 'Kabul edilen formatlar:'} {allowedTypesDescription}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {hasError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.field_key]}
              </p>
            )}
          </div>
        );
      }

      case 'checkbox':
        return (
          <div 
            key={field.id} 
            className={`md:col-span-2 ${hasError ? 'bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800' : ''}`}
            ref={setFieldRef(field.field_key)}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id={`checkbox-${field.field_key}`}
                  checked={Boolean(value)}
                  onChange={(e) => handleInputChange(field.field_key, e.target.checked)}
                  className={`w-4 h-4 text-[#990000] bg-gray-100 rounded focus:ring-[#990000] focus:ring-2 ${
                    hasError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="text-sm">
                <label 
                  htmlFor={`checkbox-${field.field_key}`}
                  className="font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-[#990000] transition-colors duration-200"
                >
                  {label} {field.is_required && <span className="text-red-500">*</span>}
                </label>
              </div>
            </div>
            {hasError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.field_key]}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div 
            key={field.id} 
            className={containerClassName}
            ref={setFieldRef(field.field_key)}
          >
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {label} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type={field.field_type}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                placeholder={placeholder}
                className={iconInputClassName}
              />
            </div>
            {hasError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[field.field_key]}
              </p>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-neutral-600 dark:text-neutral-400">Form yükleniyor...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!config) {
    return (
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Form bulunamadı
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Aradığınız form mevcut değil veya devre dışı bırakılmış.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isSubmitted) {
    const successMessage = getLocalizedCopy(config.success_message, locale, 'Başvurunuz başarıyla gönderildi!');

    return (
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-medium text-green-900 dark:text-green-100 mb-2">
              {successMessage}
            </h3>
            
            {submitResult?.submissionId && (
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                <strong>Başvuru No:</strong> {submitResult.submissionId}
              </p>
            )}
            
            <button
              onClick={() => {
                setIsSubmitted(false);
                setSubmitResult(null);
                const initialData: Record<string, FormDataValue> = {};
                fields.forEach(field => {
                  if (field.field_type === 'checkbox') {
                    initialData[field.field_key] = false;
                  } else if (field.field_type === 'multiselect') {
                    initialData[field.field_key] = [];
                  } else {
                    initialData[field.field_key] = '';
                  }
                });
                setFormData(initialData);
                setFiles({});
                setErrors({});
                // Reset user info
                setUserInfo({
                  firstName: '',
                  lastName: '',
                  email: '',
                  school: '',
                  grade: ''
                });
              }}
              className="mt-6 text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
            >
              {locale === 'en' ? 'Submit a new application' : 'Yeni bir başvuru gönderin'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const title = getLocalizedCopy(config.title, locale, 'Başvuru Formu');
  const subtitle = getLocalizedCopy(config.subtitle, locale, '');
  const submitButtonText = getLocalizedCopy(config.submit_button_text, locale, 'Gönder');

  return (
    <section className="py-20 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
            {title}
          </h2>
          <div className="w-16 h-px bg-[#990000] mb-6"></div>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* User Info Fields */}
          <div className="mb-8 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              {locale === 'tr' ? 'Kişisel Bilgiler' : 'Personal Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {userInfoT.firstName} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={userInfo.firstName}
                    onChange={(e) => {
                      setUserInfo(prev => ({ ...prev, firstName: e.target.value }));
                      if (errors['user_firstName']) {
                        setErrors(prev => ({ ...prev, 'user_firstName': '' }));
                      }
                    }}
                    placeholder={userInfoT.firstNamePlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
                      errors['user_firstName'] ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  />
                </div>
                {errors['user_firstName'] && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors['user_firstName']}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {userInfoT.lastName} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={userInfo.lastName}
                    onChange={(e) => {
                      setUserInfo(prev => ({ ...prev, lastName: e.target.value }));
                      if (errors['user_lastName']) {
                        setErrors(prev => ({ ...prev, 'user_lastName': '' }));
                      }
                    }}
                    placeholder={userInfoT.lastNamePlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
                      errors['user_lastName'] ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  />
                </div>
                {errors['user_lastName'] && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors['user_lastName']}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {userInfoT.email} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => {
                      setUserInfo(prev => ({ ...prev, email: e.target.value }));
                      if (errors['user_email']) {
                        setErrors(prev => ({ ...prev, 'user_email': '' }));
                      }
                    }}
                    placeholder={userInfoT.emailPlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
                      errors['user_email'] ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  />
                </div>
                {errors['user_email'] && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors['user_email']}
                  </p>
                )}
              </div>

              {/* School */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {userInfoT.school} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={userInfo.school}
                    onChange={(e) => {
                      setUserInfo(prev => ({ ...prev, school: e.target.value }));
                      if (errors['user_school']) {
                        setErrors(prev => ({ ...prev, 'user_school': '' }));
                      }
                    }}
                    placeholder={userInfoT.schoolPlaceholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
                      errors['user_school'] ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  />
                </div>
                {errors['user_school'] && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors['user_school']}
                  </p>
                )}
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {userInfoT.grade} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={userInfo.grade}
                    onChange={(e) => {
                      setUserInfo(prev => ({ ...prev, grade: e.target.value }));
                      if (errors['user_grade']) {
                        setErrors(prev => ({ ...prev, 'user_grade': '' }));
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-all duration-200 ${
                      errors['user_grade'] ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    <option value="">{userInfoT.gradePlaceholder}</option>
                    <option value="university_1">{userInfoT.gradeOptions.university_1}</option>
                    <option value="university_2">{userInfoT.gradeOptions.university_2}</option>
                    <option value="university_3">{userInfoT.gradeOptions.university_3}</option>
                    <option value="university_4">{userInfoT.gradeOptions.university_4}</option>
                    <option value="graduate">{userInfoT.gradeOptions.graduate}</option>
                    <option value="other">{userInfoT.gradeOptions.other}</option>
                  </select>
                </div>
                {errors['user_grade'] && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors['user_grade']}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(renderField)}
          </div>

          {/* Form genel hatası göster */}
          {errors.form && (
            <div className="mb-6 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.form}
              </p>
            </div>
          )}

          {config.terms_and_conditions && (
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Kullanım Şartları ve Koşulları
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {getLocalizedCopy(
                  config.terms_and_conditions,
                  locale,
                  'Kullanım şartları ve koşulları burada yer alacak.'
                )}
              </p>
            </div>
          )}

          {/* Privacy Notice (KVKK) */}
          {config.privacy_notice && (
            <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-3">
                Kişisel Verilerin Korunması Hakkında Bilgilendirme
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                {getLocalizedCopy(config.privacy_notice, locale, '')}
              </p>
            </div>
          )}

          {/* HCAPTCHA */}
          <div className="pt-6">
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              onVerify={(token) => {
                setCaptchaToken(token);
                if (errors['captcha']) {
                  setErrors(prev => ({ ...prev, captcha: '' }));
                }
              }}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
              theme="light"
              size="normal"
            />
            {errors['captcha'] && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors['captcha']}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="py-4 px-8 bg-[#990000] text-white rounded-md hover:bg-[#800000] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 text-sm font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Gönderiliyor...</span>
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