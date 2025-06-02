
import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.ar': 'AR',
    'nav.en': 'EN',
    
    // Hero Section
    'hero.headline': 'All your digital products delivered instantly on WhatsApp!',
    'hero.subheadline': 'Sadeem integrates with Salla to help store owners deliver digital products (like accounts/codes) instantly and automatically, with full encryption and multi-store support.',
    'hero.cta': 'Request a Demo',
    "whatsapp.user.orderid": '123456789',
    // Features
    'features.automation': 'Automation',
    'features.security': 'Security',
    'features.speed': 'Speed',
    'features.multistore': 'Multi-store support',
    
    // Contact
    'contact.email': 'sadeem.salla@gmail.com',
    'contact.phone': '+966550379037',
    'contact.instagram': 'sadeem.app',
    
    // Footer
    'footer.copyright': '© 2025 Sadeem. All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.powered': 'Powered by Salla',
    
    // WhatsApp Messages
    'whatsapp.bot.message': 'Please send me your order id to deliver the account.',
    'whatsapp.user.email': '1828376345',
    'whatsapp.user.password': '',
    "accountdetails":"Here are your account details:",
    "email": "Email",
    "password": "Password",
    "whatsapp.bot.accountdetails":"Here are your account details:",
    "whatsapp.bot.email":"Email",
    "whatsapp.bot.password":"Password",
  },
  ar: {
    // Navigation
    'nav.ar': 'عربي',
    'nav.en': 'إنجليزي',
    
    // Hero Section
    'hero.headline': 'جميع منتجاتك الرقمية تُسلّم فوراً على واتساب!',
    'hero.subheadline': 'سديم يدمج مع سلة لمساعدة أصحاب المتاجر في تسليم المنتجات الرقمية (مثل الحسابات/الرموز) فوراً وبشكل تلقائي، مع تشفير كامل ودعم تعدد المتاجر.',
    'hero.cta': 'اطلب عرض تجريبي',
    
    // Features
    'features.automation': 'الأتمتة',
    'features.security': 'الأمان',
    'features.speed': 'السرعة',
    'features.multistore': 'دعم تعدد المتاجر',
    
    // Contact
    'contact.email': 'sadeem.salla@gmail.com',
    'contact.phone': '+966550379037',
    'contact.instagram': 'sadeem.app',
    
    // Footer
    'footer.copyright': '© 2025 سديم. جميع الحقوق محفوظة.',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.powered': 'مدعوم من سلة',
    
    // WhatsApp Messages
    'whatsapp.bot.message': 'الرجاء إرسال رقم طلبك لتسليم الحساب.',
    'whatsapp.user.orderid': '1234567890',
    'whatsapp.bot.accountdetails': 'إليك تفاصيل حسابك:',
    'whatsapp.bot.email': 'البريد الإلكتروني',
    'whatsapp.bot.password': 'كلمة المرور',
    'whatsapp.user.email': 'example@email.com',
    'whatsapp.user.password': 'password123'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className={language === 'ar' ? 'rtl' : 'ltr'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
