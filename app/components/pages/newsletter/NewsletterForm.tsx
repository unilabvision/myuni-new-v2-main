'use client';

import React, { useState, useRef, useEffect } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Shield, CheckCircle, AlertCircle, Loader, Mail } from 'lucide-react';

interface NewsletterFormProps {
  locale: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  honeypot: string;
  timestamp: number;
  browser: string;
  operatingSystem: string;
  deviceType: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  general?: string;
  captcha?: string;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({ locale }) => {
  const content = {
    tr: {
      nameLabel: "Adınız",
      namePlaceholder: "Adınızı giriniz",
      surnameLabel: "Soyadınız",
      surnamePlaceholder: "Soyadınızı giriniz",
      emailLabel: "E-posta Adresiniz",
      emailPlaceholder: "E-posta adresinizi giriniz",
      submitButton: "Bültenimize Kayıt Ol",
      submittingButton: "Kayıt Ediliyor...",
      successMessage: "Newsletter'a başarıyla kayıt oldunuz. Güncel haberler için e-postalarınızı kontrol edin.",
      errorMessage: "Kayıt işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
      networkErrorMessage: "Bağlantı hatası oluştu. İnternet bağlantınızı kontrol ediniz.",
      requiredFieldError: "Bu alan zorunludur",
      invalidEmailError: "Geçerli bir e-posta adresi giriniz",
      spamProtectionText: "Bu formda spam koruması ve güvenlik doğrulaması bulunmaktadır.",
      hcaptchaError: "Lütfen robot olmadığınızı doğrulayın.",
      tryAgainButton: "Tekrar Dene",
      newsletterTitle: "Bültenimize Abone Olun",
      newsletterDescription: "En son haberler ve güncellemeler için newsletter'ımıza abone olun.",
    },
    en: {
      nameLabel: "First Name",
      namePlaceholder: "Enter your first name",
      surnameLabel: "Last Name",
      surnamePlaceholder: "Enter your last name",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      submitButton: "Subscribe to Newsletter",
      submittingButton: "Subscribing...",
      successMessage: "You have successfully subscribed to our newsletter. Check your email for the latest updates.",
      errorMessage: "An error occurred during subscription. Please try again later.",
      networkErrorMessage: "Connection error occurred. Please check your internet connection.",
      requiredFieldError: "This field is required",
      invalidEmailError: "Please enter a valid email address",
      spamProtectionText: "This form has spam protection and security verification.",
      hcaptchaError: "Please verify that you are not a robot.",
      tryAgainButton: "Try Again",
      newsletterTitle: "Subscribe to Newsletter",
      newsletterDescription: "Subscribe to our newsletter for the latest news and updates.",
    },
  };

  const t = locale in content ? content[locale as keyof typeof content] : content.tr;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    honeypot: '',
    timestamp: Date.now(),
    browser: '',
    operatingSystem: '',
    deviceType: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      let browserName = "Unknown";
      let browserVersion = "";

      if (userAgent.indexOf("Firefox") > -1) {
        browserName = "Firefox";
        browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("SamsungBrowser") > -1) {
        browserName = "Samsung Browser";
        browserVersion = userAgent.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
        browserName = "Opera";
        browserVersion = userAgent.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Trident") > -1) {
        browserName = "Internet Explorer";
        browserVersion = userAgent.match(/rv:([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Edge") > -1) {
        browserName = "Edge (Legacy)";
        browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Edg") > -1) {
        browserName = "Edge Chromium";
        browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Chrome") > -1) {
        browserName = "Chrome";
        browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || "";
      } else if (userAgent.indexOf("Safari") > -1) {
        browserName = "Safari";
        browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || "";
      }

      return `${browserName} ${browserVersion}`.trim();
    };

    const detectOS = () => {
      const userAgent = navigator.userAgent;
      let osName = "Unknown";

      if (userAgent.indexOf("Win") > -1) {
        osName = "Windows";
        if (userAgent.indexOf("Windows NT 10.0") > -1) osName = "Windows 10";
        else if (userAgent.indexOf("Windows NT 6.3") > -1) osName = "Windows 8.1";
        else if (userAgent.indexOf("Windows NT 6.2") > -1) osName = "Windows 8";
        else if (userAgent.indexOf("Windows NT 6.1") > -1) osName = "Windows 7";
      } else if (userAgent.indexOf("Mac") > -1) {
        osName = "MacOS";
      } else if (userAgent.indexOf("Android") > -1) {
        osName = "Android";
      } else if (userAgent.indexOf("like Mac") > -1) {
        osName = "iOS";
      } else if (userAgent.indexOf("Linux") > -1) {
        osName = "Linux";
      } else if (userAgent.indexOf("X11") > -1) {
        osName = "UNIX";
      }

      return osName;
    };

    const detectDeviceType = (): 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown' => {
      const userAgent = navigator.userAgent;

      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return "Tablet";
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return "Mobile";
      } else if (/Windows|Mac|Linux|X11/i.test(userAgent)) {
        return "Desktop";
      }
      return "Unknown";
    };

    setFormData(prev => ({
      ...prev,
      browser: detectBrowser(),
      operatingSystem: detectOS(),
      deviceType: detectDeviceType(),
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t.requiredFieldError;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t.requiredFieldError;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.requiredFieldError;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.invalidEmailError;
    }

    // hCaptcha validation
    if (!captchaToken) {
      newErrors.captcha = t.hcaptchaError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData(prev => ({
      firstName: '',
      lastName: '',
      email: '',
      honeypot: '',
      timestamp: Date.now(),
      browser: prev.browser,
      operatingSystem: prev.operatingSystem,
      deviceType: prev.deviceType,
    }));
    setErrors({});
    
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!captchaToken) {
      setErrors({ captcha: t.hcaptchaError });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});

    try {
      
      const requestBody = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        locale,
        browser: formData.browser,
        operatingSystem: formData.operatingSystem,
        deviceType: formData.deviceType,
        honeypot: formData.honeypot,
        timestamp: formData.timestamp,
        hCaptchaToken: captchaToken,
        type: 'newsletter', // Newsletter subscription type
      };

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });


      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        const responseText = await response.text();

        
        // Check if response is JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Failed to parse JSON error response:', parseError);
            errorData = { error: `Server error: ${response.status} ${response.statusText}` };
          }
        } else {
          // Non-JSON response (like HTML error page)
          console.error('Non-JSON response received:', responseText);
          if (response.status === 405) {
            errorData = { error: 'API endpoint not found. Please check if /api/newsletter/route.ts exists.' };
          } else if (response.status === 404) {
            errorData = { error: 'Newsletter API not found. Using contact API as fallback.' };
            // Fallback to contact API
            try {
              const fallbackResponse = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...requestBody,
                  message: `Newsletter subscription request from ${requestBody.firstName} ${requestBody.lastName}`,
                }),
              });
              
              if (fallbackResponse.ok) {
                const fallbackResult = await fallbackResponse.json();
                setSubmissionId(fallbackResult.submissionId || '');
                setSubmitStatus('success');
                resetForm();
                return;
              }
            } catch (fallbackError) {
              console.error('Fallback to contact API failed:', fallbackError);
            }
            errorData = { error: 'Newsletter service temporarily unavailable. Please try again later.' };
          } else {
            errorData = { error: `Server error: ${response.status} ${response.statusText}` };
          }
        }
        
        console.error('API returned error:', errorData);
        
        if (response.status === 400) {
          if (errorData.error?.includes('Captcha') || errorData.error?.includes('verification')) {
            setErrors({ captcha: t.hcaptchaError });
            if (captchaRef.current) {
              captchaRef.current.resetCaptcha();
            }
            setCaptchaToken(null);
          } else {
            setErrors({ general: errorData.error || t.errorMessage });
          }
        } else if (response.status >= 500) {
          setErrors({ general: t.networkErrorMessage });
        } else {
          setErrors({ general: t.errorMessage });
        }
        
        setSubmitStatus('error');
        return;
      }

      const result = await response.json();

      setSubmissionId(result.submissionId || '');
      setSubmitStatus('success');
      resetForm();

    } catch (err) {
      console.error('Newsletter subscription error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'Unknown'
      });
      
      if (err instanceof Error && err.name === 'TypeError') {
        setErrors({ general: t.networkErrorMessage });
      } else {
        setErrors({ general: t.errorMessage });
      }
      
      setSubmitStatus('error');
      
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setSubmitStatus('idle');
    setErrors({});
    
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
    setCaptchaToken(null);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-8">
      {/* Newsletter Header */}
      <div className="text-left mb-8">
        <div className="flex justify-start mb-4">
          <Mail className="w-12 h-12 text-[#a90013]" />
        </div>
        <h2 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {t.newsletterTitle}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          {t.newsletterDescription}
        </p>
      </div>

      {submitStatus === 'success' ? (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-6 rounded-sm flex items-start">
          <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t.successMessage}</p>
            {submissionId && (
              <p className="text-sm mt-2 opacity-80">
                {locale === 'tr' ? 'Referans No' : 'Reference ID'}: {submissionId}
              </p>
            )}
          </div>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Honeypot field */}
          <div className="hidden">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleInputChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* General error message */}
          {(submitStatus === 'error' || errors.general) && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-6 rounded-sm flex items-start">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{errors.general || t.errorMessage}</p>
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  {t.tryAgainButton}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.nameLabel} *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder={t.namePlaceholder}
                className={`w-full p-3 text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 border ${
                  errors.firstName
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
                required
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                {t.surnameLabel} *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder={t.surnamePlaceholder}
                className={`w-full p-3 text-black dark:text-white bg-neutral-50 dark:bg-neutral-900 border ${
                  errors.lastName
                    ? 'border-red-300 dark:border-red-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
                required
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t.emailLabel} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t.emailPlaceholder}
              className={`w-full text-black dark:text-white p-3 bg-neutral-50 dark:bg-neutral-900 border ${
                errors.email
                  ? 'border-red-300 dark:border-red-500'
                  : 'border-neutral-300 dark:border-neutral-700'
              } rounded-sm outline-none focus:ring-2 focus:ring-[#a90013] dark:focus:ring-[#ffdee2]`}
              required
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* hCaptcha Widget */}
          <div>
            <HCaptcha
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '7dbc4a24-2176-4928-8222-a65c5504acdc'}
              onVerify={(token) => {
                setCaptchaToken(token);
                if (errors.captcha) {
                  setErrors(prev => ({ ...prev, captcha: '' }));
                }
              }}
              onExpire={() => {
                setCaptchaToken(null);
                setErrors(prev => ({ ...prev, captcha: t.hcaptchaError }));
              }}
              onError={() => {
                setCaptchaToken(null);
                setErrors(prev => ({ ...prev, captcha: t.hcaptchaError }));
              }}
              onLoad={() => console.log('hCaptcha loaded')}
              theme="light"
              size="normal"
            />
            {errors.captcha && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.captcha}
              </p>
            )}
          </div>

          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center">
            <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
            {t.spamProtectionText}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || !captchaToken}
              className="w-full bg-[#a90013] hover:bg-[#8a0010] dark:bg-[#a90013] dark:hover:bg-[#8a0010] text-white py-3 px-8 rounded-sm text-md font-medium transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t.submittingButton}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {t.submitButton}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewsletterForm;