// app/components/pages/newsletter/content.ts

export interface NewsletterContent {
  title: string;
  description: string;
  newsletterInfoTitle: string;
  phoneTitle: string;
  phoneNumber: string;
  emailTitle: string;
  emailAddress: string;
  formTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  surnameLabel: string;
  surnamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitButton: string;
  submittingButton: string;
  successMessage: string;
  errorMessage: string;
  networkErrorMessage: string;
  requiredFieldError: string;
  invalidEmailError: string;
  spamProtectionText: string;
  hcaptchaError: string;
  tryAgainButton: string;
  communityTitle: string;
  communityText: string;
  socialMediaTitle: string;
  followUs: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    linkedin: string;
  };
}

const content = {
  tr: {
    title: "Bülten",
    description: "Teknolojik gelişmelerimiz, yeniliklerimiz ve UNILAB Vision platformu güncellemeleri hakkında bilgi almak için bültenimize abone olun.",
    newsletterInfoTitle: "Bülten Bilgileri",
    phoneTitle: "Telefon",
    phoneNumber: "+90 (541) 944 46 34",
    emailTitle: "E-posta",
    emailAddress: "info@myunilab.net",
    formTitle: "Bülten Aboneliği",
    nameLabel: "Adınız",
    namePlaceholder: "Adınızı giriniz",
    surnameLabel: "Soyadınız",
    surnamePlaceholder: "Soyadınızı giriniz",
    emailLabel: "E-posta Adresiniz",
    emailPlaceholder: "E-posta adresinizi giriniz",
    submitButton: "Abone Ol",
    submittingButton: "Abone Olunuyor...",
    successMessage: "Bültenimize başarıyla abone oldunuz. Teşekkürler!",
    errorMessage: "Abonelik işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
    networkErrorMessage: "Bağlantı hatası oluştu. İnternet bağlantınızı kontrol ediniz.",
    requiredFieldError: "Bu alan zorunludur",
    invalidEmailError: "Geçerli bir e-posta adresi giriniz",
    spamProtectionText: "Bu formda spam koruması ve güvenlik doğrulaması bulunmaktadır.",
    hcaptchaError: "Lütfen robot olmadığınızı doğrulayın.",
    tryAgainButton: "Tekrar Dene",
    communityTitle: "MyUNI Hakkında",
    communityText: "MyUNI, yapay zeka destekli, yenilikçi bir eğitim platformudur. Bireylere ve kurumlara yönelik dönüştürücü öğrenme deneyimleri sunar. Disiplinler arası yaklaşımı, en son teknolojileri ve yapay zeka destekli altyapısı sayesinde hem bireysel gelişim hem de kurumsal eğitim alanında yüksek etkili çözümler sunuyoruz. ",
    socialMediaTitle: "Sosyal Medya",
    followUs: "Teknolojik gelişmelerimizi takip edin",
    socialLinks: {
      twitter: "https://twitter.com/unilabvisiontr",
      instagram: "https://instagram.com/unilabvisiontr",
      linkedin: "https://linkedin.com/company/unilabvisiontr"
    }
  },
  en: {
    title: "Newsletter",
    description: "Subscribe to our newsletter to stay updated on our technological developments, innovations, and UNILAB Vision platform updates.",
    newsletterInfoTitle: "Newsletter Information",
    phoneTitle: "Phone",
    phoneNumber: "+90 (541) 944 46 34",
    emailTitle: "Email",
    emailAddress: "info@myunilab.net",
    formTitle: "Newsletter Subscription",
    nameLabel: "First Name",
    namePlaceholder: "Enter your first name",
    surnameLabel: "Last Name",
    surnamePlaceholder: "Enter your last name",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your email address",
    submitButton: "Subscribe",
    submittingButton: "Subscribing...",
    successMessage: "You have successfully subscribed to our newsletter. Thank you!",
    errorMessage: "An error occurred during subscription. Please try again later.",
    networkErrorMessage: "Connection error occurred. Please check your internet connection.",
    requiredFieldError: "This field is required",
    invalidEmailError: "Please enter a valid email address",
    spamProtectionText: "This form has spam protection and security verification.",
    hcaptchaError: "Please verify that you are not a robot.",
    tryAgainButton: "Try Again",
    communityTitle: "About UNILAB Vision",
    communityText: "UNILAB Vision is a pioneering initiative dedicated to shaping the future through breakthrough innovation. We harness the power of interdisciplinary collaboration and cutting-edge technology to develop transformative products for a better tomorrow.",
    socialMediaTitle: "Social Media",
    followUs: "Follow our technological developments",
    socialLinks: {
      twitter: "https://twitter.com/unilabvision",
      instagram: "https://instagram.com/unilabvision",
      linkedin: "https://linkedin.com/company/unilabvision"
    }
  }
};

export default content;