import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/providers/LangProvider';

type Language = 'en' | 'ar';

interface TranslationContextType {
  language: Language;
  toggleLanguage: (lang?: Language) => void;
  t: (text: string) => string;
  rtl: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Local dictionary as a fallback
const localTranslations: Record<string, string> = {
  // Sidebar items
  'Dashboard': 'لوحة القيادة',
  'Analytics': 'التحليلات',
  'Products': 'المنتجات',
  'Feedback': 'التعليقات',
  'Admins': 'المشرفون',
  'Settings': 'الإعدادات',
  'Export Data': 'تصدير البيانات',
  'Security': 'الأمان',
  'Knowledge Base': 'قاعدة المعرفة',
  'System Health': 'حالة النظام',
  'Admin Tools': 'أدوات المشرف',
  'Stores': 'المتاجر',

  // Admin related
  'Store Admins': 'مشرفو المتجر',
  'Manage your store\'s admin users and their permissions.': 'إدارة مستخدمي المشرفين في متجرك وصلاحياتهم.',
  'Admin Management': 'إدارة المشرفين',
  'Add Admin': 'إضافة مشرف',
  'Add New Admin': 'إضافة مشرف جديد',
  'New admin can now log in using these credentials.': 'يمكن للمشرف الجديد الآن تسجيل الدخول باستخدام هذه البيانات.',
  'John Doe': 'فهد أحمد',
  'john@example.com': 'fahad@example.com',
  'Role': 'الدور',
  'Select a role': 'اختر دورًا',
  'owner': 'مالك',
  'Admin added': 'تمت إضافة المشرف',
  '{{name}} has been added as {{role}}.': 'تمت إضافة {{name}} كـ {{role}}.',
  'Admin removed': 'تمت إزالة المشرف',
  '{{name}} has been removed.': 'تمت إزالة {{name}}.',
  'Loading admins data...': 'جارِ تحميل بيانات المشرفين...',
  'Last Login': 'آخر تسجيل دخول',
  'Online': 'متصل',
  'Offline': 'غير متصل',
  'مسؤول': 'مسؤول',

  // Gift Card related
  'Gift Card Product': 'منتج بطاقة هدية',
  'Enable if this product is a gift card (code only, no email/password)': 'تمكين إذا كان هذا المنتج بطاقة هدية (رمز فقط، بدون بريد إلكتروني/كلمة مرور)',
  'Gift Card Code': 'رمز بطاقة الهدية',
  'Enter gift card code': 'أدخل رمز بطاقة الهدية',
  'Add Code': 'إضافة رمز',
  'Manage Gift Card Codes': 'إدارة رموز بطاقات الهدايا',
  'Add and manage gift card codes for this product': 'إضافة وإدارة رموز بطاقات الهدايا لهذا المنتج',
  'No gift card codes found': 'لم يتم العثور على رموز بطاقات هدايا',
  'Gift cards cannot have 2FA enabled': 'لا يمكن تمكين المصادقة الثنائية لبطاقات الهدايا',
  'Gift cards can only have 1 max user': 'يمكن أن يكون لبطاقات الهدايا مستخدم واحد فقط كحد أقصى',
  'Gift cards cannot have infinite users': 'لا يمكن أن يكون لبطاقات الهدايا عدد غير محدود من المستخدمين',
  'Gift card code is required': 'رمز بطاقة الهدية مطلوب',
  'Gift Card': 'بطاقة هدية',
  'Manage Codes': 'إدارة الرموز',
  'N/A': 'غير متاح',
  'Codes': 'الرموز',
  'Converted accounts to gift card codes': 'تم تحويل الحسابات إلى رموز بطاقات الهدايا',

  // Analytics Page
  'Analytics Dashboard': 'لوحة التحليلات',
  'System Analytics': 'تحليلات النظام',
  'Monitor system-wide metrics and performance across all stores.': 'مراقبة مقاييس وأداء النظام عبر جميع المتاجر.',
  'Track your store\'s performance and user activity.': 'تتبع أداء متجرك ونشاط المستخدمين.',
  'Total Stores': 'إجمالي المتاجر',
  'Error loading analytics': 'خطأ في تحميل التحليلات',
  'Failed to load analytics data. Please try again later.': 'فشل في تحميل بيانات التحليلات. يرجى المحاولة مرة أخرى لاحقاً.',
  'No change since last month': 'لا تغيير منذ الشهر الماضي',
  'No change since last week': 'لا تغيير منذ الأسبوع الماضي',
  'Loading chart data...': 'جاري تحميل بيانات الرسم البياني...',
  'Weekly Account Claims': 'مطالبات الحساب الأسبوعية',
  'Global Account Claims': 'مطالبات الحساب العالمية',
  'Accounts Claimed': 'الحسابات المطالب بها',
  'Users Interacted': 'المستخدمون المتفاعلون',

  // Top navigation
  'Admin Panel': 'لوحة المشرف',
  'Store Panel': 'لوحة المتجر',
  'Administration': 'الإدارة',
  'Master Admin Dashboard': 'لوحة تحكم المدير الرئيسي',
  'Store Dashboard': 'لوحة تحكم المتجر',
  'Select Language': 'اختر اللغة',
  'Notifications': 'الإشعارات',
  'No notifications': 'لا توجد إشعارات',
  'Product Alert': 'تنبيه المنتج',
  'New Feedback': 'تعليق جديد',
  'System Update': 'تحديث النظام',
  'View all notifications': 'عرض جميع الإشعارات',
  'User menu': 'قائمة المستخدم',
  'My Account': 'حسابي',
  'Profile': 'الملف الشخصي',
  'Log out': 'تسجيل الخروج',
  'Netflix accounts are running low (5 remaining)': 'حسابات نتفليكس منخفضة (5 متبقية)',
  'A customer left new feedback on Disney+ product': 'ترك أحد العملاء تعليقًا جديدًا على منتج ديزني+',
  'Platform updated to version 2.4.1': 'تم تحديث المنصة إلى الإصدار 2.4.1',

  // Empty States
  'No alerts to display': 'لا توجد تنبيهات للعرض',
  'No feedback to display': 'لا توجد تعليقات للعرض',
  'No product data available': 'لا توجد بيانات منتج متاحة',
  'No stores found': 'لم يتم العثور على متاجر',
  'Welcome to your dashboard': 'مرحبًا بك في لوحة التحكم',
  'Here\'s an overview of your store activity': 'فيما يلي نظرة عامة على نشاط متجرك',
  'System Administration': 'إدارة النظام',
  'System management and monitoring': 'إدارة ومراقبة النظام',
  'System Settings': 'إعدادات النظام',
  'User Management': 'إدارة المستخدمين',
  'Send Notification': 'إرسال إشعار',
  'System Backup': 'نسخ احتياطي للنظام',

  // Knowledge Base page
  'Manage educational resources for store owners': 'إدارة الموارد التعليمية لأصحاب المتاجر',
  'Add New Resource': 'إضافة مورد جديد',
  'Search resources...': 'البحث عن الموارد...',
  'All': 'الكل',
  'Videos': 'الفيديوهات',
  'Documents': 'المستندات',
  'Links': 'الروابط',
  'Learn how to use the platform effectively': 'تعلم كيفية استخدام المنصة بفعالية',
  
  // Dashboard
  'Welcome back, Store123!': 'مرحبًا بعودتك، Store123!',
  'Here\'s what\'s happening with your store today.': 'إليك ما يحدث في متجرك اليوم.',
  'Total Products': 'إجمالي المنتجات',
  'Active Users': 'المستخدمون النشطون',
  'Expiring Soon': 'تنتهي قريبًا',
  'Account Claims Today': 'مطالبات الحساب اليوم',
  'Weekly Account Claims': 'مطالبات الحساب الأسبوعية',
  'The number of accounts claimed per day this week': 'عدد الحسابات المطالب بها يوميًا هذا الأسبوع',
  'Active Products Status': 'حالة المنتجات النشطة',
  'Distribution of active products by category': 'توزيع المنتجات النشطة حسب الفئة',
  'Recent Alerts': 'التنبيهات الأخيرة',
  'View All': 'عرض الكل',
  'Netflix accounts expiring': 'انتهاء صلاحية حسابات نتفليكس',
  '5 accounts will expire in 3 days': 'ستنتهي صلاحية 5 حسابات خلال 3 أيام',
  'Disney+ running low': 'نفاد حسابات ديزني+',
  'Only 3 accounts remaining': 'متبقي 3 حسابات فقط',
  'Recent Feedback': 'آخر التعليقات',
  'Product stats visualization coming soon': 'رسوم بيانية إحصائية للمنتجات قريبًا',

  // Login
  'Store Login': 'تسجيل دخول المتجر',
  'Admin Login': 'تسجيل دخول المسؤول',
  'Log in to access your dashboard': 'تسجيل الدخول للوصول إلى لوحة التحكم',
  'Store': 'متجر',
  'Admin': 'مسؤول',
  'Store ID': 'معرف المتجر',
  'Admin Email': 'بريد المسؤول',
  'Enter store ID': 'أدخل معرف المتجر',
  'Enter email address': 'أدخل عنوان البريد الإلكتروني',
  'Password': 'كلمة المرور',
  'New Password': 'كلمة المرور الجديدة',
  'Enter password': 'أدخل كلمة المرور',
  'Please set a new password for your account': 'يرجى تعيين كلمة مرور جديدة لحسابك',
  'Login': 'تسجيل الدخول',
  'Logging in...': 'جاري تسجيل الدخول...',
  'Set New Password': 'تعيين كلمة مرور جديدة',
  'For demo: Use "new" as Store ID and "password" for first login.': 'للعرض التجريبي: استخدم "new" كمعرف متجر و "password" لأول تسجيل دخول.',
  
  // ProductList Page
  'Manage your store products': 'إدارة منتجات متجرك',
  'Manage all stores in the system': 'إدارة جميع المتاجر في النظام',
  'Add New Product': 'إضافة منتج جديد',
  'Add New Store': 'إضافة متجر جديد',
  'Search products...': 'البحث عن المنتجات...',
  'Search stores...': 'البحث عن المتاجر...',
  'Filters': 'التصفية',
  'Paused Only': 'المتوقفة فقط',
  'Product Name': 'اسم المنتج',
  'Code': 'الرمز',
  'Max Users': 'الحد الأقصى للمستخدمين',
  'Expiry (days)': 'مدة الصلاحية (بالأيام)',
  '2FA Type': 'نوع المصادقة الثنائية',
  'Status': 'الحالة',
  'Accounts': 'الحسابات',
  'Actions': 'الإجراءات',
  'No products found': 'لم يتم العثور على منتجات',
  'Loading products...': 'جاري تحميل المنتجات...',
  'Loading stores...': 'جاري تحميل المتاجر...',
  'Active': 'نشط',
  'Paused': 'متوقف',
  'Manage': 'تعديل',
  'Pause': 'إيقاف',
  'Resume': 'استئناف',
  'Delete': 'حذف',
  'Manage Accounts': 'إدارة الحسابات',
  'Manage Admins': 'إدارة المشرفين',
  'Export Data': 'تصدير البيانات',
  'Add Product': 'إضافة منتج',
  'Add Store': 'إضافة متجر',
  
  // ProductForm Page
  'Edit Product': 'تعديل المنتج',
  'Edit Store': 'تعديل المتجر',
  'Create New Product': 'إنشاء منتج جديد',
  'Create New Store': 'إنشاء متجر جديد',
  'Details': 'التفاصيل',
  "Enable File Delivery": 'تمكين تسليم الملفات',
  "Send a PDF / DOCX to the customer after purchase": 'إرسال ملف PDF / DOCX للعميل بعد الشراء',
  "2FA Verification Method": 'طريقة التحقق من 2FA',
  "Email Verification": 'التحقق عبر البريد الإلكتروني',
  "TOTP App": 'تطبيق المصادقة',
  "Select how users will receive their 2FA codes": 'اختر كيف سيتلقى المستخدمون رموز المصادقة الثنائية الخاصة بهم',
  "Email Service Provider": 'نوع البريد الإلكتروني',
  'Basic Information': 'المعلومات الأساسية',
  'Configure the basic settings for your product': 'تكوين الإعدادات الأساسية لمنتجك',
  'Configure the basic settings for your store': 'تكوين الإعدادات الأساسية لمتجرك',
  'Name': 'الاسم',
  "Select the email service used for 2FA": 'اختر نوع البريد الإلكتروني المستخدم في المصادقة الثنائية',
  "2FA Email Sender": 'مرسل البريد الإلكتروني للمصادقة الثنائية',
  'Product name': 'اسم المنتج',
  "The email address used to send the 2FA codes": 'عنوان البريد الإلكتروني المستخدم لإرسال رموز المصادقة الثنائية',
  'Store name': 'اسم المتجر',
  'Product URL in Salla - رابط المنتج في سلة': 'رابط المنتج في سلة',
  'Enter the Salla product URL to automatically extract the product code': 'أدخل رابط المنتج في سلة لاستخراج رمز المنتج تلقائيًا',
  'Max Users': 'الحد الأقصى للمستخدمين',
  'Maximum number of users allowed': 'الحد الأقصى لعدد المستخدمين المسموح به',
  'Expire Days': 'أيام انتهاء الصلاحية',
  'Number of days until expiration': 'عدد الأيام حتى انتهاء الصلاحية',
  'Infinite Users': 'مستخدمون بلا حدود',
  'Allow unlimited users for this product': 'السماح بعدد غير محدود من المستخدمين لهذا المنتج',
  'Unlimited users allowed': 'مسموح بعدد غير محدود من المستخدمين',
  'Never Expires': 'لا تنتهي صلاحيته أبدًا',
  'Product never expires': 'لا تنتهي صلاحية المنتج أبدًا',
  'Advanced Settings': 'الإعدادات المتقدمة',
  'Configure additional options for your product': 'تكوين خيارات إضافية لمنتجك',
  'Configure additional options for your store': 'تكوين خيارات إضافية لمتجرك',
  'Enable Two-Factor Authentication': 'تمكين المصادقة الثنائية',
  'Require 2FA for this product': 'طلب المصادقة الثنائية لهذا المنتج',
  'Require 2FA for this store': 'طلب المصادقة الثنائية لهذا المتجر',
  'Limit 2FA Per User': 'تحديد المصادقة الثنائية لكل مستخدم',
  'Limit how many 2FA codes a user can get': 'تحديد عدد رموز المصادقة الثنائية التي يمكن للمستخدم الحصول عليها',
  '2FA Code Limit': 'حد رموز المصادقة الثنائية',
  'Maximum number of 2FA codes a user can get': 'الحد الأقصى لعدد رموز المصادقة الثنائية التي يمكن للمستخدم الحصول عليها',
  'Custom Reply Message': 'رسالة الرد المخصصة',
  'Message to send to users after delivery': 'رسالة ترسل للمستخدمين بعد التسليم',
  'Message shown to users after they receive the product': 'الرسالة المعروضة للمستخدمين بعد استلام المنتج',
  'Update': 'تحديث',
  'Create': 'إنشاء',
  'Cancel': 'إلغاء',
  'Account Management': 'إدارة الحسابات',
  'Manage accounts for this product': 'إدارة حسابات هذا المنتج',
  'Add Account': 'إضافة حساب',
  'Email': 'البريد الإلكتروني',
  'Password': 'كلمة المرور',
  '2FA Secret': 'سر المصادقة الثنائية',
  'No accounts found': 'لم يتم العثور على حسابات',
  'Verify 2FA Code': 'التحقق من رمز المصادقة الثنائية',
  'Please enter the 6-digit code from your authenticator app': 'الرجاء إدخال الرمز المكون من 6 أرقام من تطبيق المصادقة الخاص بك',
  'Enter 6-digit code': 'أدخل الرمز المكون من 6 أرقام',
  'Validate': 'تحقق',
  'Validating...': 'جاري التحقق...',
  'Infinity': '∞',
  'Infinite': 'غير محدود',
  'Please enter the verification code': 'الرجاء إدخال رمز التحقق',
  '2FA code validated successfully': 'تم التحقق من رمز المصادقة الثنائية بنجاح',
  '2FA code validated successfully (dev mode)': 'تم التحقق من رمز المصادقة الثنائية بنجاح (وضع التطوير)',
  '2FA code validated successfully (fallback mode)': 'تم التحقق من رمز المصادقة الثنائية بنجاح (وضع احتياطي)',
  'Invalid 2FA code': 'رمز المصادقة الثنائية غير صالح',
  'Failed to validate 2FA code': 'فشل التحقق من رمز المصادقة الثنائية',
  'Unknown error': 'خطأ غير معروف',
  'The code does not match': 'الرمز غير متطابق',
  'Server responded with status': 'استجاب الخادم بالحالة',
  'Using local validation mode - any 6-digit code will work': 'استخدام وضع التحقق المحلي - أي رمز مكون من 6 أرقام سيعمل',
  '2FA enabled successfully': 'تم تمكين المصادقة الثنائية بنجاح',
  'Failed to enable 2FA': 'فشل في تمكين المصادقة الثنائية',
  '2FA secret provided but 2FA is not enabled for this product': 'تم تقديم سر المصادقة الثنائية ولكن المصادقة الثنائية غير ممكنة لهذا المنتج',
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  // Get saved language preference
  const savedLanguage = localStorage.getItem('language') as Language;
  const defaultLanguage: Language = savedLanguage === 'ar' ? 'ar' : 'en';
  
  // Initialize with saved language preference
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>(localTranslations);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize language settings on mount
  useEffect(() => {
    // Set up correct document direction based on current language
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.style.direction = language === 'ar' ? 'rtl' : 'ltr';
    
    if (language === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Ensure language preference is saved
    localStorage.setItem('language', language);
  }, []);

  // Function to toggle language
  const toggleLanguage = (lang?: Language) => {
    const newLanguage = lang || (language === 'en' ? 'ar' : 'en');
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Update document direction
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.body.style.direction = newLanguage === 'ar' ? 'rtl' : 'ltr';
    
    if (newLanguage === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Update document language
    document.documentElement.lang = newLanguage;
    
    // Only reload if explicitly requested, not on every language toggle
    if (lang && lang !== newLanguage) {
      window.location.reload();
    }
  };

  // Handle translations
  useEffect(() => {
    if (language === 'en') {
      setTranslations(localTranslations);
      return;
    }

    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase.functions.invoke('translate', {
          body: { fetchAll: true, targetLanguage: language }
        });

        if (error) {
          console.error('Translation error:', error);
          // Fall back to local translations
          return;
        }

        if (data && data.translations) {
          // Merge server translations with local fallbacks
          setTranslations({
            ...localTranslations,
            ...data.translations
          });
        } else {
          // Fall back to local translations
          setTranslations(localTranslations);
        }
      } catch (err) {
        console.error('Failed to load translations:', err);
        // Fall back to local translations
        setTranslations(localTranslations);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Translation function
  const t = (text: string): string => {
    // If we're in English, just return the original text
    if (language === 'en') return text;
    
    // Return translation if available, otherwise return original text
    return translations[text] || text;
  };

  return (
    <TranslationContext.Provider value={{ 
      language, 
      toggleLanguage, 
      t,
      rtl: language === 'ar'
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
